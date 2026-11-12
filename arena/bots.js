// Boxeurs sans LLM : ils servent à équilibrer les règles par simulation, et de plancher de comparaison.
// Un bot reçoit l'état du combat, son numéro (0 ou 1) et un générateur aléatoire, et rend une séquence d'actions.
import { ACTIONS, RULES } from './boxing.js';
import { pick } from './rng.js';

const repeat = action => () => Array(RULES.exchanges).fill(action);

// Réponse qui bat chaque action.
const COUNTER = { jab: 'garde', crochet: 'esquive', uppercut: 'jab', garde: 'uppercut', esquive: 'jab', recuperation: 'uppercut' };

// Action la plus jouée par l'adversaire au round précédent.
function favorite(state, me) {
    const last = state.rounds.at(-1);
    if (!last) return null;
    const counts = {};
    for (const action of last.sequences[1 - me]) counts[action] = (counts[action] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export const BOTS = {
    hasard: (state, me, rng) => Array.from({ length: RULES.exchanges }, () => pick(rng, ACTIONS)),
    jab: repeat('jab'),
    crochet: repeat('crochet'),
    uppercut: repeat('uppercut'),
    garde: repeat('garde'),
    esquive: repeat('esquive'),
    // Enchaînement fixe, sans regarder l'adversaire.
    routine: () => ['jab', 'crochet', 'garde', 'uppercut'],
    // Contre l'action préférée de l'adversaire au round précédent, et souffle quand l'endurance manque.
    contreur: (state, me, rng) => {
        const target = favorite(state, me);
        const answer = target ? COUNTER[target] : 'jab';
        const sequence = [answer, answer, pick(rng, ['jab', 'crochet', 'garde']), answer];
        if (state.boxers[me].stamina < 30) sequence[3] = 'recuperation';
        return sequence;
    },
    // Varie ses coups et gère son endurance, sans lire l'adversaire.
    gestionnaire: (state, me, rng) => {
        const tired = state.boxers[me].stamina < 40;
        return Array.from({ length: RULES.exchanges }, (_, i) =>
            tired && i % 2 === 0 ? 'recuperation' : pick(rng, ['jab', 'jab', 'crochet', 'uppercut', 'garde', 'esquive']));
    },
};
