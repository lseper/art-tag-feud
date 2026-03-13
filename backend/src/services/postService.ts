import type { PostTagType, PostType, ServerRoomType } from '../domain/contracts';
import { activeGames, rooms } from '../state/store';
import { roomIsReadyForNewPost } from '../domain/roomUtils';
import { getPosts, getImageOnlyPosts } from '../data/e621Client';
import { upsertRoom } from '../data/repos/roomsRepo';
import { upsertRoomReadyStates } from '../data/repos/roomReadyStateRepo';
import { upsertPost, upsertPostTags } from '../data/repos/postsRepo';
import { insertRoundPost } from '../data/repos/roundPostsRepo';
import { insertGuess } from '../data/repos/guessesRepo';
import { insertLeaderboardSnapshot } from '../data/repos/leaderboardRepo';
import { ensureActiveGame, startNextRound, endGame } from './gameService';
import { generateBotActionSequence } from './botSequenceService';
import { initRouletteGame, handleNewPost as rouletteHandleNewPost, startTurn } from './rouletteService';
import { handlePuzzleRoundStart } from './puzzleService';
import { rouletteGames } from '../state/store';

const recordPostAndTags = async (post: PostType) => {
    await upsertPost(post);
    const tags = Array.isArray(post.tags) ? post.tags : [];
    await upsertPostTags(post.id, tags);
};

const recordRoundPost = async (roomID: string, roundId: string, postId: number, postOrder: number) => {
    const roundPostId = await insertRoundPost(roundId, postId, postOrder);
    if (!roundPostId) return null;
    const active = activeGames.get(roomID);
    if (active) {
        active.currentRoundPostId = roundPostId;
        active.nextPostOrder += 1;
        activeGames.set(roomID, active);
    }
    return roundPostId;
};

const recordGuess = async (roomID: string, userID: string, tag: PostTagType) => {
    const active = activeGames.get(roomID);
    if (!active?.currentRoundPostId) return;
    await insertGuess(active.currentRoundPostId, userID, tag);
};

const recordLeaderboardSnapshot = async (room: ServerRoomType) => {
    const active = activeGames.get(room.id);
    if (!active) return;
    const snapshot = room.members.reduce((acc, member) => {
        acc[member.id] = member.score;
        return acc;
    }, {} as Record<string, number>);
    await insertLeaderboardSnapshot(active.gameId, active.roundId, snapshot);
};

const handleRoulettePost = async (room: ServerRoomType) => {
    if (room.postQueue.length === 0) {
        room.postQueue = await getPosts(room.blacklist, room.preferlist);
    }

    const postToSend = room.postQueue.shift();
    if (!postToSend) {
        console.error('No posts available to send (Roulette).');
        return { kind: 'no_post' } as const;
    }

    await ensureActiveGame(room);
    await recordPostAndTags(postToSend);

    const activeGame = activeGames.get(room.id);
    let roundPostId: string | null = null;
    if (activeGame) {
        roundPostId = await recordRoundPost(room.id, activeGame.roundId, postToSend.id, activeGame.nextPostOrder);
    }

    const preferlistAllTimeTags = new Set(room.preferlist.filter(e => e.frequency === 'all').map(e => e.tag));
    const tags = Array.isArray(postToSend.tags) ? postToSend.tags : [];
    const postToSendWithPreferlist = preferlistAllTimeTags.size > 0 ? {
        ...postToSend,
        tags: tags.map(tag => preferlistAllTimeTags.has(tag.name) ? { ...tag, score: 0 } : tag),
    } : { ...postToSend, tags };

    if (activeGame) {
        activeGame.currentPost = postToSendWithPreferlist;
        activeGame.currentRoundGuesses = new Map();
        activeGames.set(room.id, activeGame);
    }

    room.postsViewedThisRound += 1;
    await upsertRoom(room);

    const botActionSequence = roundPostId
        ? await generateBotActionSequence(room, roundPostId, postToSendWithPreferlist.tags)
        : null;

    // Initialize or reset roulette state for the new post
    if (!rouletteGames.has(room.id)) {
        initRouletteGame(room.id);
    } else {
        rouletteHandleNewPost(room.id);
    }
    startTurn(room.id);

    return { kind: 'send_post', post: postToSendWithPreferlist, botActionSequence } as const;
};

const handlePuzzlePost = async (room: ServerRoomType, userID: string) => {
    if (room.postQueue.length === 0) {
        room.postQueue = await getImageOnlyPosts(room.blacklist, room.preferlist);
    }

    const postToSend = room.postQueue.shift();
    if (!postToSend) {
        console.error('No image posts available to send (Puzzle).');
        return { kind: 'no_post' } as const;
    }

    await ensureActiveGame(room, userID);
    await recordPostAndTags(postToSend);

    const activeGame = activeGames.get(room.id);
    if (activeGame) {
        activeGame.currentPost = postToSend;
        activeGame.currentRoundGuesses = new Map();
        activeGames.set(room.id, activeGame);
        await recordRoundPost(room.id, activeGame.roundId, postToSend.id, activeGame.nextPostOrder);
    }

    room.postsViewedThisRound += 1;
    await upsertRoom(room);

    // Delegate to puzzle service to generate pieces and broadcast PUZZLE_ROUND_START
    await handlePuzzleRoundStart(room.id, postToSend.url, postToSend.id);

    return { kind: 'puzzle_started' } as const;
};

const handleRequestPost = async (roomID: string, userID: string) => {
    const roomToSendPost = rooms.get(roomID);
    if (!roomToSendPost) return { kind: 'no_room' } as const;

    // Roulette mode: skip ready-check and round progression
    if (roomToSendPost.gameMode === 'Roulette') {
        if (!roomToSendPost.gameStarted) {
            roomToSendPost.gameStarted = true;
            await upsertRoom(roomToSendPost);
        }
        return await handleRoulettePost(roomToSendPost);
    }

    // Puzzle mode: skip tag guessing, use puzzle flow
    if (roomToSendPost.gameMode === 'Puzzle') {
        if (!roomToSendPost.gameStarted) {
            roomToSendPost.gameStarted = true;
            await upsertRoom(roomToSendPost);
        }
        return await handlePuzzlePost(roomToSendPost, userID);
    }

    roomToSendPost.allUsersReady.set(userID, true);
    await upsertRoomReadyStates(roomToSendPost);

    if (!roomToSendPost.gameStarted) {
        roomToSendPost.gameStarted = true;
        await upsertRoom(roomToSendPost);
    }

    if (roomToSendPost.postQueue.length === 0) {
        roomToSendPost.postQueue = await getPosts(roomToSendPost.blacklist, roomToSendPost.preferlist);
    }

    if (!roomIsReadyForNewPost(roomToSendPost)) {
        return { kind: 'wait' } as const;
    }

    if (roomToSendPost.postsViewedThisRound >= roomToSendPost.postsPerRound) {
        await recordLeaderboardSnapshot(roomToSendPost);
        roomToSendPost.curRound += 1;
        roomToSendPost.postsViewedThisRound = 0;
        if (roomToSendPost.curRound >= roomToSendPost.roundsPerGame) {
            await endGame(roomToSendPost.id);
            return { kind: 'end_game' } as const;
        }
        const activeGame = await ensureActiveGame(roomToSendPost);
        if (activeGame) {
            await startNextRound(roomToSendPost.id, activeGame.gameId, roomToSendPost.curRound);
        }
        await upsertRoom(roomToSendPost);
        const active = activeGames.get(roomToSendPost.id);
        if (active) {
            active.currentPost = undefined;
            active.currentRoundGuesses = new Map();
            activeGames.set(roomToSendPost.id, active);
        }
        return { kind: 'show_leaderboard' } as const;
    }

    const postToSend = roomToSendPost.postQueue.shift();
    if (!postToSend) {
        console.error('No posts available to send.');
        return { kind: 'no_post' } as const;
    }

    await ensureActiveGame(roomToSendPost, userID);
    await recordPostAndTags(postToSend);
    const activeGame = activeGames.get(roomToSendPost.id);
    let roundPostId: string | null = null;
    if (activeGame) {
        roundPostId = await recordRoundPost(roomToSendPost.id, activeGame.roundId, postToSend.id, activeGame.nextPostOrder);
    }

    const preferlistAllTimeTags = new Set(roomToSendPost.preferlist.filter(entry => entry.frequency === 'all').map(entry => entry.tag));
    const tags = Array.isArray(postToSend.tags) ? postToSend.tags : [];
    const postToSendWithPreferlist = preferlistAllTimeTags.size > 0 ? {
        ...postToSend,
        tags: tags.map(tag => preferlistAllTimeTags.has(tag.name) ? { ...tag, score: 0 } : tag),
    } : {
        ...postToSend,
        tags,
    };
    if (activeGame) {
        activeGame.currentPost = postToSendWithPreferlist;
        activeGame.currentRoundGuesses = new Map();
        activeGames.set(roomToSendPost.id, activeGame);
    }

    roomToSendPost.postsViewedThisRound += 1;
    await upsertRoom(roomToSendPost);

    const newReadyMap = new Map<string, boolean>();
    roomToSendPost.allUsersReady.forEach((_v, k) => {
        const member = roomToSendPost.members.find(user => user.id === k);
        newReadyMap.set(k, member?.isBot ? true : false);
    });
    roomToSendPost.allUsersReady = newReadyMap;
    await upsertRoomReadyStates(roomToSendPost);

    const botActionSequence = roundPostId
        ? await generateBotActionSequence(roomToSendPost, roundPostId, postToSendWithPreferlist.tags)
        : null;
    return { kind: 'send_post', post: postToSendWithPreferlist, botActionSequence } as const;
};

export { recordGuess, handleRequestPost };
