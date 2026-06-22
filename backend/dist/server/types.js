"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShowLeaderboardEventDataToClient = exports.StartGameEventDataToClient = exports.ReadyUpEventDataToClient = exports.RequestPostEventDataToClient = exports.GetSelectedIconsEventDataToClient = exports.SetUserIconEventDataToClient = exports.SetUsernameEventDataToClient = exports.GuessTagEventDataToClient = exports.AllRoomsEventDataToClient = exports.LeaveRoomEventDataToClient = exports.JoinRoomEventDataToClient = exports.CreateRoomEventDataToClient = exports.ClientRoom = exports.UserReadyState = exports.AllRoomsEventData = exports.StartGameEventData = exports.ReadyUpEventData = exports.RequestPostEventData = exports.GetSelectedIconsEventData = exports.SetUserIconEventData = exports.SetUsernameEventData = exports.GuessTagEventData = exports.LeaveRoomEventData = exports.JoinRoomEventData = exports.CreateRoomEventData = exports.ServerRoom = exports.User = exports.Post = exports.Tag = exports.TagType = exports.EventType = void 0;
const zod_1 = require("zod");
// shared
exports.EventType = zod_1.z.enum(['DEFAULT',
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
exports.TagType = zod_1.z.enum(["general", "species", "character", "artist"]);
exports.Tag = zod_1.z.object({
    name: zod_1.z.string(),
    type: exports.TagType,
    score: zod_1.z.number(),
});
exports.Post = zod_1.z.object({
    id: zod_1.z.number(),
    url: zod_1.z.string(),
    tags: zod_1.z.array(exports.Tag)
});
exports.User = zod_1.z.object({
    username: zod_1.z.string(),
    id: zod_1.z.string(),
    score: zod_1.z.number(),
    icon: zod_1.z.optional(zod_1.z.string()),
    roomID: zod_1.z.optional(zod_1.z.string())
});
exports.ServerRoom = zod_1.z.object({
    id: zod_1.z.string(),
    owner: exports.User,
    members: zod_1.z.array(exports.User),
    postQueue: zod_1.z.array(exports.Post),
    postsViewedThisRound: zod_1.z.number(),
    allUsersReady: zod_1.z.map(zod_1.z.string(), zod_1.z.boolean()),
    gameStarted: zod_1.z.boolean(),
});
exports.CreateRoomEventData = zod_1.z.object({
    userID: zod_1.z.string(),
    type: zod_1.z.literal(exports.EventType.enum.CREATE_ROOM)
});
exports.JoinRoomEventData = zod_1.z.object({
    userID: zod_1.z.optional(zod_1.z.string()),
    roomID: zod_1.z.string(),
    type: zod_1.z.literal(exports.EventType.enum.JOIN_ROOM)
});
exports.LeaveRoomEventData = zod_1.z.object({
    userID: zod_1.z.string(),
    roomID: zod_1.z.string(),
    type: zod_1.z.literal(exports.EventType.enum.LEAVE_ROOM)
});
exports.GuessTagEventData = zod_1.z.object({
    user: exports.User,
    tag: exports.Tag,
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
    owner: exports.User,
    readyStates: zod_1.z.array(exports.UserReadyState)
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
    tag: exports.Tag,
    user: exports.User,
    type: zod_1.z.literal(exports.EventType.enum.GUESS_TAG)
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
exports.ShowLeaderboardEventDataToClient = zod_1.z.object({
    type: zod_1.z.literal(exports.EventType.enum.SHOW_LEADERBOARD)
});
//# sourceMappingURL=types.js.map