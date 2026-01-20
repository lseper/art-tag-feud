"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetRoom = exports.convertServerRoomsToClientRooms = exports.convertServerRoomToClientRoom = exports.getReadyStates = exports.roomIsReadyForNewPost = void 0;
const roomIsReadyForNewPost = (room) => {
    return [...room.allUsersReady.values()].every(readyState => readyState);
};
exports.roomIsReadyForNewPost = roomIsReadyForNewPost;
const getReadyStates = (room, users) => {
    return [...room.allUsersReady.entries()].map((entry) => {
        const user = users.get(entry[0]);
        const icon = user === null || user === void 0 ? void 0 : user.icon;
        return { user, ready: entry[1], icon };
    });
};
exports.getReadyStates = getReadyStates;
const convertServerRoomToClientRoom = (serverRoom, users) => {
    const readyStates = getReadyStates(serverRoom, users);
    return {
        roomID: serverRoom.id,
        roomName: serverRoom.name,
        readyStates,
        owner: serverRoom.owner,
        blacklist: serverRoom.blacklist,
        preferlist: serverRoom.preferlist,
    };
};
exports.convertServerRoomToClientRoom = convertServerRoomToClientRoom;
const convertServerRoomsToClientRooms = (rooms, users) => {
    return [...rooms].map((room) => convertServerRoomToClientRoom(room, users));
};
exports.convertServerRoomsToClientRooms = convertServerRoomsToClientRooms;
const resetRoom = (room) => {
    room.curRound = 0;
    const newReadyStates = new Map();
    for (const userID of room.allUsersReady.keys()) {
        newReadyStates.set(userID, false);
    }
    room.allUsersReady = newReadyStates;
};
exports.resetRoom = resetRoom;
//# sourceMappingURL=roomUtils.js.map