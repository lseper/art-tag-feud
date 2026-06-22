import type { PostTagType } from '../domain/contracts';
import { activeGames, rooms, users } from '../state/store';
import { upsertRoomMember } from '../data/repos/roomMembersRepo';
import { recordGuess } from './postService';
import { handleRouletteGuess } from './rouletteService';

const handleGuessTag = async (roomID: string, userID: string, tag: PostTagType) => {
    const room = rooms.get(roomID);
    const userToUpdateScore = users.get(userID);
    if (!room || !userToUpdateScore) return null;

    if (room.gameMode === 'Roulette') {
        // Roulette handles turn validation and life tracking internally
        const result = handleRouletteGuess(roomID, userID, tag);
        if (result.kind === 'not_your_turn' || result.kind === 'no_state') {
            return null;
        }
        if (result.kind === 'correct' || result.kind === 'all_tags_guessed') {
            await recordGuess(roomID, userID, result.tag);
            return { room, user: userToUpdateScore, tag: result.tag, rouletteResult: result };
        }
        // wrong guess, game_over: no guess to record
        return { room, user: userToUpdateScore, tag, rouletteResult: result };
    }

    if (room.allUsersReady.get(userToUpdateScore.id)) {
        return null;
    }

    if (room.preferlist.some(entry => entry.tag === tag.name && entry.frequency === 'all')) {
        tag.score = 0;
    }

    userToUpdateScore.score += tag.score;
    await upsertRoomMember(room.id, userToUpdateScore);
    await recordGuess(room.id, userToUpdateScore.id, tag);
    const active = activeGames.get(roomID);
    if (active) {
        if (!active.currentRoundGuesses) {
            active.currentRoundGuesses = new Map();
        }
        if (!active.currentRoundGuesses.has(tag.name)) {
            active.currentRoundGuesses.set(tag.name, userToUpdateScore.id);
            activeGames.set(roomID, active);
        }
    }

    return { room, user: userToUpdateScore, tag };
};

export { handleGuessTag };
