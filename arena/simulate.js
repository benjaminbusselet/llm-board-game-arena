// Équilibrage des règles : tous les bots s'affrontent, sans aucun appel à un LLM.
// Usage : npm run arena:simulate [-- combats_par_duel]
import { createFight, playRound } from './boxing.js';
import { BOTS } from './bots.js';
import { createRng } from './rng.js';

const fightsPerDuel = Number(process.argv[2] ?? 200);
const names = Object.keys(BOTS);

function fight(a, b, seed) {
    const rng = createRng(seed);
    let state = createFight();
    while (!state.over) state = playRound(state, [BOTS[a](state, 0, rng), BOTS[b](state, 1, rng)]);
    return state;
}

const wins = Object.fromEntries(names.map(n => [n, 0]));
const played = Object.fromEntries(names.map(n => [n, 0]));
const methods = {};
const table = {};
let rounds = 0;
let total = 0;

for (const a of names) {
    table[a] = {};
    for (const b of names) {
        if (a === b) continue;
        let won = 0;
        for (let seed = 1; seed <= fightsPerDuel; seed++) {
            const state = fight(a, b, seed);
            if (state.winner === 0) won++;
            if (state.winner !== null) wins[state.winner === 0 ? a : b]++;
            played[a]++;
            played[b]++;
            methods[state.method] = (methods[state.method] ?? 0) + 1;
            rounds += state.rounds.length;
            total++;
        }
        table[a][b] = Math.round((100 * won) / fightsPerDuel);
    }
}

console.log(`Victoires de la ligne contre la colonne, en % (${fightsPerDuel} combats par duel)`);
console.table(table);
console.log('Part de victoires par bot, tous adversaires confondus :');
for (const n of [...names].sort((x, y) => wins[y] / played[y] - wins[x] / played[x])) {
    console.log(`  ${n.padEnd(13)} ${Math.round((100 * wins[n]) / played[n])} %`);
}
console.log('Fins de combat :', Object.entries(methods).map(([m, c]) => `${m} ${Math.round((100 * c) / total)} %`).join(', '));
console.log(`Durée moyenne : ${(rounds / total).toFixed(1)} rounds`);
