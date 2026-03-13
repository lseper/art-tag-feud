"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouletteTurnStartEventDataToClient = exports.RouletteVoteSkipEventData = exports.UpdateRoomSettingsEventDataToClient = exports.UpdatePreferlistEventDataToClient = exports.UpdateBlacklistEventDataToClient = exports.ShowLeaderboardEventDataToClient = exports.EndGameEventDataToClient = exports.StartGameEventDataToClient = exports.ReadyUpEventDataToClient = exports.RequestPostEventDataToClient = exports.GetSelectedIconsEventDataToClient = exports.SetUserIconEventDataToClient = exports.SetUsernameEventDataToClient = exports.SyncRoundStateEventDataToClient = exports.GuessTagEventDataToClient = exports.AllRoomsEventDataToClient = exports.LeaveRoomEventDataToClient = exports.JoinRoomEventDataToClient = exports.CreateRoomEventDataToClient = exports.ClientRoom = exports.UserReadyState = exports.RequestBotFillEventData = exports.BotActionSequence = exports.BotAction = exports.UpdateRoomSettingsEventData = exports.UpdatePreferlistEventData = exports.UpdateBlacklistEventData = exports.AllRoomsEventData = exports.StartGameEventData = exports.ReadyUpEventData = exports.RequestPostEventData = exports.GetSelectedIconsEventData = exports.SetUserIconEventData = exports.SetUsernameEventData = exports.GuessTagEventData = exports.LeaveRoomEventData = exports.JoinRoomEventData = exports.CreateRoomEventData = exports.ServerRoom = exports.GuessedTagEntry = exports.User = exports.PreferlistTag = exports.BotDifficulty = exports.RoomRating = exports.GameMode = exports.PreferlistFrequency = exports.Post = exports.PostTag = exports.TagType = exports.EventType = void 0;
exports.RouletteAllTagsGuessedEventDataToClient = exports.RoulettePlayerEliminatedEventDataToClient = exports.RouletteSkipUpdateEventDataToClient = exports.RouletteLifeLostEventDataToClient = void 0;
// @ts-nocheck
const zod_1 = require("zod");
// shared
exports.EventType = zod_1.z.enum(['DEFAULT',
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
    'UPDATE_ROOM_SETTINGS',
    'REQUEST_BOT_FILL',
    'SYNC_ROUND_STATE',
    'ROULETTE_TURN_START',
    'ROULETTE_LIFE_LOST',
    'ROULETTE_VOTE_SKIP',
    'ROULETTE_SKIP_UPDATE',
    'ROULETTE_PLAYER_ELIMINATED',
    'ROULETTE_ALL_TAGS_GUESSED']);
/**
 * Server-Only Types
 */
exports.TagType = zod_1.z.enum(["general", "species", "character", "artist"]);
exports.PostTag = zod_1.z.object({
    name: zod_1.z.string(),
    type: exports.TagType,
    score: zod_1.z.number(),
});
exports.Post = zod_1.z.object({
    id: zod_1.z.number(),
    url: zod_1.z.string(),
    tags: zod_1.z.array(exports.PostTag)
});
exports.PreferlistFrequency = zod_1.z.enum(['most', 'all']);
exports.GameMode = zod_1.z.enum(['Blitz', 'Roulette', 'Imposter']);
exports.RoomRating = zod_1.z.enum(['Safe', 'Questionable', 'Explicit']);
exports.BotDifficulty = zod_1.z.enum(['Saint', 'Sinner', 'Succubus']);
exports.PreferlistTag = zod_1.z.object({
    tag: zod_1.z.string(),
    frequency: exports.PreferlistFrequency,
});
exports.User = zod_1.z.object({
    username: zod_1.z.string(),
    id: zod_1.z.string(),
    score: zod_1.z.number(),
    icon: zod_1.z.optional(zod_1.z.string()),
    isBot: zod_1.z.optional(zod_1.z.boolean()),
    botProfileId: zod_1.z.optional(zod_1.z.string()),
    roomID: zod_1.z.optional(zod_1.z.string())
});
exports.GuessedTagEntry = zod_1.z.object({
    tag: exports.PostTag,
    user: zod_1.z.optional(exports.User),
});
exports.ServerRoom = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    postsPerRound: zod_1.z.number(),
    roundsPerGame: zod_1.z.number(),
    botCount: zod_1.z.number(),
    botDifficulties: zod_1.z.array(exports.BotDifficulty),
    gameMode: exports.GameMode,
    rating: exports.RoomRating,
    roomCode: zod_1.z.string(),
    isPrivate: zod_1.z.boolean(),
    owner: exports.User,
    members: zod_1.z.array(exports.User),
    blacklist: zod_1.z.array(zod_1.z.string()),
    preferlist: zod_1.z.array(exports.PreferlistTag),
    postQueue: zod_1.z.array(exports.Post),
    curRound: zod_1.z.number(),
    postsViewedThisRound: zod_1.z.number(),
    allUsersReady: zod_1.z.map(zod_1.z.string(), zod_1.z.boolean()),
    gameStarted: zod_1.z.boolean(),
    startingLives: zod_1.z.optional(zod_1.z.number()),
    turnTimeMs: zod_1.z.optional(zod_1.z.number()),
});
exports.CreateRoomEventData = zod_1.z.object({
    roomID: zod_1.z.optional(zod_1.z.string()),
    userID: zod_1.z.string(),
    roomName: zod_1.z.string(),
    postsPerRound: zod_1.z.number(),
    roundsPerGame: zod_1.z.number(),
    botCount: zod_1.z.optional(zod_1.z.number()),
    botDifficulties: zod_1.z.optional(zod_1.z.array(exports.BotDifficulty)),
    gameMode: zod_1.z.optional(exports.GameMode),
    rating: zod_1.z.optional(exports.RoomRating),
    isPrivate: zod_1.z.optional(zod_1.z.boolean()),
    startingLives: zod_1.z.optional(zod_1.z.number()),
    turnTimeMs: zod_1.z.optional(zod_1.z.number()),
    type: zod_1.z.literal(exports.EventType.enum.CREATE_ROOM)
});
exports.JoinRoomEventData = zod_1.z.object({
    userID: zod_1.z.optional(zod_1.z.string()),
    roomID: zod_1.z.optional(zod_1.z.string()),
    roomCode: zod_1.z.optional(zod_1.z.string()),
    type: zod_1.z.literal(exports.EventType.enum.JOIN_ROOM)
}).refine((data) => data.roomID || data.roomCode, {
    message: 'roomID or roomCode is required',
});
exports.LeaveRoomEventData = zod_1.z.object({
    userID: zod_1.z.string(),
    roomID: zod_1.z.string(),
    type: zod_1.z.literal(exports.EventType.enum.LEAVE_ROOM)
});
exports.GuessTagEventData = zod_1.z.object({
    user: exports.User,
    tag: exports.PostTag,
    roomID: zod_1.z.string(),
    type: zod_1.z.literal(exports.EventType.enum.GUESS_TAG)
});
exports.SetUsernameEventData = zod_1.z.object({
    username: zod_1.z.string(),
    userID: zod_1.z.optional(zod_1.z.string()),
    type: zod_1.z.literal(exports.EventType.enum.SET_USERNAME)
});
exports.SetUserIconEventData = zod_1.z.object({
    icon: zod_1.z.string(),
    userID: zod_1.z.string(),
    roomID: zod_1.z.string(),
    type: zod_1.z.literal(exports.EventType.enum.SET_ICON)
});
exports.GetSelectedIconsEventData = zod_1.z.object({
    roomID: zod_1.z.string(),
    type: zod_1.z.literal(exports.EventType.enum.GET_SELECTED_ICONS)
});
exports.RequestPostEventData = zod_1.z.object({
    roomID: zod_1.z.string(),
    userID: zod_1.z.string(),
    type: zod_1.z.literal(exports.EventType.enum.REQUEST_POST)
});
exports.ReadyUpEventData = zod_1.z.object({
    userID: zod_1.z.string(),
    roomID: zod_1.z.string(),
    ready: zod_1.z.boolean(),
    type: zod_1.z.literal(exports.EventType.enum.READY_UP)
});
exports.StartGameEventData = zod_1.z.object({
    roomID: zod_1.z.string(),
    type: zod_1.z.literal(exports.EventType.enum.START_GAME)
});
exports.AllRoomsEventData = zod_1.z.object({
    type: zod_1.z.literal(exports.EventType.enum.ALL_ROOMS)
});
exports.UpdateBlacklistEventData = zod_1.z.object({
    roomID: zod_1.z.string(),
    tag: zod_1.z.string(),
    action: zod_1.z.enum(['add', 'remove']),
    type: zod_1.z.literal(exports.EventType.enum.UPDATE_BLACKLIST)
});
exports.UpdatePreferlistEventData = zod_1.z.object({
    roomID: zod_1.z.string(),
    tag: zod_1.z.string(),
    action: zod_1.z.enum(['add', 'remove', 'set_frequency']),
    frequency: zod_1.z.optional(exports.PreferlistFrequency),
    type: zod_1.z.literal(exports.EventType.enum.UPDATE_PREFERLIST)
});
exports.UpdateRoomSettingsEventData = zod_1.z.object({
    roomID: zod_1.z.string(),
    userID: zod_1.z.string(),
    roomName: zod_1.z.string(),
    postsPerRound: zod_1.z.number(),
    roundsPerGame: zod_1.z.number(),
    botCount: zod_1.z.number(),
    botDifficulties: zod_1.z.array(exports.BotDifficulty),
    gameMode: exports.GameMode,
    rating: exports.RoomRating,
    isPrivate: zod_1.z.boolean(),
    startingLives: zod_1.z.optional(zod_1.z.number()),
    turnTimeMs: zod_1.z.optional(zod_1.z.number()),
    type: zod_1.z.literal(exports.EventType.enum.UPDATE_ROOM_SETTINGS)
});
exports.BotAction = zod_1.z.object({
    type: zod_1.z.enum(['guess_tag', 'ready_up']),
    delayMs: zod_1.z.number(),
    tag: zod_1.z.optional(exports.PostTag),
});
exports.BotActionSequence = zod_1.z.object({
    roundPostId: zod_1.z.string(),
    botProfileId: zod_1.z.optional(zod_1.z.string()),
    gameMode: exports.GameMode,
    bots: zod_1.z.array(zod_1.z.object({
        botId: zod_1.z.string(),
        actions: zod_1.z.array(exports.BotAction),
    })),
});
exports.RequestBotFillEventData = zod_1.z.object({
    roomID: zod_1.z.string(),
    userID: zod_1.z.string(),
    botNames: zod_1.z.array(zod_1.z.string()),
    botProfileName: zod_1.z.optional(zod_1.z.string()),
    type: zod_1.z.literal(exports.EventType.enum.REQUEST_BOT_FILL)
});
/**
 * Client Types
 */
exports.UserReadyState = zod_1.z.object({
    user: exports.User,
    ready: zod_1.z.boolean(),
    icon: zod_1.z.optional(zod_1.z.string()),
});
exports.ClientRoom = zod_1.z.object({
    roomID: zod_1.z.string(),
    roomName: zod_1.z.string(),
    postsPerRound: zod_1.z.number(),
    roundsPerGame: zod_1.z.number(),
    botCount: zod_1.z.number(),
    botDifficulties: zod_1.z.array(exports.BotDifficulty),
    gameMode: exports.GameMode,
    rating: exports.RoomRating,
    roomCode: zod_1.z.string(),
    isPrivate: zod_1.z.boolean(),
    owner: exports.User,
    readyStates: zod_1.z.array(exports.UserReadyState),
    blacklist: zod_1.z.array(zod_1.z.string()),
    preferlist: zod_1.z.array(exports.PreferlistTag),
    startingLives: zod_1.z.optional(zod_1.z.number()),
    turnTimeMs: zod_1.z.optional(zod_1.z.number()),
});
exports.CreateRoomEventDataToClient = zod_1.z.object({
    roomID: zod_1.z.string(),
    readyStates: zod_1.z.array(zod_1.z.boolean()),
    userID: zod_1.z.optional(zod_1.z.string()),
    type: zod_1.z.literal(exports.EventType.enum.CREATE_ROOM)
});
exports.JoinRoomEventDataToClient = zod_1.z.object({
    user: exports.User,
    room: exports.ClientRoom,
    type: zod_1.z.literal(exports.EventType.enum.JOIN_ROOM)
});
exports.LeaveRoomEventDataToClient = zod_1.z.object({
    room: exports.ClientRoom,
    type: zod_1.z.literal(exports.EventType.enum.LEAVE_ROOM)
});
exports.AllRoomsEventDataToClient = zod_1.z.object({
    rooms: zod_1.z.array(exports.ClientRoom),
    type: zod_1.z.literal(exports.EventType.enum.ALL_ROOMS)
});
exports.GuessTagEventDataToClient = zod_1.z.object({
    tag: exports.PostTag,
    user: exports.User,
    type: zod_1.z.literal(exports.EventType.enum.GUESS_TAG)
});
exports.SyncRoundStateEventDataToClient = zod_1.z.object({
    post: zod_1.z.optional(exports.Post),
    guessedTags: zod_1.z.array(exports.GuessedTagEntry),
    type: zod_1.z.literal(exports.EventType.enum.SYNC_ROUND_STATE)
});
exports.SetUsernameEventDataToClient = zod_1.z.object({
    user: exports.User,
    type: zod_1.z.literal(exports.EventType.enum.SET_USERNAME)
});
exports.SetUserIconEventDataToClient = zod_1.z.object({
    userID: zod_1.z.string(),
    icon: zod_1.z.optional(zod_1.z.string()),
    pastIcon: zod_1.z.optional(zod_1.z.string()),
    type: zod_1.z.literal(exports.EventType.enum.SET_ICON)
});
exports.GetSelectedIconsEventDataToClient = zod_1.z.object({
    selectedIcons: zod_1.z.array(zod_1.z.string()),
    type: zod_1.z.literal(exports.EventType.enum.GET_SELECTED_ICONS)
});
exports.RequestPostEventDataToClient = zod_1.z.object({
    post: zod_1.z.optional(exports.Post),
    botActionSequence: zod_1.z.optional(exports.BotActionSequence),
    type: zod_1.z.literal(exports.EventType.enum.REQUEST_POST)
});
exports.ReadyUpEventDataToClient = zod_1.z.object({
    roomID: zod_1.z.string(),
    room: exports.ClientRoom,
    type: zod_1.z.literal(exports.EventType.enum.READY_UP)
});
exports.StartGameEventDataToClient = zod_1.z.object({
    type: zod_1.z.literal(exports.EventType.enum.START_GAME)
});
exports.EndGameEventDataToClient = zod_1.z.object({
    type: zod_1.z.literal(exports.EventType.enum.END_GAME)
});
exports.ShowLeaderboardEventDataToClient = zod_1.z.object({
    type: zod_1.z.literal(exports.EventType.enum.SHOW_LEADERBOARD)
});
exports.UpdateBlacklistEventDataToClient = zod_1.z.object({
    roomID: zod_1.z.string(),
    blacklist: zod_1.z.array(zod_1.z.string()),
    type: zod_1.z.literal(exports.EventType.enum.UPDATE_BLACKLIST)
});
exports.UpdatePreferlistEventDataToClient = zod_1.z.object({
    roomID: zod_1.z.string(),
    preferlist: zod_1.z.array(exports.PreferlistTag),
    type: zod_1.z.literal(exports.EventType.enum.UPDATE_PREFERLIST)
});
exports.UpdateRoomSettingsEventDataToClient = zod_1.z.object({
    roomID: zod_1.z.string(),
    roomName: zod_1.z.string(),
    postsPerRound: zod_1.z.number(),
    roundsPerGame: zod_1.z.number(),
    botCount: zod_1.z.number(),
    botDifficulties: zod_1.z.array(exports.BotDifficulty),
    gameMode: exports.GameMode,
    rating: exports.RoomRating,
    roomCode: zod_1.z.string(),
    isPrivate: zod_1.z.boolean(),
    startingLives: zod_1.z.optional(zod_1.z.number()),
    turnTimeMs: zod_1.z.optional(zod_1.z.number()),
    type: zod_1.z.literal(exports.EventType.enum.UPDATE_ROOM_SETTINGS)
});
// Roulette Client → Server
exports.RouletteVoteSkipEventData = zod_1.z.object({
    roomID: zod_1.z.string(),
    userID: zod_1.z.string(),
    vote: zod_1.z.boolean(),
    type: zod_1.z.literal(exports.EventType.enum.ROULETTE_VOTE_SKIP)
});
// Roulette Server → Client
exports.RouletteTurnStartEventDataToClient = zod_1.z.object({
    activePlayerID: zod_1.z.string(),
    turnTimeMs: zod_1.z.number(),
    turnOrder: zod_1.z.array(zod_1.z.string()),
    playerLives: zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
    type: zod_1.z.literal(exports.EventType.enum.ROULETTE_TURN_START)
});
exports.RouletteLifeLostEventDataToClient = zod_1.z.object({
    playerID: zod_1.z.string(),
    livesRemaining: zod_1.z.number(),
    reason: zod_1.z.enum(['wrong_guess', 'timeout']),
    type: zod_1.z.literal(exports.EventType.enum.ROULETTE_LIFE_LOST)
});
exports.RouletteSkipUpdateEventDataToClient = zod_1.z.object({
    skipVotes: zod_1.z.number(),
    totalPlayers: zod_1.z.number(),
    threshold: zod_1.z.number(),
    type: zod_1.z.literal(exports.EventType.enum.ROULETTE_SKIP_UPDATE)
});
exports.RoulettePlayerEliminatedEventDataToClient = zod_1.z.object({
    playerID: zod_1.z.string(),
    placement: zod_1.z.number(),
    type: zod_1.z.literal(exports.EventType.enum.ROULETTE_PLAYER_ELIMINATED)
});
exports.RouletteAllTagsGuessedEventDataToClient = zod_1.z.object({
    type: zod_1.z.literal(exports.EventType.enum.ROULETTE_ALL_TAGS_GUESSED)
});
//# sourceMappingURL=contracts.js.map