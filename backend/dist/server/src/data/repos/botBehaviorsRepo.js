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
exports.getBotModeBehaviors = void 0;
const supabaseClient_1 = require("../supabaseClient");
const supabaseUtils_1 = require("../supabaseUtils");
const getBotModeBehaviors = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!supabaseClient_1.supabase)
        return [];
    const { data, error } = yield supabaseClient_1.supabase
        .from('bot_mode_behaviors')
        .select(`
            bot_profile_id,
            game_mode,
            lobby_icon_delay_min_ms,
            lobby_icon_delay_max_ms,
            lobby_ready_delay_min_ms,
            lobby_ready_delay_max_ms,
            guess_interval_min_ms,
            guess_interval_max_ms
        `);
    (0, supabaseUtils_1.logSupabaseError)('get bot mode behaviors', error);
    return (data !== null && data !== void 0 ? data : []);
});
exports.getBotModeBehaviors = getBotModeBehaviors;
//# sourceMappingURL=botBehaviorsRepo.js.map