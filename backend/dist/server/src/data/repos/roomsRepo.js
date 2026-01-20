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
exports.deleteRoom = exports.upsertRoom = void 0;
const supabaseClient_1 = require("../supabaseClient");
const supabaseUtils_1 = require("../supabaseUtils");
const upsertRoom = (room) => __awaiter(void 0, void 0, void 0, function* () {
    if (!supabaseClient_1.supabase)
        return;
    const { error } = yield supabaseClient_1.supabase
        .from('rooms')
        .upsert({
        id: room.id,
        name: room.name,
        owner_player_id: room.owner.id,
        posts_per_round: room.postsPerRound,
        rounds_per_game: room.roundsPerGame,
        cur_round: room.curRound,
        posts_viewed_this_round: room.postsViewedThisRound,
        game_started: room.gameStarted,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    (0, supabaseUtils_1.logSupabaseError)('upsert room', error);
});
exports.upsertRoom = upsertRoom;
const deleteRoom = (roomID) => __awaiter(void 0, void 0, void 0, function* () {
    if (!supabaseClient_1.supabase)
        return;
    const { error } = yield supabaseClient_1.supabase
        .from('rooms')
        .delete()
        .eq('id', roomID);
    (0, supabaseUtils_1.logSupabaseError)('delete room', error);
});
exports.deleteRoom = deleteRoom;
//# sourceMappingURL=roomsRepo.js.map