import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';
import type { PostTagType } from '../../domain/contracts';

const insertGuess = async (roundPostId: string, userID: string, tag: PostTagType) => {
    if (!supabase) return;
    const { error } = await supabase
        .from('guesses')
        .insert({
            round_post_id: roundPostId,
            player_id: userID,
            guessed_tag: tag.name,
            tag_type: tag.type,
            score: tag.score,
        });
    logSupabaseError('insert guess', error);
};

export { insertGuess };
