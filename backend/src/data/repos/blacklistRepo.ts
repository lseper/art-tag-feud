import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';

const updateBlacklist = async (roomID: string, tag: string, action: 'add' | 'remove') => {
    if (!supabase) return;
    if (action === 'add') {
        const { error } = await supabase
            .from('room_blacklist')
            .upsert({ room_id: roomID, tag }, { onConflict: 'room_id,tag' });
        logSupabaseError('upsert room blacklist', error);
    } else {
        const { error } = await supabase
            .from('room_blacklist')
            .delete()
            .eq('room_id', roomID)
            .eq('tag', tag);
        logSupabaseError('remove room blacklist', error);
    }
};

export { updateBlacklist };
