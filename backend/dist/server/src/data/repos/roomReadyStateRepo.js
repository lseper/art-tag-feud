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
exports.upsertRoomReadyStates = void 0;
const supabaseClient_1 = require("../supabaseClient");
const supabaseUtils_1 = require("../supabaseUtils");
const upsertRoomReadyStates = (room) => __awaiter(void 0, void 0, void 0, function* () {
    if (!supabaseClient_1.supabase)
        return;
    const payload = [...room.allUsersReady.entries()].map(([playerID, ready]) => ({
        room_id: room.id,
        player_id: playerID,
        ready,
        updated_at: new Date().toISOString(),
    }));
    if (payload.length === 0)
        return;
    const { error } = yield supabaseClient_1.supabase
        .from('room_ready_state')
        .upsert(payload, { onConflict: 'room_id,player_id' });
    (0, supabaseUtils_1.logSupabaseError)('upsert room ready state', error);
});
exports.upsertRoomReadyStates = upsertRoomReadyStates;
//# sourceMappingURL=roomReadyStateRepo.js.map