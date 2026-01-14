import { createContext } from 'react';
import { ConnectionManager } from '../util/ConnectionManager';
import type {UserReadyStateType, UserType} from '../types';

type UserContextType = {
    // user specific things
    userID?: string,
    username?: string,
    score: number,
    // room specific things
    roomID?: string,
    roomName?: string,
    icon?: string,
    readyStates: UserReadyStateType[],
    owner?: UserType,
    blacklist: string[],
    connectionManager: ConnectionManager

    setUserID: (userID: string) => void,
    setUsername: (username: string) => void,
    setRoomID: (roomID: string) => void,
    setRoomName: (roomName: string) => void,
    setIcon: (icon: string) => void,
    setReadyStates: (readyStates: UserReadyStateType[]) => void,
    setOwner: (owner: UserType) => void,
    setScore: (score: number) => void,
    setBlacklist: (blacklist: string[]) => void,
    leaveRoomCleanup: () => void,
}

export const UserContext = createContext<UserContextType>({
        score: 0,
        connectionManager: ConnectionManager.getInstance(),
        readyStates: [],
        blacklist: [],
    
        setUserID: (userID: string) => {},
        setUsername: (username: string) => {},
        setRoomID: (roomID: string) => {},
        setRoomName: (roomID: string) => {},
        setScore: (score: number) => {},
        setIcon: (icon: string) => {},
        setOwner: (owner: UserType) => {},
        setReadyStates: (readyStates: UserReadyStateType[]) => {},
        setBlacklist: (blacklist: string[]) => {},
        leaveRoomCleanup: () => {},
});
