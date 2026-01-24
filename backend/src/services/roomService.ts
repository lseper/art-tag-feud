import { v4 } from 'uuid';
import type {
    ClientRoomType,
    BotDifficultyType,
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
import { getRoomMember, upsertRoomMember, removeRoomMember } from '../data/repos/roomMembersRepo';
import { upsertRoomReadyStates } from '../data/repos/roomReadyStateRepo';
import { updateBlacklist } from '../data/repos/blacklistRepo';
import { updatePreferlist } from '../data/repos/preferlistRepo';
import { upsertPlayer } from '../data/repos/playersRepo';
import { ensureBotCountForRoom } from './botService';

const DEFAULT_BOT_DIFFICULTY: BotDifficultyType = 'Sinner';

const normalizeBotDifficulties = (
    botCount: number,
    difficulties: BotDifficultyType[] | undefined,
) => {
    const values = new Set<BotDifficultyType>(['Saint', 'Sinner', 'Succubus']);
    const source = Array.isArray(difficulties) ? difficulties : [];
    return Array.from({ length: botCount }, (_value, index) => {
        const entry = source[index];
        return values.has(entry) ? entry : DEFAULT_BOT_DIFFICULTY;
    });
};

const getAllRooms = (): ClientRoomType[] => {
    const publicRooms = [...rooms.values()].filter(room => !room.isPrivate);
    return convertServerRoomsToClientRooms(publicRooms, users);
};

const getRoom = (roomID: string) => rooms.get(roomID) ?? null;

const normalizeRoomCode = (roomCode: string) => roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

const getRoomByCode = (roomCode: string) => {
    const normalized = normalizeRoomCode(roomCode);
    return [...rooms.values()].find(room => room.roomCode === normalized) ?? null;
};

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

const markBotsReady = (room: ServerRoomType) => {
    room.members.forEach(member => {
        if (member.isBot) {
            room.allUsersReady.set(member.id, true);
        }
    });
};

const createRoomCode = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 12; i += 1) {
        result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return result;
};

const createOrUpdateRoom = async (
    userID: string,
    roomName: string,
    postsPerRound: number,
    roundsPerGame: number,
    roomID?: string,
    gameMode?: GameModeType,
    rating?: RoomRatingType,
    isPrivate?: boolean,
    botCount?: number,
    botDifficulties?: BotDifficultyType[],
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
        room.isPrivate = isPrivate ?? room.isPrivate ?? false;
        room.botCount = botCount ?? room.botCount ?? 0;
        room.botDifficulties = normalizeBotDifficulties(
            room.botCount,
            botDifficulties ?? room.botDifficulties,
        );
        if (!room.roomCode) {
            room.roomCode = createRoomCode();
        }
        await ensureBotCountForRoom(room, room.botCount, room.botDifficulties);
        resetRoom(room);
        markBotsReady(room);
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
    let roomCode = createRoomCode();
    while ([...rooms.values()].some(existing => existing.roomCode === roomCode)) {
        roomCode = createRoomCode();
    }

    const newRoom: ServerRoomType = {
        id: newRoomID,
        name: roomName,
        postsPerRound,
        roundsPerGame,
        botCount: botCount ?? 0,
        botDifficulties: normalizeBotDifficulties(botCount ?? 0, botDifficulties),
        gameMode: gameMode ?? DEFAULT_GAME_MODE,
        rating: rating ?? DEFAULT_RATING,
        roomCode,
        isPrivate: isPrivate ?? false,
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
    await ensureBotCountForRoom(newRoom, newRoom.botCount, newRoom.botDifficulties);
    await upsertRoom(newRoom);
    await upsertRoomMember(newRoomID, user);
    await upsertRoomReadyStates(newRoom);

    const roomToClient = convertServerRoomToClientRoom(newRoom, users);
    return { room: newRoom, roomToClient, user, created: true };
};

const joinRoom = async (roomID: string | undefined, roomCode: string | undefined, userID: string) => {
    const room = roomID ? rooms.get(roomID) : (roomCode ? getRoomByCode(roomCode) : null);
    const user = users.get(userID);
    if (!room || !user) return null;

    if (room.isPrivate) {
        const normalizedCode = roomCode ? normalizeRoomCode(roomCode) : '';
        if (!normalizedCode || normalizedCode !== room.roomCode) {
            return null;
        }
    }

    const isExistingMember = room.members.some(member => member.id === user.id);
    const roomMember = await getRoomMember(room.id, user.id);
    if (roomMember?.score != null) {
        user.score = roomMember.score;
    } else if (!isExistingMember && room.gameStarted) {
        const lowestScore = room.members.length > 0
            ? room.members.reduce((minScore, member) => Math.min(minScore, member.score), room.members[0].score)
            : 0;
        user.score = Math.max(0, lowestScore - 400);
    }

    if (!isExistingMember) {
        room.members.push(user);
    }
    if (!room.allUsersReady.has(user.id)) {
        room.allUsersReady.set(user.id, false);
    }
    user.roomID = room.id;

    await upsertPlayer(user);
    await upsertRoomMember(room.id, user);
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
    botCount: number,
    botDifficulties: BotDifficultyType[],
    gameMode: GameModeType,
    rating: RoomRatingType,
    isPrivate: boolean,
) => {
    const room = rooms.get(roomID);
    if (!room) return null;

    const shouldReset = room.postsPerRound !== postsPerRound || room.roundsPerGame !== roundsPerGame;
    room.name = roomName;
    room.postsPerRound = postsPerRound;
    room.roundsPerGame = roundsPerGame;
    room.botCount = botCount;
    room.botDifficulties = normalizeBotDifficulties(botCount, botDifficulties);
    room.gameMode = gameMode;
    room.rating = rating;
    room.isPrivate = isPrivate;
    await ensureBotCountForRoom(room, botCount, room.botDifficulties);
    if (shouldReset) {
        resetRoom(room);
        markBotsReady(room);
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
