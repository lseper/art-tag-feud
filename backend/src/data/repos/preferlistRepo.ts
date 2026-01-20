import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';

const updatePreferlist = async (roomID: string, tag: string, action: 'add' | 'remove' | 'set_frequency', frequency?: string) => {
    if (!supabase) return;
    if (action === 'add') {
        const { error } = await supabase
            .from('room_preferlist')
            .upsert({ room_id: roomID, tag, frequency: frequency ?? 'most' }, { onConflict: 'room_id,tag' });
        logSupabaseError('upsert room preferlist', error);
    } else if (action === 'set_frequency') {
        const { error } = await supabase
            .from('room_preferlist')
            .update({ frequency })
            .eq('room_id', roomID)
            .eq('tag', tag);
        logSupabaseError('update room preferlist frequency', error);
    } else {
        const { error } = await supabase
            .from('room_preferlist')
            .delete()
            .eq('room_id', roomID)
            .eq('tag', tag);
        logSupabaseError('remove room preferlist', error);
    }
};

export { updatePreferlist };
