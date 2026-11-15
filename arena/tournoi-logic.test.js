import { describe, expect, it } from 'vitest';
import { createRng } from './rng.js';
import { hashSeed, pairUp, planBarrages, resolveMatch, rngFor } from './tournoi-logic.js';

const fight = (a, b, winner, { points = [10, 10], health = [10, 10], faults = [0, 0] } = {}) => ({
    winner,
    points: { [a]: points[0], [b]: points[1] },
    health: { [a]: health[0], [b]: health[1] },
    faults: { [a]: faults[0], [b]: faults[1] },
});
const match = combats => ({ a: 'A', b: 'B', combats });
const rng = createRng(1);

describe('barrages', () => {
    const names = n => Array.from({ length: n }, (_, i) => `m${i}`);
    it.each([
        [9, 3, 3, 3], // Cohere
        [7, 3, 1, 5], // Google
        [5, 2, 1, 3], // NVIDIA
        [2, 1, 0, 2], // Liquid
    ])('%i candidats, %i places : %i barrages, %i exemptés', (n, places, barrages, exempts) => {
        const plan = planBarrages(names(n), places, createRng(7));
        expect(plan.pairs).toHaveLength(barrages);
        expect(plan.exempts).toHaveLength(exempts);
        expect(new Set([...plan.pairs.flat(), ...plan.exempts]).size).toBe(n);
    });
    it('refuse une zone qui compte moins de 2 × places candidats', () => {
        expect(() => planBarrages(names(3), 2, createRng(1))).toThrow();
    });
    it('rejoue le même tirage avec la même graine', () => {
        const draw = seed => planBarrages(names(9), 3, rngFor(seed, 'Cohere', 'barrages'));
        expect(draw(42)).toEqual(draw(42));
        expect(draw(42)).not.toEqual(draw(43));
    });
    it('apparie tous les modèles', () => {
        expect(pairUp(names(6), createRng(3)).flat().sort()).toEqual(names(6).sort());
    });
    it('hashSeed est stable', () => {
        expect(hashSeed('a|b')).toBe(hashSeed('a|b'));
    });
});

describe('décision du match', () => {
    it('attend le deuxième combat', () => {
        expect(resolveMatch(match([fight('A', 'B', 'A')]), rng).done).toBe(false);
    });
    it('le plus de combats gagnés l’emporte', () => {
        expect(resolveMatch(match([fight('A', 'B', 'A'), fight('A', 'B', 'A')]), rng)).toMatchObject({ winner: 'A', motif: 'combats gagnés' });
        expect(resolveMatch(match([fight('A', 'B', 'B'), fight('A', 'B', null)]), rng)).toMatchObject({ winner: 'B' });
    });
    it('égalité 1-1 : points des juges', () => {
        const combats = [fight('A', 'B', 'A', { points: [58, 57] }), fight('A', 'B', 'B', { points: [55, 57] })];
        expect(resolveMatch(match(combats), rng)).toMatchObject({ winner: 'B', motif: 'points des juges' });
    });
    it('points égaux : différence de santé', () => {
        const combats = [fight('A', 'B', 'A', { health: [30, 10] }), fight('A', 'B', 'B', { health: [20, 25] })];
        expect(resolveMatch(match(combats), rng)).toMatchObject({ winner: 'A', motif: 'différence de santé' });
    });
    it('tout égal : combat supplémentaire, puis son vainqueur', () => {
        const combats = [fight('A', 'B', 'A'), fight('A', 'B', 'B')];
        expect(resolveMatch(match(combats), rng).done).toBe(false);
        expect(resolveMatch(match([...combats, fight('A', 'B', 'B')]), rng)).toMatchObject({ winner: 'B', motif: 'combats gagnés' });
    });
    it('supplémentaire nul : fautes, puis tirage au sort', () => {
        const base = [fight('A', 'B', 'A'), fight('A', 'B', 'B')];
        expect(resolveMatch(match([...base, fight('A', 'B', null, { faults: [2, 0] })]), rng)).toMatchObject({ winner: 'B', motif: 'moins de fautes' });
        expect(resolveMatch(match([...base, fight('A', 'B', null)]), () => 0.9)).toMatchObject({ winner: 'B', motif: 'tirage au sort' });
    });
});
