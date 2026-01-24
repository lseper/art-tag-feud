import type { ClientRoomType, ServerRoomType, UserReadyStateType, UserType } from './contracts';

const roomIsReadyForNewPost = (room: ServerRoomType): boolean => {
    return [...room.allUsersReady.values()].every(readyState => readyState);
};

const getReadyStates = (room: ServerRoomType, users: Map<string, UserType>): UserReadyStateType[] => {
    return [...room.allUsersReady.entries()].map((entry) => {
        const user = users.get(entry[0])!;
        const icon = user?.icon;
        return { user, ready: entry[1], icon };
    });
};

const convertServerRoomToClientRoom = (serverRoom: ServerRoomType, users: Map<string, UserType>): ClientRoomType => {
    const readyStates: UserReadyStateType[] = getReadyStates(serverRoom, users);
    return {
        roomID: serverRoom.id,
        roomName: serverRoom.name,
        postsPerRound: serverRoom.postsPerRound,
        roundsPerGame: serverRoom.roundsPerGame,
        botCount: serverRoom.botCount,
        botDifficulties: serverRoom.botDifficulties,
        gameMode: serverRoom.gameMode,
        rating: serverRoom.rating,
        roomCode: serverRoom.roomCode,
        isPrivate: serverRoom.isPrivate,
        readyStates,
        owner: serverRoom.owner,
        blacklist: serverRoom.blacklist,
        preferlist: serverRoom.preferlist,
    };
};

const convertServerRoomsToClientRooms = (rooms: Iterable<ServerRoomType>, users: Map<string, UserType>) => {
    return [...rooms].map((room) => convertServerRoomToClientRoom(room, users));
};

const resetRoom = (room: ServerRoomType): void => {
    room.curRound = 0;
    const newReadyStates = new Map<string, boolean>();
    for (const userID of room.allUsersReady.keys()) {
        newReadyStates.set(userID, false);
    }
    room.allUsersReady = newReadyStates;
};

export {
    roomIsReadyForNewPost,
    getReadyStates,
    convertServerRoomToClientRoom,
    convertServerRoomsToClientRooms,
    resetRoom,
};
