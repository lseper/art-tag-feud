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
exports.puzzleAdvanceRound = exports.endGame = exports.startNextRound = exports.ensureActiveGame = void 0;
const store_1 = require("../state/store");
const gamesRepo_1 = require("../data/repos/gamesRepo");
const roundsRepo_1 = require("../data/repos/roundsRepo");
const ensureActiveGame = (room, createdByPlayerID) => __awaiter(void 0, void 0, void 0, function* () {
    if (store_1.activeGames.has(room.id)) {
        return store_1.activeGames.get(room.id);
    }
    const gameId = yield (0, gamesRepo_1.createGame)(room.id, createdByPlayerID !== null && createdByPlayerID !== void 0 ? createdByPlayerID : null, room.postsPerRound, room.roundsPerGame);
    if (!gameId)
        return null;
    const roundId = yield (0, roundsRepo_1.createRound)(gameId, room.curRound);
    if (!roundId)
        return null;
    const state = {
        gameId,
        roundId,
        roundIndex: room.curRound,
        nextPostOrder: 0,
        currentPost: undefined,
        currentRoundGuesses: new Map(),
    };
    store_1.activeGames.set(room.id, state);
    return state;
});
exports.ensureActiveGame = ensureActiveGame;
const startNextRound = (roomID, gameId, roundIndex) => __awaiter(void 0, void 0, void 0, function* () {
    const roundId = yield (0, roundsRepo_1.createRound)(gameId, roundIndex);
    if (!roundId)
        return null;
    const state = {
        gameId,
        roundId,
        roundIndex,
        nextPostOrder: 0,
        currentPost: undefined,
        currentRoundGuesses: new Map(),
    };
    store_1.activeGames.set(roomID, state);
    return state;
});
exports.startNextRound = startNextRound;
const endGame = (roomID) => __awaiter(void 0, void 0, void 0, function* () {
    const active = store_1.activeGames.get(roomID);
    if (!active)
        return;
    yield (0, gamesRepo_1.endGame)(active.gameId);
    store_1.activeGames.delete(roomID);
});
exports.endGame = endGame;
/**
 * Advance to the next puzzle round or end the game if all rounds are complete.
 * Returns 'next_round', 'end_game', or null on error.
 */
const puzzleAdvanceRound = (roomID) => __awaiter(void 0, void 0, void 0, function* () {
    const active = store_1.activeGames.get(roomID);
    if (!active)
        return null;
    const room = store_1.rooms.get(roomID);
    if (!room)
        return null;
    room.curRound += 1;
    room.postsViewedThisRound = 0;
    if (room.curRound >= room.roundsPerGame) {
        yield endGame(roomID);
        return 'end_game';
    }
    const nextState = yield startNextRound(roomID, active.gameId, room.curRound);
    if (!nextState)
        return null;
    return 'next_round';
});
exports.puzzleAdvanceRound = puzzleAdvanceRound;
//# sourceMappingURL=gameService.js.map