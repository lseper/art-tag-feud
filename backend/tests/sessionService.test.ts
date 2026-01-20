import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WebSocket } from 'ws';
import { decrementUsers, getNumUsers, incrementUsers, rooms, userSockets, users } from '../src/state/store';
import { purgeUserOnDisconnect } from '../src/services/sessionService';
import type { UserType } from '../src/domain/contracts';
import { makeRoom, makeUser } from './shared';
import { removeRoomMember } from '../src/data/repos/roomMembersRepo';
import { deleteRoom, upsertRoom } from '../src/data/repos/roomsRepo';
import { upsertRoomReadyStates } from '../src/data/repos/roomReadyStateRepo';

vi.mock('../src/data/repos/roomMembersRepo', () => ({
    removeRoomMember: vi.fn(),
}));

vi.mock('../src/data/repos/roomsRepo', () => ({
    deleteRoom: vi.fn(),
    upsertRoom: vi.fn(),
}));

vi.mock('../src/data/repos/roomReadyStateRepo', () => ({
    upsertRoomReadyStates: vi.fn(),
}));


describe('sessionService.purgeUserOnDisconnect', () => {
    beforeEach(() => {
        rooms.clear();
        users.clear();
        userSockets.clear();
        while (getNumUsers() > 0) decrementUsers();
        vi.clearAllMocks();
    });

    it('exits early when socket is not associated with a user', async () => {
        const socket = {} as WebSocket;
        incrementUsers();

        await purgeUserOnDisconnect(socket);

        expect(getNumUsers()).toBe(0);
        expect(removeRoomMember).not.toHaveBeenCalled();
        expect(upsertRoom).not.toHaveBeenCalled();
        expect(deleteRoom).not.toHaveBeenCalled();
    });

    it('removes user from room and updates room state', async () => {
        const socket = {} as WebSocket;
        const user = makeUser('u2');
        const room = makeRoom({ owner: makeUser('u1') });
        room.members.push(user);
        rooms.set(room.id, room);
        users.set(user.id, user);
        userSockets.set(user.id, socket);
        incrementUsers();

        await purgeUserOnDisconnect(socket);

        expect(users.has(user.id)).toBe(false);
        expect(userSockets.has(user.id)).toBe(false);
        expect(rooms.get(room.id)?.members.some(member => member.id === user.id)).toBe(false);
        expect(removeRoomMember).toHaveBeenCalledWith(room.id, user.id);
        expect(upsertRoom).toHaveBeenCalledWith(room);
        expect(upsertRoomReadyStates).toHaveBeenCalledWith(room);
    });

    it('deletes room when owner disconnects and no members remain', async () => {
        const socket = {} as WebSocket;
        const user = makeUser('u1');
        const room = makeRoom({ owner: user, members: [user], allUsersReady: new Map([['u1', false]]) });
        rooms.set(room.id, room);
        users.set(user.id, user);
        userSockets.set(user.id, socket);
        incrementUsers();

        await purgeUserOnDisconnect(socket);

        expect(rooms.has(room.id)).toBe(false);
        expect(deleteRoom).toHaveBeenCalledWith(room.id);
        expect(upsertRoom).not.toHaveBeenCalled();
    });
});
