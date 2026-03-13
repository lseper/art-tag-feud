"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalGuessCount = exports.getRouletteState = exports.handleNewPost = exports.handleVoteSkip = exports.handleRouletteGuess = exports.startTurn = exports.initRouletteGame = void 0;
const contracts_1 = require("../domain/contracts");
const store_1 = require("../state/store");
const wsBroadcast_1 = require("../transport/ws/wsBroadcast");
const DEFAULT_STARTING_LIVES = 3;
const DEFAULT_TURN_TIME_MS = 15000;
const shuffle = (arr) => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};
const getPlayerLivesRecord = (state) => {
    const record = {};
    state.playerLives.forEach((lives, playerID) => {
        record[playerID] = lives;
    });
    return record;
};
const getAlivePlayerCount = (state) => {
    let count = 0;
    state.playerLives.forEach(lives => {
        if (lives > 0)
            count++;
    });
    return count;
};
const getNextAlivePlayerIndex = (state) => {
    var _a;
    const { turnOrder, playerLives, currentTurnIndex } = state;
    const len = turnOrder.length;
    for (let i = 1; i <= len; i++) {
        const nextIndex = (currentTurnIndex + i) % len;
        const playerID = turnOrder[nextIndex];
        const lives = (_a = playerLives.get(playerID)) !== null && _a !== void 0 ? _a : 0;
        if (lives > 0) {
            return nextIndex;
        }
    }
    return -1;
};
const clearTurnTimer = (state) => {
    if (state.turnTimerHandle !== undefined) {
        clearTimeout(state.turnTimerHandle);
        state.turnTimerHandle = undefined;
    }
};
const initRouletteGame = (roomID) => {
    var _a, _b;
    const room = store_1.rooms.get(roomID);
    if (!room)
        return null;
    const turnOrder = shuffle(room.members.map(m => m.id));
    const startingLives = (_a = room.startingLives) !== null && _a !== void 0 ? _a : DEFAULT_STARTING_LIVES;
    const playerLives = new Map();
    turnOrder.forEach(id => playerLives.set(id, startingLives));
    const state = {
        turnOrder,
        currentTurnIndex: 0,
        playerLives,
        skipVotes: new Set(),
        turnTimerHandle: undefined,
        totalGuessCount: new Map(),
        eliminationOrder: [],
        turnTimeMs: (_b = room.turnTimeMs) !== null && _b !== void 0 ? _b : DEFAULT_TURN_TIME_MS,
    };
    store_1.rouletteGames.set(roomID, state);
    return state;
};
exports.initRouletteGame = initRouletteGame;
const startTurn = (roomID) => {
    const room = store_1.rooms.get(roomID);
    const state = store_1.rouletteGames.get(roomID);
    if (!room || !state)
        return;
    clearTurnTimer(state);
    const activePlayerID = state.turnOrder[state.currentTurnIndex];
    const playerLivesRecord = getPlayerLivesRecord(state);
    (0, wsBroadcast_1.broadcastToRoom)(room, {
        type: contracts_1.EventType.enum.ROULETTE_TURN_START,
        activePlayerID,
        turnTimeMs: state.turnTimeMs,
        turnOrder: state.turnOrder,
        playerLives: playerLivesRecord,
    });
    state.turnTimerHandle = setTimeout(() => {
        handleTurnTimeout(roomID);
    }, state.turnTimeMs);
    store_1.rouletteGames.set(roomID, state);
};
exports.startTurn = startTurn;
const handlePlayerElimination = (roomID, playerID) => {
    const room = store_1.rooms.get(roomID);
    const state = store_1.rouletteGames.get(roomID);
    if (!room || !state)
        return;
    state.eliminationOrder.push(playerID);
    const placement = state.eliminationOrder.length;
    (0, wsBroadcast_1.broadcastToRoom)(room, {
        type: contracts_1.EventType.enum.ROULETTE_PLAYER_ELIMINATED,
        playerID,
        placement,
    });
    store_1.rouletteGames.set(roomID, state);
};
const advanceTurn = (roomID) => {
    const room = store_1.rooms.get(roomID);
    const state = store_1.rouletteGames.get(roomID);
    if (!room || !state)
        return;
    const aliveCount = getAlivePlayerCount(state);
    if (aliveCount <= 0) {
        (0, wsBroadcast_1.broadcastToRoom)(room, { type: contracts_1.EventType.enum.END_GAME });
        store_1.rouletteGames.delete(roomID);
        return;
    }
    const nextIndex = getNextAlivePlayerIndex(state);
    if (nextIndex === -1)
        return;
    state.currentTurnIndex = nextIndex;
    store_1.rouletteGames.set(roomID, state);
    startTurn(roomID);
};
const handleTurnTimeout = (roomID) => {
    var _a;
    const room = store_1.rooms.get(roomID);
    const state = store_1.rouletteGames.get(roomID);
    if (!room || !state)
        return;
    state.turnTimerHandle = undefined;
    const activePlayerID = state.turnOrder[state.currentTurnIndex];
    const currentLives = (_a = state.playerLives.get(activePlayerID)) !== null && _a !== void 0 ? _a : 0;
    const newLives = Math.max(0, currentLives - 1);
    state.playerLives.set(activePlayerID, newLives);
    store_1.rouletteGames.set(roomID, state);
    (0, wsBroadcast_1.broadcastToRoom)(room, {
        type: contracts_1.EventType.enum.ROULETTE_LIFE_LOST,
        playerID: activePlayerID,
        livesRemaining: newLives,
        reason: 'timeout',
    });
    if (newLives <= 0) {
        handlePlayerElimination(roomID, activePlayerID);
    }
    advanceTurn(roomID);
};
const handleRouletteGuess = (roomID, userID, tag) => {
    var _a, _b, _c, _d;
    const state = store_1.rouletteGames.get(roomID);
    if (!state)
        return { kind: 'no_state' };
    const activePlayerID = state.turnOrder[state.currentTurnIndex];
    if (activePlayerID !== userID) {
        return { kind: 'not_your_turn' };
    }
    const active = store_1.activeGames.get(roomID);
    if (!(active === null || active === void 0 ? void 0 : active.currentPost))
        return { kind: 'no_state' };
    const actualTag = active.currentPost.tags.find(t => t.name === tag.name);
    const alreadyGuessed = (_b = (_a = active.currentRoundGuesses) === null || _a === void 0 ? void 0 : _a.has(tag.name)) !== null && _b !== void 0 ? _b : false;
    if (!actualTag || alreadyGuessed) {
        // Wrong guess
        clearTurnTimer(state);
        const currentLives = (_c = state.playerLives.get(userID)) !== null && _c !== void 0 ? _c : 0;
        const newLives = Math.max(0, currentLives - 1);
        state.playerLives.set(userID, newLives);
        store_1.rouletteGames.set(roomID, state);
        const room = store_1.rooms.get(roomID);
        if (!room)
            return { kind: 'no_state' };
        (0, wsBroadcast_1.broadcastToRoom)(room, {
            type: contracts_1.EventType.enum.ROULETTE_LIFE_LOST,
            playerID: userID,
            livesRemaining: newLives,
            reason: 'wrong_guess',
        });
        const eliminated = newLives <= 0;
        if (eliminated) {
            handlePlayerElimination(roomID, userID);
        }
        const aliveCount = getAlivePlayerCount(state);
        if (aliveCount <= 0) {
            (0, wsBroadcast_1.broadcastToRoom)(room, { type: contracts_1.EventType.enum.END_GAME });
            store_1.rouletteGames.delete(roomID);
            return { kind: 'game_over' };
        }
        advanceTurn(roomID);
        return { kind: 'wrong', livesRemaining: newLives, eliminated };
    }
    // Correct guess
    clearTurnTimer(state);
    const currentCount = (_d = state.totalGuessCount.get(userID)) !== null && _d !== void 0 ? _d : 0;
    state.totalGuessCount.set(userID, currentCount + 1);
    if (!active.currentRoundGuesses) {
        active.currentRoundGuesses = new Map();
    }
    active.currentRoundGuesses.set(actualTag.name, userID);
    store_1.activeGames.set(roomID, active);
    store_1.rouletteGames.set(roomID, state);
    const allTagsGuessed = active.currentPost.tags.every(t => active.currentRoundGuesses.has(t.name));
    if (allTagsGuessed) {
        return { kind: 'all_tags_guessed', tag: actualTag };
    }
    // Advance to next player turn (non-blocking)
    advanceTurn(roomID);
    return { kind: 'correct', tag: actualTag };
};
exports.handleRouletteGuess = handleRouletteGuess;
const handleVoteSkip = (roomID, userID, vote) => {
    const state = store_1.rouletteGames.get(roomID);
    if (!state)
        return null;
    if (vote) {
        state.skipVotes.add(userID);
    }
    else {
        state.skipVotes.delete(userID);
    }
    store_1.rouletteGames.set(roomID, state);
    const aliveCount = getAlivePlayerCount(state);
    const skipVotes = state.skipVotes.size;
    const threshold = Math.ceil(aliveCount * 0.8);
    const shouldSkip = aliveCount > 0 && skipVotes >= threshold;
    return { skipVotes, totalPlayers: aliveCount, threshold, shouldSkip };
};
exports.handleVoteSkip = handleVoteSkip;
const handleNewPost = (roomID) => {
    const state = store_1.rouletteGames.get(roomID);
    if (!state)
        return;
    clearTurnTimer(state);
    state.skipVotes = new Set();
    store_1.rouletteGames.set(roomID, state);
};
exports.handleNewPost = handleNewPost;
const getRouletteState = (roomID) => {
    return store_1.rouletteGames.get(roomID);
};
exports.getRouletteState = getRouletteState;
const getTotalGuessCount = (roomID) => {
    var _a, _b;
    return (_b = (_a = store_1.rouletteGames.get(roomID)) === null || _a === void 0 ? void 0 : _a.totalGuessCount) !== null && _b !== void 0 ? _b : new Map();
};
exports.getTotalGuessCount = getTotalGuessCount;
//# sourceMappingURL=rouletteService.js.map