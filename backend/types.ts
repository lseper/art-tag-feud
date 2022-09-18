import { string, z } from 'zod';

// shared
export const EventType = z.enum(['DEFAULT',
'CREATE_ROOM',
'ALL_ROOMS',
'GUESS_TAG',
'READY_UP',
'START_GAME',
'SET_USERNAME',
'SET_ICON',
'GET_SELECTED_ICONS',
'JOIN_ROOM',
'LEAVE_ROOM',
'REQUEST_POST',
'SHOW_LEADERBOARD']);

/**
 * Server-Only Types
 */
export const TagType = z.enum(["general", "species", "character", "artist"]);

export const Tag = z.object({
    name: z.string(),
    type: TagType,
    score: z.number(),
})

export const Post = z.object({
    id: z.number(),
    url: z.string(),
    tags: z.array(Tag)
})

export const User = z.object({
    username: z.string(),
    id: z.string(),
    score: z.number(),
    icon: z.optional(z.string()),
    roomID: z.optional(z.string())
})

export const ServerRoom = z.object({
    id: z.string(),
    owner: User,
    members: z.array(User),
    postQueue: z.array(Post),
    postsViewedThisRound: z.number(),
    allUsersReady: z.map(z.string(), z.boolean()),
    gameStarted: z.boolean(),
})

export const CreateRoomEventData = z.object({
    userID: z.string(),
    type: z.literal(EventType.enum.CREATE_ROOM)
});
export const JoinRoomEventData = z.object({
    userID: z.optional(z.string()),
    roomID: z.string(),
    type: z.literal(EventType.enum.JOIN_ROOM)
});
export const LeaveRoomEventData = z.object({
    userID: z.string(),
    roomID: z.string(),
    type: z.literal(EventType.enum.LEAVE_ROOM)
});
export const GuessTagEventData = z.object({
    user: User,
    tag: Tag,
    roomID: z.string(),
    type: z.literal(EventType.enum.GUESS_TAG)
});
export const SetUsernameEventData = z.object({
    username: z.string(),
    userID: z.optional(z.string()),
    type: z.literal(EventType.enum.SET_USERNAME)
});
export const SetUserIconEventData = z.object({
    icon: z.string(),
    userID: z.string(),
    roomID: z.string(),
    type: z.literal(EventType.enum.SET_ICON)
});
export const GetSelectedIconsEventData = z.object({
    roomID: z.string(),
    type: z.literal(EventType.enum.GET_SELECTED_ICONS)
});
export const RequestPostEventData = z.object({
    roomID: z.string(),
    userID:z.string(),
    type: z.literal(EventType.enum.REQUEST_POST)
});
export const ReadyUpEventData = z.object({
    userID: z.string(),
    roomID: z.string(),
    ready: z.boolean(),
    type: z.literal(EventType.enum.READY_UP)
});
export const StartGameEventData = z.object({
    roomID: z.string(),
    type: z.literal(EventType.enum.START_GAME)
})
export const AllRoomsEventData = z.object({
    type: z.literal(EventType.enum.ALL_ROOMS)
})

/**
 * Client Types
 */
 export const UserReadyState = z.object({
    user: User,
    ready: z.boolean(),
    icon: z.optional(z.string()),
})

export const ClientRoom = z.object({
    roomID: z.string(),
    owner: User,
    readyStates: z.array(UserReadyState)
})

export const CreateRoomEventDataToClient = z.object({
    roomID: z.string(),
    readyStates: z.array(z.boolean()),
    userID: z.optional(z.string()),
    type: z.literal(EventType.enum.CREATE_ROOM)
});

export const JoinRoomEventDataToClient = z.object({
    user: User,
    room: ClientRoom,
    type: z.literal(EventType.enum.JOIN_ROOM)
});

export const LeaveRoomEventDataToClient = z.object({
    room: ClientRoom,
    type: z.literal(EventType.enum.LEAVE_ROOM)
});

export const AllRoomsEventDataToClient = z.object({
    rooms: z.array(ClientRoom),
    type: z.literal(EventType.enum.ALL_ROOMS)
});

export const GuessTagEventDataToClient = z.object({
    tag: Tag,
    user: User,
    type: z.literal(EventType.enum.GUESS_TAG)
});

export const SetUsernameEventDataToClient = z.object({
    user: User,
    type: z.literal(EventType.enum.SET_USERNAME)
})

export const SetUserIconEventDataToClient = z.object({
    userID: z.string(),
    icon: z.optional(z.string()),
    pastIcon: z.optional(z.string()),
    type: z.literal(EventType.enum.SET_ICON)
})

export const GetSelectedIconsEventDataToClient = z.object({
    selectedIcons: z.array(z.string()),
    type: z.literal(EventType.enum.GET_SELECTED_ICONS)
})

export const RequestPostEventDataToClient = z.object({
    post: z.optional(Post),
    type: z.literal(EventType.enum.REQUEST_POST)
})

export const ReadyUpEventDataToClient = z.object({
    roomID: z.string(),
    room: ClientRoom,
    type: z.literal(EventType.enum.READY_UP)
});

export const StartGameEventDataToClient = z.object({
    type: z.literal(EventType.enum.START_GAME)
})

export const ShowLeaderboardEventDataToClient = z.object({
    type: z.literal(EventType.enum.SHOW_LEADERBOARD)
})

/**
 * Server-Only Object Types
 */
export type ServerRoom = z.infer<typeof ServerRoom>;

/**
 * Server-Only Types
 */
export type CreateRoomEventData = z.infer<typeof CreateRoomEventData>
export type JoinRoomEventData = z.infer<typeof JoinRoomEventData>
export type LeaveRoomEventData = z.infer<typeof LeaveRoomEventData>
export type RequestPostEventData = z.infer<typeof RequestPostEventData>
export type GuessTagEventData = z.infer<typeof GuessTagEventData>
export type SetUsernameEventData = z.infer<typeof SetUsernameEventData>
export type SetUserIconEventData = z.infer<typeof SetUserIconEventData>
export type GetSelectedIconsEventData = z.infer<typeof GetSelectedIconsEventData>
export type StartGameEventData = z.infer<typeof StartGameEventData>
export type ReadyUpEventData = z.infer<typeof ReadyUpEventData>
export type AllRoomsEventData = z.infer<typeof AllRoomsEventData>

/**
 * Client-Only Types
 */
export type CreateRoomEventDataToClient = z.infer<typeof CreateRoomEventDataToClient>
export type JoinRoomEventDataToClient = z.infer<typeof JoinRoomEventDataToClient>
export type LeaveRoomEventDataToClient = z.infer<typeof LeaveRoomEventDataToClient>
export type AllRoomsEventDataToClient = z.infer<typeof AllRoomsEventDataToClient>
export type GuessTagEventDataToClient = z.infer<typeof GuessTagEventDataToClient>
export type RequestPostEventDataToClient = z.infer<typeof RequestPostEventDataToClient>
export type SetUsernameEventDataToClient = z.infer<typeof SetUsernameEventDataToClient>
export type SetUserIconEventDataToClient = z.infer<typeof SetUserIconEventDataToClient>
export type GetSelectedIconsEventDataToClient = z.infer<typeof GetSelectedIconsEventDataToClient>
export type ReadyUpEventDataToClient = z.infer<typeof ReadyUpEventDataToClient>
export type StartGameEventDataToClient = z.infer<typeof StartGameEventDataToClient>
export type ShowLeaderboardEventDataToClient = z.infer<typeof ShowLeaderboardEventDataToClient>

export type ClientRoom = z.infer<typeof ClientRoom>;

/**
 * Shared Types
 */
export type TagType = z.infer<typeof TagType>
export type Tag = z.infer<typeof Tag>;
export type Post = z.infer<typeof Post>;
export type User = z.infer<typeof User>;
export type EventType = z.infer<typeof EventType>;
export type UserReadyState = z.infer<typeof UserReadyState>;