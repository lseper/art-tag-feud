import { beforeEach, describe, expect, it, vi } from 'vitest';
import { activeGames } from '../src/state/store';
import { ensureActiveGame, endGame, startNextRound } from '../src/services/gameService';
import { makeRoom } from './shared';
import { createGame, endGame as endGameRepo } from '../src/data/repos/gamesRepo';
import { createRound } from '../src/data/repos/roundsRepo';

vi.mock('../src/data/repos/gamesRepo', () => ({
    createGame: vi.fn(),
    endGame: vi.fn(),
}));

vi.mock('../src/data/repos/roundsRepo', () => ({
    createRound: vi.fn(),
}));


describe('gameService', () => {
    beforeEach(() => {
        activeGames.clear();
        vi.clearAllMocks();
    });

    it('ensureActiveGame returns existing active state without creating a new game', async () => {
        activeGames.set('room-1', {
            gameId: 'game-1',
            roundId: 'round-1',
            roundIndex: 0,
            nextPostOrder: 1,
        });

        const result = await ensureActiveGame(makeRoom());

        expect(result?.gameId).toBe('game-1');
        expect(createGame).not.toHaveBeenCalled();
        expect(createRound).not.toHaveBeenCalled();
    });

    it('ensureActiveGame creates a game and round when missing', async () => {
        vi.mocked(createGame).mockResolvedValue('game-2');
        vi.mocked(createRound).mockResolvedValue('round-2');

        const result = await ensureActiveGame(makeRoom({ roundsPerGame: 3 }), 'u1');

        expect(result).toEqual({
            gameId: 'game-2',
            roundId: 'round-2',
            roundIndex: 0,
            nextPostOrder: 0,
        });
        expect(activeGames.get('room-1')?.gameId).toBe('game-2');
        expect(createGame).toHaveBeenCalledWith('room-1', 'u1', 2, 3);
        expect(createRound).toHaveBeenCalledWith('game-2', 0);
    });

    it('startNextRound creates a new round and updates active state', async () => {
        vi.mocked(createRound).mockResolvedValue('round-3');

        const result = await startNextRound('room-1', 'game-3', 2);

        expect(result?.roundId).toBe('round-3');
        expect(activeGames.get('room-1')?.roundIndex).toBe(2);
        expect(createRound).toHaveBeenCalledWith('game-3', 2);
    });

    it('endGame ends active game and clears state', async () => {
        activeGames.set('room-1', {
            gameId: 'game-4',
            roundId: 'round-4',
            roundIndex: 1,
            nextPostOrder: 0,
        });

        await endGame('room-1');

        expect(endGameRepo).toHaveBeenCalledWith('game-4');
        expect(activeGames.has('room-1')).toBe(false);
    });
});
