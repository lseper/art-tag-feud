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
exports.updateRoomSettings = exports.updateRoomPreferlist = exports.updateRoomBlacklist = exports.updateRoomReadyState = exports.leaveRoom = exports.joinRoom = exports.createOrUpdateRoom = exports.getSelectedIcons = exports.getRoom = exports.getAllRooms = void 0;
const uuid_1 = require("uuid");
const store_1 = require("../state/store");
const roomUtils_1 = require("../domain/roomUtils");
const tagUtils_1 = require("../domain/tagUtils");
const roomsRepo_1 = require("../data/repos/roomsRepo");
const roomMembersRepo_1 = require("../data/repos/roomMembersRepo");
const roomReadyStateRepo_1 = require("../data/repos/roomReadyStateRepo");
const blacklistRepo_1 = require("../data/repos/blacklistRepo");
const preferlistRepo_1 = require("../data/repos/preferlistRepo");
const playersRepo_1 = require("../data/repos/playersRepo");
const botService_1 = require("./botService");
const DEFAULT_BOT_DIFFICULTY = 'Sinner';
const normalizeBotDifficulties = (botCount, difficulties) => {
    const values = new Set(['Saint', 'Sinner', 'Succubus']);
    const source = Array.isArray(difficulties) ? difficulties : [];
    return Array.from({ length: botCount }, (_value, index) => {
        const entry = source[index];
        return values.has(entry) ? entry : DEFAULT_BOT_DIFFICULTY;
    });
};
const getAllRooms = () => {
    const publicRooms = [...store_1.rooms.values()].filter(room => !room.isPrivate);
    return (0, roomUtils_1.convertServerRoomsToClientRooms)(publicRooms, store_1.users);
};
exports.getAllRooms = getAllRooms;
const getRoom = (roomID) => { var _a; return (_a = store_1.rooms.get(roomID)) !== null && _a !== void 0 ? _a : null; };
exports.getRoom = getRoom;
const normalizeRoomCode = (roomCode) => roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
const getRoomByCode = (roomCode) => {
    var _a;
    const normalized = normalizeRoomCode(roomCode);
    return (_a = [...store_1.rooms.values()].find(room => room.roomCode === normalized)) !== null && _a !== void 0 ? _a : null;
};
const getSelectedIcons = (roomID) => {
    const room = store_1.rooms.get(roomID);
    if (!room)
        return null;
    const selectedIconsWithNulls = [...room.allUsersReady.entries()].map(entry => {
        var _a;
        const userID = entry[0];
        const user = store_1.users.get(userID);
        return (_a = user === null || user === void 0 ? void 0 : user.icon) !== null && _a !== void 0 ? _a : null;
    });
    const selectedIcons = [];
    selectedIconsWithNulls.forEach(selectedIcon => {
        if (selectedIcon) {
            selectedIcons.push(selectedIcon);
        }
    });
    return selectedIcons;
};
exports.getSelectedIcons = getSelectedIcons;
const DEFAULT_GAME_MODE = 'Blitz';
const DEFAULT_RATING = 'Explicit';
const markBotsReady = (room) => {
    room.members.forEach(member => {
        if (member.isBot) {
            room.allUsersReady.set(member.id, true);
        }
    });
};
const createRoomCode = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 12; i += 1) {
        result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return result;
};
const createOrUpdateRoom = (userID, roomName, postsPerRound, roundsPerGame, roomID, gameMode, rating, isPrivate, botCount, botDifficulties, startingLives, turnTimeMs) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const user = store_1.users.get(userID);
    if (!user)
        return null;
    if (roomID) {
        const room = store_1.rooms.get(roomID);
        if (!room)
            return null;
        room.postsPerRound = postsPerRound;
        room.roundsPerGame = roundsPerGame;
        room.name = roomName;
        room.gameMode = (_a = gameMode !== null && gameMode !== void 0 ? gameMode : room.gameMode) !== null && _a !== void 0 ? _a : DEFAULT_GAME_MODE;
        room.rating = (_b = rating !== null && rating !== void 0 ? rating : room.rating) !== null && _b !== void 0 ? _b : DEFAULT_RATING;
        room.isPrivate = (_c = isPrivate !== null && isPrivate !== void 0 ? isPrivate : room.isPrivate) !== null && _c !== void 0 ? _c : false;
        room.botCount = (_d = botCount !== null && botCount !== void 0 ? botCount : room.botCount) !== null && _d !== void 0 ? _d : 0;
        room.botDifficulties = normalizeBotDifficulties(room.botCount, botDifficulties !== null && botDifficulties !== void 0 ? botDifficulties : room.botDifficulties);
        if (startingLives !== undefined)
            room.startingLives = startingLives;
        if (turnTimeMs !== undefined)
            room.turnTimeMs = turnTimeMs;
        if (!room.roomCode) {
            room.roomCode = createRoomCode();
        }
        yield (0, botService_1.ensureBotCountForRoom)(room, room.botCount, room.botDifficulties);
        (0, roomUtils_1.resetRoom)(room);
        markBotsReady(room);
        yield (0, roomsRepo_1.upsertRoom)(room);
        const roomToClient = (0, roomUtils_1.convertServerRoomToClientRoom)(room, store_1.users);
        return { room, roomToClient, user, created: false };
    }
    let newRoomID = (0, uuid_1.v4)();
    while (store_1.rooms.get(newRoomID)) {
        newRoomID = (0, uuid_1.v4)();
    }
    const newRoomAllUsersReady = new Map();
    newRoomAllUsersReady.set(user.id, false);
    user.roomID = newRoomID;
    let roomCode = createRoomCode();
    while ([...store_1.rooms.values()].some(existing => existing.roomCode === roomCode)) {
        roomCode = createRoomCode();
    }
    const newRoom = {
        id: newRoomID,
        name: roomName,
        postsPerRound,
        roundsPerGame,
        botCount: botCount !== null && botCount !== void 0 ? botCount : 0,
        botDifficulties: normalizeBotDifficulties(botCount !== null && botCount !== void 0 ? botCount : 0, botDifficulties),
        gameMode: gameMode !== null && gameMode !== void 0 ? gameMode : DEFAULT_GAME_MODE,
        rating: rating !== null && rating !== void 0 ? rating : DEFAULT_RATING,
        roomCode,
        isPrivate: isPrivate !== null && isPrivate !== void 0 ? isPrivate : false,
        members: [user],
        blacklist: [],
        preferlist: [],
        curRound: 0,
        postQueue: [],
        allUsersReady: newRoomAllUsersReady,
        postsViewedThisRound: 0,
        gameStarted: false,
        owner: user,
        startingLives,
        turnTimeMs,
    };
    store_1.rooms.set(newRoomID, newRoom);
    yield (0, playersRepo_1.upsertPlayer)(user);
    yield (0, botService_1.ensureBotCountForRoom)(newRoom, newRoom.botCount, newRoom.botDifficulties);
    yield (0, roomsRepo_1.upsertRoom)(newRoom);
    yield (0, roomMembersRepo_1.upsertRoomMember)(newRoomID, user);
    yield (0, roomReadyStateRepo_1.upsertRoomReadyStates)(newRoom);
    const roomToClient = (0, roomUtils_1.convertServerRoomToClientRoom)(newRoom, store_1.users);
    return { room: newRoom, roomToClient, user, created: true };
});
exports.createOrUpdateRoom = createOrUpdateRoom;
const joinRoom = (roomID, roomCode, userID) => __awaiter(void 0, void 0, void 0, function* () {
    const room = roomID ? store_1.rooms.get(roomID) : (roomCode ? getRoomByCode(roomCode) : null);
    const user = store_1.users.get(userID);
    if (!room || !user)
        return null;
    if (room.isPrivate) {
        const normalizedCode = roomCode ? normalizeRoomCode(roomCode) : '';
        if (!normalizedCode || normalizedCode !== room.roomCode) {
            return null;
        }
    }
    const isExistingMember = room.members.some(member => member.id === user.id);
    const roomMember = yield (0, roomMembersRepo_1.getRoomMember)(room.id, user.id);
    if ((roomMember === null || roomMember === void 0 ? void 0 : roomMember.score) != null) {
        user.score = roomMember.score;
    }
    else if (!isExistingMember && room.gameStarted) {
        const lowestScore = room.members.length > 0
            ? room.members.reduce((minScore, member) => Math.min(minScore, member.score), room.members[0].score)
            : 0;
        user.score = Math.max(0, lowestScore - 400);
    }
    if (!isExistingMember) {
        room.members.push(user);
    }
    if (!room.allUsersReady.has(user.id)) {
        room.allUsersReady.set(user.id, false);
    }
    user.roomID = room.id;
    yield (0, playersRepo_1.upsertPlayer)(user);
    yield (0, roomMembersRepo_1.upsertRoomMember)(room.id, user);
    yield (0, roomReadyStateRepo_1.upsertRoomReadyStates)(room);
    const roomToClient = (0, roomUtils_1.convertServerRoomToClientRoom)(room, store_1.users);
    return { room, user, roomToClient };
});
exports.joinRoom = joinRoom;
const leaveRoom = (roomID, userID) => __awaiter(void 0, void 0, void 0, function* () {
    const roomToUpdate = store_1.rooms.get(roomID);
    const userToLeave = store_1.users.get(userID);
    if (!roomToUpdate || !userToLeave)
        return null;
    const pastIcon = userToLeave.icon;
    userToLeave.icon = undefined;
    roomToUpdate.allUsersReady.delete(userID);
    roomToUpdate.members = roomToUpdate.members.filter(member => member.id !== userID);
    store_1.rooms.set(roomID, roomToUpdate);
    yield (0, roomMembersRepo_1.removeRoomMember)(roomID, userID);
    let shouldDeleteRoom = false;
    if (roomToUpdate.owner.id === userID) {
        if (roomToUpdate.members.length === 0) {
            store_1.rooms.delete(roomID);
            shouldDeleteRoom = true;
        }
        else {
            roomToUpdate.owner = roomToUpdate.members[0];
            store_1.rooms.set(roomID, roomToUpdate);
        }
    }
    if (shouldDeleteRoom) {
        yield (0, roomsRepo_1.deleteRoom)(roomID);
        return { room: roomToUpdate, shouldDeleteRoom: true, pastIcon };
    }
    yield (0, roomsRepo_1.upsertRoom)(roomToUpdate);
    yield (0, roomReadyStateRepo_1.upsertRoomReadyStates)(roomToUpdate);
    const roomToClient = (0, roomUtils_1.convertServerRoomToClientRoom)(roomToUpdate, store_1.users);
    return { room: roomToUpdate, roomToClient, shouldDeleteRoom: false, pastIcon };
});
exports.leaveRoom = leaveRoom;
const updateRoomReadyState = (roomID, userID, ready) => __awaiter(void 0, void 0, void 0, function* () {
    const room = store_1.rooms.get(roomID);
    const user = store_1.users.get(userID);
    if (!room || !user)
        return null;
    room.allUsersReady.set(userID, ready);
    yield (0, roomReadyStateRepo_1.upsertRoomReadyStates)(room);
    const roomToClient = (0, roomUtils_1.convertServerRoomToClientRoom)(room, store_1.users);
    return { room, roomToClient, user };
});
exports.updateRoomReadyState = updateRoomReadyState;
const updateRoomBlacklist = (roomID, tag, action) => __awaiter(void 0, void 0, void 0, function* () {
    const room = store_1.rooms.get(roomID);
    if (!room)
        return null;
    const normalizedTag = (0, tagUtils_1.normalizeTag)(tag);
    if (!normalizedTag)
        return null;
    if (action === 'add') {
        if (!room.blacklist.includes(normalizedTag)) {
            room.blacklist.push(normalizedTag);
        }
        if (room.preferlist.some(entry => entry.tag === normalizedTag)) {
            room.blacklist = room.blacklist.filter(existing => existing !== normalizedTag);
        }
    }
    else {
        room.blacklist = room.blacklist.filter(existing => existing !== normalizedTag);
    }
    store_1.rooms.set(room.id, room);
    yield (0, blacklistRepo_1.updateBlacklist)(room.id, normalizedTag, action);
    return { room, normalizedTag };
});
exports.updateRoomBlacklist = updateRoomBlacklist;
const updateRoomPreferlist = (roomID, tag, action, frequency) => __awaiter(void 0, void 0, void 0, function* () {
    const room = store_1.rooms.get(roomID);
    if (!room)
        return null;
    const normalizedTag = (0, tagUtils_1.normalizeTag)(tag);
    if (!normalizedTag)
        return null;
    const preferlistIndex = room.preferlist.findIndex(entry => entry.tag === normalizedTag);
    if (action === 'add') {
        const nextFrequency = frequency !== null && frequency !== void 0 ? frequency : 'most';
        if (preferlistIndex === -1) {
            room.preferlist.push({ tag: normalizedTag, frequency: nextFrequency });
        }
        else {
            room.preferlist[preferlistIndex].frequency = nextFrequency;
        }
        room.blacklist = room.blacklist.filter(existing => existing !== normalizedTag);
    }
    else if (action === 'set_frequency') {
        if (frequency && preferlistIndex !== -1) {
            room.preferlist[preferlistIndex].frequency = frequency;
        }
    }
    else {
        room.preferlist = room.preferlist.filter(entry => entry.tag !== normalizedTag);
    }
    store_1.rooms.set(room.id, room);
    yield (0, preferlistRepo_1.updatePreferlist)(room.id, normalizedTag, action, frequency);
    if (action === 'add') {
        yield (0, blacklistRepo_1.updateBlacklist)(room.id, normalizedTag, 'remove');
    }
    return { room, normalizedTag, removedFromBlacklist: action === 'add' };
});
exports.updateRoomPreferlist = updateRoomPreferlist;
const updateRoomSettings = (roomID, roomName, postsPerRound, roundsPerGame, botCount, botDifficulties, gameMode, rating, isPrivate, startingLives, turnTimeMs) => __awaiter(void 0, void 0, void 0, function* () {
    const room = store_1.rooms.get(roomID);
    if (!room)
        return null;
    const shouldReset = room.postsPerRound !== postsPerRound || room.roundsPerGame !== roundsPerGame;
    room.name = roomName;
    room.postsPerRound = postsPerRound;
    room.roundsPerGame = roundsPerGame;
    room.botCount = botCount;
    room.botDifficulties = normalizeBotDifficulties(botCount, botDifficulties);
    room.gameMode = gameMode;
    room.rating = rating;
    room.isPrivate = isPrivate;
    if (startingLives !== undefined)
        room.startingLives = startingLives;
    if (turnTimeMs !== undefined)
        room.turnTimeMs = turnTimeMs;
    yield (0, botService_1.ensureBotCountForRoom)(room, botCount, room.botDifficulties);
    if (shouldReset) {
        (0, roomUtils_1.resetRoom)(room);
        markBotsReady(room);
    }
    store_1.rooms.set(room.id, room);
    yield (0, roomsRepo_1.upsertRoom)(room);
    const roomToClient = (0, roomUtils_1.convertServerRoomToClientRoom)(room, store_1.users);
    return { room, roomToClient };
});
exports.updateRoomSettings = updateRoomSettings;
//# sourceMappingURL=roomService.js.map