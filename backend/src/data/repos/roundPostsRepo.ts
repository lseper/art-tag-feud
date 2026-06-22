import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';

const insertRoundPost = async (roundId: string, postId: number, postOrder: number) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('round_posts')
        .insert({
            round_id: roundId,
            post_id: postId,
            post_order: postOrder,
        })
        .select('id')
        .single();
    logSupabaseError('insert round post', error);
    return data?.id ?? null;
};

export { insertRoundPost };
