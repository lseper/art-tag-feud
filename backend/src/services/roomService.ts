import { v4 } from 'uuid';
import type {
    ClientRoomType,
    GameModeType,
    RoomRatingType,
    ServerRoomType,
    UpdateBlacklistEventDataType,
    UpdatePreferlistEventDataType,
    UserType,
} from '../domain/contracts';
import { rooms, users } from '../state/store';
import { convertServerRoomToClientRoom, convertServerRoomsToClientRooms, getReadyStates, resetRoom } from '../domain/roomUtils';
import { normalizeTag } from '../domain/tagUtils';
import { upsertRoom, deleteRoom } from '../data/repos/roomsRepo';
import { upsertRoomMember, removeRoomMember } from '../data/repos/roomMembersRepo';
import { upsertRoomReadyStates } from '../data/repos/roomReadyStateRepo';
import { updateBlacklist } from '../data/repos/blacklistRepo';
import { updatePreferlist } from '../data/repos/preferlistRepo';
import { upsertPlayer } from '../data/repos/playersRepo';

const getAllRooms = (): ClientRoomType[] => {
    return convertServerRoomsToClientRooms(rooms.values(), users);
};

const getRoom = (roomID: string) => rooms.get(roomID) ?? null;

const getSelectedIcons = (roomID: string) => {
    const room = rooms.get(roomID);
    if (!room) return null;
    const selectedIconsWithNulls = [...room.allUsersReady.entries()].map(entry => {
        const userID = entry[0];
        const user = users.get(userID);
        return user?.icon ?? null;
    });
    const selectedIcons: string[] = [];
    selectedIconsWithNulls.forEach(selectedIcon => {
        if (selectedIcon) {
            selectedIcons.push(selectedIcon);
        }
    });
    return selectedIcons;
};

const DEFAULT_GAME_MODE: GameModeType = 'Blitz';
const DEFAULT_RATING: RoomRatingType = 'Explicit';

const createOrUpdateRoom = async (
    userID: string,
    roomName: string,
    postsPerRound: number,
    roundsPerGame: number,
    roomID?: string,
    gameMode?: GameModeType,
    rating?: RoomRatingType,
) => {
    const user = users.get(userID);
    if (!user) return null;

    if (roomID) {
        const room = rooms.get(roomID);
        if (!room) return null;
        room.postsPerRound = postsPerRound;
        room.roundsPerGame = roundsPerGame;
        room.name = roomName;
        room.gameMode = gameMode ?? room.gameMode ?? DEFAULT_GAME_MODE;
        room.rating = rating ?? room.rating ?? DEFAULT_RATING;
        resetRoom(room);
        await upsertRoom(room);
        const roomToClient = convertServerRoomToClientRoom(room, users);
        return { room, roomToClient, user, created: false };
    }

    let newRoomID = v4();
    while (rooms.get(newRoomID)) {
        newRoomID = v4();
    }

    const newRoomAllUsersReady = new Map<string, boolean>();
    newRoomAllUsersReady.set(user.id, false);
    user.roomID = newRoomID;
    const newRoom: ServerRoomType = {
        id: newRoomID,
        name: roomName,
        postsPerRound,
        roundsPerGame,
        gameMode: gameMode ?? DEFAULT_GAME_MODE,
        rating: rating ?? DEFAULT_RATING,
        members: [user],
        blacklist: [],
        preferlist: [],
        curRound: 0,
        postQueue: [],
        allUsersReady: newRoomAllUsersReady,
        postsViewedThisRound: 0,
        gameStarted: false,
        owner: user,
    };
    rooms.set(newRoomID, newRoom);
    await upsertPlayer(user);
    await upsertRoom(newRoom);
    await upsertRoomMember(newRoomID, user);
    await upsertRoomReadyStates(newRoom);

    const roomToClient = convertServerRoomToClientRoom(newRoom, users);
    return { room: newRoom, roomToClient, user, created: true };
};

const joinRoom = async (roomID: string, userID: string) => {
    const room = rooms.get(roomID);
    const user = users.get(userID);
    if (!room || !user) return null;

    room.members.push(user);
    room.allUsersReady.set(user.id, false);
    user.roomID = roomID;

    await upsertPlayer(user);
    await upsertRoomMember(roomID, user);
    await upsertRoomReadyStates(room);

    const roomToClient = convertServerRoomToClientRoom(room, users);
    return { room, user, roomToClient };
};

const leaveRoom = async (roomID: string, userID: string) => {
    const roomToUpdate = rooms.get(roomID);
    const userToLeave = users.get(userID);
    if (!roomToUpdate || !userToLeave) return null;

    const pastIcon = userToLeave.icon;
    userToLeave.icon = undefined;

    roomToUpdate.allUsersReady.delete(userID);
    roomToUpdate.members = roomToUpdate.members.filter(member => member.id !== userID);
    rooms.set(roomID, roomToUpdate);
    await removeRoomMember(roomID, userID);

    let shouldDeleteRoom = false;
    if (roomToUpdate.owner.id === userID) {
        if (roomToUpdate.members.length === 0) {
            rooms.delete(roomID);
            shouldDeleteRoom = true;
        } else {
            roomToUpdate.owner = roomToUpdate.members[0];
            rooms.set(roomID, roomToUpdate);
        }
    }

    if (shouldDeleteRoom) {
        await deleteRoom(roomID);
        return { room: roomToUpdate, shouldDeleteRoom: true, pastIcon };
    }

    await upsertRoom(roomToUpdate);
    await upsertRoomReadyStates(roomToUpdate);

    const roomToClient = convertServerRoomToClientRoom(roomToUpdate, users);
    return { room: roomToUpdate, roomToClient, shouldDeleteRoom: false, pastIcon };
};

const updateRoomReadyState = async (roomID: string, userID: string, ready: boolean) => {
    const room = rooms.get(roomID);
    const user = users.get(userID);
    if (!room || !user) return null;

    room.allUsersReady.set(userID, ready);
    await upsertRoomReadyStates(room);
    const roomToClient = convertServerRoomToClientRoom(room, users);
    return { room, roomToClient, user };
};

const updateRoomBlacklist = async (roomID: string, tag: string, action: UpdateBlacklistEventDataType['action']) => {
    const room = rooms.get(roomID);
    if (!room) return null;

    const normalizedTag = normalizeTag(tag);
    if (!normalizedTag) return null;

    if (action === 'add') {
        if (!room.blacklist.includes(normalizedTag)) {
            room.blacklist.push(normalizedTag);
        }
        if (room.preferlist.some(entry => entry.tag === normalizedTag)) {
            room.blacklist = room.blacklist.filter(existing => existing !== normalizedTag);
        }
    } else {
        room.blacklist = room.blacklist.filter(existing => existing !== normalizedTag);
    }

    rooms.set(room.id, room);
    await updateBlacklist(room.id, normalizedTag, action);
    return { room, normalizedTag };
};

const updateRoomPreferlist = async (roomID: string, tag: string, action: UpdatePreferlistEventDataType['action'], frequency?: UpdatePreferlistEventDataType['frequency']) => {
    const room = rooms.get(roomID);
    if (!room) return null;

    const normalizedTag = normalizeTag(tag);
    if (!normalizedTag) return null;

    const preferlistIndex = room.preferlist.findIndex(entry => entry.tag === normalizedTag);
    if (action === 'add') {
        const nextFrequency = frequency ?? 'most';
        if (preferlistIndex === -1) {
            room.preferlist.push({ tag: normalizedTag, frequency: nextFrequency });
        } else {
            room.preferlist[preferlistIndex].frequency = nextFrequency;
        }
        room.blacklist = room.blacklist.filter(existing => existing !== normalizedTag);
    } else if (action === 'set_frequency') {
        if (frequency && preferlistIndex !== -1) {
            room.preferlist[preferlistIndex].frequency = frequency;
        }
    } else {
        room.preferlist = room.preferlist.filter(entry => entry.tag !== normalizedTag);
    }

    rooms.set(room.id, room);
    await updatePreferlist(room.id, normalizedTag, action, frequency);
    if (action === 'add') {
        await updateBlacklist(room.id, normalizedTag, 'remove');
    }

    return { room, normalizedTag, removedFromBlacklist: action === 'add' };
};

const updateRoomSettings = async (
    roomID: string,
    roomName: string,
    postsPerRound: number,
    roundsPerGame: number,
    gameMode: GameModeType,
    rating: RoomRatingType,
) => {
    const room = rooms.get(roomID);
    if (!room) return null;

    const shouldReset = room.postsPerRound !== postsPerRound || room.roundsPerGame !== roundsPerGame;
    room.name = roomName;
    room.postsPerRound = postsPerRound;
    room.roundsPerGame = roundsPerGame;
    room.gameMode = gameMode;
    room.rating = rating;
    if (shouldReset) {
        resetRoom(room);
    }
    rooms.set(room.id, room);
    await upsertRoom(room);
    const roomToClient = convertServerRoomToClientRoom(room, users);
    return { room, roomToClient };
};

export {
    getAllRooms,
    getRoom,
    getSelectedIcons,
    createOrUpdateRoom,
    joinRoom,
    leaveRoom,
    updateRoomReadyState,
    updateRoomBlacklist,
    updateRoomPreferlist,
    updateRoomSettings,
};
