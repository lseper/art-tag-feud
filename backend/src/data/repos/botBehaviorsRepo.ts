import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';

type BotModeBehaviorRow = {
    bot_profile_id: string;
    game_mode: string;
    lobby_icon_delay_min_ms: number;
    lobby_icon_delay_max_ms: number;
    lobby_ready_delay_min_ms: number;
    lobby_ready_delay_max_ms: number;
    guess_interval_min_ms: number;
    guess_interval_max_ms: number;
};

const getBotModeBehaviors = async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('bot_mode_behaviors')
        .select(`
            bot_profile_id,
            game_mode,
            lobby_icon_delay_min_ms,
            lobby_icon_delay_max_ms,
            lobby_ready_delay_min_ms,
            lobby_ready_delay_max_ms,
            guess_interval_min_ms,
            guess_interval_max_ms
        `);
    logSupabaseError('get bot mode behaviors', error);
    return (data ?? []) as BotModeBehaviorRow[];
};

export type { BotModeBehaviorRow };
export { getBotModeBehaviors };
