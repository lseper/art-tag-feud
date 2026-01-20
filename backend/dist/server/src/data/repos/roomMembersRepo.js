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
exports.removeRoomMember = exports.upsertRoomMember = void 0;
const supabaseClient_1 = require("../supabaseClient");
const supabaseUtils_1 = require("../supabaseUtils");
const upsertRoomMember = (roomID, user) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!supabaseClient_1.supabase)
        return;
    const { error } = yield supabaseClient_1.supabase
        .from('room_members')
        .upsert({
        room_id: roomID,
        player_id: user.id,
        score: user.score,
        icon: (_a = user.icon) !== null && _a !== void 0 ? _a : null,
        left_at: null,
    }, { onConflict: 'room_id,player_id' });
    (0, supabaseUtils_1.logSupabaseError)('upsert room member', error);
});
exports.upsertRoomMember = upsertRoomMember;
const removeRoomMember = (roomID, userID) => __awaiter(void 0, void 0, void 0, function* () {
    if (!supabaseClient_1.supabase)
        return;
    const { error } = yield supabaseClient_1.supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomID)
        .eq('player_id', userID);
    (0, supabaseUtils_1.logSupabaseError)('remove room member', error);
});
exports.removeRoomMember = removeRoomMember;
//# sourceMappingURL=roomMembersRepo.js.map