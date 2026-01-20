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
exports.clearUserIcon = exports.setUserIcon = exports.setUsername = exports.getOrCreateUser = void 0;
const uuid_1 = require("uuid");
const store_1 = require("../state/store");
const playersRepo_1 = require("../data/repos/playersRepo");
const roomMembersRepo_1 = require("../data/repos/roomMembersRepo");
const getOrCreateUser = (socket, userID) => {
    if (!userID) {
        let newUserID = (0, uuid_1.v4)();
        while (store_1.userSockets.get(newUserID)) {
            newUserID = (0, uuid_1.v4)();
        }
        const createdUser = { username: `User_${userID}`, id: newUserID, score: 0 };
        store_1.userSockets.set(newUserID, socket);
        store_1.users.set(newUserID, createdUser);
        return newUserID;
    }
    return userID;
};
exports.getOrCreateUser = getOrCreateUser;
const setUsername = (userID, username) => __awaiter(void 0, void 0, void 0, function* () {
    const user = store_1.users.get(userID);
    if (!user)
        return null;
    user.username = username;
    yield (0, playersRepo_1.upsertPlayer)(user);
    return user;
});
exports.setUsername = setUsername;
const setUserIcon = (userID, roomID, icon) => __awaiter(void 0, void 0, void 0, function* () {
    const user = store_1.users.get(userID);
    if (!user)
        return null;
    const pastIcon = user.icon;
    user.icon = icon;
    yield (0, roomMembersRepo_1.upsertRoomMember)(roomID, user);
    return { user, pastIcon };
});
exports.setUserIcon = setUserIcon;
const clearUserIcon = (userID, roomID) => __awaiter(void 0, void 0, void 0, function* () {
    const user = store_1.users.get(userID);
    if (!user)
        return null;
    const pastIcon = user.icon;
    user.icon = undefined;
    yield (0, roomMembersRepo_1.upsertRoomMember)(roomID, user);
    return { user, pastIcon };
});
exports.clearUserIcon = clearUserIcon;
//# sourceMappingURL=userService.js.map