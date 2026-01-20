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
exports.updatePreferlist = void 0;
const supabaseClient_1 = require("../supabaseClient");
const supabaseUtils_1 = require("../supabaseUtils");
const updatePreferlist = (roomID, tag, action, frequency) => __awaiter(void 0, void 0, void 0, function* () {
    if (!supabaseClient_1.supabase)
        return;
    if (action === 'add') {
        const { error } = yield supabaseClient_1.supabase
            .from('room_preferlist')
            .upsert({ room_id: roomID, tag, frequency: frequency !== null && frequency !== void 0 ? frequency : 'most' }, { onConflict: 'room_id,tag' });
        (0, supabaseUtils_1.logSupabaseError)('upsert room preferlist', error);
    }
    else if (action === 'set_frequency') {
        const { error } = yield supabaseClient_1.supabase
            .from('room_preferlist')
            .update({ frequency })
            .eq('room_id', roomID)
            .eq('tag', tag);
        (0, supabaseUtils_1.logSupabaseError)('update room preferlist frequency', error);
    }
    else {
        const { error } = yield supabaseClient_1.supabase
            .from('room_preferlist')
            .delete()
            .eq('room_id', roomID)
            .eq('tag', tag);
        (0, supabaseUtils_1.logSupabaseError)('remove room preferlist', error);
    }
});
exports.updatePreferlist = updatePreferlist;
//# sourceMappingURL=preferlistRepo.js.map