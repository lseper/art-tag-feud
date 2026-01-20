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
exports.upsertPostTags = exports.upsertPost = void 0;
const supabaseClient_1 = require("../supabaseClient");
const supabaseUtils_1 = require("../supabaseUtils");
const upsertPost = (post) => __awaiter(void 0, void 0, void 0, function* () {
    if (!supabaseClient_1.supabase)
        return;
    const { error } = yield supabaseClient_1.supabase
        .from('posts')
        .upsert({
        id: post.id,
        url: post.url,
    }, { onConflict: 'id' });
    (0, supabaseUtils_1.logSupabaseError)('upsert post', error);
});
exports.upsertPost = upsertPost;
const upsertPostTags = (postId, tags) => __awaiter(void 0, void 0, void 0, function* () {
    if (!supabaseClient_1.supabase || tags.length === 0)
        return;
    const tagRows = tags.map((tag) => ({
        post_id: postId,
        tag: tag.name,
        tag_type: tag.type,
        score: tag.score,
    }));
    const { error } = yield supabaseClient_1.supabase
        .from('post_tags')
        .upsert(tagRows, { onConflict: 'post_id,tag,tag_type' });
    (0, supabaseUtils_1.logSupabaseError)('upsert post tags', error);
});
exports.upsertPostTags = upsertPostTags;
//# sourceMappingURL=postsRepo.js.map