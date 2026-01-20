import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';

const createGame = async (roomID: string, createdByPlayerID: string | null, postsPerRound: number, roundsPerGame: number) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('games')
        .insert({
            room_id: roomID,
            created_by_player_id: createdByPlayerID,
            posts_per_round: postsPerRound,
            rounds_per_game: roundsPerGame,
        })
        .select('id')
        .single();
    logSupabaseError('create game', error);
    return data?.id ?? null;
};

const endGame = async (gameID: string) => {
    if (!supabase) return;
    const { error } = await supabase
        .from('games')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', gameID);
    logSupabaseError('end game', error);
};

export { createGame, endGame };
