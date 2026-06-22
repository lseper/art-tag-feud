import type { BotActionSequenceType, GameModeType, PostTagType, ServerRoomType } from '../domain/contracts';
import { getBotModeBehaviors } from '../data/repos/botBehaviorsRepo';
import { insertBotActionSequence } from '../data/repos/botSequencesRepo';

const ROUND_DURATION_MS = 30000;
const READY_DELAY_MIN_MS = 24000;
const READY_DELAY_MAX_MS = 30000;

const randomBetween = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const pickBehavior = async (gameMode: GameModeType, botProfileId: string | null) => {
    const behaviors = await getBotModeBehaviors();
    if (botProfileId) {
        const match = behaviors.find(behavior => behavior.bot_profile_id === botProfileId && behavior.game_mode === gameMode);
        if (match) return match;
    }
    return behaviors.find(behavior => behavior.game_mode === gameMode) ?? null;
};

const generateBotActionSequence = async (
    room: ServerRoomType,
    roundPostId: string,
    tags: PostTagType[],
): Promise<BotActionSequenceType | null> => {
    if (room.botCount <= 0) {
        return null;
    }

    const bots = room.members.filter(member => member.isBot);
    if (bots.length === 0) {
        return null;
    }

    const sequence: BotActionSequenceType = {
        roundPostId,
        gameMode: room.gameMode,
        bots: await Promise.all(bots.map(async (bot) => {
            const behavior = await pickBehavior(room.gameMode, bot.botProfileId ?? null);
            if (!behavior) {
                return { botId: bot.id, actions: [] };
            }
            const availableTags = [...tags];
            const actions: BotActionSequenceType['bots'][number]['actions'] = [];
            let elapsed = randomBetween(behavior.guess_interval_min_ms, behavior.guess_interval_max_ms);
            while (elapsed <= ROUND_DURATION_MS && availableTags.length > 0) {
                const index = Math.floor(Math.random() * availableTags.length);
                const [tag] = availableTags.splice(index, 1);
                actions.push({
                    type: 'guess_tag',
                    delayMs: elapsed,
                    tag,
                });
                elapsed += randomBetween(behavior.guess_interval_min_ms, behavior.guess_interval_max_ms);
            }
            actions.push({
                type: 'ready_up',
                delayMs: randomBetween(READY_DELAY_MIN_MS, READY_DELAY_MAX_MS),
            });
            return { botId: bot.id, actions };
        })),
    };

    await insertBotActionSequence(roundPostId, null, room.gameMode, sequence as unknown as Record<string, unknown>);
    return sequence;
};

export { generateBotActionSequence };
