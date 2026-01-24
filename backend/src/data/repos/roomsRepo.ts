import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';
import type { ServerRoomType } from '../../domain/contracts';

const upsertRoom = async (room: ServerRoomType) => {
    if (!supabase) return;
    const { error } = await supabase
        .from('rooms')
        .upsert({
            id: room.id,
            name: room.name,
            owner_player_id: room.owner.id,
            posts_per_round: room.postsPerRound,
            rounds_per_game: room.roundsPerGame,
            bot_count: room.botCount,
            bot_difficulties: room.botDifficulties,
            cur_round: room.curRound,
            posts_viewed_this_round: room.postsViewedThisRound,
            game_started: room.gameStarted,
            is_private: room.isPrivate,
            room_code: room.roomCode,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
    logSupabaseError('upsert room', error);
};

const deleteRoom = async (roomID: string) => {
    if (!supabase) return;
    const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomID);
    logSupabaseError('delete room', error);
};

export { upsertRoom, deleteRoom };
