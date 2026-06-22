import { beforeEach, describe, expect, it, vi } from 'vitest';
import { rooms, users } from '../src/state/store';
import { handleGuessTag } from '../src/services/guessService';
import type { PostTagType } from '../src/domain/contracts';
import { makeRoom, makeUser } from './shared';
import { upsertRoomMember } from '../src/data/repos/roomMembersRepo';
import { recordGuess } from '../src/services/postService';

vi.mock('../src/data/repos/roomMembersRepo', () => ({
    upsertRoomMember: vi.fn(),
}));

vi.mock('../src/services/postService', () => ({
    recordGuess: vi.fn(),
}));


describe('guessService.handleGuessTag', () => {
    beforeEach(() => {
        rooms.clear();
        users.clear();
        vi.clearAllMocks();
    });

    it('returns null when room or user is missing', async () => {
        const tag: PostTagType = { name: 'cute', type: 'general', score: 5 };
        expect(await handleGuessTag('room-1', 'u1', tag)).toBeNull();

        rooms.set('room-1', makeRoom());
        expect(await handleGuessTag('room-1', 'u1', tag)).toBeNull();
    });

    it('returns null when user already ready', async () => {
        const room = makeRoom({ allUsersReady: new Map([['u1', true]]) });
        const user = makeUser('u1');
        rooms.set(room.id, room);
        users.set(user.id, user);

        const tag: PostTagType = { name: 'cute', type: 'general', score: 5 };
        const result = await handleGuessTag(room.id, user.id, tag);

        expect(result).toBeNull();
        expect(upsertRoomMember).not.toHaveBeenCalled();
        expect(recordGuess).not.toHaveBeenCalled();
    });

    it('updates score, respects preferlist all-time tags, and records guess', async () => {
        const room = makeRoom({
            preferlist: [{ tag: 'cute', frequency: 'all' }],
            allUsersReady: new Map([['u1', false]]),
        });
        const user = makeUser('u1', { score: 1 });
        rooms.set(room.id, room);
        users.set(user.id, user);

        const tag: PostTagType = { name: 'cute', type: 'general', score: 5 };
        const result = await handleGuessTag(room.id, user.id, tag);

        expect(result?.user.score).toBe(1);
        expect(result?.tag.score).toBe(0);
        expect(upsertRoomMember).toHaveBeenCalledWith(room.id, user);
        expect(recordGuess).toHaveBeenCalledWith(room.id, user.id, tag);
    });
});
