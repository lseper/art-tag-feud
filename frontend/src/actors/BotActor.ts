import type { ConnectionManager } from '../util/ConnectionManager';
import type { GuessTagEventDataType, PostTagType } from '../types';
import { EventType } from '../types';
import { HumanActor } from './HumanActor';

class BotActor extends HumanActor {
    public username: string;
    public botProfileId?: string;

    constructor(id: string, username: string, connectionManager: ConnectionManager, botProfileId?: string) {
        super(id, connectionManager);
        this.isBot = true;
        this.username = username;
        this.botProfileId = botProfileId;
    }

    public guessTag(roomID: string, tag: PostTagType) {
        const data: GuessTagEventDataType = {
            type: EventType.enum.GUESS_TAG,
            tag,
            user: {
                id: this.id,
                score: 0,
                username: this.username,
                roomID,
                isBot: true,
                botProfileId: this.botProfileId,
            },
            roomID,
        };
        this.connectionManager.send(data);
    }
}

export { BotActor };
