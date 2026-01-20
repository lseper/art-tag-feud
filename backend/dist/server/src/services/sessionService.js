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
exports.purgeUserOnDisconnect = void 0;
const store_1 = require("../state/store");
const roomMembersRepo_1 = require("../data/repos/roomMembersRepo");
const roomsRepo_1 = require("../data/repos/roomsRepo");
const roomReadyStateRepo_1 = require("../data/repos/roomReadyStateRepo");
const purgeUserOnDisconnect = (userSocket) => __awaiter(void 0, void 0, void 0, function* () {
    (0, store_1.decrementUsers)();
    const userEntry = [...store_1.userSockets.entries()].find(entry => {
        const [, socket] = entry;
        return userSocket === socket;
    });
    if (!userEntry) {
        return;
    }
    const userID = userEntry[0];
    store_1.userSockets.delete(userID);
    store_1.users.delete(userID);
    const roomToUpdateEntry = [...store_1.rooms.entries()].find(entry => {
        const [, room] = entry;
        return room.members.some(member => member.id === userID);
    });
    if (!roomToUpdateEntry) {
        return;
    }
    const [roomToUpdateID, roomToUpdate] = roomToUpdateEntry;
    roomToUpdate.allUsersReady.delete(userID);
    roomToUpdate.members = roomToUpdate.members.filter(member => member.id !== userID);
    store_1.rooms.set(roomToUpdateID, roomToUpdate);
    yield (0, roomMembersRepo_1.removeRoomMember)(roomToUpdateID, userID);
    let shouldDeleteRoom = false;
    if (roomToUpdate.owner.id === userID) {
        if (roomToUpdate.members.length === 0) {
            store_1.rooms.delete(roomToUpdateID);
            shouldDeleteRoom = true;
        }
        else {
            roomToUpdate.owner = roomToUpdate.members[0];
            store_1.rooms.set(roomToUpdateID, roomToUpdate);
        }
    }
    if (shouldDeleteRoom) {
        yield (0, roomsRepo_1.deleteRoom)(roomToUpdateID);
        return;
    }
    yield (0, roomsRepo_1.upsertRoom)(roomToUpdate);
    yield (0, roomReadyStateRepo_1.upsertRoomReadyStates)(roomToUpdate);
});
exports.purgeUserOnDisconnect = purgeUserOnDisconnect;
//# sourceMappingURL=sessionService.js.map