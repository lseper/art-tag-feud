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
exports.insertRoundPost = void 0;
const supabaseClient_1 = require("../supabaseClient");
const supabaseUtils_1 = require("../supabaseUtils");
const insertRoundPost = (roundId, postId, postOrder) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!supabaseClient_1.supabase)
        return null;
    const { data, error } = yield supabaseClient_1.supabase
        .from('round_posts')
        .insert({
        round_id: roundId,
        post_id: postId,
        post_order: postOrder,
    })
        .select('id')
        .single();
    (0, supabaseUtils_1.logSupabaseError)('insert round post', error);
    return (_a = data === null || data === void 0 ? void 0 : data.id) !== null && _a !== void 0 ? _a : null;
});
exports.insertRoundPost = insertRoundPost;
//# sourceMappingURL=roundPostsRepo.js.map