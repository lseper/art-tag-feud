import type { PostTagType } from '../domain/contracts';
import { rooms, users } from '../state/store';
import { upsertRoomMember } from '../data/repos/roomMembersRepo';
import { recordGuess } from './postService';

const handleGuessTag = async (roomID: string, userID: string, tag: PostTagType) => {
    const room = rooms.get(roomID);
    const userToUpdateScore = users.get(userID);
    if (!room || !userToUpdateScore) return null;

    if (room.allUsersReady.get(userToUpdateScore.id)) {
        return null;
    }

    if (room.preferlist.some(entry => entry.tag === tag.name && entry.frequency === 'all')) {
        tag.score = 0;
    }

    userToUpdateScore.score += tag.score;
    await upsertRoomMember(room.id, userToUpdateScore);
    await recordGuess(room.id, userToUpdateScore.id, tag);

    return { room, user: userToUpdateScore, tag };
};

export { handleGuessTag };
