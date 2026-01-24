import type { ConnectionManager } from '../util/ConnectionManager';
import type { GuessTagEventDataType, PostTagType, ReadyUpEventDataType, SetUserIconEventDataType } from '../types';
import { EventType } from '../types';
import type { Actor } from './Actor';

class HumanActor implements Actor {
    public id: string;
    public isBot: boolean;
    protected connectionManager: ConnectionManager;

    constructor(id: string, connectionManager: ConnectionManager) {
        this.id = id;
        this.connectionManager = connectionManager;
        this.isBot = false;
    }

    public selectIcon(roomID: string, icon: string) {
        const data: SetUserIconEventDataType = { type: EventType.enum.SET_ICON, userID: this.id, roomID, icon };
        this.connectionManager.send(data);
    }

    public readyUp(roomID: string, ready: boolean) {
        const data: ReadyUpEventDataType = { type: EventType.enum.READY_UP, userID: this.id, roomID, ready };
        this.connectionManager.send(data);
    }

    public guessTag(roomID: string, tag: PostTagType) {
        const data: GuessTagEventDataType = {
            type: EventType.enum.GUESS_TAG,
            tag,
            user: { id: this.id, score: 0, username: `User_${this.id}`, roomID },
            roomID,
        };
        this.connectionManager.send(data);
    }
}

export { HumanActor };
