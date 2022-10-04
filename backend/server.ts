// server
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
} from "./types"; // DTO Types
import type { 
    ServerRoomType, 
    UserType, 
    ClientRoomType, 
    UserReadyStateType, 
    JoinRoomEventDataToClientType, 
    SetUsernameEventDataToClientType, 
    AllRoomsEventDataToClientType, 
    RequestPostEventDataToClientType, 
    GetSelectedIconsEventDataToClientType, 
    SetUserIconEventDataToClientType, 
    ReadyUpEventDataToClientType, 
    ShowLeaderboardEventDataToClientType, 
    LeaveRoomEventDataToClientType 
} from "./types";
import { getPosts } from "./fetching_utility";
import {v4} from 'uuid';


// start up the server
const server = new WebSocketServer({port: 8080});

// TODO: make this client-side settable per-game
const POSTS_PER_ROUND = 2

let numUsers = 0;
// types for global server variables
const rooms: Map<string, ServerRoomType> = new Map<string, ServerRoomType>();
const users: Map<string, UserType> = new Map<string, UserType>();
const userSockets: Map<string, WebSocket> = new Map<string, WebSocket>();

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
    if(roomToUpdate.owner.id === userID) {
        if(roomToUpdate.members.length === 0) {
            rooms.delete(roomToUpdateID);
        } else {
            roomToUpdate.owner = roomToUpdate.members[0];
            rooms.set(roomToUpdateID, roomToUpdate);
        }
    }
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
        owner: serverRoom.owner
    };
}

const convertServerRoomsToClientRooms = () => {
    const roomsToSend: ClientRoomType[] = [...rooms.values()].map((room) => {
        return convertServerRoomToClientRoom(room);
    });
    return roomsToSend;
}

const leaveRoom = (server: WebSocketServer, userID: string, roomID: string) => {
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
    if(roomToUpdate.owner.id === userID) {
        if(roomToUpdate.members.length === 0) {
            rooms.delete(roomID);
            const newRooms = convertServerRoomsToClientRooms();
            const data : AllRoomsEventDataToClientType = {type: EventType.enum.ALL_ROOMS, rooms: newRooms};
            broadcast(server, data); 
        } else {
            roomToUpdate.owner = roomToUpdate.members[0];
            rooms.set(roomID, roomToUpdate);
        }
    }

    const roomToClient = convertServerRoomToClientRoom(roomToUpdate)
    const data : LeaveRoomEventDataToClientType = {type: EventType.enum.LEAVE_ROOM, room: roomToClient};
    broadcastToRoom(roomToUpdate, data);
}

server.on("connection", response => {
    numUsers += 1;

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
                    userToUpdateScore.score += data.tag.score;
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
                        const responseData: SetUserIconEventDataToClientType = {type:EventType.enum.SET_ICON, userID, icon: user.icon, pastIcon};
                        broadcastToRoom(room, responseData);
                    } else {
                        user.icon = data.icon;
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
                        postQueue: [], 
                        allUsersReady: newRoomAllUsersReady, 
                        postsViewedThisRound: 0, 
                        gameStarted: false, 
                        owner: user
                    };
                    rooms.set(newRoomID, newRoom);
                    const readyStates: UserReadyStateType[] = getReadyStates(newRoom);
                    const roomToClient = {
                        roomID: newRoom.id,
                        roomName: newRoom.name, 
                        readyStates: readyStates, 
                        owner: user
                    };
                    console.log('created room, letting user join');
                    // broadcase to the user their updated roomID
                    broadcast<JoinRoomEventDataToClientType>(server, {type: EventType.enum.JOIN_ROOM, user: user, room: roomToClient})
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
                    const roomToClient = {
                        roomID: room.id,
                        roomName: room.name,
                        readyStates: getReadyStates(room), 
                        owner: room.owner
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
                leaveRoom(server, userID, roomID);
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

                    if(roomToSendPost.postQueue.length === 0){
                        roomToSendPost.postQueue = await getPosts();
                    }

                    if(roomIsReadyForNewPost(roomToSendPost)) {
                        // they've completed the round, show the leaderboard
                        if(roomToSendPost.postsViewedThisRound >= roomToSendPost.postsPerRound) {
                            roomToSendPost.postsViewedThisRound = 0;
                            broadcastToRoom<ShowLeaderboardEventDataToClientType>(roomToSendPost, {type: EventType.enum.SHOW_LEADERBOARD});
                            break;
                        }
                        const postToSend = roomToSendPost.postQueue.shift()!;
                        broadcastToRoom<RequestPostEventDataToClientType>(roomToSendPost, {type: EventType.enum.REQUEST_POST, post: postToSend});
                        roomToSendPost.postsViewedThisRound += 1;
                        // reset ready map to all false
                        const newReadyMap = new Map<string, boolean>();
                        roomToSendPost.allUsersReady.forEach((v, k) => {
                            newReadyMap.set(k, false);
                        })
                        roomToSendPost.allUsersReady = newReadyMap;
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
                            owner: user
                        };
                        room.allUsersReady.set(data.userID, data.ready);
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
                    broadcastToRoom(room, {type: EventType.enum.START_GAME});
                } else {
                    console.error(`room ${data.roomID} does not exist, so a game cannot be started in it`);
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