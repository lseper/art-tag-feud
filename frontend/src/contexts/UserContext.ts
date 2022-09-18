import { createContext } from 'react';
import { ConnectionManager } from '../util/ConnectionManager';
import type {UserReadyState, User} from '../types';

type UserContextType = {
    // user specific things
    userID?: string,
    username?: string,
    score: number,
    // room specific things
    roomID?: string,
    icon?: string,
    readyStates: UserReadyState[],
    owner?: User,
    connectionManager: ConnectionManager

    setUserID: (userID: string) => void,
    setUsername: (username: string) => void,
    setRoomID: (roomID: string) => void,
    setIcon: (icon: string) => void,
    setReadyStates: (readyStates: UserReadyState[]) => void,
    setOwner: (owner: User) => void,
    setScore: (score: number) => void,
    leaveRoomCleanup: () => void,
}

export const UserContext = createContext<UserContextType>({
        score: 0,
        connectionManager: ConnectionManager.getInstance(),
        readyStates: [],
    
        setUserID: (userID: string) => {},
        setUsername: (username: string) => {},
        setRoomID: (roomID: string) => {},
        setScore: (score: number) => {},
        setIcon: (icon: string) => {},
        setOwner: (owner: User) => {},
        setReadyStates: (readyStates: UserReadyState[]) => {},
        leaveRoomCleanup: () => {},
});