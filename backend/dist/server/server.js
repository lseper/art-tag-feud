"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// server
require("dotenv/config");
const ws_1 = require("ws");
const types_1 = require("./types"); // DTO Types
const fetching_utility_1 = require("./fetching_utility");
const uuid_1 = require("uuid");
const client_1 = require("./supabase/client");
// start up the server
const server = new ws_1.WebSocketServer({ port: 8080 });
// TODO: make this client-side settable per-game
const POSTS_PER_ROUND = 2;
let numUsers = 0;
// types for global server variables
const rooms = new Map();
const users = new Map();
const userSockets = new Map();
const activeGames = new Map();
// TODO setup heartbeat polling to close broken connections
// https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections
const purgeUserOnDisconnect = (userSocket) => {
    numUsers -= 1;
    const userEntry = [...userSockets.entries()].find(entry => {
        const [id, socket] = entry;
        return userSocket === socket;
    });
    if (!userEntry) {
        return;
    }
    const userID = userEntry[0];
    userSockets.delete(userID);
    users.delete(userID);
    const roomToUpdateEntry = [...rooms.entries()].find(entry => {
        const [id, room] = entry;
        return room.members.some(member => member.id === userID);
    });
    if (!roomToUpdateEntry) {
        return;
    }
    const [roomToUpdateID, roomToUpdate] = roomToUpdateEntry;
    const roomReadyStates = roomToUpdate.allUsersReady;
    roomReadyStates.delete(userID);
    roomToUpdate.members = roomToUpdate.members.filter(member => member.id !== userID);
    rooms.set(roomToUpdateID, roomToUpdate);
    void removeRoomMember(roomToUpdateID, userID);
    let shouldDeleteRoom = false;
    if (roomToUpdate.owner.id === userID) {
        if (roomToUpdate.members.length === 0) {
            rooms.delete(roomToUpdateID);
            shouldDeleteRoom = true;
        }
        else {
            roomToUpdate.owner = roomToUpdate.members[0];
            rooms.set(roomToUpdateID, roomToUpdate);
        }
    }
    if (shouldDeleteRoom) {
        void deleteRoom(roomToUpdateID);
        return;
    }
    void upsertRoom(roomToUpdate);
    void setRoomReadyStates(roomToUpdate);
};
/**
 * Utility Methods
 */
const roomIsReadyForNewPost = (room) => {
    return [...room.allUsersReady.values()].every(readyState => readyState);
};
const getReadyStates = (room) => {
    return [...room.allUsersReady.entries()].map((entry) => {
        const user = users.get(entry[0]);
        const icon = user === null || user === void 0 ? void 0 : user.icon;
        return { user, ready: entry[1], icon };
    });
};
const getUser = (socket, userID) => {
    if (!userID) {
        let newUserID = (0, uuid_1.v4)();
        // unique user ids
        while (userSockets.get(newUserID)) {
            newUserID = (0, uuid_1.v4)();
        }
        const createdUser = { username: `User_${userID}`, id: newUserID, score: 0 };
        // add to uId-socket map
        userSockets.set(newUserID, socket);
        // add to regular users map
        users.set(newUserID, createdUser);
        return newUserID;
    }
    return userID;
};
/**
 * Broadcasting helper methods
 */
const broadcast = (server, data) => {
    const dataToString = JSON.stringify(data);
    server.clients.forEach(client => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(dataToString);
        }
    });
};
const reply = (client, data) => {
    const dataToString = JSON.stringify(data);
    if (client.readyState === ws_1.WebSocket.OPEN) {
        client.send(dataToString);
    }
};
const broadcastToRoom = (room, data) => {
    const dataToString = JSON.stringify(data);
    const userSocketsToSend = room.members.map(user => userSockets.get(user.id));
    userSocketsToSend.forEach(socket => {
        if (socket != null && socket.readyState === ws_1.WebSocket.OPEN) {
            socket.send(dataToString);
        }
    });
};
const convertServerRoomToClientRoom = (serverRoom) => {
    const readyStates = getReadyStates(serverRoom);
    return {
        roomID: serverRoom.id,
        roomName: serverRoom.name,
        readyStates: readyStates,
        owner: serverRoom.owner,
        blacklist: serverRoom.blacklist,
        preferlist: serverRoom.preferlist
    };
};
const convertServerRoomsToClientRooms = () => {
    const roomsToSend = [...rooms.values()].map((room) => {
        return convertServerRoomToClientRoom(room);
    });
    return roomsToSend;
};
const leaveRoom = (server, userID, roomID) => __awaiter(void 0, void 0, void 0, function* () {
    const userToLeave = users.get(userID);
    if (!userToLeave) {
        return;
    }
    const roomToUpdate = rooms.get(roomID);
    if (!roomToUpdate) {
        return;
    }
    // update icon in room
    const pastIcon = userToLeave.icon;
    userToLeave.icon = undefined;
    const iconData = { type: types_1.EventType.enum.SET_ICON, userID, pastIcon };
    broadcastToRoom(roomToUpdate, iconData);
    const roomReadyStates = roomToUpdate.allUsersReady;
    roomReadyStates.delete(userID);
    roomToUpdate.members = roomToUpdate.members.filter(member => member.id !== userID);
    rooms.set(roomID, roomToUpdate);
    let shouldDeleteRoom = false;
    if (roomToUpdate.owner.id === userID) {
        if (roomToUpdate.members.length === 0) {
            rooms.delete(roomID);
            shouldDeleteRoom = true;
            const newRooms = convertServerRoomsToClientRooms();
            const data = { type: types_1.EventType.enum.ALL_ROOMS, rooms: newRooms };
            broadcast(server, data);
        }
        else {
            roomToUpdate.owner = roomToUpdate.members[0];
            rooms.set(roomID, roomToUpdate);
        }
    }
    if (shouldDeleteRoom) {
        yield deleteRoom(roomID);
        return;
    }
    const roomToClient = convertServerRoomToClientRoom(roomToUpdate);
    const data = { type: types_1.EventType.enum.LEAVE_ROOM, room: roomToClient };
    broadcastToRoom(roomToUpdate, data);
    yield upsertRoom(roomToUpdate);
    yield setRoomReadyStates(roomToUpdate);
});
const resetRoom = (room) => {
    room.curRound = 0;
    const newReadyStates = new Map();
    for (const userID of room.allUsersReady.keys()) {
        newReadyStates.set(userID, false);
    }
};
const normalizeBlacklistTag = (tag) => {
    return tag.trim().toLowerCase().replace(/\s+/g, "_");
};
const normalizePreferlistTag = (tag) => {
    return normalizeBlacklistTag(tag);
};
/**
 * Supabase helpers
 */
const logSupabaseError = (context, error) => {
    if (error) {
        console.error(`Supabase error (${context}):`, error);
    }
};
const upsertPlayer = (user) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client_1.supabase)
        return;
    const { error } = yield client_1.supabase
        .from('players')
        .upsert({
        id: user.id,
        username: user.username,
        last_seen_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    logSupabaseError('upsert player', error);
});
const upsertRoom = (room) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client_1.supabase)
        return;
    const { error } = yield client_1.supabase
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
});
const upsertRoomMember = (roomID, user) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!client_1.supabase)
        return;
    const { error } = yield client_1.supabase
        .from('room_members')
        .upsert({
        room_id: roomID,
        player_id: user.id,
        score: user.score,
        icon: (_a = user.icon) !== null && _a !== void 0 ? _a : null,
        left_at: null,
    }, { onConflict: 'room_id,player_id' });
    logSupabaseError('upsert room member', error);
});
const removeRoomMember = (roomID, userID) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client_1.supabase)
        return;
    const { error } = yield client_1.supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomID)
        .eq('player_id', userID);
    logSupabaseError('remove room member', error);
});
const setRoomReadyStates = (room) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client_1.supabase)
        return;
    const payload = [...room.allUsersReady.entries()].map(([playerID, ready]) => ({
        room_id: room.id,
        player_id: playerID,
        ready,
        updated_at: new Date().toISOString(),
    }));
    if (payload.length === 0)
        return;
    const { error } = yield client_1.supabase
        .from('room_ready_state')
        .upsert(payload, { onConflict: 'room_id,player_id' });
    logSupabaseError('upsert room ready state', error);
});
const updateBlacklist = (roomID, tag, action) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client_1.supabase)
        return;
    if (action === 'add') {
        const { error } = yield client_1.supabase
            .from('room_blacklist')
            .upsert({ room_id: roomID, tag }, { onConflict: 'room_id,tag' });
        logSupabaseError('upsert room blacklist', error);
    }
    else {
        const { error } = yield client_1.supabase
            .from('room_blacklist')
            .delete()
            .eq('room_id', roomID)
            .eq('tag', tag);
        logSupabaseError('remove room blacklist', error);
    }
});
const updatePreferlist = (roomID, tag, action, frequency) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client_1.supabase)
        return;
    if (action === 'add') {
        const { error } = yield client_1.supabase
            .from('room_preferlist')
            .upsert({ room_id: roomID, tag, frequency: frequency !== null && frequency !== void 0 ? frequency : 'most' }, { onConflict: 'room_id,tag' });
        logSupabaseError('upsert room preferlist', error);
    }
    else if (action === 'set_frequency') {
        const { error } = yield client_1.supabase
            .from('room_preferlist')
            .update({ frequency })
            .eq('room_id', roomID)
            .eq('tag', tag);
        logSupabaseError('update room preferlist frequency', error);
    }
    else {
        const { error } = yield client_1.supabase
            .from('room_preferlist')
            .delete()
            .eq('room_id', roomID)
            .eq('tag', tag);
        logSupabaseError('remove room preferlist', error);
    }
});
const deleteRoom = (roomID) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client_1.supabase)
        return;
    const { error } = yield client_1.supabase
        .from('rooms')
        .delete()
        .eq('id', roomID);
    logSupabaseError('delete room', error);
});
const ensureActiveGame = (room, createdByPlayerID) => __awaiter(void 0, void 0, void 0, function* () {
    if (activeGames.has(room.id)) {
        return activeGames.get(room.id);
    }
    if (!client_1.supabase)
        return null;
    const { data: gameData, error: gameError } = yield client_1.supabase
        .from('games')
        .insert({
        room_id: room.id,
        created_by_player_id: createdByPlayerID !== null && createdByPlayerID !== void 0 ? createdByPlayerID : null,
        posts_per_round: room.postsPerRound,
        rounds_per_game: room.roundsPerGame,
    })
        .select('id')
        .single();
    logSupabaseError('create game', gameError);
    if (!(gameData === null || gameData === void 0 ? void 0 : gameData.id))
        return null;
    const { data: roundData, error: roundError } = yield client_1.supabase
        .from('rounds')
        .insert({
        game_id: gameData.id,
        round_index: room.curRound,
    })
        .select('id')
        .single();
    logSupabaseError('create round', roundError);
    if (!(roundData === null || roundData === void 0 ? void 0 : roundData.id))
        return null;
    const state = {
        gameId: gameData.id,
        roundId: roundData.id,
        roundIndex: room.curRound,
        nextPostOrder: 0,
    };
    activeGames.set(room.id, state);
    return state;
});
const startNextRound = (roomID, gameId, roundIndex) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client_1.supabase)
        return null;
    const { data: roundData, error } = yield client_1.supabase
        .from('rounds')
        .insert({
        game_id: gameId,
        round_index: roundIndex,
    })
        .select('id')
        .single();
    logSupabaseError('create next round', error);
    if (!(roundData === null || roundData === void 0 ? void 0 : roundData.id))
        return null;
    const state = {
        gameId,
        roundId: roundData.id,
        roundIndex,
        nextPostOrder: 0,
    };
    activeGames.set(roomID, state);
    return state;
});
const recordPostAndTags = (post) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client_1.supabase)
        return;
    const { error: postError } = yield client_1.supabase
        .from('posts')
        .upsert({
        id: post.id,
        url: post.url,
    }, { onConflict: 'id' });
    logSupabaseError('upsert post', postError);
    const tags = Array.isArray(post.tags) ? post.tags : [];
    if (tags.length === 0)
        return;
    const tagRows = tags.map((tag) => ({
        post_id: post.id,
        tag: tag.name,
        tag_type: tag.type,
        score: tag.score,
    }));
    const { error: tagsError } = yield client_1.supabase
        .from('post_tags')
        .upsert(tagRows, { onConflict: 'post_id,tag,tag_type' });
    logSupabaseError('upsert post tags', tagsError);
});
const recordRoundPost = (roomID, roundId, postId, postOrder) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client_1.supabase)
        return null;
    const { data, error } = yield client_1.supabase
        .from('round_posts')
        .insert({
        round_id: roundId,
        post_id: postId,
        post_order: postOrder,
    })
        .select('id')
        .single();
    logSupabaseError('insert round post', error);
    if (!(data === null || data === void 0 ? void 0 : data.id))
        return null;
    const active = activeGames.get(roomID);
    if (active) {
        active.currentRoundPostId = data.id;
        active.nextPostOrder += 1;
        activeGames.set(roomID, active);
    }
    return data.id;
});
const recordGuess = (roomID, userID, tag) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client_1.supabase)
        return;
    const active = activeGames.get(roomID);
    if (!(active === null || active === void 0 ? void 0 : active.currentRoundPostId))
        return;
    const { error } = yield client_1.supabase
        .from('guesses')
        .insert({
        round_post_id: active.currentRoundPostId,
        player_id: userID,
        guessed_tag: tag.name,
        tag_type: tag.type,
        score: tag.score,
    });
    logSupabaseError('insert guess', error);
});
const recordLeaderboardSnapshot = (room) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client_1.supabase)
        return;
    const active = activeGames.get(room.id);
    if (!active)
        return;
    const snapshot = room.members.reduce((acc, member) => {
        acc[member.id] = member.score;
        return acc;
    }, {});
    const { error } = yield client_1.supabase
        .from('leaderboard_snapshots')
        .insert({
        game_id: active.gameId,
        round_id: active.roundId,
        snapshot,
    });
    logSupabaseError('insert leaderboard snapshot', error);
});
const endGame = (roomID) => __awaiter(void 0, void 0, void 0, function* () {
    if (!client_1.supabase)
        return;
    const active = activeGames.get(roomID);
    if (!active)
        return;
    const { error } = yield client_1.supabase
        .from('games')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', active.gameId);
    logSupabaseError('end game', error);
    activeGames.delete(roomID);
});
server.on("connection", response => {
    numUsers += 1;
    const address = server.options.host;
    const port = server.options.port;
    console.log(`Server is running at ws://${address}:${port}`);
    // handle tag guess
    response.on("message", (data) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const dataJSON = JSON.parse(data.toString());
        const messageType = dataJSON.type;
        switch (messageType) {
            case types_1.EventType.enum.GUESS_TAG: {
                // TODO: guess parsing on server-side to validate that it has not already been guessed
                const result = types_1.GuessTagEventData.safeParse(dataJSON);
                if (!result.success) {
                    break;
                }
                const data = result.data;
                // check that room is valid room
                const room = rooms.get(data.roomID);
                if (!room) {
                    break;
                }
                // broadcast the tag guessed to ALL members of the room, and user that guessed it
                const userToUpdateScore = users.get(data.user.id);
                if (userToUpdateScore) {
                    // short-circuit if user has already finished the round
                    if (room.allUsersReady.get(userToUpdateScore.id)) {
                        break;
                    }
                    if (room.preferlist.some(entry => entry.tag === data.tag.name && entry.frequency === 'all')) {
                        data.tag.score = 0;
                    }
                    userToUpdateScore.score += data.tag.score;
                    yield upsertRoomMember(room.id, userToUpdateScore);
                    yield recordGuess(room.id, userToUpdateScore.id, data.tag);
                    const guessTagData = { type: types_1.EventType.enum.GUESS_TAG, tag: data.tag, user: userToUpdateScore };
                    broadcastToRoom(room, guessTagData);
                }
                break;
            }
            case types_1.EventType.enum.SET_USERNAME: {
                const result = types_1.SetUsernameEventData.safeParse(dataJSON);
                if (!result.success) {
                    break;
                }
                const data = result.data;
                const userID = getUser(response, data.userID);
                const user = users.get(userID);
                if (user) {
                    user.username = data.username;
                    yield upsertPlayer(user);
                    const userToChangeResponseData = { type: types_1.EventType.enum.SET_USERNAME, user };
                    reply(response, userToChangeResponseData);
                }
                break;
            }
            case types_1.EventType.enum.SET_ICON:
                const result = types_1.SetUserIconEventData.safeParse(dataJSON);
                if (!result.success) {
                    break;
                }
                const data = result.data;
                const userID = getUser(response, data.userID);
                const user = users.get(userID);
                const room = rooms.get(data.roomID);
                if (room && user) {
                    if (user.icon) {
                        const pastIcon = user.icon;
                        user.icon = data.icon;
                        yield upsertRoomMember(room.id, user);
                        const responseData = { type: types_1.EventType.enum.SET_ICON, userID, icon: user.icon, pastIcon };
                        broadcastToRoom(room, responseData);
                    }
                    else {
                        user.icon = data.icon;
                        yield upsertRoomMember(room.id, user);
                        const responseData = { type: types_1.EventType.enum.SET_ICON, userID, icon: user.icon };
                        broadcastToRoom(room, responseData);
                    }
                }
                else {
                    console.error(`user ${userID} or room ${room === null || room === void 0 ? void 0 : room.id} does not exist`);
                }
                break;
            case types_1.EventType.enum.GET_SELECTED_ICONS: {
                const result = types_1.GetSelectedIconsEventData.safeParse(dataJSON);
                if (!result.success) {
                    break;
                }
                const { roomID } = result.data;
                const room = rooms.get(roomID);
                if (!room) {
                    break;
                }
                const selectedIconsWithNulls = [...room.allUsersReady.entries()].map(entry => {
                    const userID = entry[0];
                    const user = users.get(userID);
                    if (user) {
                        return user.icon;
                    }
                    return null;
                });
                const selectedIcons = [];
                selectedIconsWithNulls.forEach(selectedIcon => {
                    if (selectedIcon) {
                        selectedIcons.push(selectedIcon);
                    }
                });
                const data = { type: types_1.EventType.enum.GET_SELECTED_ICONS, selectedIcons };
                reply(response, data);
                break;
            }
            case types_1.EventType.enum.CREATE_ROOM: {
                const result = types_1.CreateRoomEventData.safeParse(dataJSON);
                if (!result.success) {
                    break;
                }
                const data = result.data;
                // first time user, create them
                const userID = getUser(response, data.userID);
                // create the room
                let newRoomID = (0, uuid_1.v4)();
                while (rooms.get(newRoomID)) {
                    newRoomID = (0, uuid_1.v4)();
                }
                const user = users.get(userID);
                const userSocket = userSockets.get(userID);
                if (data.roomID) {
                    const room = rooms.get(data.roomID);
                    if (!room) {
                        break;
                    }
                    room.postsPerRound = data.postsPerRound;
                    room.roundsPerGame = data.roundsPerGame;
                    room.name = data.roomName;
                    resetRoom(room);
                    yield upsertRoom(room);
                    if (user && userSocket) {
                        const roomToClient = {
                            roomID: room.id,
                            roomName: room.name,
                            readyStates: getReadyStates(room),
                            owner: user,
                            blacklist: room.blacklist,
                            preferlist: room.preferlist
                        };
                        broadcast(server, { type: types_1.EventType.enum.JOIN_ROOM, user: user, room: roomToClient });
                    }
                }
                else {
                    if (user && userSocket) {
                        // setup the userReady map for the room
                        const newRoomAllUsersReady = new Map();
                        newRoomAllUsersReady.set(user.id, false);
                        // create room and add to rooms map
                        user.roomID = newRoomID;
                        const newRoom = {
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
                        yield upsertPlayer(user);
                        yield upsertRoom(newRoom);
                        yield upsertRoomMember(newRoomID, user);
                        yield setRoomReadyStates(newRoom);
                        const readyStates = getReadyStates(newRoom);
                        const roomToClient = {
                            roomID: newRoom.id,
                            roomName: newRoom.name,
                            readyStates: readyStates,
                            owner: user,
                            blacklist: newRoom.blacklist,
                            preferlist: newRoom.preferlist
                        };
                        // broadcase to the user their updated roomID
                        broadcast(server, { type: types_1.EventType.enum.JOIN_ROOM, user: user, room: roomToClient });
                    }
                }
                break;
            }
            case types_1.EventType.enum.ALL_ROOMS: {
                const roomsToSend = convertServerRoomsToClientRooms();
                reply(response, { type: types_1.EventType.enum.ALL_ROOMS, rooms: roomsToSend });
                break;
            }
            case types_1.EventType.enum.JOIN_ROOM: {
                const result = types_1.JoinRoomEventData.safeParse(dataJSON);
                if (!result.success) {
                    break;
                }
                const roomID = result.data.roomID;
                const userID = getUser(response, result.data.userID);
                const room = rooms.get(roomID);
                const user = users.get(userID);
                if (room && user) {
                    // add member to members list of room
                    room.members.push(user);
                    // set their ready status to false at first
                    room.allUsersReady.set(user.id, false);
                    // set user's roomID to room
                    user.roomID = roomID;
                    yield upsertPlayer(user);
                    yield upsertRoomMember(roomID, user);
                    yield setRoomReadyStates(room);
                    const roomToClient = {
                        roomID: room.id,
                        roomName: room.name,
                        readyStates: getReadyStates(room),
                        owner: room.owner,
                        blacklist: room.blacklist,
                        preferlist: room.preferlist
                    };
                    // broadcast to room newly updated members
                    broadcastToRoom(room, { type: types_1.EventType.enum.JOIN_ROOM, user: user, room: roomToClient });
                }
                break;
            }
            case types_1.EventType.enum.LEAVE_ROOM: {
                const result = types_1.LeaveRoomEventData.safeParse(dataJSON);
                if (!result.success) {
                    break;
                }
                const { userID, roomID } = result.data;
                yield leaveRoom(server, userID, roomID);
                yield removeRoomMember(roomID, userID);
                break;
            }
            case types_1.EventType.enum.REQUEST_POST: {
                // TODO: implement sending win screen upon round exhaustion
                const result = types_1.RequestPostEventData.safeParse(dataJSON);
                if (!result.success) {
                    break;
                }
                const data = result.data;
                const roomToSendPost = rooms.get(data.roomID);
                if (roomToSendPost) {
                    // ready up the user, if they already aren't readied up
                    roomToSendPost.allUsersReady.set(data.userID, true);
                    yield setRoomReadyStates(roomToSendPost);
                    if (roomToSendPost.postQueue.length === 0) {
                        roomToSendPost.postQueue = yield (0, fetching_utility_1.getPosts)(roomToSendPost.blacklist, roomToSendPost.preferlist);
                    }
                    if (roomIsReadyForNewPost(roomToSendPost)) {
                        // they've completed the round, show the leaderboard
                        if (roomToSendPost.postsViewedThisRound >= roomToSendPost.postsPerRound) {
                            yield recordLeaderboardSnapshot(roomToSendPost);
                            roomToSendPost.curRound += 1;
                            roomToSendPost.postsViewedThisRound = 0;
                            if (roomToSendPost.curRound >= roomToSendPost.roundsPerGame) {
                                yield endGame(roomToSendPost.id);
                                broadcastToRoom(roomToSendPost, { type: types_1.EventType.enum.END_GAME });
                                break;
                            }
                            const activeGame = yield ensureActiveGame(roomToSendPost);
                            if (activeGame) {
                                yield startNextRound(roomToSendPost.id, activeGame.gameId, roomToSendPost.curRound);
                            }
                            yield upsertRoom(roomToSendPost);
                            broadcastToRoom(roomToSendPost, { type: types_1.EventType.enum.SHOW_LEADERBOARD });
                            break;
                        }
                        const postToSend = roomToSendPost.postQueue.shift();
                        if (!postToSend) {
                            console.error('No posts available to send.');
                            broadcastToRoom(roomToSendPost, { type: types_1.EventType.enum.REQUEST_POST });
                            break;
                        }
                        yield ensureActiveGame(roomToSendPost, data.userID);
                        yield recordPostAndTags(postToSend);
                        const activeGame = activeGames.get(roomToSendPost.id);
                        if (activeGame) {
                            yield recordRoundPost(roomToSendPost.id, activeGame.roundId, postToSend.id, activeGame.nextPostOrder);
                        }
                        const preferlistAllTimeTags = new Set(roomToSendPost.preferlist.filter(entry => entry.frequency === 'all').map(entry => entry.tag));
                        const tags = Array.isArray(postToSend.tags) ? postToSend.tags : [];
                        const postToSendWithPreferlist = preferlistAllTimeTags.size > 0 ? Object.assign(Object.assign({}, postToSend), { tags: tags.map(tag => preferlistAllTimeTags.has(tag.name) ? Object.assign(Object.assign({}, tag), { score: 0 }) : tag) }) : Object.assign(Object.assign({}, postToSend), { tags });
                        broadcastToRoom(roomToSendPost, { type: types_1.EventType.enum.REQUEST_POST, post: postToSendWithPreferlist });
                        roomToSendPost.postsViewedThisRound += 1;
                        yield upsertRoom(roomToSendPost);
                        // reset ready map to all false
                        const newReadyMap = new Map();
                        roomToSendPost.allUsersReady.forEach((v, k) => {
                            newReadyMap.set(k, false);
                        });
                        roomToSendPost.allUsersReady = newReadyMap;
                        yield setRoomReadyStates(roomToSendPost);
                    }
                    else {
                        broadcastToRoom(roomToSendPost, { type: types_1.EventType.enum.REQUEST_POST });
                    }
                }
                break;
            }
            case types_1.EventType.enum.READY_UP: {
                const result = types_1.ReadyUpEventData.safeParse(dataJSON);
                if (!result.success) {
                    break;
                }
                const data = result.data;
                const room = rooms.get(data.roomID);
                const user = users.get(data.userID);
                if (room && user) {
                    const readyStates = getReadyStates(room);
                    const userToChangeIndex = readyStates.findIndex(readyState => readyState.user.id === data.userID);
                    if (userToChangeIndex >= 0) {
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
                        yield setRoomReadyStates(room);
                        broadcastToRoom(room, { type: types_1.EventType.enum.READY_UP, roomID: room.id, room: updatedRoom });
                    }
                    else {
                        console.error(`user ${data.userID} is not in the room`);
                    }
                }
                else {
                    console.error(`room ${data.roomID} does not exist`);
                }
                break;
            }
            case types_1.EventType.enum.START_GAME: {
                const result = types_1.StartGameEventData.safeParse(dataJSON);
                if (!result.success) {
                    break;
                }
                const data = result.data;
                const room = rooms.get(data.roomID);
                if (room) {
                    yield ensureActiveGame(room, room.owner.id);
                    broadcastToRoom(room, { type: types_1.EventType.enum.START_GAME });
                }
                else {
                    console.error(`room ${data.roomID} does not exist, so a game cannot be started in it`);
                }
                break;
            }
            case types_1.EventType.enum.UPDATE_BLACKLIST: {
                const result = types_1.UpdateBlacklistEventData.safeParse(dataJSON);
                if (!result.success) {
                    break;
                }
                const data = result.data;
                const room = rooms.get(data.roomID);
                if (!room) {
                    break;
                }
                const normalizedTag = normalizeBlacklistTag(data.tag);
                if (!normalizedTag) {
                    break;
                }
                if (data.action === 'add') {
                    if (!room.blacklist.includes(normalizedTag)) {
                        room.blacklist.push(normalizedTag);
                    }
                    if (room.preferlist.some(entry => entry.tag === normalizedTag)) {
                        room.blacklist = room.blacklist.filter(tag => tag !== normalizedTag);
                    }
                }
                else {
                    room.blacklist = room.blacklist.filter(tag => tag !== normalizedTag);
                }
                rooms.set(room.id, room);
                yield updateBlacklist(room.id, normalizedTag, data.action);
                const responseData = {
                    type: types_1.EventType.enum.UPDATE_BLACKLIST,
                    roomID: room.id,
                    blacklist: room.blacklist
                };
                broadcastToRoom(room, responseData);
                break;
            }
            case types_1.EventType.enum.UPDATE_PREFERLIST: {
                const result = types_1.UpdatePreferlistEventData.safeParse(dataJSON);
                if (!result.success) {
                    break;
                }
                const data = result.data;
                const room = rooms.get(data.roomID);
                if (!room) {
                    break;
                }
                const normalizedTag = normalizePreferlistTag(data.tag);
                if (!normalizedTag) {
                    break;
                }
                const preferlistIndex = room.preferlist.findIndex(entry => entry.tag === normalizedTag);
                if (data.action === 'add') {
                    const frequency = (_a = data.frequency) !== null && _a !== void 0 ? _a : 'most';
                    if (preferlistIndex === -1) {
                        room.preferlist.push({ tag: normalizedTag, frequency });
                    }
                    else {
                        room.preferlist[preferlistIndex].frequency = frequency;
                    }
                    room.blacklist = room.blacklist.filter(tag => tag !== normalizedTag);
                }
                else if (data.action === 'set_frequency') {
                    if (data.frequency && preferlistIndex !== -1) {
                        room.preferlist[preferlistIndex].frequency = data.frequency;
                    }
                }
                else {
                    room.preferlist = room.preferlist.filter(entry => entry.tag !== normalizedTag);
                }
                rooms.set(room.id, room);
                yield updatePreferlist(room.id, normalizedTag, data.action, data.frequency);
                if (data.action === 'add') {
                    yield updateBlacklist(room.id, normalizedTag, 'remove');
                }
                const responseData = {
                    type: types_1.EventType.enum.UPDATE_PREFERLIST,
                    roomID: room.id,
                    preferlist: room.preferlist
                };
                broadcastToRoom(room, responseData);
                if (data.action === 'add') {
                    const blacklistResponse = {
                        type: types_1.EventType.enum.UPDATE_BLACKLIST,
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
    }));
    response.on("close", code => {
        purgeUserOnDisconnect(response);
    });
});
//# sourceMappingURL=server.js.map