import { createContext } from 'react';
import { ConnectionManager } from '../util/ConnectionManager';
import type {PreferlistTagType, UserReadyStateType, UserType} from '../types';

type UserContextType = {
    // user specific things
    userID?: string,
    username?: string,
    score: number,
    // room specific things
    roomID?: string,
    roomName?: string,
    roomCode?: string,
    isPrivate: boolean,
    icon?: string,
    readyStates: UserReadyStateType[],
    owner?: UserType,
    blacklist: string[],
    preferlist: PreferlistTagType[],
    connectionManager: ConnectionManager

    setUserID: (userID: string) => void,
    setUsername: (username: string) => void,
    setRoomID: (roomID: string) => void,
    setRoomName: (roomName: string) => void,
    setRoomCode: (roomCode: string | undefined) => void,
    setIsPrivate: (isPrivate: boolean) => void,
    setIcon: (icon: string) => void,
    setReadyStates: (readyStates: UserReadyStateType[]) => void,
    setOwner: (owner: UserType) => void,
    setScore: (score: number) => void,
    setBlacklist: (blacklist: string[]) => void,
    setPreferlist: (preferlist: PreferlistTagType[]) => void,
    leaveRoomCleanup: () => void,
}

export const UserContext = createContext<UserContextType>({
        score: 0,
        connectionManager: ConnectionManager.getInstance(),
        readyStates: [],
        blacklist: [],
        preferlist: [],
        isPrivate: true,
    
        setUserID: (_userID: string) => {},
        setUsername: (_username: string) => {},
        setRoomID: (_roomID: string) => {},
        setRoomName: (_roomID: string) => {},
        setRoomCode: (_roomCode: string | undefined) => {},
        setIsPrivate: (_isPrivate: boolean) => {},
        setScore: (_score: number) => {},
        setIcon: (_icon: string) => {},
        setOwner: (_owner: UserType) => {},
        setReadyStates: (_readyStates: UserReadyStateType[]) => {},
        setBlacklist: (_blacklist: string[]) => {},
        setPreferlist: (_preferlist: PreferlistTagType[]) => {},
        leaveRoomCleanup: () => {},
});
