import type { PostType, ServerRoomType, UserType } from '../src/domain/contracts';

const makeUser = (id: string, overrides?: Partial<UserType>): UserType => ({
    id,
    username: `User_${id}`,
    score: 0,
    ...overrides,
});

const makeRoom = (overrides?: Partial<ServerRoomType>): ServerRoomType => ({
    id: 'room-1',
    name: 'Room',
    postsPerRound: 2,
    roundsPerGame: 2,
    owner: makeUser('u1', { username: 'Owner' }),
    members: [makeUser('u1', { username: 'Owner' })],
    blacklist: [],
    preferlist: [],
    postQueue: [],
    curRound: 0,
    postsViewedThisRound: 0,
    allUsersReady: new Map([['u1', false]]),
    gameStarted: false,
    ...overrides,
});

const makePost = (id: number, overrides?: Partial<PostType>): PostType => ({
    id,
    url: `https://example.com/${id}.png`,
    tags: [
        { name: 'cute', type: 'general', score: 5 },
        { name: 'artist_name', type: 'artist', score: 3 },
    ],
    ...overrides,
});

export { makePost, makeRoom, makeUser };
