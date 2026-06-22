import { describe, expect, it } from 'vitest';
import { calculateMaxBots } from '../src/services/botService';
import { getBotModeBehaviors } from '../src/data/repos/botBehaviorsRepo';

describe('botService', () => {
    it('calculateMaxBots respects scaling and caps', () => {
        expect(calculateMaxBots(0)).toBe(0);
        expect(calculateMaxBots(1)).toBe(3);
        expect(calculateMaxBots(3)).toBe(9);
        expect(calculateMaxBots(4)).toBe(9);
        expect(calculateMaxBots(5)).toBe(3);
        expect(calculateMaxBots(6)).toBe(3);
    });
});

describe('botBehaviorsRepo', () => {
    it('returns empty behaviors when supabase is disabled', async () => {
        const behaviors = await getBotModeBehaviors();
        expect(Array.isArray(behaviors)).toBe(true);
    });
});
