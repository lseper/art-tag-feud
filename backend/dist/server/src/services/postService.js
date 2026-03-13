"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRequestPost = exports.recordGuess = void 0;
const store_1 = require("../state/store");
const roomUtils_1 = require("../domain/roomUtils");
const e621Client_1 = require("../data/e621Client");
const roomsRepo_1 = require("../data/repos/roomsRepo");
const roomReadyStateRepo_1 = require("../data/repos/roomReadyStateRepo");
const postsRepo_1 = require("../data/repos/postsRepo");
const roundPostsRepo_1 = require("../data/repos/roundPostsRepo");
const guessesRepo_1 = require("../data/repos/guessesRepo");
const leaderboardRepo_1 = require("../data/repos/leaderboardRepo");
const gameService_1 = require("./gameService");
const botSequenceService_1 = require("./botSequenceService");
const rouletteService_1 = require("./rouletteService");
const store_2 = require("../state/store");
const recordPostAndTags = (post) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, postsRepo_1.upsertPost)(post);
    const tags = Array.isArray(post.tags) ? post.tags : [];
    yield (0, postsRepo_1.upsertPostTags)(post.id, tags);
});
const recordRoundPost = (roomID, roundId, postId, postOrder) => __awaiter(void 0, void 0, void 0, function* () {
    const roundPostId = yield (0, roundPostsRepo_1.insertRoundPost)(roundId, postId, postOrder);
    if (!roundPostId)
        return null;
    const active = store_1.activeGames.get(roomID);
    if (active) {
        active.currentRoundPostId = roundPostId;
        active.nextPostOrder += 1;
        store_1.activeGames.set(roomID, active);
    }
    return roundPostId;
});
const recordGuess = (roomID, userID, tag) => __awaiter(void 0, void 0, void 0, function* () {
    const active = store_1.activeGames.get(roomID);
    if (!(active === null || active === void 0 ? void 0 : active.currentRoundPostId))
        return;
    yield (0, guessesRepo_1.insertGuess)(active.currentRoundPostId, userID, tag);
});
exports.recordGuess = recordGuess;
const recordLeaderboardSnapshot = (room) => __awaiter(void 0, void 0, void 0, function* () {
    const active = store_1.activeGames.get(room.id);
    if (!active)
        return;
    const snapshot = room.members.reduce((acc, member) => {
        acc[member.id] = member.score;
        return acc;
    }, {});
    yield (0, leaderboardRepo_1.insertLeaderboardSnapshot)(active.gameId, active.roundId, snapshot);
});
const handleRoulettePost = (room) => __awaiter(void 0, void 0, void 0, function* () {
    if (room.postQueue.length === 0) {
        room.postQueue = yield (0, e621Client_1.getPosts)(room.blacklist, room.preferlist);
    }
    const postToSend = room.postQueue.shift();
    if (!postToSend) {
        console.error('No posts available to send (Roulette).');
        return { kind: 'no_post' };
    }
    yield (0, gameService_1.ensureActiveGame)(room);
    yield recordPostAndTags(postToSend);
    const activeGame = store_1.activeGames.get(room.id);
    let roundPostId = null;
    if (activeGame) {
        roundPostId = yield recordRoundPost(room.id, activeGame.roundId, postToSend.id, activeGame.nextPostOrder);
    }
    const preferlistAllTimeTags = new Set(room.preferlist.filter(e => e.frequency === 'all').map(e => e.tag));
    const tags = Array.isArray(postToSend.tags) ? postToSend.tags : [];
    const postToSendWithPreferlist = preferlistAllTimeTags.size > 0 ? Object.assign(Object.assign({}, postToSend), { tags: tags.map(tag => preferlistAllTimeTags.has(tag.name) ? Object.assign(Object.assign({}, tag), { score: 0 }) : tag) }) : Object.assign(Object.assign({}, postToSend), { tags });
    if (activeGame) {
        activeGame.currentPost = postToSendWithPreferlist;
        activeGame.currentRoundGuesses = new Map();
        store_1.activeGames.set(room.id, activeGame);
    }
    room.postsViewedThisRound += 1;
    yield (0, roomsRepo_1.upsertRoom)(room);
    const botActionSequence = roundPostId
        ? yield (0, botSequenceService_1.generateBotActionSequence)(room, roundPostId, postToSendWithPreferlist.tags)
        : null;
    // Initialize or reset roulette state for the new post
    if (!store_2.rouletteGames.has(room.id)) {
        (0, rouletteService_1.initRouletteGame)(room.id);
    }
    else {
        (0, rouletteService_1.handleNewPost)(room.id);
    }
    (0, rouletteService_1.startTurn)(room.id);
    return { kind: 'send_post', post: postToSendWithPreferlist, botActionSequence };
});
const handleRequestPost = (roomID, userID) => __awaiter(void 0, void 0, void 0, function* () {
    const roomToSendPost = store_1.rooms.get(roomID);
    if (!roomToSendPost)
        return { kind: 'no_room' };
    // Roulette mode: skip ready-check and round progression
    if (roomToSendPost.gameMode === 'Roulette') {
        if (!roomToSendPost.gameStarted) {
            roomToSendPost.gameStarted = true;
            yield (0, roomsRepo_1.upsertRoom)(roomToSendPost);
        }
        return yield handleRoulettePost(roomToSendPost);
    }
    roomToSendPost.allUsersReady.set(userID, true);
    yield (0, roomReadyStateRepo_1.upsertRoomReadyStates)(roomToSendPost);
    if (!roomToSendPost.gameStarted) {
        roomToSendPost.gameStarted = true;
        yield (0, roomsRepo_1.upsertRoom)(roomToSendPost);
    }
    if (roomToSendPost.postQueue.length === 0) {
        roomToSendPost.postQueue = yield (0, e621Client_1.getPosts)(roomToSendPost.blacklist, roomToSendPost.preferlist);
    }
    if (!(0, roomUtils_1.roomIsReadyForNewPost)(roomToSendPost)) {
        return { kind: 'wait' };
    }
    if (roomToSendPost.postsViewedThisRound >= roomToSendPost.postsPerRound) {
        yield recordLeaderboardSnapshot(roomToSendPost);
        roomToSendPost.curRound += 1;
        roomToSendPost.postsViewedThisRound = 0;
        if (roomToSendPost.curRound >= roomToSendPost.roundsPerGame) {
            yield (0, gameService_1.endGame)(roomToSendPost.id);
            return { kind: 'end_game' };
        }
        const activeGame = yield (0, gameService_1.ensureActiveGame)(roomToSendPost);
        if (activeGame) {
            yield (0, gameService_1.startNextRound)(roomToSendPost.id, activeGame.gameId, roomToSendPost.curRound);
        }
        yield (0, roomsRepo_1.upsertRoom)(roomToSendPost);
        const active = store_1.activeGames.get(roomToSendPost.id);
        if (active) {
            active.currentPost = undefined;
            active.currentRoundGuesses = new Map();
            store_1.activeGames.set(roomToSendPost.id, active);
        }
        return { kind: 'show_leaderboard' };
    }
    const postToSend = roomToSendPost.postQueue.shift();
    if (!postToSend) {
        console.error('No posts available to send.');
        return { kind: 'no_post' };
    }
    yield (0, gameService_1.ensureActiveGame)(roomToSendPost, userID);
    yield recordPostAndTags(postToSend);
    const activeGame = store_1.activeGames.get(roomToSendPost.id);
    let roundPostId = null;
    if (activeGame) {
        roundPostId = yield recordRoundPost(roomToSendPost.id, activeGame.roundId, postToSend.id, activeGame.nextPostOrder);
    }
    const preferlistAllTimeTags = new Set(roomToSendPost.preferlist.filter(entry => entry.frequency === 'all').map(entry => entry.tag));
    const tags = Array.isArray(postToSend.tags) ? postToSend.tags : [];
    const postToSendWithPreferlist = preferlistAllTimeTags.size > 0 ? Object.assign(Object.assign({}, postToSend), { tags: tags.map(tag => preferlistAllTimeTags.has(tag.name) ? Object.assign(Object.assign({}, tag), { score: 0 }) : tag) }) : Object.assign(Object.assign({}, postToSend), { tags });
    if (activeGame) {
        activeGame.currentPost = postToSendWithPreferlist;
        activeGame.currentRoundGuesses = new Map();
        store_1.activeGames.set(roomToSendPost.id, activeGame);
    }
    roomToSendPost.postsViewedThisRound += 1;
    yield (0, roomsRepo_1.upsertRoom)(roomToSendPost);
    const newReadyMap = new Map();
    roomToSendPost.allUsersReady.forEach((_v, k) => {
        const member = roomToSendPost.members.find(user => user.id === k);
        newReadyMap.set(k, (member === null || member === void 0 ? void 0 : member.isBot) ? true : false);
    });
    roomToSendPost.allUsersReady = newReadyMap;
    yield (0, roomReadyStateRepo_1.upsertRoomReadyStates)(roomToSendPost);
    const botActionSequence = roundPostId
        ? yield (0, botSequenceService_1.generateBotActionSequence)(roomToSendPost, roundPostId, postToSendWithPreferlist.tags)
        : null;
    return { kind: 'send_post', post: postToSendWithPreferlist, botActionSequence };
});
exports.handleRequestPost = handleRequestPost;
//# sourceMappingURL=postService.js.map