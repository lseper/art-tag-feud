import { supabase } from '../supabaseClient';
import { logSupabaseError } from '../supabaseUtils';

const insertBotActionSequence = async (
    roundPostId: string,
    botProfileId: string | null,
    gameMode: string,
    actionSequence: Record<string, unknown>,
) => {
    if (!supabase) return;
    const { error } = await supabase
        .from('bot_action_sequences')
        .insert({
            round_post_id: roundPostId,
            bot_profile_id: botProfileId,
            game_mode: gameMode,
            action_sequence: actionSequence,
        });
    logSupabaseError('insert bot action sequence', error);
};

export { insertBotActionSequence };
