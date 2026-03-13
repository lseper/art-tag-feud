"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBotActionSequence = void 0;
const botBehaviorsRepo_1 = require("../data/repos/botBehaviorsRepo");
const botSequencesRepo_1 = require("../data/repos/botSequencesRepo");
const ROUND_DURATION_MS = 30000;
const READY_DELAY_MIN_MS = 24000;
const READY_DELAY_MAX_MS = 30000;
const randomBetween = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
const pickBehavior = (gameMode, botProfileId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const behaviors = yield (0, botBehaviorsRepo_1.getBotModeBehaviors)();
    if (botProfileId) {
        const match = behaviors.find(behavior => behavior.bot_profile_id === botProfileId && behavior.game_mode === gameMode);
        if (match)
            return match;
    }
    return (_a = behaviors.find(behavior => behavior.game_mode === gameMode)) !== null && _a !== void 0 ? _a : null;
});
const generateBotActionSequence = (room, roundPostId, tags) => __awaiter(void 0, void 0, void 0, function* () {
    if (room.botCount <= 0) {
        return null;
    }
    const bots = room.members.filter(member => member.isBot);
    if (bots.length === 0) {
        return null;
    }
    const sequence = {
        roundPostId,
        gameMode: room.gameMode,
        bots: yield Promise.all(bots.map((bot) => __awaiter(void 0, void 0, void 0, function* () {
            var _b;
            const behavior = yield pickBehavior(room.gameMode, (_b = bot.botProfileId) !== null && _b !== void 0 ? _b : null);
            if (!behavior) {
                return { botId: bot.id, actions: [] };
            }
            const availableTags = [...tags];
            const actions = [];
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
        }))),
    };
    yield (0, botSequencesRepo_1.insertBotActionSequence)(roundPostId, null, room.gameMode, sequence);
    return sequence;
});
exports.generateBotActionSequence = generateBotActionSequence;
//# sourceMappingURL=botSequenceService.js.map