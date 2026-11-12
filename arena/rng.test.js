import { describe, expect, it } from 'vitest';
import { createRng, pick } from './rng.js';

describe('générateur aléatoire des tirages au sort', () => {
    it('redonne la même suite pour la même graine', () => {
        const a = createRng(2026);
        const b = createRng(2026);
        expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    });

    it('donne une autre suite pour une autre graine', () => {
        expect(createRng(1)()).not.toBe(createRng(2)());
    });

    it('tire un élément du tableau', () => {
        const items = ['a', 'b', 'c'];
        expect(items).toContain(pick(createRng(7), items));
    });
});
