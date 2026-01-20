import type { ServerRoomType } from '../domain/contracts';
import { activeGames } from '../state/store';
import { createGame, endGame as endGameRepo } from '../data/repos/gamesRepo';
import { createRound } from '../data/repos/roundsRepo';
import type { ActiveGameState } from '../state/store';

const ensureActiveGame = async (room: ServerRoomType, createdByPlayerID?: string) => {
    if (activeGames.has(room.id)) {
        return activeGames.get(room.id)!;
    }
    const gameId = await createGame(room.id, createdByPlayerID ?? null, room.postsPerRound, room.roundsPerGame);
    if (!gameId) return null;

    const roundId = await createRound(gameId, room.curRound);
    if (!roundId) return null;

    const state: ActiveGameState = {
        gameId,
        roundId,
        roundIndex: room.curRound,
        nextPostOrder: 0,
    };
    activeGames.set(room.id, state);
    return state;
};

const startNextRound = async (roomID: string, gameId: string, roundIndex: number) => {
    const roundId = await createRound(gameId, roundIndex);
    if (!roundId) return null;
    const state: ActiveGameState = {
        gameId,
        roundId,
        roundIndex,
        nextPostOrder: 0,
    };
    activeGames.set(roomID, state);
    return state;
};

const endGame = async (roomID: string) => {
    const active = activeGames.get(roomID);
    if (!active) return;
    await endGameRepo(active.gameId);
    activeGames.delete(roomID);
};

export { ensureActiveGame, startNextRound, endGame };
