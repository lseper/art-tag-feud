import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';
import type { UserType } from '../../domain/contracts';

const upsertRoomMember = async (roomID: string, user: UserType) => {
    if (!supabase) return;
    const { error } = await supabase
        .from('room_members')
        .upsert({
            room_id: roomID,
            player_id: user.id,
            score: user.score,
            icon: user.icon ?? null,
            left_at: null,
        }, { onConflict: 'room_id,player_id' });
    logSupabaseError('upsert room member', error);
};

const removeRoomMember = async (roomID: string, userID: string) => {
    if (!supabase) return;
    const { error } = await supabase
        .from('room_members')
        .update({ left_at: new Date().toISOString(), icon: null })
        .eq('room_id', roomID)
        .eq('player_id', userID);
    logSupabaseError('remove room member', error);
};

const getRoomMember = async (roomID: string, userID: string) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('room_members')
        .select('score,left_at')
        .eq('room_id', roomID)
        .eq('player_id', userID)
        .maybeSingle();
    logSupabaseError('get room member', error);
    return data ?? null;
};

export { upsertRoomMember, removeRoomMember, getRoomMember };
