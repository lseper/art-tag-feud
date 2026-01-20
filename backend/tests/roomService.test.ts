import { describe, expect, it, beforeEach, vi } from 'vitest';
import { rooms, users } from '../src/state/store';
import {
    createOrUpdateRoom,
    getAllRooms,
    getSelectedIcons,
    joinRoom,
    leaveRoom,
    updateRoomBlacklist,
    updateRoomPreferlist,
    updateRoomReadyState,
} from '../src/services/roomService';
import { makeRoom, makeUser } from './shared';
import { updateBlacklist } from '../src/data/repos/blacklistRepo';
import { updatePreferlist } from '../src/data/repos/preferlistRepo';
import { upsertRoom, deleteRoom } from '../src/data/repos/roomsRepo';
import { upsertRoomMember, removeRoomMember } from '../src/data/repos/roomMembersRepo';
import { upsertRoomReadyStates } from '../src/data/repos/roomReadyStateRepo';
import { upsertPlayer } from '../src/data/repos/playersRepo';

vi.mock('../src/data/repos/blacklistRepo', () => ({
    updateBlacklist: vi.fn(),
}));

vi.mock('../src/data/repos/preferlistRepo', () => ({
    updatePreferlist: vi.fn(),
}));

vi.mock('../src/data/repos/roomsRepo', () => ({
    upsertRoom: vi.fn(),
    deleteRoom: vi.fn(),
}));

vi.mock('../src/data/repos/roomMembersRepo', () => ({
    upsertRoomMember: vi.fn(),
    removeRoomMember: vi.fn(),
}));

vi.mock('../src/data/repos/roomReadyStateRepo', () => ({
    upsertRoomReadyStates: vi.fn(),
}));

vi.mock('../src/data/repos/playersRepo', () => ({
    upsertPlayer: vi.fn(),
}));


describe('roomService.updateRoomPreferlist', () => {
    beforeEach(() => {
        rooms.clear();
        users.clear();
        vi.clearAllMocks();
    });

    it('adds preferlist entry and removes it from blacklist', async () => {
        const room = makeRoom({ blacklist: ['test_tag'] });
        rooms.set(room.id, room);

        const result = await updateRoomPreferlist(room.id, 'test tag', 'add', 'most');

        expect(result?.room.preferlist[0].tag).toBe('test_tag');
        expect(result?.room.blacklist).toEqual([]);
        expect(updatePreferlist).toHaveBeenCalled();
        expect(updateBlacklist).toHaveBeenCalledWith(room.id, 'test_tag', 'remove');
    });
});

describe('roomService core operations', () => {
    beforeEach(() => {
        rooms.clear();
        users.clear();
        vi.clearAllMocks();
    });

    it('getAllRooms returns client rooms', () => {
        const room = makeRoom();
        rooms.set(room.id, room);
        users.set('u1', room.owner);

        const result = getAllRooms();

        expect(result).toHaveLength(1);
        expect(result[0].roomID).toBe(room.id);
    });

    it('getSelectedIcons returns selected icons only', () => {
        const room = makeRoom({
            allUsersReady: new Map([['u1', false], ['u2', false]]),
            members: [makeUser('u1'), makeUser('u2')],
        });
        rooms.set(room.id, room);
        users.set('u1', makeUser('u1', { icon: 'icon-1' }));
        users.set('u2', makeUser('u2'));

        const result = getSelectedIcons(room.id);

        expect(result).toEqual(['icon-1']);
    });

    it('createOrUpdateRoom creates a new room and persists data', async () => {
        const user = makeUser('u1');
        users.set(user.id, user);

        const result = await createOrUpdateRoom(user.id, 'New Room', 3, 4);

        expect(result?.created).toBe(true);
        expect(result?.room.name).toBe('New Room');
        expect(result?.user.roomID).toBe(result?.room.id);
        expect(upsertPlayer).toHaveBeenCalledWith(user);
        expect(upsertRoom).toHaveBeenCalled();
        expect(upsertRoomMember).toHaveBeenCalled();
        expect(upsertRoomReadyStates).toHaveBeenCalled();
    });

    it('createOrUpdateRoom updates existing room and resets state', async () => {
        const user = makeUser('u1');
        const room = makeRoom({ curRound: 2, allUsersReady: new Map([['u1', true]]) });
        rooms.set(room.id, room);
        users.set(user.id, user);

        const result = await createOrUpdateRoom(user.id, 'Updated', 5, 6, room.id);

        expect(result?.created).toBe(false);
        expect(result?.room.name).toBe('Updated');
        expect(result?.room.curRound).toBe(0);
        expect(result?.room.allUsersReady.get('u1')).toBe(false);
        expect(upsertRoom).toHaveBeenCalledWith(room);
    });

    it('joinRoom adds member and updates ready state', async () => {
        const room = makeRoom();
        const user = makeUser('u2');
        rooms.set(room.id, room);
        users.set(user.id, user);

        const result = await joinRoom(room.id, user.id);

        expect(result?.room.members.some(member => member.id === user.id)).toBe(true);
        expect(result?.user.roomID).toBe(room.id);
        expect(upsertRoomMember).toHaveBeenCalledWith(room.id, user);
        expect(upsertRoomReadyStates).toHaveBeenCalledWith(room);
        expect(upsertPlayer).toHaveBeenCalledWith(user);
    });

    it('leaveRoom deletes room when owner leaves and no members remain', async () => {
        const owner = makeUser('u1', { icon: 'icon-1' });
        const room = makeRoom({ owner, members: [owner], allUsersReady: new Map([['u1', false]]) });
        rooms.set(room.id, room);
        users.set(owner.id, owner);

        const result = await leaveRoom(room.id, owner.id);

        expect(result?.shouldDeleteRoom).toBe(true);
        expect(result?.pastIcon).toBe('icon-1');
        expect(deleteRoom).toHaveBeenCalledWith(room.id);
        expect(rooms.has(room.id)).toBe(false);
    });

    it('leaveRoom reassigns owner and updates room', async () => {
        const owner = makeUser('u1');
        const member = makeUser('u2');
        const room = makeRoom({ owner, members: [owner, member], allUsersReady: new Map([['u1', false], ['u2', false]]) });
        rooms.set(room.id, room);
        users.set(owner.id, owner);
        users.set(member.id, member);

        const result = await leaveRoom(room.id, owner.id);

        expect(result?.shouldDeleteRoom).toBe(false);
        expect(room.owner.id).toBe(member.id);
        expect(removeRoomMember).toHaveBeenCalledWith(room.id, owner.id);
        expect(upsertRoom).toHaveBeenCalledWith(room);
        expect(upsertRoomReadyStates).toHaveBeenCalledWith(room);
    });

    it('updateRoomReadyState toggles ready and persists', async () => {
        const room = makeRoom();
        const user = makeUser('u1');
        rooms.set(room.id, room);
        users.set(user.id, user);

        const result = await updateRoomReadyState(room.id, user.id, true);

        expect(result?.room.allUsersReady.get(user.id)).toBe(true);
        expect(upsertRoomReadyStates).toHaveBeenCalledWith(room);
    });

    it('updateRoomBlacklist adds or removes normalized tags', async () => {
        const room = makeRoom({ blacklist: [] });
        rooms.set(room.id, room);

        const addResult = await updateRoomBlacklist(room.id, 'Test Tag', 'add');
        expect(addResult?.room.blacklist).toContain('test_tag');
        expect(updateBlacklist).toHaveBeenCalledWith(room.id, 'test_tag', 'add');

        const removeResult = await updateRoomBlacklist(room.id, 'Test Tag', 'remove');
        expect(removeResult?.room.blacklist).not.toContain('test_tag');
        expect(updateBlacklist).toHaveBeenCalledWith(room.id, 'test_tag', 'remove');
    });

    it('updateRoomPreferlist updates frequency and removes from blacklist', async () => {
        const room = makeRoom({ blacklist: ['test_tag'], preferlist: [] });
        rooms.set(room.id, room);

        const addResult = await updateRoomPreferlist(room.id, 'Test Tag', 'add', 'most');
        expect(addResult?.removedFromBlacklist).toBe(true);
        expect(updatePreferlist).toHaveBeenCalledWith(room.id, 'test_tag', 'add', 'most');
        expect(updateBlacklist).toHaveBeenCalledWith(room.id, 'test_tag', 'remove');
    });
});
