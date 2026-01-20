import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WebSocket } from 'ws';
import { users, userSockets } from '../src/state/store';
import { clearUserIcon, getOrCreateUser, setUserIcon, setUsername } from '../src/services/userService';
import { upsertPlayer } from '../src/data/repos/playersRepo';
import { upsertRoomMember } from '../src/data/repos/roomMembersRepo';
import { v4 } from 'uuid';

vi.mock('uuid', () => ({
    v4: vi.fn(),
}));

vi.mock('../src/data/repos/playersRepo', () => ({
    upsertPlayer: vi.fn(),
}));

vi.mock('../src/data/repos/roomMembersRepo', () => ({
    upsertRoomMember: vi.fn(),
}));

describe('userService', () => {
    beforeEach(() => {
        users.clear();
        userSockets.clear();
        vi.clearAllMocks();
    });

    it('getOrCreateUser returns existing userID when provided', () => {
        const socket = {} as WebSocket;
        const result = getOrCreateUser(socket, 'u1');

        expect(result).toBe('u1');
        expect(users.size).toBe(0);
    });

    it('getOrCreateUser creates a user with a unique id', () => {
        const socket = {} as WebSocket;
        vi.mocked(v4)
            .mockReturnValueOnce('dup-id')
            .mockReturnValueOnce('new-id');
        userSockets.set('dup-id', socket);

        const result = getOrCreateUser(socket);

        expect(result).toBe('new-id');
        expect(users.get('new-id')?.username).toBe('User_undefined');
        expect(users.get('new-id')?.score).toBe(0);
        expect(userSockets.get('new-id')).toBe(socket);
    });

    it('setUsername updates username and persists player', async () => {
        users.set('u1', { id: 'u1', username: 'Old', score: 0 });

        const result = await setUsername('u1', 'NewName');

        expect(result?.username).toBe('NewName');
        expect(upsertPlayer).toHaveBeenCalledWith({ id: 'u1', username: 'NewName', score: 0 });
    });

    it('setUserIcon and clearUserIcon update icons and return past icon', async () => {
        users.set('u1', { id: 'u1', username: 'User', score: 0, icon: 'old' });

        const setResult = await setUserIcon('u1', 'room-1', 'new');
        expect(setResult?.pastIcon).toBe('old');
        expect(setResult?.user.icon).toBe('new');

        const clearResult = await clearUserIcon('u1', 'room-1');
        expect(clearResult?.pastIcon).toBe('new');
        expect(clearResult?.user.icon).toBeUndefined();

        expect(upsertRoomMember).toHaveBeenCalledTimes(2);
    });
});
