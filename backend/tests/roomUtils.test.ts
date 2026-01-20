import { describe, expect, it } from 'vitest';
import { roomIsReadyForNewPost, getReadyStates } from '../src/domain/roomUtils';
import type { ServerRoomType, UserType } from '../src/domain/contracts';

const makeRoom = (readyStates: [string, boolean][]): ServerRoomType => {
    return {
        id: 'room-1',
        name: 'Room',
        postsPerRound: 2,
        roundsPerGame: 2,
        owner: { id: 'u1', username: 'Owner', score: 0 },
        members: [
            { id: 'u1', username: 'Owner', score: 0 },
            { id: 'u2', username: 'User', score: 0 },
        ],
        blacklist: [],
        preferlist: [],
        postQueue: [],
        curRound: 0,
        postsViewedThisRound: 0,
        allUsersReady: new Map(readyStates),
        gameStarted: false,
    };
};

describe('roomUtils', () => {
    it('roomIsReadyForNewPost returns true when all users are ready', () => {
        const room = makeRoom([['u1', true], ['u2', true]]);
        expect(roomIsReadyForNewPost(room)).toBe(true);
    });

    it('getReadyStates includes icons from users map', () => {
        const room = makeRoom([['u1', true], ['u2', false]]);
        const users = new Map<string, UserType>([
            ['u1', { id: 'u1', username: 'Owner', score: 0, icon: 'icon1' }],
            ['u2', { id: 'u2', username: 'User', score: 0 }],
        ]);
        const readyStates = getReadyStates(room, users);
        expect(readyStates).toHaveLength(2);
        expect(readyStates[0].icon).toBe('icon1');
    });
});
