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
exports.handleGuessTag = void 0;
const store_1 = require("../state/store");
const roomMembersRepo_1 = require("../data/repos/roomMembersRepo");
const postService_1 = require("./postService");
const handleGuessTag = (roomID, userID, tag) => __awaiter(void 0, void 0, void 0, function* () {
    const room = store_1.rooms.get(roomID);
    const userToUpdateScore = store_1.users.get(userID);
    if (!room || !userToUpdateScore)
        return null;
    if (room.allUsersReady.get(userToUpdateScore.id)) {
        return null;
    }
    if (room.preferlist.some(entry => entry.tag === tag.name && entry.frequency === 'all')) {
        tag.score = 0;
    }
    userToUpdateScore.score += tag.score;
    yield (0, roomMembersRepo_1.upsertRoomMember)(room.id, userToUpdateScore);
    yield (0, postService_1.recordGuess)(room.id, userToUpdateScore.id, tag);
    return { room, user: userToUpdateScore, tag };
});
exports.handleGuessTag = handleGuessTag;
//# sourceMappingURL=guessService.js.map