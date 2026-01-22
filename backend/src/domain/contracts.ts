// @ts-nocheck
import { z } from 'zod';

// shared
export const EventType = z.enum(['DEFAULT',
    'CREATE_ROOM',
    'ALL_ROOMS',
    'GUESS_TAG',
    'READY_UP',
    'START_GAME',
    'END_GAME',
    'SET_USERNAME',
    'SET_ICON',
    'GET_SELECTED_ICONS',
    'JOIN_ROOM',
    'LEAVE_ROOM',
    'REQUEST_POST',
    'SHOW_LEADERBOARD',
    'UPDATE_BLACKLIST',
    'UPDATE_PREFERLIST',
    'UPDATE_ROOM_SETTINGS']);

/**
 * Server-Only Types
 */
export const TagType = z.enum(["general", "species", "character", "artist"]);

export const PostTag = z.object({
    name: z.string(),
    type: TagType,
    score: z.number(),
})

export const Post = z.object({
    id: z.number(),
    url: z.string(),
    tags: z.array(PostTag)
})

export const PreferlistFrequency = z.enum(['most', 'all']);

export const GameMode = z.enum(['Blitz', 'Roulette', 'Imposter']);
export const RoomRating = z.enum(['Safe', 'Questionable', 'Explicit']);

export const PreferlistTag = z.object({
    tag: z.string(),
    frequency: PreferlistFrequency,
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
    name: z.string(),
    postsPerRound: z.number(),
    roundsPerGame: z.number(),
    gameMode: GameMode,
    rating: RoomRating,
    owner: User,
    members: z.array(User),
    blacklist: z.array(z.string()),
    preferlist: z.array(PreferlistTag),
    postQueue: z.array(Post),
    curRound: z.number(),
    postsViewedThisRound: z.number(),
    allUsersReady: z.map(z.string(), z.boolean()),
    gameStarted: z.boolean(),
})

export const CreateRoomEventData = z.object({
    roomID: z.optional(z.string()),
    userID: z.string(),
    roomName: z.string(),
    postsPerRound: z.number(),
    roundsPerGame: z.number(),
    gameMode: z.optional(GameMode),
    rating: z.optional(RoomRating),
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
    tag: PostTag,
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
    userID: z.string(),
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
export const UpdateBlacklistEventData = z.object({
    roomID: z.string(),
    tag: z.string(),
    action: z.enum(['add', 'remove']),
    type: z.literal(EventType.enum.UPDATE_BLACKLIST)
})
export const UpdatePreferlistEventData = z.object({
    roomID: z.string(),
    tag: z.string(),
    action: z.enum(['add', 'remove', 'set_frequency']),
    frequency: z.optional(PreferlistFrequency),
    type: z.literal(EventType.enum.UPDATE_PREFERLIST)
})
export const UpdateRoomSettingsEventData = z.object({
    roomID: z.string(),
    userID: z.string(),
    roomName: z.string(),
    postsPerRound: z.number(),
    roundsPerGame: z.number(),
    gameMode: GameMode,
    rating: RoomRating,
    type: z.literal(EventType.enum.UPDATE_ROOM_SETTINGS)
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
    roomName: z.string(),
    postsPerRound: z.number(),
    roundsPerGame: z.number(),
    gameMode: GameMode,
    rating: RoomRating,
    owner: User,
    readyStates: z.array(UserReadyState),
    blacklist: z.array(z.string()),
    preferlist: z.array(PreferlistTag)
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
    tag: PostTag,
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
});

export const EndGameEventDataToClient = z.object({
    type: z.literal(EventType.enum.END_GAME)
});

export const ShowLeaderboardEventDataToClient = z.object({
    type: z.literal(EventType.enum.SHOW_LEADERBOARD)
});
export const UpdateBlacklistEventDataToClient = z.object({
    roomID: z.string(),
    blacklist: z.array(z.string()),
    type: z.literal(EventType.enum.UPDATE_BLACKLIST)
})
export const UpdatePreferlistEventDataToClient = z.object({
    roomID: z.string(),
    preferlist: z.array(PreferlistTag),
    type: z.literal(EventType.enum.UPDATE_PREFERLIST)
})
export const UpdateRoomSettingsEventDataToClient = z.object({
    roomID: z.string(),
    roomName: z.string(),
    postsPerRound: z.number(),
    roundsPerGame: z.number(),
    gameMode: GameMode,
    rating: RoomRating,
    type: z.literal(EventType.enum.UPDATE_ROOM_SETTINGS)
})

/**
 * Server-Only Object Types
 */
export type ServerRoomType = z.infer<typeof ServerRoom>;

/**
 * Server-Only Types
 */
export type CreateRoomEventDataType = z.infer<typeof CreateRoomEventData>
export type JoinRoomEventDataType = z.infer<typeof JoinRoomEventData>
export type LeaveRoomEventDataType = z.infer<typeof LeaveRoomEventData>
export type RequestPostEventDataType = z.infer<typeof RequestPostEventData>
export type GuessTagEventDataType = z.infer<typeof GuessTagEventData>
export type SetUsernameEventDataType = z.infer<typeof SetUsernameEventData>
export type SetUserIconEventDataType = z.infer<typeof SetUserIconEventData>
export type GetSelectedIconsEventDataType = z.infer<typeof GetSelectedIconsEventData>
export type StartGameEventDataType = z.infer<typeof StartGameEventData>
export type ReadyUpEventDataType = z.infer<typeof ReadyUpEventData>
export type AllRoomsEventDataType = z.infer<typeof AllRoomsEventData>
export type UpdateBlacklistEventDataType = z.infer<typeof UpdateBlacklistEventData>
export type UpdatePreferlistEventDataType = z.infer<typeof UpdatePreferlistEventData>
export type UpdateRoomSettingsEventDataType = z.infer<typeof UpdateRoomSettingsEventData>

/**
 * Client-Only Types
 */
export type CreateRoomEventDataToClientType = z.infer<typeof CreateRoomEventDataToClient>
export type JoinRoomEventDataToClientType = z.infer<typeof JoinRoomEventDataToClient>
export type LeaveRoomEventDataToClientType = z.infer<typeof LeaveRoomEventDataToClient>
export type AllRoomsEventDataToClientType = z.infer<typeof AllRoomsEventDataToClient>
export type GuessTagEventDataToClientType = z.infer<typeof GuessTagEventDataToClient>
export type RequestPostEventDataToClientType = z.infer<typeof RequestPostEventDataToClient>
export type SetUsernameEventDataToClientType = z.infer<typeof SetUsernameEventDataToClient>
export type SetUserIconEventDataToClientType = z.infer<typeof SetUserIconEventDataToClient>
export type GetSelectedIconsEventDataToClientType = z.infer<typeof GetSelectedIconsEventDataToClient>
export type ReadyUpEventDataToClientType = z.infer<typeof ReadyUpEventDataToClient>
export type StartGameEventDataToClientType = z.infer<typeof StartGameEventDataToClient>
export type EndGameEventDataToClientType = z.infer<typeof EndGameEventDataToClient>
export type ShowLeaderboardEventDataToClientType = z.infer<typeof ShowLeaderboardEventDataToClient>
export type UpdateBlacklistEventDataToClientType = z.infer<typeof UpdateBlacklistEventDataToClient>
export type UpdatePreferlistEventDataToClientType = z.infer<typeof UpdatePreferlistEventDataToClient>
export type UpdateRoomSettingsEventDataToClientType = z.infer<typeof UpdateRoomSettingsEventDataToClient>

export type ClientRoomType = z.infer<typeof ClientRoom>;

/**
 * Shared Types
 */
export type TagTypeType = z.infer<typeof TagType>
export type PostTagType = z.infer<typeof PostTag>;
export type PostType = z.infer<typeof Post>;
export type PreferlistTagType = z.infer<typeof PreferlistTag>;
export type PreferlistFrequencyType = z.infer<typeof PreferlistFrequency>;
export type GameModeType = z.infer<typeof GameMode>;
export type RoomRatingType = z.infer<typeof RoomRating>;
export type UserType = z.infer<typeof User>;
export type EventTypeType = z.infer<typeof EventType>;
export type UserReadyStateType = z.infer<typeof UserReadyState>;
