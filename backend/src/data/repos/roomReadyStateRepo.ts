import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';
import type { ServerRoomType } from '../../domain/contracts';

const upsertRoomReadyStates = async (room: ServerRoomType) => {
    if (!supabase) return;
    const payload = [...room.allUsersReady.entries()].map(([playerID, ready]) => ({
        room_id: room.id,
        player_id: playerID,
        ready,
        updated_at: new Date().toISOString(),
    }));
    if (payload.length === 0) return;
    const { error } = await supabase
        .from('room_ready_state')
        .upsert(payload, { onConflict: 'room_id,player_id' });
    logSupabaseError('upsert room ready state', error);
};

export { upsertRoomReadyStates };
