import type { PostTagType } from '../domain/contracts';
import { EventType } from '../domain/contracts';
import { rooms, users, activeGames, rouletteGames } from '../state/store';
import type { RouletteGameState } from '../state/store';
import { broadcastToRoom } from '../transport/ws/wsBroadcast';

const DEFAULT_STARTING_LIVES = 3;
const DEFAULT_TURN_TIME_MS = 15000;

const shuffle = <T>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

const getPlayerLivesRecord = (state: RouletteGameState): Record<string, number> => {
    const record: Record<string, number> = {};
    state.playerLives.forEach((lives, playerID) => {
        record[playerID] = lives;
    });
    return record;
};

const getAlivePlayerCount = (state: RouletteGameState): number => {
    let count = 0;
    state.playerLives.forEach(lives => {
        if (lives > 0) count++;
    });
    return count;
};

const getNextAlivePlayerIndex = (state: RouletteGameState): number => {
    const { turnOrder, playerLives, currentTurnIndex } = state;
    const len = turnOrder.length;
    for (let i = 1; i <= len; i++) {
        const nextIndex = (currentTurnIndex + i) % len;
        const playerID = turnOrder[nextIndex];
        const lives = playerLives.get(playerID) ?? 0;
        if (lives > 0) {
            return nextIndex;
        }
    }
    return -1;
};

const clearTurnTimer = (state: RouletteGameState) => {
    if (state.turnTimerHandle !== undefined) {
        clearTimeout(state.turnTimerHandle);
        state.turnTimerHandle = undefined;
    }
};

const initRouletteGame = (roomID: string): RouletteGameState | null => {
    const room = rooms.get(roomID);
    if (!room) return null;

    const turnOrder = shuffle(room.members.map(m => m.id));
    const startingLives = room.startingLives ?? DEFAULT_STARTING_LIVES;

    const playerLives = new Map<string, number>();
    turnOrder.forEach(id => playerLives.set(id, startingLives));

    const state: RouletteGameState = {
        turnOrder,
        currentTurnIndex: 0,
        playerLives,
        skipVotes: new Set(),
        turnTimerHandle: undefined,
        totalGuessCount: new Map(),
        eliminationOrder: [],
        turnTimeMs: room.turnTimeMs ?? DEFAULT_TURN_TIME_MS,
    };
    rouletteGames.set(roomID, state);
    return state;
};

const startTurn = (roomID: string): void => {
    const room = rooms.get(roomID);
    const state = rouletteGames.get(roomID);
    if (!room || !state) return;

    clearTurnTimer(state);

    const activePlayerID = state.turnOrder[state.currentTurnIndex];
    const playerLivesRecord = getPlayerLivesRecord(state);

    broadcastToRoom(room, {
        type: EventType.enum.ROULETTE_TURN_START,
        activePlayerID,
        turnTimeMs: state.turnTimeMs,
        turnOrder: state.turnOrder,
        playerLives: playerLivesRecord,
    });

    state.turnTimerHandle = setTimeout(() => {
        handleTurnTimeout(roomID);
    }, state.turnTimeMs);

    rouletteGames.set(roomID, state);
};

const handlePlayerElimination = (roomID: string, playerID: string): void => {
    const room = rooms.get(roomID);
    const state = rouletteGames.get(roomID);
    if (!room || !state) return;

    state.eliminationOrder.push(playerID);
    const placement = state.eliminationOrder.length;

    broadcastToRoom(room, {
        type: EventType.enum.ROULETTE_PLAYER_ELIMINATED,
        playerID,
        placement,
    });
    rouletteGames.set(roomID, state);
};

const advanceTurn = (roomID: string): void => {
    const room = rooms.get(roomID);
    const state = rouletteGames.get(roomID);
    if (!room || !state) return;

    const aliveCount = getAlivePlayerCount(state);
    if (aliveCount <= 0) {
        broadcastToRoom(room, { type: EventType.enum.END_GAME });
        rouletteGames.delete(roomID);
        return;
    }

    const nextIndex = getNextAlivePlayerIndex(state);
    if (nextIndex === -1) return;

    state.currentTurnIndex = nextIndex;
    rouletteGames.set(roomID, state);
    startTurn(roomID);
};

const handleTurnTimeout = (roomID: string): void => {
    const room = rooms.get(roomID);
    const state = rouletteGames.get(roomID);
    if (!room || !state) return;

    state.turnTimerHandle = undefined;
    const activePlayerID = state.turnOrder[state.currentTurnIndex];
    const currentLives = state.playerLives.get(activePlayerID) ?? 0;
    const newLives = Math.max(0, currentLives - 1);
    state.playerLives.set(activePlayerID, newLives);
    rouletteGames.set(roomID, state);

    broadcastToRoom(room, {
        type: EventType.enum.ROULETTE_LIFE_LOST,
        playerID: activePlayerID,
        livesRemaining: newLives,
        reason: 'timeout' as const,
    });

    if (newLives <= 0) {
        handlePlayerElimination(roomID, activePlayerID);
    }

    advanceTurn(roomID);
};

type RouletteGuessResult =
    | { kind: 'not_your_turn' }
    | { kind: 'no_state' }
    | { kind: 'wrong'; livesRemaining: number; eliminated: boolean }
    | { kind: 'correct'; tag: PostTagType }
    | { kind: 'all_tags_guessed'; tag: PostTagType }
    | { kind: 'game_over' };

const handleRouletteGuess = (roomID: string, userID: string, tag: PostTagType): RouletteGuessResult => {
    const state = rouletteGames.get(roomID);
    if (!state) return { kind: 'no_state' };

    const activePlayerID = state.turnOrder[state.currentTurnIndex];
    if (activePlayerID !== userID) {
        return { kind: 'not_your_turn' };
    }

    const active = activeGames.get(roomID);
    if (!active?.currentPost) return { kind: 'no_state' };

    const actualTag = active.currentPost.tags.find(t => t.name === tag.name);
    const alreadyGuessed = active.currentRoundGuesses?.has(tag.name) ?? false;

    if (!actualTag || alreadyGuessed) {
        // Wrong guess
        clearTurnTimer(state);

        const currentLives = state.playerLives.get(userID) ?? 0;
        const newLives = Math.max(0, currentLives - 1);
        state.playerLives.set(userID, newLives);
        rouletteGames.set(roomID, state);

        const room = rooms.get(roomID);
        if (!room) return { kind: 'no_state' };

        broadcastToRoom(room, {
            type: EventType.enum.ROULETTE_LIFE_LOST,
            playerID: userID,
            livesRemaining: newLives,
            reason: 'wrong_guess' as const,
        });

        const eliminated = newLives <= 0;
        if (eliminated) {
            handlePlayerElimination(roomID, userID);
        }

        const aliveCount = getAlivePlayerCount(state);
        if (aliveCount <= 0) {
            broadcastToRoom(room, { type: EventType.enum.END_GAME });
            rouletteGames.delete(roomID);
            return { kind: 'game_over' };
        }

        advanceTurn(roomID);
        return { kind: 'wrong', livesRemaining: newLives, eliminated };
    }

    // Correct guess
    clearTurnTimer(state);

    const currentCount = state.totalGuessCount.get(userID) ?? 0;
    state.totalGuessCount.set(userID, currentCount + 1);

    if (!active.currentRoundGuesses) {
        active.currentRoundGuesses = new Map();
    }
    active.currentRoundGuesses.set(actualTag.name, userID);
    activeGames.set(roomID, active);
    rouletteGames.set(roomID, state);

    const allTagsGuessed = active.currentPost.tags.every(t => active.currentRoundGuesses!.has(t.name));

    if (allTagsGuessed) {
        return { kind: 'all_tags_guessed', tag: actualTag };
    }

    // Advance to next player turn (non-blocking)
    advanceTurn(roomID);
    return { kind: 'correct', tag: actualTag };
};

type SkipResult = {
    skipVotes: number;
    totalPlayers: number;
    threshold: number;
    shouldSkip: boolean;
};

const handleVoteSkip = (roomID: string, userID: string, vote: boolean): SkipResult | null => {
    const state = rouletteGames.get(roomID);
    if (!state) return null;

    if (vote) {
        state.skipVotes.add(userID);
    } else {
        state.skipVotes.delete(userID);
    }
    rouletteGames.set(roomID, state);

    const aliveCount = getAlivePlayerCount(state);
    const skipVotes = state.skipVotes.size;
    const threshold = Math.ceil(aliveCount * 0.8);
    const shouldSkip = aliveCount > 0 && skipVotes >= threshold;

    return { skipVotes, totalPlayers: aliveCount, threshold, shouldSkip };
};

const handleNewPost = (roomID: string): void => {
    const state = rouletteGames.get(roomID);
    if (!state) return;
    clearTurnTimer(state);
    state.skipVotes = new Set();
    rouletteGames.set(roomID, state);
};

const getRouletteState = (roomID: string): RouletteGameState | undefined => {
    return rouletteGames.get(roomID);
};

const getTotalGuessCount = (roomID: string): Map<string, number> => {
    return rouletteGames.get(roomID)?.totalGuessCount ?? new Map();
};

export {
    initRouletteGame,
    startTurn,
    handleRouletteGuess,
    handleVoteSkip,
    handleNewPost,
    getRouletteState,
    getTotalGuessCount,
};
