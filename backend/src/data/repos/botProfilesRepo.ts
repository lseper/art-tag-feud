import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';

const getBotProfileIdByName = async (name: string) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('bot_profiles')
        .select('id')
        .eq('name', name)
        .maybeSingle();
    logSupabaseError('get bot profile', error);
    return data?.id ?? null;
};

export { getBotProfileIdByName };
