import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';
import type { UserType } from '../../domain/contracts';

const upsertPlayer = async (user: UserType) => {
    if (!supabase) return;
    const { error } = await supabase
        .from('players')
        .upsert({
            id: user.id,
            username: user.username,
            last_seen_at: new Date().toISOString(),
        }, { onConflict: 'id' });
    logSupabaseError('upsert player', error);
};

export { upsertPlayer };
