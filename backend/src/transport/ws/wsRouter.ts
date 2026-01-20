import type { RawData, WebSocket, WebSocketServer } from 'ws';
import {
    EventType,
    GuessTagEventData,
    SetUsernameEventData,
    SetUserIconEventData,
    GetSelectedIconsEventData,
    CreateRoomEventData,
    AllRoomsEventData,
    JoinRoomEventData,
    LeaveRoomEventData,
    RequestPostEventData,
    ReadyUpEventData,
    StartGameEventData,
    UpdateBlacklistEventData,
    UpdatePreferlistEventData,
} from '../../domain/contracts';
import type {
    AllRoomsEventDataToClientType,
    EndGameEventDataToClientType,
    GetSelectedIconsEventDataToClientType,
    JoinRoomEventDataToClientType,
    LeaveRoomEventDataToClientType,
    ReadyUpEventDataToClientType,
    RequestPostEventDataToClientType,
    SetUserIconEventDataToClientType,
    SetUsernameEventDataToClientType,
    ShowLeaderboardEventDataToClientType,
    UpdateBlacklistEventDataToClientType,
    UpdatePreferlistEventDataToClientType,
} from '../../domain/contracts';
import { broadcast, broadcastToRoom, reply } from './wsBroadcast';
import { getOrCreateUser, setUserIcon, setUsername } from '../../services/userService';
import { getAllRooms, getRoom, getSelectedIcons, createOrUpdateRoom, joinRoom, leaveRoom, updateRoomReadyState, updateRoomBlacklist, updateRoomPreferlist } from '../../services/roomService';
import { handleGuessTag } from '../../services/guessService';
import { handleRequestPost } from '../../services/postService';
import { ensureActiveGame } from '../../services/gameService';

const handleMessage = async (server: WebSocketServer, response: WebSocket, data: RawData) => {
    const dataJSON = JSON.parse(data.toString());
    const messageType = dataJSON.type;

    switch (messageType) {
        case EventType.enum.GUESS_TAG: {
            const result = GuessTagEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const guessResult = await handleGuessTag(data.roomID, data.user.id, data.tag);
            if (guessResult) {
                const guessTagData = { type: EventType.enum.GUESS_TAG, tag: guessResult.tag, user: guessResult.user };
                broadcastToRoom(guessResult.room, guessTagData);
            }
            break;
        }
        case EventType.enum.SET_USERNAME: {
            const result = SetUsernameEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const userID = getOrCreateUser(response, data.userID);
            const user = await setUsername(userID, data.username);
            if (user) {
                const userToChangeResponseData: SetUsernameEventDataToClientType = { type: EventType.enum.SET_USERNAME, user };
                reply(response, userToChangeResponseData);
            }
            break;
        }
        case EventType.enum.SET_ICON: {
            const result = SetUserIconEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const userID = getOrCreateUser(response, data.userID);
            const room = getRoom(data.roomID);
            if (room) {
                const iconResult = await setUserIcon(userID, room.id, data.icon);
                if (iconResult) {
                    const responseData: SetUserIconEventDataToClientType = iconResult.pastIcon
                        ? { type: EventType.enum.SET_ICON, userID, icon: iconResult.user.icon, pastIcon: iconResult.pastIcon }
                        : { type: EventType.enum.SET_ICON, userID, icon: iconResult.user.icon };
                    broadcastToRoom(room, responseData);
                }
            } else {
                const roomId = (room ?? { id: 'NULL'}).id;
                console.error(`user ${userID} or room ${roomId}} does not exist`);
            }
            break;
        }
        case EventType.enum.GET_SELECTED_ICONS: {
            const result = GetSelectedIconsEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const { roomID } = result.data;
            const selectedIcons = getSelectedIcons(roomID);
            if (!selectedIcons) {
                break;
            }
            const responseData: GetSelectedIconsEventDataToClientType = { type: EventType.enum.GET_SELECTED_ICONS, selectedIcons };
            reply(response, responseData);
            break;
        }
        case EventType.enum.CREATE_ROOM: {
            const result = CreateRoomEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const userID = getOrCreateUser(response, data.userID);
            const createResult = await createOrUpdateRoom(userID, data.roomName, data.postsPerRound, data.roundsPerGame, data.roomID);
            if (createResult) {
                const roomToClient = createResult.roomToClient;
                broadcast<JoinRoomEventDataToClientType>(server, { type: EventType.enum.JOIN_ROOM, user: createResult.user, room: roomToClient });
            }
            break;
        }
        case EventType.enum.ALL_ROOMS: {
            const roomsToSend = getAllRooms();
            reply<AllRoomsEventDataToClientType>(response, { type: EventType.enum.ALL_ROOMS, rooms: roomsToSend });
            break;
        }
        case EventType.enum.JOIN_ROOM: {
            const result = JoinRoomEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const roomID = result.data.roomID;
            const userID = getOrCreateUser(response, result.data.userID);
            const joinResult = await joinRoom(roomID, userID);
            if (joinResult) {
                broadcastToRoom<JoinRoomEventDataToClientType>(joinResult.room, { type: EventType.enum.JOIN_ROOM, user: joinResult.user, room: joinResult.roomToClient });
            }
            break;
        }
        case EventType.enum.LEAVE_ROOM: {
            const result = LeaveRoomEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const { userID, roomID } = result.data;
            const leaveResult = await leaveRoom(roomID, userID);
            if (!leaveResult) {
                break;
            }
            const iconData: SetUserIconEventDataToClientType = { type: EventType.enum.SET_ICON, userID, pastIcon: leaveResult.pastIcon };
            broadcastToRoom(leaveResult.room, iconData);
            if (leaveResult.shouldDeleteRoom) {
                const newRooms = getAllRooms();
                const data: AllRoomsEventDataToClientType = { type: EventType.enum.ALL_ROOMS, rooms: newRooms };
                broadcast(server, data);
                break;
            }
            const leaveData: LeaveRoomEventDataToClientType = { type: EventType.enum.LEAVE_ROOM, room: leaveResult.roomToClient! };
            broadcastToRoom(leaveResult.room, leaveData);
            break;
        }
        case EventType.enum.REQUEST_POST: {
            const result = RequestPostEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const requestResult = await handleRequestPost(data.roomID, data.userID);
            const room = getRoom(data.roomID);
            if (!room) {
                break;
            }
            if (requestResult.kind === 'end_game') {
                broadcastToRoom<EndGameEventDataToClientType>(room, { type: EventType.enum.END_GAME });
                break;
            }
            if (requestResult.kind === 'show_leaderboard') {
                broadcastToRoom<ShowLeaderboardEventDataToClientType>(room, { type: EventType.enum.SHOW_LEADERBOARD });
                break;
            }
            if (requestResult.kind === 'send_post') {
                broadcastToRoom<RequestPostEventDataToClientType>(room, { type: EventType.enum.REQUEST_POST, post: requestResult.post });
                break;
            }
            broadcastToRoom<RequestPostEventDataToClientType>(room, { type: EventType.enum.REQUEST_POST });
            break;
        }
        case EventType.enum.READY_UP: {
            const result = ReadyUpEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const readyResult = await updateRoomReadyState(data.roomID, data.userID, data.ready);
            if (readyResult) {
                const updatedRoom = {
                    roomID: readyResult.room.id,
                    roomName: readyResult.room.name,
                    readyStates: readyResult.roomToClient.readyStates,
                    owner: readyResult.user,
                    blacklist: readyResult.room.blacklist,
                    preferlist: readyResult.room.preferlist,
                };
                broadcastToRoom<ReadyUpEventDataToClientType>(readyResult.room, { type: EventType.enum.READY_UP, roomID: readyResult.room.id, room: updatedRoom });
            }
            break;
        }
        case EventType.enum.START_GAME: {
            const result = StartGameEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const room = getRoom(data.roomID);
            if (room) {
                await ensureActiveGame(room, room.owner.id);
                broadcastToRoom(room, { type: EventType.enum.START_GAME });
            } else {
                console.error(`room ${data.roomID} does not exist, so a game cannot be started in it`);
            }
            break;
        }
        case EventType.enum.UPDATE_BLACKLIST: {
            const result = UpdateBlacklistEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const updateResult = await updateRoomBlacklist(data.roomID, data.tag, data.action);
            if (!updateResult) {
                break;
            }
            const responseData: UpdateBlacklistEventDataToClientType = {
                type: EventType.enum.UPDATE_BLACKLIST,
                roomID: updateResult.room.id,
                blacklist: updateResult.room.blacklist,
            };
            broadcastToRoom(updateResult.room, responseData);
            break;
        }
        case EventType.enum.UPDATE_PREFERLIST: {
            const result = UpdatePreferlistEventData.safeParse(dataJSON);
            if (!result.success) {
                break;
            }
            const data = result.data;
            const updateResult = await updateRoomPreferlist(data.roomID, data.tag, data.action, data.frequency);
            if (!updateResult) {
                break;
            }
            const responseData: UpdatePreferlistEventDataToClientType = {
                type: EventType.enum.UPDATE_PREFERLIST,
                roomID: updateResult.room.id,
                preferlist: updateResult.room.preferlist,
            };
            broadcastToRoom(updateResult.room, responseData);
            if (updateResult.removedFromBlacklist) {
                const blacklistResponse: UpdateBlacklistEventDataToClientType = {
                    type: EventType.enum.UPDATE_BLACKLIST,
                    roomID: updateResult.room.id,
                    blacklist: updateResult.room.blacklist,
                };
                broadcastToRoom(updateResult.room, blacklistResponse);
            }
            break;
        }
        default:
            break;
    }
};

export { handleMessage };
