import { describe, expect, it } from 'vitest';
import { normalizeTag } from '../src/domain/tagUtils';

describe('normalizeTag', () => {
    it('lowercases, trims, and replaces spaces with underscores', () => {
        expect(normalizeTag('  Foo Bar  ')).toBe('foo_bar');
    });

    it('handles multiple spaces', () => {
        expect(normalizeTag('Many   Spaces')).toBe('many_spaces');
    });
});
