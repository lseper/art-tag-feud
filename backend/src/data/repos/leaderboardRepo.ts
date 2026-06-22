import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';

const insertLeaderboardSnapshot = async (gameId: string, roundId: string, snapshot: Record<string, number>) => {
    if (!supabase) return;
    const { error } = await supabase
        .from('leaderboard_snapshots')
        .insert({
            game_id: gameId,
            round_id: roundId,
            snapshot,
        });
    logSupabaseError('insert leaderboard snapshot', error);
};

export { insertLeaderboardSnapshot };
