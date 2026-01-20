import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';

const createRound = async (gameID: string, roundIndex: number) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('rounds')
        .insert({
            game_id: gameID,
            round_index: roundIndex,
        })
        .select('id')
        .single();
    logSupabaseError('create round', error);
    return data?.id ?? null;
};

export { createRound };
