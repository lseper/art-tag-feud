import type { WebSocket } from 'ws';
import type { PostType, ServerRoomType, UserType } from '../domain/contracts';

export type ActiveGameState = {
    gameId: string;
    roundId: string;
    roundIndex: number;
    nextPostOrder: number;
    currentRoundPostId?: string;
    currentPost?: PostType;
    currentRoundGuesses?: Map<string, string>;
};

export type RouletteGameState = {
    turnOrder: string[];
    currentTurnIndex: number;
    playerLives: Map<string, number>;
    skipVotes: Set<string>;
    turnTimerHandle?: ReturnType<typeof setTimeout>;
    totalGuessCount: Map<string, number>;
    eliminationOrder: string[];
    turnTimeMs: number;
};

let numUsers = 0;

const rooms: Map<string, ServerRoomType> = new Map();
const users: Map<string, UserType> = new Map();
const userSockets: Map<string, WebSocket> = new Map();
const activeGames: Map<string, ActiveGameState> = new Map();
const rouletteGames: Map<string, RouletteGameState> = new Map();

const incrementUsers = () => {
    numUsers += 1;
};

const decrementUsers = () => {
    numUsers -= 1;
};

const getNumUsers = () => numUsers;

export {
    rooms,
    users,
    userSockets,
    activeGames,
    rouletteGames,
    incrementUsers,
    decrementUsers,
    getNumUsers,
};
