// server
import 'dotenv/config';
import { WebSocketServer, WebSocket, } from "ws";
import { 
    EventType, 
    GuessTagEventData, 
    CreateRoomEventData, 
    JoinRoomEventData, 
    RequestPostEventData, 
    SetUsernameEventData, 
    ReadyUpEventData, 
    StartGameEventData, 
    SetUserIconEventData, 
    LeaveRoomEventData, 
    GetSelectedIconsEventData,
    UpdateBlacklistEventData,
    UpdatePreferlistEventData,
    EndGameEventDataToClientType, 
} from "./types"; // DTO Types
import type { 
    ServerRoomType, 
    UserType, 
    ClientRoomType, 
    PostType,
    PostTagType,
    UserReadyStateType, 
    JoinRoomEventDataToClientType, 
    SetUsernameEventDataToClientType, 
    AllRoomsEventDataToClientType, 
    RequestPostEventDataToClientType, 
    GetSelectedIconsEventDataToClientType, 
    SetUserIconEventDataToClientType, 
    ReadyUpEventDataToClientType, 
    ShowLeaderboardEventDataToClientType, 
    UpdateBlacklistEventDataToClientType,
    UpdatePreferlistEventDataToClientType,
    LeaveRoomEventDataToClientType 
} from "./types";
import { getPosts } from "./fetching_utility";
import {v4} from 'uuid';
import { supabase } from "./supabase/client";

type ActiveGameState = {
    gameId: string;
    roundId: string;
    roundIndex: number;
    nextPostOrder: number;
    currentRoundPostId?: string;
};


// start up the server
const server = new WebSocketServer({port: 8080});

// TODO: make this client-side settable per-game
const POSTS_PER_ROUND = 2

let numUsers = 0;
// types for global server variables
const rooms: Map<string, ServerRoomType> = new Map<string, ServerRoomType>();
const users: Map<string, UserType> = new Map<string, UserType>();
const userSockets: Map<string, WebSocket> = new Map<string, WebSocket>();
const activeGames: Map<string, ActiveGameState> = new Map<string, ActiveGameState>();

// TODO setup heartbeat polling to close broken connections
// https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections
const purgeUserOnDisconnect = (userSocket: WebSocket) => {
    numUsers -= 1;
    const userEntry = [...userSockets.entries()].find(entry => {
        const [id, socket] = entry;
        return userSocket === socket;
    })
    if(!userEntry) {
        return;
    }
    const userID = userEntry[0];
    userSockets.delete(userID);
    users.delete(userID);
    const roomToUpdateEntry = [...rooms.entries()].find(entry => {
        const [id, room] = entry;
        return room.members.some(member => member.id === userID);
    });
    if(!roomToUpdateEntry) {
        return;
    }
    const [roomToUpdateID, roomToUpdate] = roomToUpdateEntry;
    const roomReadyStates = roomToUpdate.allUsersReady;
    roomReadyStates.delete(userID);
    roomToUpdate.members = roomToUpdate.members.filter(member => member.id !== userID);
    rooms.set(roomToUpdateID, roomToUpdate);
    void removeRoomMember(roomToUpdateID, userID);
    let shouldDeleteRoom = false;
    if(roomToUpdate.owner.id === userID) {
        if(roomToUpdate.members.length === 0) {
            rooms.delete(roomToUpdateID);
            shouldDeleteRoom = true;
        } else {
            roomToUpdate.owner = roomToUpdate.members[0];
            rooms.set(roomToUpdateID, roomToUpdate);
        }
    }
    if(shouldDeleteRoom) {
        void deleteRoom(roomToUpdateID);
        return;
    }
    void upsertRoom(roomToUpdate);
    void setRoomReadyStates(roomToUpdate);
}

/**
 * Utility Methods
 */
const roomIsReadyForNewPost = (room: ServerRoomType): boolean => {
    return [...room.allUsersReady.values()].every(readyState => readyState);
}

const getReadyStates = (room: ServerRoomType) : UserReadyStateType[] => {
    return [...room.allUsersReady.entries()].map((entry) => {
        const user = users.get(entry[0])!;
        const icon = user?.icon;
        return {user, ready: entry[1], icon};
    });
}

const getUser = (socket: WebSocket, userID?: string): string => {
    if(!userID) {
        let newUserID = v4();
        // unique user ids
        while(userSockets.get(newUserID)) {
            newUserID = v4();
        }
        const createdUser: UserType = {username: `User_${userID}`, id: newUserID, score: 0};
        // add to uId-socket map
        userSockets.set(newUserID, socket);
        // add to regular users map
        users.set(newUserID, createdUser);
        return newUserID;
    }
    return userID;
}

/**
 * Broadcasting helper methods
 */

const broadcast = <T>( server: WebSocketServer, data: T) => {
    const dataToString = JSON.stringify(data);
    server.clients.forEach(client => {
        if(client.readyState === WebSocket.OPEN) {
            client.send(dataToString);
        }
    });
}

const reply = <T>(client: WebSocket, data: T) => {
    const dataToString = JSON.stringify(data);
    if(client.readyState === WebSocket.OPEN) {
        client.send(dataToString);
    }
}

const broadcastToRoom = <T>(room: ServerRoomType, data: T) => {
    const dataToString = JSON.stringify(data);
    const userSocketsToSend = room.members.map(user => userSockets.get(user.id));

    userSocketsToSend.forEach(socket => {
        if(socket != null && socket.readyState === WebSocket.OPEN) {
            socket.send(dataToString);
        }
    })
} 

const convertServerRoomToClientRoom = (serverRoom: ServerRoomType): ClientRoomType => {
    const readyStates: UserReadyStateType[] = getReadyStates(serverRoom);
    return {
        roomID: serverRoom.id,
        roomName: serverRoom.name, 
        readyStates: readyStates, 
        owner: serverRoom.owner,
        blacklist: serverRoom.blacklist,
        preferlist: serverRoom.preferlist
    };
}

const convertServerRoomsToClientRooms = () => {
    const roomsToSend: ClientRoomType[] = [...rooms.values()].map((room) => {
        return convertServerRoomToClientRoom(room);
    });
    return roomsToSend;
}

const leaveRoom = async (server: WebSocketServer, userID: string, roomID: string) => {
    const userToLeave = users.get(userID);
    if(!userToLeave) {
        return;
    }
    const roomToUpdate = rooms.get(roomID);
    if(!roomToUpdate) {
        return;
    }

    // update icon in room
    const pastIcon = userToLeave.icon;
    userToLeave.icon = undefined;
    const iconData: SetUserIconEventDataToClientType = {type:EventType.enum.SET_ICON, userID, pastIcon};
    broadcastToRoom(roomToUpdate, iconData);

    const roomReadyStates = roomToUpdate.allUsersReady;
    roomReadyStates.delete(userID);
    roomToUpdate.members = roomToUpdate.members.filter(member => member.id !== userID);
    rooms.set(roomID, roomToUpdate);
    let shouldDeleteRoom = false;
    if(roomToUpdate.owner.id === userID) {
        if(roomToUpdate.members.length === 0) {
            rooms.delete(roomID);
            shouldDeleteRoom = true;
            const newRooms = convertServerRoomsToClientRooms();
            const data : AllRoomsEventDataToClientType = {type: EventType.enum.ALL_ROOMS, rooms: newRooms};
            broadcast(server, data); 
        } else {
            roomToUpdate.owner = roomToUpdate.members[0];
            rooms.set(roomID, roomToUpdate);
        }
    }

    if(shouldDeleteRoom) {
        await deleteRoom(roomID);
        return;
    }

    const roomToClient = convertServerRoomToClientRoom(roomToUpdate)
    const data : LeaveRoomEventDataToClientType = {type: EventType.enum.LEAVE_ROOM, room: roomToClient};
    broadcastToRoom(roomToUpdate, data);
    await upsertRoom(roomToUpdate);
    await setRoomReadyStates(roomToUpdate);
}

const resetRoom = (room: ServerRoomType): void => {
    room.curRound = 0;
    const newReadyStates = new Map<string, boolean>();
    for (const userID of room.allUsersReady.keys()) {
        newReadyStates.set(userID, false);
    }
}

const normalizeBlacklistTag = (tag: string): string => {
    return tag.trim().toLowerCase().replace(/\s+/g, "_");
}
const normalizePreferlistTag = (tag: string): string => {
    return normalizeBlacklistTag(tag);
}

/**
 * Supabase helpers
 */
const logSupabaseError = (context: string, error: unknown) => {
    if(error) {
        console.error(`Supabase error (${context}):`, error);
    }
}

const upsertPlayer = async (user: UserType) => {
    if(!supabase) return;
    const { error } = await supabase
        .from('players')
        .upsert({
            id: user.id,
            username: user.username,
            last_seen_at: new Date().toISOString(),
        }, { onConflict: 'id' });
    logSupabaseError('upsert player', error);
}

const upsertRoom = async (room: ServerRoomType) => {
    if(!supabase) return;
    const { error } = await supabase
        .from('rooms')
        .upsert({
            id: room.id,
            name: room.name,
            owner_player_id: room.owner.id,
            posts_per_round: room.postsPerRound,
            rounds_per_game: room.roundsPerGame,
            cur_round: room.curRound,
            posts_viewed_this_round: room.postsViewedThisRound,
            game_started: room.gameStarted,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
    logSupabaseError('upsert room', error);
}

const upsertRoomMember = async (roomID: string, user: UserType) => {
    if(!supabase) return;
    const { error } = await supabase
        .from('room_members')
        .upsert({
            room_id: roomID,
            player_id: user.id,
            score: user.score,
            icon: user.icon ?? null,
            left_at: null,
        }, { onConflict: 'room_id,player_id' });
    logSupabaseError('upsert room member', error);
}

const removeRoomMember = async (roomID: string, userID: string) => {
    if(!supabase) return;
    const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomID)
        .eq('player_id', userID);
    logSupabaseError('remove room member', error);
}

const setRoomReadyStates = async (room: ServerRoomType) => {
    if(!supabase) return;
    const payload = [...room.allUsersReady.entries()].map(([playerID, ready]) => ({
        room_id: room.id,
        player_id: playerID,
        ready,
        updated_at: new Date().toISOString(),
    }));
    if(payload.length === 0) return;
    const { error } = await supabase
        .from('room_ready_state')
        .upsert(payload, { onConflict: 'room_id,player_id' });
    logSupabaseError('upsert room ready state', error);
}

const updateBlacklist = async (roomID: string, tag: string, action: 'add' | 'remove') => {
    if(!supabase) return;
    if(action === 'add') {
        const { error } = await supabase
            .from('room_blacklist')
            .upsert({ room_id: roomID, tag }, { onConflict: 'room_id,tag' });
        logSupabaseError('upsert room blacklist', error);
    } else {
        const { error } = await supabase
            .from('room_blacklist')
            .delete()
            .eq('room_id', roomID)
            .eq('tag', tag);
        logSupabaseError('remove room blacklist', error);
    }
}

const updatePreferlist = async (roomID: string, tag: string, action: 'add' | 'remove' | 'set_frequency', frequency?: string) => {
    if(!supabase) return;
    if(action === 'add') {
        const { error } = await supabase
            .from('room_preferlist')
            .upsert({ room_id: roomID, tag, frequency: frequency ?? 'most' }, { onConflict: 'room_id,tag' });
        logSupabaseError('upsert room preferlist', error);
    } else if(action === 'set_frequency') {
        const { error } = await supabase
            .from('room_preferlist')
            .update({ frequency })
            .eq('room_id', roomID)
            .eq('tag', tag);
        logSupabaseError('update room preferlist frequency', error);
    } else {
        const { error } = await supabase
            .from('room_preferlist')
            .delete()
            .eq('room_id', roomID)
            .eq('tag', tag);
        logSupabaseError('remove room preferlist', error);
    }
}

const deleteRoom = async (roomID: string) => {
    if(!supabase) return;
    const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomID);
    logSupabaseError('delete room', error);
}

const ensureActiveGame = async (room: ServerRoomType, createdByPlayerID?: string) => {
    if(activeGames.has(room.id)) {
        return activeGames.get(room.id)!;
    }
    if(!supabase) return null;
    const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert({
            room_id: room.id,
            created_by_player_id: createdByPlayerID ?? null,
            posts_per_round: room.postsPerRound,
            rounds_per_game: room.roundsPerGame,
        })
        .select('id')
        .single();
    logSupabaseError('create game', gameError);
    if(!gameData?.id) return null;

    const { data: roundData, error: roundError } = await supabase
        .from('rounds')
        .insert({
            game_id: gameData.id,
            round_index: room.curRound,
        })
        .select('id')
        .single();
    logSupabaseError('create round', roundError);
    if(!roundData?.id) return null;

    const state: ActiveGameState = {
        gameId: gameData.id,
        roundId: roundData.id,
        roundIndex: room.curRound,
        nextPostOrder: 0,
    };
    activeGames.set(room.id, state);
    return state;
}

const startNextRound = async (roomID: string, gameId: string, roundIndex: number) => {
    if(!supabase) return null;
    const { data: roundData, error } = await supabase
        .from('rounds')
        .insert({
            game_id: gameId,
            round_index: roundIndex,
        })
        .select('id')
        .single();
    logSupabaseError('create next round', error);
    if(!roundData?.id) return null;
    const state: ActiveGameState = {
        gameId,
        roundId: roundData.id,
        roundIndex,
        nextPostOrder: 0,
    };
    activeGames.set(roomID, state);
    return state;
}

const recordPostAndTags = async (post: PostType) => {
    if(!supabase) return;
    const { error: postError } = await supabase
        .from('posts')
        .upsert({
            id: post.id,
            url: post.url,
        }, { onConflict: 'id' });
    logSupabaseError('upsert post', postError);

    const tags = Array.isArray(post.tags) ? post.tags : [];
    if(tags.length === 0) return;
    const tagRows = tags.map((tag: PostTagType) => ({
        post_id: post.id,
        tag: tag.name,
        tag_type: tag.type,
        score: tag.score,
    }));
    const { error: tagsError } = await supabase
        .from('post_tags')
        .upsert(tagRows, { onConflict: 'post_id,tag,tag_type' });
    logSupabaseError('upsert post tags', tagsError);
}

const recordRoundPost = async (roomID: string, roundId: string, postId: number, postOrder: number) => {
    if(!supabase) return null;
    const { data, error } = await supabase
        .from('round_posts')
        .insert({
            round_id: roundId,
            post_id: postId,
            post_order: postOrder,
        })
        .select('id')
        .single();
    logSupabaseError('insert round post', error);
    if(!data?.id) return null;
    const active = activeGames.get(roomID);
    if(active) {
        active.currentRoundPostId = data.id;
        active.nextPostOrder += 1;
        activeGames.set(roomID, active);
    }
    return data.id;
}

const recordGuess = async (roomID: string, userID: string, tag: PostTagType) => {
    if(!supabase) return;
    const active = activeGames.get(roomID);
    if(!active?.currentRoundPostId) return;
    const { error } = await supabase
        .from('guesses')
        .insert({
            round_post_id: active.currentRoundPostId,
            player_id: userID,
            guessed_tag: tag.name,
            tag_type: tag.type,
            score: tag.score,
        });
    logSupabaseError('insert guess', error);
}

const recordLeaderboardSnapshot = async (room: ServerRoomType) => {
    if(!supabase) return;
    const active = activeGames.get(room.id);
    if(!active) return;
    const snapshot = room.members.reduce((acc, member) => {
        acc[member.id] = member.score;
        return acc;
    }, {} as Record<string, number>);
    const { error } = await supabase
        .from('leaderboard_snapshots')
        .insert({
            game_id: active.gameId,
            round_id: active.roundId,
            snapshot,
        });
    logSupabaseError('insert leaderboard snapshot', error);
}

const endGame = async (roomID: string) => {
    if(!supabase) return;
    const active = activeGames.get(roomID);
    if(!active) return;
    const { error } = await supabase
        .from('games')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', active.gameId);
    logSupabaseError('end game', error);
    activeGames.delete(roomID);
}

server.on("connection", response => {
    numUsers += 1;

    const address = server.options.host;
    const port = server.options.port;
    console.log(`Server is running at ws://${address}:${port}`);
    // handle tag guess
    response.on("message", async (data) => {
        const dataJSON = JSON.parse(data.toString());
        const messageType = dataJSON.type;
        switch(messageType) {
            case EventType.enum.GUESS_TAG: {
                // TODO: guess parsing on server-side to validate that it has not already been guessed
                const result = GuessTagEventData.safeParse(dataJSON);
                if(!result.success) {
                    break;
                }
                const data = result.data;
                // check that room is valid room
                const room = rooms.get(data.roomID);
                if(!room) {
                    break;
                } 
                // broadcast the tag guessed to ALL members of the room, and user that guessed it
                const userToUpdateScore = users.get(data.user.id);
                if(userToUpdateScore) {
                    // short-circuit if user has already finished the round
                    if(room.allUsersReady.get(userToUpdateScore.id)) {
                        break;
                    }
                    if(room.preferlist.some(entry => entry.tag === data.tag.name && entry.frequency === 'all')) {
                        data.tag.score = 0;
                    }
                    userToUpdateScore.score += data.tag.score;
                    await upsertRoomMember(room.id, userToUpdateScore);
                    await recordGuess(room.id, userToUpdateScore.id, data.tag);
                    const guessTagData = {type: EventType.enum.GUESS_TAG, tag: data.tag, user: userToUpdateScore};
                    broadcastToRoom(room, guessTagData);
                }
                break;
            }
            case EventType.enum.SET_USERNAME: {
                const result = SetUsernameEventData.safeParse(dataJSON);
                if(!result.success) {
                    break;
                }
                const data = result.data;
                const userID = getUser(response, data.userID);
                const user = users.get(userID);
                if(user) {
                    user.username = data.username;
                    await upsertPlayer(user);
                    const userToChangeResponseData: SetUsernameEventDataToClientType = {type: EventType.enum.SET_USERNAME, user};
                    reply(response, userToChangeResponseData);
                }
                break;
            }
            case EventType.enum.SET_ICON:
                const result = SetUserIconEventData.safeParse(dataJSON);
                if(!result.success) {
                    break;
                }
                const data = result.data;
                const userID = getUser(response, data.userID);
                const user = users.get(userID);
                const room = rooms.get(data.roomID);
                if(room && user) {
                    if(user.icon) {
                        const pastIcon = user.icon;
                        user.icon = data.icon;
                        await upsertRoomMember(room.id, user);
                        const responseData: SetUserIconEventDataToClientType = {type:EventType.enum.SET_ICON, userID, icon: user.icon, pastIcon};
                        broadcastToRoom(room, responseData);
                    } else {
                        user.icon = data.icon;
                        await upsertRoomMember(room.id, user);
                        const responseData: SetUserIconEventDataToClientType = {type:EventType.enum.SET_ICON, userID, icon: user.icon};
                        broadcastToRoom(room, responseData);
                    }
                } else {
                    console.error(`user ${userID} or room ${room?.id} does not exist`);
                }
                break;
            case EventType.enum.GET_SELECTED_ICONS: {
                const result = GetSelectedIconsEventData.safeParse(dataJSON);
                if(!result.success) {
                    break;
                }
                const { roomID } = result.data;
                const room = rooms.get(roomID);
                if(!room) {
                    break;
                }
                const selectedIconsWithNulls = [...room.allUsersReady.entries()].map(entry => {
                    const userID = entry[0];
                    const user = users.get(userID);
                    if(user) {
                        return user.icon;
                    }
                    return null;
                });
                const selectedIcons: string[] = [];
                selectedIconsWithNulls.forEach(selectedIcon => {
                    if(selectedIcon) {
                        selectedIcons.push(selectedIcon);
                    }
                });
                const data : GetSelectedIconsEventDataToClientType = {type: EventType.enum.GET_SELECTED_ICONS, selectedIcons}
                reply(response, data);
                break;
            }
            case EventType.enum.CREATE_ROOM: {
                const result = CreateRoomEventData.safeParse(dataJSON);
                if(!result.success) {
                    break;
                }
                const data = result.data;
                // first time user, create them
                const userID = getUser(response, data.userID);
                // create the room
                let newRoomID = v4();
                while(rooms.get(newRoomID)) {
                    newRoomID = v4();
                }
                const user = users.get(userID);
                const userSocket = userSockets.get(userID);
                if(data.roomID) {
                    const room = rooms.get(data.roomID);
                    if(!room) {
                        break;
                    }
                    room.postsPerRound = data.postsPerRound;
                    room.roundsPerGame = data.roundsPerGame;
                    room.name = data.roomName;
                    resetRoom(room);
                    await upsertRoom(room);
                    if(user && userSocket) {
                        const roomToClient = {
                            roomID: room.id,
                            roomName: room.name, 
                            readyStates: getReadyStates(room), 
                            owner: user,
                            blacklist: room.blacklist,
                            preferlist: room.preferlist
                        };
                        broadcast<JoinRoomEventDataToClientType>(server, {type: EventType.enum.JOIN_ROOM, user: user, room: roomToClient})
                    }
                } else {
                    if(user && userSocket) {
                        // setup the userReady map for the room
                        const newRoomAllUsersReady = new Map<string, boolean>();
                        newRoomAllUsersReady.set(user.id, false);
                        // create room and add to rooms map
                        user.roomID = newRoomID;
                        const newRoom: ServerRoomType = {
                            id: newRoomID,
                            name: data.roomName,
                            postsPerRound: data.postsPerRound,
                            roundsPerGame: data.roundsPerGame,
                            members: [user], 
                            blacklist: [],
                            preferlist: [],
                            curRound: 0,
                            postQueue: [], 
                            allUsersReady: newRoomAllUsersReady, 
                            postsViewedThisRound: 0, 
                            gameStarted: false, 
                            owner: user
                        };
                        rooms.set(newRoomID, newRoom);
                        await upsertPlayer(user);
                        await upsertRoom(newRoom);
                        await upsertRoomMember(newRoomID, user);
                        await setRoomReadyStates(newRoom);
                        const readyStates: UserReadyStateType[] = getReadyStates(newRoom);
                        const roomToClient = {
                            roomID: newRoom.id,
                            roomName: newRoom.name, 
                            readyStates: readyStates, 
                            owner: user,
                            blacklist: newRoom.blacklist,
                            preferlist: newRoom.preferlist
                        };
                        // broadcase to the user their updated roomID
                        broadcast<JoinRoomEventDataToClientType>(server, {type: EventType.enum.JOIN_ROOM, user: user, room: roomToClient})
                    }
                }
                break;
            }
            case EventType.enum.ALL_ROOMS: {
                const roomsToSend = convertServerRoomsToClientRooms();
                reply<AllRoomsEventDataToClientType>(response, {type: EventType.enum.ALL_ROOMS, rooms: roomsToSend});
                break;
            }
            case EventType.enum.JOIN_ROOM: {
                const result = JoinRoomEventData.safeParse(dataJSON);
                if(!result.success) {
                    break;
                }
                const roomID = result.data.roomID;
                const userID = getUser(response, result.data.userID);
                const room = rooms.get(roomID);
                const user = users.get(userID);
                if(room && user) {
                    // add member to members list of room
                    room.members.push(user);
                    // set their ready status to false at first
                    room.allUsersReady.set(user.id, false);
                    // set user's roomID to room
                    user.roomID = roomID;
                    await upsertPlayer(user);
                    await upsertRoomMember(roomID, user);
                    await setRoomReadyStates(room);
                    const roomToClient = {
                        roomID: room.id,
                        roomName: room.name,
                        readyStates: getReadyStates(room), 
                        owner: room.owner,
                        blacklist: room.blacklist,
                        preferlist: room.preferlist
                    };
                    // broadcast to room newly updated members
                    broadcastToRoom<JoinRoomEventDataToClientType>(room, {type: EventType.enum.JOIN_ROOM, user: user, room: roomToClient});
                }
                break;
            }
            case EventType.enum.LEAVE_ROOM: {
                const result = LeaveRoomEventData.safeParse(dataJSON);
                if(!result.success) {
                    break;
                }
                const {userID, roomID} = result.data;
                await leaveRoom(server, userID, roomID);
                await removeRoomMember(roomID, userID);
                break;
            }
            case EventType.enum.REQUEST_POST: {
                // TODO: implement sending win screen upon round exhaustion
                const result = RequestPostEventData.safeParse(dataJSON);
                if(!result.success) {
                    break;
                }
                const data = result.data;
                const roomToSendPost = rooms.get(data.roomID);
                if(roomToSendPost) {
                    // ready up the user, if they already aren't readied up
                    roomToSendPost.allUsersReady.set(data.userID, true);
                    await setRoomReadyStates(roomToSendPost);

                    if(roomToSendPost.postQueue.length === 0){
                        roomToSendPost.postQueue = await getPosts(roomToSendPost.blacklist, roomToSendPost.preferlist);
                    }

                    if(roomIsReadyForNewPost(roomToSendPost)) {
                        // they've completed the round, show the leaderboard
                        if(roomToSendPost.postsViewedThisRound >= roomToSendPost.postsPerRound) {
                            await recordLeaderboardSnapshot(roomToSendPost);
                            roomToSendPost.curRound += 1;
                            roomToSendPost.postsViewedThisRound = 0;
                            if(roomToSendPost.curRound >= roomToSendPost.roundsPerGame) {
                                await endGame(roomToSendPost.id);
                                broadcastToRoom<EndGameEventDataToClientType>(roomToSendPost, {type: EventType.enum.END_GAME});
                                break;
                            }
                            const activeGame = await ensureActiveGame(roomToSendPost);
                            if(activeGame) {
                                await startNextRound(roomToSendPost.id, activeGame.gameId, roomToSendPost.curRound);
                            }
                            await upsertRoom(roomToSendPost);
                            broadcastToRoom<ShowLeaderboardEventDataToClientType>(roomToSendPost, {type: EventType.enum.SHOW_LEADERBOARD});
                            break;
                        }
                        const postToSend = roomToSendPost.postQueue.shift();
                        if (!postToSend) {
                            console.error('No posts available to send.');
                            broadcastToRoom<RequestPostEventDataToClientType>(roomToSendPost, {type: EventType.enum.REQUEST_POST});
                            break;
                        }
                        await ensureActiveGame(roomToSendPost, data.userID);
                        await recordPostAndTags(postToSend);
                        const activeGame = activeGames.get(roomToSendPost.id);
                        if(activeGame) {
                            await recordRoundPost(roomToSendPost.id, activeGame.roundId, postToSend.id, activeGame.nextPostOrder);
                        }
                        const preferlistAllTimeTags = new Set(roomToSendPost.preferlist.filter(entry => entry.frequency === 'all').map(entry => entry.tag));
                        const tags = Array.isArray(postToSend.tags) ? postToSend.tags : [];
                        const postToSendWithPreferlist = preferlistAllTimeTags.size > 0 ? {
                            ...postToSend,
                            tags: tags.map(tag => preferlistAllTimeTags.has(tag.name) ? {...tag, score: 0} : tag)
                        } : {
                            ...postToSend,
                            tags
                        };
                        broadcastToRoom<RequestPostEventDataToClientType>(roomToSendPost, {type: EventType.enum.REQUEST_POST, post: postToSendWithPreferlist});
                        roomToSendPost.postsViewedThisRound += 1;
                        await upsertRoom(roomToSendPost);
                        // reset ready map to all false
                        const newReadyMap = new Map<string, boolean>();
                        roomToSendPost.allUsersReady.forEach((v, k) => {
                            newReadyMap.set(k, false);
                        })
                        roomToSendPost.allUsersReady = newReadyMap;
                        await setRoomReadyStates(roomToSendPost);
                    } else {
                        broadcastToRoom<RequestPostEventDataToClientType>(roomToSendPost, {type: EventType.enum.REQUEST_POST});
                    }
                }
                break;
            }
            case EventType.enum.READY_UP: {
                const result = ReadyUpEventData.safeParse(dataJSON);
                if(!result.success) {
                    break;
                }
                const data = result.data;
                const room = rooms.get(data.roomID);
                const user = users.get(data.userID);
                if(room && user) {
                    const readyStates = getReadyStates(room);
                    const userToChangeIndex = readyStates.findIndex(readyState => readyState.user.id === data.userID);
                    if(userToChangeIndex >= 0){
                        readyStates[userToChangeIndex].ready = data.ready;
                        const updatedRoom = {
                            roomID: room.id,
                            roomName: room.name, 
                            readyStates: readyStates, 
                            owner: user,
                            blacklist: room.blacklist,
                            preferlist: room.preferlist
                        };
                        room.allUsersReady.set(data.userID, data.ready);
                        await setRoomReadyStates(room);
                        broadcastToRoom<ReadyUpEventDataToClientType>(room, {type: EventType.enum.READY_UP, roomID: room.id, room: updatedRoom})
                    } else {
                        console.error(`user ${data.userID} is not in the room`);
                    }
                } else {
                    console.error(`room ${data.roomID} does not exist`);
                }
                break;
            }
            case EventType.enum.START_GAME: {
                const result = StartGameEventData.safeParse(dataJSON);
                if(!result.success) {
                    break;
                }
                const data = result.data;
                const room = rooms.get(data.roomID);
                if(room) {
                    await ensureActiveGame(room, room.owner.id);
                    broadcastToRoom(room, {type: EventType.enum.START_GAME});
                } else {
                    console.error(`room ${data.roomID} does not exist, so a game cannot be started in it`);
                }
                break;
            }
            case EventType.enum.UPDATE_BLACKLIST: {
                const result = UpdateBlacklistEventData.safeParse(dataJSON);
                if(!result.success) {
                    break;
                }
                const data = result.data;
                const room = rooms.get(data.roomID);
                if(!room) {
                    break;
                }
                const normalizedTag = normalizeBlacklistTag(data.tag);
                if(!normalizedTag) {
                    break;
                }
                if(data.action === 'add') {
                    if(!room.blacklist.includes(normalizedTag)) {
                        room.blacklist.push(normalizedTag);
                    }
                    if(room.preferlist.some(entry => entry.tag === normalizedTag)) {
                        room.blacklist = room.blacklist.filter(tag => tag !== normalizedTag);
                    }
                } else {
                    room.blacklist = room.blacklist.filter(tag => tag !== normalizedTag);
                }
                rooms.set(room.id, room);
                await updateBlacklist(room.id, normalizedTag, data.action);
                const responseData: UpdateBlacklistEventDataToClientType = {
                    type: EventType.enum.UPDATE_BLACKLIST,
                    roomID: room.id,
                    blacklist: room.blacklist
                };
                broadcastToRoom(room, responseData);
                break;
            }
            case EventType.enum.UPDATE_PREFERLIST: {
                const result = UpdatePreferlistEventData.safeParse(dataJSON);
                if(!result.success) {
                    break;
                }
                const data = result.data;
                const room = rooms.get(data.roomID);
                if(!room) {
                    break;
                }
                const normalizedTag = normalizePreferlistTag(data.tag);
                if(!normalizedTag) {
                    break;
                }
                const preferlistIndex = room.preferlist.findIndex(entry => entry.tag === normalizedTag);
                if(data.action === 'add') {
                    const frequency = data.frequency ?? 'most';
                    if(preferlistIndex === -1) {
                        room.preferlist.push({tag: normalizedTag, frequency});
                    } else {
                        room.preferlist[preferlistIndex].frequency = frequency;
                    }
                    room.blacklist = room.blacklist.filter(tag => tag !== normalizedTag);
                } else if(data.action === 'set_frequency') {
                    if(data.frequency && preferlistIndex !== -1) {
                        room.preferlist[preferlistIndex].frequency = data.frequency;
                    }
                } else {
                    room.preferlist = room.preferlist.filter(entry => entry.tag !== normalizedTag);
                }
                rooms.set(room.id, room);
                await updatePreferlist(room.id, normalizedTag, data.action, data.frequency);
                if(data.action === 'add') {
                    await updateBlacklist(room.id, normalizedTag, 'remove');
                }
                const responseData: UpdatePreferlistEventDataToClientType = {
                    type: EventType.enum.UPDATE_PREFERLIST,
                    roomID: room.id,
                    preferlist: room.preferlist
                };
                broadcastToRoom(room, responseData);
                if(data.action === 'add') {
                    const blacklistResponse: UpdateBlacklistEventDataToClientType = {
                        type: EventType.enum.UPDATE_BLACKLIST,
                        roomID: room.id,
                        blacklist: room.blacklist
                    };
                    broadcastToRoom(room, blacklistResponse);
                }
                break;
            }
            default:
                break;
        }
    })

    response.on("close", code => {
        purgeUserOnDisconnect(response);
    })
});
