import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rooms, activeGames, rouletteGames } from '../src/state/store';
import {
    initRouletteGame,
    handleRouletteGuess,
    handleVoteSkip,
    handleNewPost,
    getRouletteState,
    getTotalGuessCount,
    startTurn,
} from '../src/services/rouletteService';
import type { PostTagType } from '../src/domain/contracts';
import { makeRoom, makePost, makeUser } from './shared';

vi.mock('../src/transport/ws/wsBroadcast', () => ({
    broadcastToRoom: vi.fn(),
}));

import { broadcastToRoom } from '../src/transport/ws/wsBroadcast';

const makeRoulettRoom = (memberIDs: string[] = ['u1', 'u2']) => {
    const members = memberIDs.map(id => makeUser(id));
    const room = makeRoom({
        id: 'room-1',
        members,
        gameMode: 'Roulette',
        startingLives: 3,
        turnTimeMs: 15000,
    });
    return room;
};

describe('rouletteService.initRouletteGame', () => {
    beforeEach(() => {
        rooms.clear();
        activeGames.clear();
        rouletteGames.clear();
        vi.clearAllMocks();
    });

    it('returns null when room does not exist', () => {
        const result = initRouletteGame('nonexistent');
        expect(result).toBeNull();
    });

    it('initializes state with shuffled turn order and default lives', () => {
        const room = makeRoulettRoom(['u1', 'u2', 'u3']);
        rooms.set(room.id, room);

        const state = initRouletteGame(room.id);

        expect(state).not.toBeNull();
        expect(state!.turnOrder).toHaveLength(3);
        expect(new Set(state!.turnOrder)).toEqual(new Set(['u1', 'u2', 'u3']));
        expect(state!.currentTurnIndex).toBe(0);
        expect(state!.playerLives.get('u1')).toBe(3);
        expect(state!.playerLives.get('u2')).toBe(3);
        expect(state!.playerLives.get('u3')).toBe(3);
        expect(state!.eliminationOrder).toEqual([]);
        expect(state!.turnTimeMs).toBe(15000);
    });

    it('uses DEFAULT_STARTING_LIVES=3 when room has no startingLives', () => {
        const room = makeRoulettRoom(['u1', 'u2']);
        room.startingLives = undefined;
        rooms.set(room.id, room);

        const state = initRouletteGame(room.id);
        expect(state!.playerLives.get('u1')).toBe(3);
    });

    it('stores state in rouletteGames', () => {
        const room = makeRoulettRoom(['u1']);
        rooms.set(room.id, room);

        initRouletteGame(room.id);

        expect(rouletteGames.has(room.id)).toBe(true);
    });
});

describe('rouletteService.handleRouletteGuess', () => {
    beforeEach(() => {
        rooms.clear();
        activeGames.clear();
        rouletteGames.clear();
        vi.clearAllMocks();
    });

    const setupGame = (activePlayerIndex = 0) => {
        const room = makeRoulettRoom(['u1', 'u2']);
        rooms.set(room.id, room);

        const post = makePost(1, {
            tags: [
                { name: 'cute', type: 'general', score: 5 },
                { name: 'fluffy', type: 'general', score: 3 },
            ],
        });

        activeGames.set(room.id, {
            gameId: 'g1',
            roundId: 'r1',
            roundIndex: 0,
            nextPostOrder: 0,
            currentPost: post,
            currentRoundGuesses: new Map(),
        });

        const state = initRouletteGame(room.id)!;
        // Force a known turn order: u1 first
        state.turnOrder = ['u1', 'u2'];
        state.currentTurnIndex = activePlayerIndex;
        rouletteGames.set(room.id, state);

        return { room, post };
    };

    it('returns not_your_turn when guesser is not the active player', () => {
        setupGame(0); // u1 is active
        const tag: PostTagType = { name: 'cute', type: 'general', score: 5 };
        const result = handleRouletteGuess('room-1', 'u2', tag);
        expect(result.kind).toBe('not_your_turn');
    });

    it('returns no_state when roulette game does not exist', () => {
        const tag: PostTagType = { name: 'cute', type: 'general', score: 5 };
        const result = handleRouletteGuess('room-1', 'u1', tag);
        expect(result.kind).toBe('no_state');
    });

    it('returns correct for a valid tag guess', () => {
        setupGame(0);
        const tag: PostTagType = { name: 'cute', type: 'general', score: 5 };
        const result = handleRouletteGuess('room-1', 'u1', tag);
        expect(result.kind).toBe('correct');
        if (result.kind === 'correct') {
            expect(result.tag.name).toBe('cute');
        }
    });

    it('advances to next player on correct guess', () => {
        setupGame(0);
        const tag: PostTagType = { name: 'cute', type: 'general', score: 5 };
        handleRouletteGuess('room-1', 'u1', tag);
        // broadcastToRoom should be called for ROULETTE_TURN_START
        expect(broadcastToRoom).toHaveBeenCalled();
    });

    it('records correct guess in currentRoundGuesses', () => {
        setupGame(0);
        const tag: PostTagType = { name: 'cute', type: 'general', score: 5 };
        handleRouletteGuess('room-1', 'u1', tag);
        const active = activeGames.get('room-1')!;
        expect(active.currentRoundGuesses!.has('cute')).toBe(true);
    });

    it('increments totalGuessCount on correct guess', () => {
        setupGame(0);
        const tag: PostTagType = { name: 'cute', type: 'general', score: 5 };
        handleRouletteGuess('room-1', 'u1', tag);
        const state = rouletteGames.get('room-1')!;
        expect(state.totalGuessCount.get('u1')).toBe(1);
    });

    it('returns wrong and deducts life on incorrect tag', () => {
        setupGame(0);
        const tag: PostTagType = { name: 'nonexistent_tag', type: 'general', score: 0 };
        const result = handleRouletteGuess('room-1', 'u1', tag);
        expect(result.kind).toBe('wrong');
        if (result.kind === 'wrong') {
            expect(result.livesRemaining).toBe(2);
            expect(result.eliminated).toBe(false);
        }
        const state = rouletteGames.get('room-1')!;
        expect(state.playerLives.get('u1')).toBe(2);
    });

    it('returns wrong on already-guessed tag', () => {
        const { room } = setupGame(0);
        const active = activeGames.get(room.id)!;
        active.currentRoundGuesses!.set('cute', 'u1');
        activeGames.set(room.id, active);

        const tag: PostTagType = { name: 'cute', type: 'general', score: 5 };
        const result = handleRouletteGuess('room-1', 'u1', tag);
        expect(result.kind).toBe('wrong');
    });

    it('broadcasts ROULETTE_LIFE_LOST on wrong guess', () => {
        setupGame(0);
        const tag: PostTagType = { name: 'nonexistent_tag', type: 'general', score: 0 };
        handleRouletteGuess('room-1', 'u1', tag);
        const calls = vi.mocked(broadcastToRoom).mock.calls;
        const lifeLostCall = calls.find(([, data]) => (data as { type: string }).type === 'ROULETTE_LIFE_LOST');
        expect(lifeLostCall).toBeDefined();
    });

    it('eliminates player at 0 lives on wrong guess', () => {
        setupGame(0);
        const state = rouletteGames.get('room-1')!;
        state.playerLives.set('u1', 1); // one life left
        rouletteGames.set('room-1', state);

        const tag: PostTagType = { name: 'nonexistent_tag', type: 'general', score: 0 };
        const result = handleRouletteGuess('room-1', 'u1', tag);
        expect(result.kind).toBe('wrong');
        if (result.kind === 'wrong') {
            expect(result.eliminated).toBe(true);
            expect(result.livesRemaining).toBe(0);
        }
        const updatedState = rouletteGames.get('room-1')!;
        expect(updatedState.eliminationOrder).toContain('u1');
    });

    it('returns game_over when last alive player is eliminated', () => {
        const room = makeRoulettRoom(['u1', 'u2']);
        rooms.set(room.id, room);
        const post = makePost(1, { tags: [{ name: 'cute', type: 'general', score: 5 }] });
        activeGames.set(room.id, {
            gameId: 'g1', roundId: 'r1', roundIndex: 0, nextPostOrder: 0,
            currentPost: post, currentRoundGuesses: new Map(),
        });
        const state = initRouletteGame(room.id)!;
        state.turnOrder = ['u1', 'u2'];
        state.currentTurnIndex = 0;
        state.playerLives.set('u1', 1);
        state.playerLives.set('u2', 0); // u2 already dead
        rouletteGames.set(room.id, state);

        const tag: PostTagType = { name: 'nonexistent_tag', type: 'general', score: 0 };
        const result = handleRouletteGuess(room.id, 'u1', tag);
        expect(result.kind).toBe('game_over');
        expect(rouletteGames.has(room.id)).toBe(false);
    });

    it('returns all_tags_guessed when last tag is guessed', () => {
        const room = makeRoulettRoom(['u1', 'u2']);
        rooms.set(room.id, room);
        const post = makePost(1, { tags: [{ name: 'cute', type: 'general', score: 5 }] });
        // Only one tag; pre-mark no guesses
        activeGames.set(room.id, {
            gameId: 'g1', roundId: 'r1', roundIndex: 0, nextPostOrder: 0,
            currentPost: post, currentRoundGuesses: new Map(),
        });
        const state = initRouletteGame(room.id)!;
        state.turnOrder = ['u1', 'u2'];
        state.currentTurnIndex = 0;
        rouletteGames.set(room.id, state);

        const tag: PostTagType = { name: 'cute', type: 'general', score: 5 };
        const result = handleRouletteGuess(room.id, 'u1', tag);
        expect(result.kind).toBe('all_tags_guessed');
    });
});

describe('rouletteService.handleVoteSkip', () => {
    beforeEach(() => {
        rooms.clear();
        rouletteGames.clear();
        vi.clearAllMocks();
    });

    const setupSkipGame = () => {
        const room = makeRoulettRoom(['u1', 'u2', 'u3']);
        rooms.set(room.id, room);
        const state = initRouletteGame(room.id)!;
        state.turnOrder = ['u1', 'u2', 'u3'];
        rouletteGames.set(room.id, state);
        return room;
    };

    it('returns null when no roulette state', () => {
        const result = handleVoteSkip('room-1', 'u1', true);
        expect(result).toBeNull();
    });

    it('adds and removes skip votes', () => {
        const room = setupSkipGame();
        const result1 = handleVoteSkip(room.id, 'u1', true);
        expect(result1!.skipVotes).toBe(1);

        const result2 = handleVoteSkip(room.id, 'u1', false);
        expect(result2!.skipVotes).toBe(0);
    });

    it('shouldSkip is true when threshold is met (80% of alive players)', () => {
        const room = setupSkipGame();
        // 3 alive players, threshold = ceil(3 * 0.8) = 3
        handleVoteSkip(room.id, 'u1', true);
        handleVoteSkip(room.id, 'u2', true);
        const result = handleVoteSkip(room.id, 'u3', true);
        expect(result!.shouldSkip).toBe(true);
        expect(result!.threshold).toBe(3);
    });

    it('shouldSkip is false when threshold is not met', () => {
        const room = setupSkipGame();
        const result = handleVoteSkip(room.id, 'u1', true);
        expect(result!.shouldSkip).toBe(false);
    });
});

describe('rouletteService.handleNewPost', () => {
    beforeEach(() => {
        rooms.clear();
        rouletteGames.clear();
        vi.clearAllMocks();
    });

    it('clears skip votes on new post', () => {
        const room = makeRoulettRoom(['u1', 'u2']);
        rooms.set(room.id, room);
        const state = initRouletteGame(room.id)!;
        state.skipVotes.add('u1');
        state.skipVotes.add('u2');
        rouletteGames.set(room.id, state);

        handleNewPost(room.id);

        const updated = rouletteGames.get(room.id)!;
        expect(updated.skipVotes.size).toBe(0);
    });

    it('is a no-op when state does not exist', () => {
        expect(() => handleNewPost('nonexistent')).not.toThrow();
    });
});

describe('rouletteService.getRouletteState / getTotalGuessCount', () => {
    beforeEach(() => {
        rooms.clear();
        rouletteGames.clear();
    });

    it('getRouletteState returns undefined for missing room', () => {
        expect(getRouletteState('nonexistent')).toBeUndefined();
    });

    it('getRouletteState returns existing state', () => {
        const room = makeRoulettRoom(['u1']);
        rooms.set(room.id, room);
        initRouletteGame(room.id);
        expect(getRouletteState(room.id)).toBeDefined();
    });

    it('getTotalGuessCount returns empty map for missing room', () => {
        const result = getTotalGuessCount('nonexistent');
        expect(result.size).toBe(0);
    });

    it('getTotalGuessCount returns the current guess count map', () => {
        const room = makeRoulettRoom(['u1']);
        rooms.set(room.id, room);
        const state = initRouletteGame(room.id)!;
        state.totalGuessCount.set('u1', 5);
        rouletteGames.set(room.id, state);
        const result = getTotalGuessCount(room.id);
        expect(result.get('u1')).toBe(5);
    });
});

describe('rouletteService.startTurn', () => {
    beforeEach(() => {
        rooms.clear();
        rouletteGames.clear();
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('broadcasts ROULETTE_TURN_START with active player and lives', () => {
        const room = makeRoulettRoom(['u1', 'u2']);
        rooms.set(room.id, room);
        const state = initRouletteGame(room.id)!;
        state.turnOrder = ['u1', 'u2'];
        state.currentTurnIndex = 0;
        rouletteGames.set(room.id, state);

        startTurn(room.id);

        expect(broadcastToRoom).toHaveBeenCalledWith(
            room,
            expect.objectContaining({
                type: 'ROULETTE_TURN_START',
                activePlayerID: 'u1',
            }),
        );
    });

    it('sets a turn timer that fires handleTurnTimeout', () => {
        const room = makeRoulettRoom(['u1', 'u2']);
        rooms.set(room.id, room);
        const state = initRouletteGame(room.id)!;
        state.turnOrder = ['u1', 'u2'];
        state.currentTurnIndex = 0;
        state.playerLives.set('u1', 2);
        rouletteGames.set(room.id, state);

        startTurn(room.id);
        vi.clearAllMocks();

        // Advance timers to trigger timeout
        vi.advanceTimersByTime(15001);

        // ROULETTE_LIFE_LOST should have been broadcast
        const calls = vi.mocked(broadcastToRoom).mock.calls;
        const lifeLostCall = calls.find(([, data]) => (data as { type: string }).type === 'ROULETTE_LIFE_LOST');
        expect(lifeLostCall).toBeDefined();
    });
});
