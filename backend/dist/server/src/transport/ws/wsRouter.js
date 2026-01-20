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
exports.handleMessage = void 0;
const contracts_1 = require("../../domain/contracts");
const wsBroadcast_1 = require("./wsBroadcast");
const userService_1 = require("../../services/userService");
const roomService_1 = require("../../services/roomService");
const guessService_1 = require("../../services/guessService");
const postService_1 = require("../../services/postService");
const gameService_1 = require("../../services/gameService");
const handleMessage = (server, response, data) => __awaiter(void 0, void 0, void 0, function* () {
    const dataJSON = JSON.parse(data.toString());
    const messageType = dataJSON.type;
    switch (messageType) {
        case contracts_1.EventType.enum.GUESS_TAG: {
            const result = contracts_1.GuessTagEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const guessResult = yield (0, guessService_1.handleGuessTag)(data.roomID, data.user.id, data.tag);
            if (guessResult) {
                const guessTagData = { type: contracts_1.EventType.enum.GUESS_TAG, tag: guessResult.tag, user: guessResult.user };
                (0, wsBroadcast_1.broadcastToRoom)(guessResult.room, guessTagData);
            }
            break;
        }
        case contracts_1.EventType.enum.SET_USERNAME: {
            const result = contracts_1.SetUsernameEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const userID = (0, userService_1.getOrCreateUser)(response, data.userID);
            const user = yield (0, userService_1.setUsername)(userID, data.username);
            if (user) {
                const userToChangeResponseData = { type: contracts_1.EventType.enum.SET_USERNAME, user };
                (0, wsBroadcast_1.reply)(response, userToChangeResponseData);
            }
            break;
        }
        case contracts_1.EventType.enum.SET_ICON: {
            const result = contracts_1.SetUserIconEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const userID = (0, userService_1.getOrCreateUser)(response, data.userID);
            const room = (0, roomService_1.getRoom)(data.roomID);
            if (room) {
                const iconResult = yield (0, userService_1.setUserIcon)(userID, room.id, data.icon);
                if (iconResult) {
                    const responseData = iconResult.pastIcon
                        ? { type: contracts_1.EventType.enum.SET_ICON, userID, icon: iconResult.user.icon, pastIcon: iconResult.pastIcon }
                        : { type: contracts_1.EventType.enum.SET_ICON, userID, icon: iconResult.user.icon };
                    (0, wsBroadcast_1.broadcastToRoom)(room, responseData);
                }
            }
            else {
                const roomId = (room !== null && room !== void 0 ? room : { id: 'NULL' }).id;
                console.error(`user ${userID} or room ${roomId}} does not exist`);
            }
            break;
        }
        case contracts_1.EventType.enum.GET_SELECTED_ICONS: {
            const result = contracts_1.GetSelectedIconsEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const { roomID } = result.data;
            const selectedIcons = (0, roomService_1.getSelectedIcons)(roomID);
            if (!selectedIcons) {
                break;
            }
            const responseData = { type: contracts_1.EventType.enum.GET_SELECTED_ICONS, selectedIcons };
            (0, wsBroadcast_1.reply)(response, responseData);
            break;
        }
        case contracts_1.EventType.enum.CREATE_ROOM: {
            const result = contracts_1.CreateRoomEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const userID = (0, userService_1.getOrCreateUser)(response, data.userID);
            const createResult = yield (0, roomService_1.createOrUpdateRoom)(userID, data.roomName, data.postsPerRound, data.roundsPerGame, data.roomID);
            if (createResult) {
                const roomToClient = createResult.roomToClient;
                (0, wsBroadcast_1.broadcast)(server, { type: contracts_1.EventType.enum.JOIN_ROOM, user: createResult.user, room: roomToClient });
            }
            break;
        }
        case contracts_1.EventType.enum.ALL_ROOMS: {
            const roomsToSend = (0, roomService_1.getAllRooms)();
            (0, wsBroadcast_1.reply)(response, { type: contracts_1.EventType.enum.ALL_ROOMS, rooms: roomsToSend });
            break;
        }
        case contracts_1.EventType.enum.JOIN_ROOM: {
            const result = contracts_1.JoinRoomEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const roomID = result.data.roomID;
            const userID = (0, userService_1.getOrCreateUser)(response, result.data.userID);
            const joinResult = yield (0, roomService_1.joinRoom)(roomID, userID);
            if (joinResult) {
                (0, wsBroadcast_1.broadcastToRoom)(joinResult.room, { type: contracts_1.EventType.enum.JOIN_ROOM, user: joinResult.user, room: joinResult.roomToClient });
            }
            break;
        }
        case contracts_1.EventType.enum.LEAVE_ROOM: {
            const result = contracts_1.LeaveRoomEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const { userID, roomID } = result.data;
            const leaveResult = yield (0, roomService_1.leaveRoom)(roomID, userID);
            if (!leaveResult) {
                break;
            }
            const iconData = { type: contracts_1.EventType.enum.SET_ICON, userID, pastIcon: leaveResult.pastIcon };
            (0, wsBroadcast_1.broadcastToRoom)(leaveResult.room, iconData);
            if (leaveResult.shouldDeleteRoom) {
                const newRooms = (0, roomService_1.getAllRooms)();
                const data = { type: contracts_1.EventType.enum.ALL_ROOMS, rooms: newRooms };
                (0, wsBroadcast_1.broadcast)(server, data);
                break;
            }
            const leaveData = { type: contracts_1.EventType.enum.LEAVE_ROOM, room: leaveResult.roomToClient };
            (0, wsBroadcast_1.broadcastToRoom)(leaveResult.room, leaveData);
            break;
        }
        case contracts_1.EventType.enum.REQUEST_POST: {
            const result = contracts_1.RequestPostEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const requestResult = yield (0, postService_1.handleRequestPost)(data.roomID, data.userID);
            const room = (0, roomService_1.getRoom)(data.roomID);
            if (!room) {
                break;
            }
            if (requestResult.kind === 'end_game') {
                (0, wsBroadcast_1.broadcastToRoom)(room, { type: contracts_1.EventType.enum.END_GAME });
                break;
            }
            if (requestResult.kind === 'show_leaderboard') {
                (0, wsBroadcast_1.broadcastToRoom)(room, { type: contracts_1.EventType.enum.SHOW_LEADERBOARD });
                break;
            }
            if (requestResult.kind === 'send_post') {
                (0, wsBroadcast_1.broadcastToRoom)(room, { type: contracts_1.EventType.enum.REQUEST_POST, post: requestResult.post });
                break;
            }
            (0, wsBroadcast_1.broadcastToRoom)(room, { type: contracts_1.EventType.enum.REQUEST_POST });
            break;
        }
        case contracts_1.EventType.enum.READY_UP: {
            const result = contracts_1.ReadyUpEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const readyResult = yield (0, roomService_1.updateRoomReadyState)(data.roomID, data.userID, data.ready);
            if (readyResult) {
                const updatedRoom = {
                    roomID: readyResult.room.id,
                    roomName: readyResult.room.name,
                    readyStates: readyResult.roomToClient.readyStates,
                    owner: readyResult.user,
                    blacklist: readyResult.room.blacklist,
                    preferlist: readyResult.room.preferlist,
                };
                (0, wsBroadcast_1.broadcastToRoom)(readyResult.room, { type: contracts_1.EventType.enum.READY_UP, roomID: readyResult.room.id, room: updatedRoom });
            }
            break;
        }
        case contracts_1.EventType.enum.START_GAME: {
            const result = contracts_1.StartGameEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const room = (0, roomService_1.getRoom)(data.roomID);
            if (room) {
                yield (0, gameService_1.ensureActiveGame)(room, room.owner.id);
                (0, wsBroadcast_1.broadcastToRoom)(room, { type: contracts_1.EventType.enum.START_GAME });
            }
            else {
                console.error(`room ${data.roomID} does not exist, so a game cannot be started in it`);
            }
            break;
        }
        case contracts_1.EventType.enum.UPDATE_BLACKLIST: {
            const result = contracts_1.UpdateBlacklistEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const updateResult = yield (0, roomService_1.updateRoomBlacklist)(data.roomID, data.tag, data.action);
            if (!updateResult) {
                break;
            }
            const responseData = {
                type: contracts_1.EventType.enum.UPDATE_BLACKLIST,
                roomID: updateResult.room.id,
                blacklist: updateResult.room.blacklist,
            };
            (0, wsBroadcast_1.broadcastToRoom)(updateResult.room, responseData);
            break;
        }
        case contracts_1.EventType.enum.UPDATE_PREFERLIST: {
            const result = contracts_1.UpdatePreferlistEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const updateResult = yield (0, roomService_1.updateRoomPreferlist)(data.roomID, data.tag, data.action, data.frequency);
            if (!updateResult) {
                break;
            }
            const responseData = {
                type: contracts_1.EventType.enum.UPDATE_PREFERLIST,
                roomID: updateResult.room.id,
                preferlist: updateResult.room.preferlist,
            };
            (0, wsBroadcast_1.broadcastToRoom)(updateResult.room, responseData);
            if (updateResult.removedFromBlacklist) {
                const blacklistResponse = {
                    type: contracts_1.EventType.enum.UPDATE_BLACKLIST,
                    roomID: updateResult.room.id,
                    blacklist: updateResult.room.blacklist,
                };
                (0, wsBroadcast_1.broadcastToRoom)(updateResult.room, blacklistResponse);
            }
            break;
        }
        default:
            break;
    }
});
exports.handleMessage = handleMessage;
//# sourceMappingURL=wsRouter.js.map