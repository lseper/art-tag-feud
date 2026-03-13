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
exports.insertBotActionSequence = void 0;
const supabaseClient_1 = require("../supabaseClient");
const supabaseUtils_1 = require("../supabaseUtils");
const insertBotActionSequence = (roundPostId, botProfileId, gameMode, actionSequence) => __awaiter(void 0, void 0, void 0, function* () {
    if (!supabaseClient_1.supabase)
        return;
    const { error } = yield supabaseClient_1.supabase
        .from('bot_action_sequences')
        .insert({
        round_post_id: roundPostId,
        bot_profile_id: botProfileId,
        game_mode: gameMode,
        action_sequence: actionSequence,
    });
    (0, supabaseUtils_1.logSupabaseError)('insert bot action sequence', error);
});
exports.insertBotActionSequence = insertBotActionSequence;
//# sourceMappingURL=botSequencesRepo.js.map