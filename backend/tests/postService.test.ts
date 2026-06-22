import { beforeEach, describe, expect, it, vi } from 'vitest';
import { activeGames, rooms } from '../src/state/store';
import { makePost, makeRoom } from './shared';
import { handleRequestPost, recordGuess } from '../src/services/postService';
import { roomIsReadyForNewPost } from '../src/domain/roomUtils';
import { getPosts } from '../src/data/e621Client';
import { upsertRoom } from '../src/data/repos/roomsRepo';
import { upsertRoomReadyStates } from '../src/data/repos/roomReadyStateRepo';
import { upsertPost, upsertPostTags } from '../src/data/repos/postsRepo';
import { insertRoundPost } from '../src/data/repos/roundPostsRepo';
import { insertGuess } from '../src/data/repos/guessesRepo';
import { insertLeaderboardSnapshot } from '../src/data/repos/leaderboardRepo';
import { ensureActiveGame, startNextRound, endGame } from '../src/services/gameService';

vi.mock('../src/domain/roomUtils', () => ({
    roomIsReadyForNewPost: vi.fn(),
}));

vi.mock('../src/data/e621Client', () => ({
    getPosts: vi.fn(),
}));

vi.mock('../src/data/repos/roomsRepo', () => ({
    upsertRoom: vi.fn(),
}));

vi.mock('../src/data/repos/roomReadyStateRepo', () => ({
    upsertRoomReadyStates: vi.fn(),
}));

vi.mock('../src/data/repos/postsRepo', () => ({
    upsertPost: vi.fn(),
    upsertPostTags: vi.fn(),
}));

vi.mock('../src/data/repos/roundPostsRepo', () => ({
    insertRoundPost: vi.fn(),
}));

vi.mock('../src/data/repos/guessesRepo', () => ({
    insertGuess: vi.fn(),
}));

vi.mock('../src/data/repos/leaderboardRepo', () => ({
    insertLeaderboardSnapshot: vi.fn(),
}));

vi.mock('../src/services/gameService', () => ({
    ensureActiveGame: vi.fn(),
    startNextRound: vi.fn(),
    endGame: vi.fn(),
}));


describe('postService.recordGuess', () => {
    beforeEach(() => {
        activeGames.clear();
        vi.clearAllMocks();
    });

    it('does nothing when there is no active round post', async () => {
        await recordGuess('room-1', 'u1', { name: 'cute', type: 'general', score: 1 });
        expect(insertGuess).not.toHaveBeenCalled();
    });

    it('records guess when active round post exists', async () => {
        activeGames.set('room-1', {
            gameId: 'game-1',
            roundId: 'round-1',
            roundIndex: 0,
            nextPostOrder: 0,
            currentRoundPostId: 'round-post-1',
        });

        await recordGuess('room-1', 'u1', { name: 'cute', type: 'general', score: 1 });

        expect(insertGuess).toHaveBeenCalledWith('round-post-1', 'u1', { name: 'cute', type: 'general', score: 1 });
    });
});

describe('postService.handleRequestPost', () => {
    beforeEach(() => {
        rooms.clear();
        activeGames.clear();
        vi.clearAllMocks();
    });

    it('returns no_room when room does not exist', async () => {
        const result = await handleRequestPost('room-1', 'u1');
        expect(result).toEqual({ kind: 'no_room' });
    });

    it('returns wait when not all users are ready', async () => {
        const room = makeRoom();
        rooms.set(room.id, room);
        vi.mocked(roomIsReadyForNewPost).mockReturnValue(false);
        vi.mocked(getPosts).mockResolvedValue([makePost(1)]);

        const result = await handleRequestPost(room.id, 'u1');

        expect(result).toEqual({ kind: 'wait' });
        expect(room.allUsersReady.get('u1')).toBe(true);
        expect(getPosts).toHaveBeenCalled();
        expect(upsertRoomReadyStates).toHaveBeenCalledWith(room);
    });

    it('ends game when rounds are complete', async () => {
        const room = makeRoom({ postsViewedThisRound: 2, postsPerRound: 2, curRound: 1, roundsPerGame: 2 });
        rooms.set(room.id, room);
        vi.mocked(roomIsReadyForNewPost).mockReturnValue(true);

        const result = await handleRequestPost(room.id, 'u1');

        expect(result).toEqual({ kind: 'end_game' });
        expect(endGame).toHaveBeenCalledWith(room.id);
        expect(insertLeaderboardSnapshot).not.toHaveBeenCalled();
        
    });

    it('shows leaderboard and starts next round when round completes', async () => {
        const room = makeRoom({ postsViewedThisRound: 2, postsPerRound: 2, curRound: 0, roundsPerGame: 2 });
        rooms.set(room.id, room);
        vi.mocked(roomIsReadyForNewPost).mockReturnValue(true);
        vi.mocked(ensureActiveGame).mockResolvedValue({
            gameId: 'game-1',
            roundId: 'round-1',
            roundIndex: 0,
            nextPostOrder: 0,
        });

        const result = await handleRequestPost(room.id, 'u1');

        expect(result).toEqual({ kind: 'show_leaderboard' });
        expect(startNextRound).toHaveBeenCalledWith(room.id, 'game-1', 1);
        expect(upsertRoom).toHaveBeenCalledWith(room);
    });

    it('sends a post and resets ready state', async () => {
        const room = makeRoom({
            postQueue: [makePost(2)],
            preferlist: [{ tag: 'cute', frequency: 'all' }],
        });
        rooms.set(room.id, room);
        vi.mocked(roomIsReadyForNewPost).mockReturnValue(true);
        vi.mocked(ensureActiveGame).mockResolvedValue({
            gameId: 'game-1',
            roundId: 'round-1',
            roundIndex: 0,
            nextPostOrder: 0,
        });
        vi.mocked(insertRoundPost).mockResolvedValue('round-post-1');
        activeGames.set(room.id, {
            gameId: 'game-1',
            roundId: 'round-1',
            roundIndex: 0,
            nextPostOrder: 0,
        });

        const result = await handleRequestPost(room.id, 'u1');

        expect(result.kind).toBe('send_post');
        if (result.kind === 'send_post') {
            const tag = result.post.tags.find(entry => entry.name === 'cute');
            expect(tag?.score).toBe(0);
        }
        expect(upsertPost).toHaveBeenCalled();
        expect(upsertPostTags).toHaveBeenCalled();
        expect(activeGames.get(room.id)?.currentRoundPostId).toBe('round-post-1');
        expect(activeGames.get(room.id)?.nextPostOrder).toBe(1);
        expect(room.allUsersReady.get('u1')).toBe(false);
        expect(upsertRoomReadyStates).toHaveBeenCalledWith(room);
    });

    it('returns no_post when queue is empty and fetch returns none', async () => {
        const room = makeRoom({ postQueue: [] });
        rooms.set(room.id, room);
        vi.mocked(roomIsReadyForNewPost).mockReturnValue(true);
        vi.mocked(getPosts).mockResolvedValue([]);

        const result = await handleRequestPost(room.id, 'u1');

        expect(result).toEqual({ kind: 'no_post' });
    });
});
