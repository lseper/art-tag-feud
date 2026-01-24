import type { WebSocket } from 'ws';
import { v4 } from 'uuid';
import { users, userSockets } from '../state/store';
import type { UserType } from '../domain/contracts';
import { upsertPlayer } from '../data/repos/playersRepo';
import { upsertRoomMember } from '../data/repos/roomMembersRepo';

const getOrCreateUser = (socket: WebSocket, userID?: string): string => {
    if (!userID) {
        let newUserID = v4();
        while (userSockets.get(newUserID)) {
            newUserID = v4();
        }
        const createdUser: UserType = { username: `User_${userID}`, id: newUserID, score: 0, isBot: false };
        userSockets.set(newUserID, socket);
        users.set(newUserID, createdUser);
        return newUserID;
    }
    if (!users.get(userID)) {
        const createdUser: UserType = { username: `User_${userID}`, id: userID, score: 0 };
        users.set(userID, createdUser);
    }
    userSockets.set(userID, socket);
    return userID;
};

const setUsername = async (userID: string, username: string) => {
    const user = users.get(userID);
    if (!user) return null;
    user.username = username;
    await upsertPlayer(user);
    return user;
};

const setUserIcon = async (userID: string, roomID: string, icon: string) => {
    const user = users.get(userID);
    if (!user) return null;
    const pastIcon = user.icon;
    user.icon = icon;
    await upsertRoomMember(roomID, user);
    return { user, pastIcon };
};

const clearUserIcon = async (userID: string, roomID: string) => {
    const user = users.get(userID);
    if (!user) return null;
    const pastIcon = user.icon;
    user.icon = undefined;
    await upsertRoomMember(roomID, user);
    return { user, pastIcon };
};

export { getOrCreateUser, setUsername, setUserIcon, clearUserIcon };
