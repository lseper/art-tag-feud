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
exports.handleGuessTag = void 0;
const store_1 = require("../state/store");
const roomMembersRepo_1 = require("../data/repos/roomMembersRepo");
const postService_1 = require("./postService");
const rouletteService_1 = require("./rouletteService");
const handleGuessTag = (roomID, userID, tag) => __awaiter(void 0, void 0, void 0, function* () {
    const room = store_1.rooms.get(roomID);
    const userToUpdateScore = store_1.users.get(userID);
    if (!room || !userToUpdateScore)
        return null;
    if (room.gameMode === 'Roulette') {
        // Roulette handles turn validation and life tracking internally
        const result = (0, rouletteService_1.handleRouletteGuess)(roomID, userID, tag);
        if (result.kind === 'not_your_turn' || result.kind === 'no_state') {
            return null;
        }
        if (result.kind === 'correct' || result.kind === 'all_tags_guessed') {
            yield (0, postService_1.recordGuess)(roomID, userID, result.tag);
            return { room, user: userToUpdateScore, tag: result.tag, rouletteResult: result };
        }
        // wrong guess, game_over: no guess to record
        return { room, user: userToUpdateScore, tag, rouletteResult: result };
    }
    if (room.allUsersReady.get(userToUpdateScore.id)) {
        return null;
    }
    if (room.preferlist.some(entry => entry.tag === tag.name && entry.frequency === 'all')) {
        tag.score = 0;
    }
    userToUpdateScore.score += tag.score;
    yield (0, roomMembersRepo_1.upsertRoomMember)(room.id, userToUpdateScore);
    yield (0, postService_1.recordGuess)(room.id, userToUpdateScore.id, tag);
    const active = store_1.activeGames.get(roomID);
    if (active) {
        if (!active.currentRoundGuesses) {
            active.currentRoundGuesses = new Map();
        }
        if (!active.currentRoundGuesses.has(tag.name)) {
            active.currentRoundGuesses.set(tag.name, userToUpdateScore.id);
            store_1.activeGames.set(roomID, active);
        }
    }
    return { room, user: userToUpdateScore, tag };
});
exports.handleGuessTag = handleGuessTag;
//# sourceMappingURL=guessService.js.map