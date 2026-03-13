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
const roomUtils_1 = require("../../domain/roomUtils");
const store_1 = require("../../state/store");
const wsBroadcast_1 = require("./wsBroadcast");
const userService_1 = require("../../services/userService");
const roomService_1 = require("../../services/roomService");
const guessService_1 = require("../../services/guessService");
const postService_1 = require("../../services/postService");
const gameService_1 = require("../../services/gameService");
const botService_1 = require("../../services/botService");
const rouletteService_1 = require("../../services/rouletteService");
const handleMessage = (server, response, data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
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
            if (!guessResult)
                break;
            const room = (0, roomService_1.getRoom)(data.roomID);
            if (!room)
                break;
            if (room.gameMode === 'Roulette') {
                const rr = guessResult.rouletteResult;
                if (!rr)
                    break;
                if (rr.kind === 'correct' || rr.kind === 'all_tags_guessed') {
                    (0, wsBroadcast_1.broadcastToRoom)(room, { type: contracts_1.EventType.enum.GUESS_TAG, tag: guessResult.tag, user: guessResult.user });
                }
                if (rr.kind === 'all_tags_guessed') {
                    (0, wsBroadcast_1.broadcastToRoom)(room, { type: contracts_1.EventType.enum.ROULETTE_ALL_TAGS_GUESSED });
                    // Auto-advance to next post
                    const postResult = yield (0, postService_1.handleRequestPost)(data.roomID, data.user.id);
                    if (postResult.kind === 'send_post') {
                        (0, wsBroadcast_1.broadcastToRoom)(room, {
                            type: contracts_1.EventType.enum.REQUEST_POST,
                            post: postResult.post,
                            botActionSequence: (_a = postResult.botActionSequence) !== null && _a !== void 0 ? _a : undefined,
                        });
                    }
                }
                break;
            }
            const guessTagData = { type: contracts_1.EventType.enum.GUESS_TAG, tag: guessResult.tag, user: guessResult.user };
            (0, wsBroadcast_1.broadcastToRoom)(guessResult.room, guessTagData);
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
            const createResult = yield (0, roomService_1.createOrUpdateRoom)(userID, data.roomName, data.postsPerRound, data.roundsPerGame, data.roomID, data.gameMode, data.rating, data.isPrivate, data.botCount, data.botDifficulties, data.startingLives, data.turnTimeMs);
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
            const { roomID, roomCode } = result.data;
            const userID = (0, userService_1.getOrCreateUser)(response, result.data.userID);
            const joinResult = yield (0, roomService_1.joinRoom)(roomID, roomCode, userID);
            if (joinResult) {
                (0, wsBroadcast_1.broadcastToRoom)(joinResult.room, { type: contracts_1.EventType.enum.JOIN_ROOM, user: joinResult.user, room: joinResult.roomToClient });
                const activeGame = store_1.activeGames.get(joinResult.room.id);
                const currentPost = activeGame === null || activeGame === void 0 ? void 0 : activeGame.currentPost;
                if (currentPost) {
                    const guessedTags = [...((_c = (_b = activeGame === null || activeGame === void 0 ? void 0 : activeGame.currentRoundGuesses) === null || _b === void 0 ? void 0 : _b.entries()) !== null && _c !== void 0 ? _c : [])].flatMap(([tagName, guesserId]) => {
                        const tag = currentPost.tags.find(existing => existing.name === tagName);
                        const user = store_1.users.get(guesserId);
                        if (!tag || !user) {
                            return [];
                        }
                        return [{ tag, user }];
                    });
                    const roundStateData = {
                        type: contracts_1.EventType.enum.SYNC_ROUND_STATE,
                        post: currentPost,
                        guessedTags,
                    };
                    (0, wsBroadcast_1.reply)(response, roundStateData);
                }
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
                (0, wsBroadcast_1.broadcastToRoom)(room, {
                    type: contracts_1.EventType.enum.REQUEST_POST,
                    post: requestResult.post,
                    botActionSequence: (_d = requestResult.botActionSequence) !== null && _d !== void 0 ? _d : undefined,
                });
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
                (0, wsBroadcast_1.broadcastToRoom)(readyResult.room, {
                    type: contracts_1.EventType.enum.READY_UP,
                    roomID: readyResult.room.id,
                    room: readyResult.roomToClient,
                });
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
        case contracts_1.EventType.enum.UPDATE_ROOM_SETTINGS: {
            const result = contracts_1.UpdateRoomSettingsEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const room = (0, roomService_1.getRoom)(data.roomID);
            if (!room || room.owner.id !== data.userID) {
                break;
            }
            const updateResult = yield (0, roomService_1.updateRoomSettings)(data.roomID, data.roomName, data.postsPerRound, data.roundsPerGame, data.botCount, data.botDifficulties, data.gameMode, data.rating, data.isPrivate, data.startingLives, data.turnTimeMs);
            if (!updateResult) {
                break;
            }
            const responseData = {
                type: contracts_1.EventType.enum.UPDATE_ROOM_SETTINGS,
                roomID: updateResult.room.id,
                roomName: updateResult.room.name,
                postsPerRound: updateResult.room.postsPerRound,
                roundsPerGame: updateResult.room.roundsPerGame,
                botCount: updateResult.room.botCount,
                botDifficulties: updateResult.room.botDifficulties,
                gameMode: updateResult.room.gameMode,
                rating: updateResult.room.rating,
                roomCode: updateResult.room.roomCode,
                isPrivate: updateResult.room.isPrivate,
                startingLives: updateResult.room.startingLives,
                turnTimeMs: updateResult.room.turnTimeMs,
            };
            (0, wsBroadcast_1.broadcastToRoom)(updateResult.room, responseData);
            break;
        }
        case contracts_1.EventType.enum.ROULETTE_VOTE_SKIP: {
            const result = contracts_1.RouletteVoteSkipEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const room = (0, roomService_1.getRoom)(data.roomID);
            if (!room)
                break;
            const skipResult = (0, rouletteService_1.handleVoteSkip)(data.roomID, data.userID, data.vote);
            if (!skipResult)
                break;
            const skipUpdateData = {
                type: contracts_1.EventType.enum.ROULETTE_SKIP_UPDATE,
                skipVotes: skipResult.skipVotes,
                totalPlayers: skipResult.totalPlayers,
                threshold: skipResult.threshold,
            };
            (0, wsBroadcast_1.broadcastToRoom)(room, skipUpdateData);
            if (skipResult.shouldSkip) {
                (0, wsBroadcast_1.broadcastToRoom)(room, { type: contracts_1.EventType.enum.ROULETTE_ALL_TAGS_GUESSED });
                const postResult = yield (0, postService_1.handleRequestPost)(data.roomID, data.userID);
                if (postResult.kind === 'send_post') {
                    (0, wsBroadcast_1.broadcastToRoom)(room, {
                        type: contracts_1.EventType.enum.REQUEST_POST,
                        post: postResult.post,
                        botActionSequence: (_e = postResult.botActionSequence) !== null && _e !== void 0 ? _e : undefined,
                    });
                }
            }
            break;
        }
        case contracts_1.EventType.enum.REQUEST_BOT_FILL: {
            const result = contracts_1.RequestBotFillEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const room = (0, roomService_1.getRoom)(data.roomID);
            if (!room || room.owner.id !== data.userID) {
                break;
            }
            const profileNames = data.botProfileName
                ? data.botNames.map(() => data.botProfileName)
                : undefined;
            const createdBots = yield (0, botService_1.createBotsForRoom)(room.id, data.botNames, profileNames);
            if (createdBots.length === 0) {
                break;
            }
            const roomToClient = (0, roomUtils_1.convertServerRoomToClientRoom)(room, store_1.users);
            createdBots.forEach(bot => {
                (0, wsBroadcast_1.broadcastToRoom)(room, { type: contracts_1.EventType.enum.JOIN_ROOM, user: bot, room: roomToClient });
            });
            break;
        }
        default:
            break;
    }
});
exports.handleMessage = handleMessage;
//# sourceMappingURL=wsRouter.js.map