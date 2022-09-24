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
const ws_1 = require("ws");
// TODO: fix imports lol, have to on frontend too
const types_1 = require("./types"); // DTO Types
const fetching_utility_1 = require("./fetching_utility");
const uuid_1 = require("uuid");
// start up the server
const server = new ws_1.WebSocketServer({ port: 8080 });
// TODO: make this client-side settable per-game
const POSTS_PER_ROUND = 2;
let numUsers = 0;
// types for global server variables
const rooms = new Map();
const users = new Map();
const userSockets = new Map();
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
    if (roomToUpdate.owner.id === userID) {
        if (roomToUpdate.members.length === 0) {
            rooms.delete(roomToUpdateID);
        }
        else {
            roomToUpdate.owner = roomToUpdate.members[0];
            rooms.set(roomToUpdateID, roomToUpdate);
        }
    }
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
    return { roomID: serverRoom.id, readyStates: readyStates, owner: serverRoom.owner };
};
const convertServerRoomsToClientRooms = () => {
    const roomsToSend = [...rooms.values()].map((room) => {
        return convertServerRoomToClientRoom(room);
    });
    return roomsToSend;
};
const leaveRoom = (server, userID, roomID) => {
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
    if (roomToUpdate.owner.id === userID) {
        if (roomToUpdate.members.length === 0) {
            rooms.delete(roomID);
            const newRooms = convertServerRoomsToClientRooms();
            const data = { type: types_1.EventType.enum.ALL_ROOMS, rooms: newRooms };
            broadcast(server, data);
        }
        else {
            roomToUpdate.owner = roomToUpdate.members[0];
            rooms.set(roomID, roomToUpdate);
        }
    }
    const roomToClient = convertServerRoomToClientRoom(roomToUpdate);
    const data = { type: types_1.EventType.enum.LEAVE_ROOM, room: roomToClient };
    broadcastToRoom(roomToUpdate, data);
};
server.on("connection", response => {
    numUsers += 1;
    // handle tag guess
    response.on("message", (data) => __awaiter(void 0, void 0, void 0, function* () {
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
                    userToUpdateScore.score += data.tag.score;
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
                        const responseData = { type: types_1.EventType.enum.SET_ICON, userID, icon: user.icon, pastIcon };
                        broadcastToRoom(room, responseData);
                    }
                    else {
                        user.icon = data.icon;
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
                if (user && userSocket) {
                    // setup the userReady map for the room
                    const newRoomAllUsersReady = new Map();
                    newRoomAllUsersReady.set(user.id, false);
                    // create room and add to rooms map
                    user.roomID = newRoomID;
                    const newRoom = { id: newRoomID, members: [user], postQueue: [], allUsersReady: newRoomAllUsersReady, postsViewedThisRound: 0, gameStarted: false, owner: user };
                    rooms.set(newRoomID, newRoom);
                    const readyStates = getReadyStates(newRoom);
                    const roomToClient = { roomID: newRoom.id, readyStates: readyStates, owner: user };
                    // broadcase to the user their updated roomID
                    broadcast(server, { type: types_1.EventType.enum.JOIN_ROOM, user: user, room: roomToClient });
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
                    const roomToClient = { roomID: room.id, readyStates: getReadyStates(room), owner: room.owner };
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
                leaveRoom(server, userID, roomID);
                break;
            }
            case types_1.EventType.enum.REQUEST_POST: {
                const result = types_1.RequestPostEventData.safeParse(dataJSON);
                if (!result.success) {
                    break;
                }
                const data = result.data;
                const roomToSendPost = rooms.get(data.roomID);
                if (roomToSendPost) {
                    // ready up the user, if they already aren't readied up
                    roomToSendPost.allUsersReady.set(data.userID, true);
                    if (roomToSendPost.postQueue.length === 0) {
                        roomToSendPost.postQueue = yield (0, fetching_utility_1.getPosts)();
                    }
                    if (roomIsReadyForNewPost(roomToSendPost)) {
                        // they've completed the round, show the leaderboard
                        if (roomToSendPost.postsViewedThisRound >= POSTS_PER_ROUND) {
                            roomToSendPost.postsViewedThisRound = 0;
                            broadcastToRoom(roomToSendPost, { type: types_1.EventType.enum.SHOW_LEADERBOARD });
                            break;
                        }
                        const postToSend = roomToSendPost.postQueue.shift();
                        broadcastToRoom(roomToSendPost, { type: types_1.EventType.enum.REQUEST_POST, post: postToSend });
                        roomToSendPost.postsViewedThisRound += 1;
                        // reset ready map to all false
                        const newReadyMap = new Map();
                        roomToSendPost.allUsersReady.forEach((v, k) => {
                            newReadyMap.set(k, false);
                        });
                        roomToSendPost.allUsersReady = newReadyMap;
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
                        const updatedRoom = { roomID: room.id, readyStates: readyStates, owner: user };
                        room.allUsersReady.set(data.userID, data.ready);
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
                    broadcastToRoom(room, { type: types_1.EventType.enum.START_GAME });
                }
                else {
                    console.error(`room ${data.roomID} does not exist, so a game cannot be started in it`);
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