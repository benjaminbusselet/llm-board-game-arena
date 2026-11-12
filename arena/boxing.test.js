import { describe, expect, it } from 'vitest';
import { ACTIONS, createFight, isValidSequence, playRound, RULES, totals } from './boxing.js';
import { createRng, pick } from './rng.js';

const four = action => Array(RULES.exchanges).fill(action);
const randomSequence = rng => Array.from({ length: RULES.exchanges }, () => pick(rng, ACTIONS));

function playAll(sequencesByRound) {
    let state = createFight();
    for (const sequences of sequencesByRound) {
        if (state.over) break;
        state = playRound(state, sequences);
    }
    return state;
}

describe('séquences', () => {
    it('accepte 4 actions connues', () => {
        expect(isValidSequence(['jab', 'garde', 'esquive', 'uppercut'])).toBe(true);
    });

    it('refuse une séquence trop courte, une action inconnue ou autre chose qu’un tableau', () => {
        expect(isValidSequence(['jab', 'jab', 'jab'])).toBe(false);
        expect(isValidSequence(['jab', 'jab', 'jab', 'coup de pied'])).toBe(false);
        expect(isValidSequence('jab')).toBe(false);
    });

    it('refuse de jouer un round avec une séquence invalide', () => {
        expect(() => playRound(createFight(), [four('jab'), ['jab']])).toThrow();
    });
});

describe('résolution des échanges', () => {
    const firstExchange = (a, b) => playRound(createFight(), [[a, 'garde', 'garde', 'garde'], [b, 'garde', 'garde', 'garde']]).rounds[0].exchanges[0];

    it('la garde absorbe le jab et renvoie un contre', () => {
        expect(firstExchange('jab', 'garde').damage).toEqual([RULES.guardCounter.jab, 0]);
    });

    it('l’uppercut traverse la garde', () => {
        expect(firstExchange('uppercut', 'garde').damage).toEqual([0, RULES.damage.uppercut]);
    });

    it('l’esquive fait rater l’uppercut et place un contre', () => {
        expect(firstExchange('uppercut', 'esquive').damage).toEqual([RULES.dodgeCounter.uppercut, 0]);
    });

    it('le jab touche malgré l’esquive', () => {
        expect(firstExchange('jab', 'esquive').damage).toEqual([0, RULES.damage.jab]);
    });

    it('le jab, plus rapide, réduit l’uppercut', () => {
        expect(firstExchange('jab', 'uppercut').damage).toEqual([Math.round(RULES.damage.uppercut * RULES.slower[2]), RULES.damage.jab]);
    });

    it('un boxeur qui récupère encaisse davantage et regagne de l’endurance', () => {
        const exchange = firstExchange('crochet', 'recuperation');
        expect(exchange.damage).toEqual([0, Math.round(RULES.damage.crochet * RULES.vulnerable)]);
        expect(exchange.stamina[1]).toBe(RULES.stamina);
    });

    it('un coup lancé sans endurance perd sa force', () => {
        // 5 uppercuts vident l'endurance, le 6e part affaibli.
        let state = playRound(createFight(), [four('uppercut'), four('garde')]);
        state = playRound(state, [four('uppercut'), four('garde')]);
        const weak = state.rounds[1].exchanges.at(-1);
        expect(weak.damage[1]).toBe(Math.round(RULES.damage.uppercut * RULES.tired));
    });
});

describe('fin du combat', () => {
    it('s’arrête par KO dès que la santé tombe à zéro', () => {
        const state = playAll(Array(RULES.rounds).fill([four('uppercut'), four('recuperation')]));
        expect(state).toMatchObject({ over: true, winner: 0, method: 'KO' });
        expect(state.boxers[1].health).toBe(0);
        expect(state.rounds.length).toBeLessThan(RULES.rounds);
    });

    it('va aux points après le dernier round', () => {
        const state = playAll(Array(RULES.rounds).fill([['jab', 'garde', 'garde', 'garde'], four('esquive')]));
        expect(state).toMatchObject({ over: true, winner: 0, method: 'points' });
        expect(totals(state)).toEqual([10 * RULES.rounds, 9 * RULES.rounds]);
    });

    it('déclare un nul quand personne ne touche', () => {
        const state = playAll(Array(RULES.rounds).fill([four('garde'), four('garde')]));
        expect(state).toMatchObject({ over: true, winner: null, method: 'nul' });
    });

    it('refuse de jouer après la fin', () => {
        const state = playAll(Array(RULES.rounds).fill([four('garde'), four('garde')]));
        expect(() => playRound(state, [four('jab'), four('jab')])).toThrow();
    });
});

describe('équité', () => {
    it('ne modifie pas l’état reçu', () => {
        const state = createFight();
        const copy = structuredClone(state);
        playRound(state, [four('uppercut'), four('jab')]);
        expect(state).toEqual(copy);
    });

    it('donne le résultat inverse quand on échange les deux boxeurs', () => {
        const rng = createRng(2026);
        for (let fight = 0; fight < 200; fight++) {
            const rounds = Array.from({ length: RULES.rounds }, () => [randomSequence(rng), randomSequence(rng)]);
            const normal = playAll(rounds);
            const swapped = playAll(rounds.map(([a, b]) => [b, a]));
            expect(swapped.method).toBe(normal.method);
            expect(swapped.winner).toBe(normal.winner === null ? null : 1 - normal.winner);
            expect(swapped.boxers).toEqual([...normal.boxers].reverse());
        }
    });
});
