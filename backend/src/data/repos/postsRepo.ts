import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';
import type { PostTagType, PostType } from '../../domain/contracts';

const upsertPost = async (post: PostType) => {
    if (!supabase) return;
    const { error } = await supabase
        .from('posts')
        .upsert({
            id: post.id,
            url: post.url,
        }, { onConflict: 'id' });
    logSupabaseError('upsert post', error);
};

const upsertPostTags = async (postId: number, tags: PostTagType[]) => {
    if (!supabase || tags.length === 0) return;
    const tagRows = tags.map((tag) => ({
        post_id: postId,
        tag: tag.name,
        tag_type: tag.type,
        score: tag.score,
    }));
    const { error } = await supabase
        .from('post_tags')
        .upsert(tagRows, { onConflict: 'post_id,tag,tag_type' });
    logSupabaseError('upsert post tags', error);
};

export { upsertPost, upsertPostTags };
