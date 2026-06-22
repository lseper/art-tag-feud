import config from '../components/config/constants';

export type BotModeBehavior = {
    botProfileId: string;
    gameMode: string;
    lobbyIconDelayMinMs: number;
    lobbyIconDelayMaxMs: number;
    lobbyReadyDelayMinMs: number;
    lobbyReadyDelayMaxMs: number;
    guessIntervalMinMs: number;
    guessIntervalMaxMs: number;
};

let cachedBehaviors: BotModeBehavior[] | null = null;

const fetchBotBehaviors = async () => {
    if (cachedBehaviors) return cachedBehaviors;
    const base = config.httpUrl;
    if (!base) return [];
    try {
        const response = await fetch(`${base}/bots/behaviors`);
        if (!response.ok) {
            return [];
        }
        const payload = await response.json();
        const behaviors: BotModeBehavior[] = (payload?.behaviors ?? []).map((row: any) => ({
            botProfileId: row.bot_profile_id,
            gameMode: row.game_mode,
            lobbyIconDelayMinMs: row.lobby_icon_delay_min_ms,
            lobbyIconDelayMaxMs: row.lobby_icon_delay_max_ms,
            lobbyReadyDelayMinMs: row.lobby_ready_delay_min_ms,
            lobbyReadyDelayMaxMs: row.lobby_ready_delay_max_ms,
            guessIntervalMinMs: row.guess_interval_min_ms,
            guessIntervalMaxMs: row.guess_interval_max_ms,
        }));
        cachedBehaviors = behaviors;
        return behaviors;
    } catch {
        return [];
    }
};

const getBehaviorFor = (behaviors: BotModeBehavior[], botProfileId: string | undefined, gameMode: string) => {
    if (botProfileId) {
        const match = behaviors.find(behavior => behavior.botProfileId === botProfileId && behavior.gameMode === gameMode);
        if (match) return match;
    }
    return behaviors.find(behavior => behavior.gameMode === gameMode) ?? null;
};

export { fetchBotBehaviors, getBehaviorFor };
