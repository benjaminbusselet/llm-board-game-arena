// Moteur du combat de boxe : fonctions pures, sans hasard, sans appel réseau.
// Toutes les valeurs chiffrées sont dans RULES : c'est la seule source, le prompt et le règlement s'en servent.

export const ACTIONS = ['jab', 'crochet', 'uppercut', 'garde', 'esquive', 'recuperation'];

export const RULES = {
    rounds: 6,
    exchanges: 4, // Actions par round.
    health: 110,
    stamina: 100,
    damage: { jab: 5, crochet: 11, uppercut: 18 },
    speed: { jab: 3, crochet: 2, uppercut: 1 }, // Coup contre coup : le plus rapide réduit le plus lent.
    slower: [1, 0.75, 0.25], // Part des dégâts gardée par un coup en retard de 0, 1 ou 2 crans de vitesse.
    cost: { jab: 8, crochet: 14, uppercut: 20, garde: 4, esquive: 8, recuperation: 0 },
    recovery: 20, // Endurance rendue par une récupération.
    roundRecovery: 8, // Endurance rendue à chacun entre deux rounds.
    tired: 0.25, // Part des dégâts d'un coup lancé sans l'endurance nécessaire.
    vulnerable: 1.5, // Dégâts multipliés contre un boxeur qui récupère.
    guard: { jab: 0, crochet: 0.5, uppercut: 1 }, // Part des dégâts qui traverse la garde.
    guardCounter: { jab: 4 }, // Dégâts renvoyés par la garde à l'attaquant.
    dodge: { jab: 1, crochet: 0, uppercut: 0 }, // Part des dégâts qui touche malgré l'esquive.
    dodgeCounter: { crochet: 4, uppercut: 8 }, // Dégâts du contre après une esquive réussie.
};

export function createFight() {
    const boxer = () => ({ health: RULES.health, stamina: RULES.stamina });
    return { boxers: [boxer(), boxer()], rounds: [], over: false, winner: null, method: null };
}

export function isValidSequence(sequence) {
    return Array.isArray(sequence) && sequence.length === RULES.exchanges && sequence.every(a => ACTIONS.includes(a));
}

// Dégâts infligés par un coup, et dégâts du contre subi en retour, selon l'action adverse.
function strike(attack, defense, power) {
    if (!(attack in RULES.damage)) return { dealt: 0, countered: 0 };
    const base = RULES.damage[attack] * power;
    if (defense === 'recuperation') return { dealt: base * RULES.vulnerable, countered: 0 };
    if (defense === 'garde') return { dealt: base * RULES.guard[attack], countered: RULES.guardCounter[attack] ?? 0 };
    if (defense === 'esquive') return { dealt: base * RULES.dodge[attack], countered: RULES.dodgeCounter[attack] ?? 0 };
    const gap = Math.max(0, RULES.speed[defense] - RULES.speed[attack]);
    return { dealt: base * RULES.slower[gap], countered: 0 };
}

// Résout un échange : les deux actions sont jouées en même temps.
function resolveExchange(boxers, actions) {
    const power = boxers.map((b, i) => (b.stamina >= RULES.cost[actions[i]] ? 1 : RULES.tired));
    const strikes = [strike(actions[0], actions[1], power[0]), strike(actions[1], actions[0], power[1])];
    const damage = [0, 1].map(i => Math.round(strikes[1 - i].dealt + strikes[i].countered));
    const next = boxers.map((b, i) => {
        const spent = Math.max(0, b.stamina - RULES.cost[actions[i]]);
        const stamina = actions[i] === 'recuperation' ? Math.min(RULES.stamina, spent + RULES.recovery) : spent;
        return { health: Math.max(0, b.health - damage[i]), stamina };
    });
    return { boxers: next, damage };
}

// Joue un round complet à partir des deux séquences. Renvoie un nouvel état, l'ancien n'est pas modifié.
export function playRound(state, sequences) {
    if (state.over) throw new Error('Le combat est terminé');
    if (!sequences.every(isValidSequence)) throw new Error('Séquence invalide');

    let boxers = state.boxers;
    const exchanges = [];
    const taken = [0, 0];
    let knockout = false;
    for (let i = 0; i < RULES.exchanges && !knockout; i++) {
        const actions = [sequences[0][i], sequences[1][i]];
        const result = resolveExchange(boxers, actions);
        boxers = result.boxers;
        taken[0] += result.damage[0];
        taken[1] += result.damage[1];
        exchanges.push({ actions, damage: result.damage, health: boxers.map(b => b.health), stamina: boxers.map(b => b.stamina) });
        knockout = boxers.some(b => b.health === 0);
    }

    // Les juges : celui qui a subi le moins de dégâts dans le round marque 10, l'autre 9.
    const scores = taken[0] === taken[1] ? [10, 10] : taken[0] < taken[1] ? [10, 9] : [9, 10];
    const rounds = [...state.rounds, { number: state.rounds.length + 1, sequences, exchanges, scores }];
    const next = { boxers, rounds, over: false, winner: null, method: null };

    if (knockout) {
        const [a, b] = boxers.map(x => x.health);
        return { ...next, over: true, winner: a === b ? null : a > b ? 0 : 1, method: a === b ? 'double KO' : 'KO' };
    }
    if (rounds.length === RULES.rounds) {
        const [a, b] = totals(next);
        return { ...next, over: true, winner: a === b ? null : a > b ? 0 : 1, method: a === b ? 'nul' : 'points' };
    }
    next.boxers = boxers.map(b => ({ ...b, stamina: Math.min(RULES.stamina, b.stamina + RULES.roundRecovery) }));
    return next;
}

// Total des points des juges pour chaque boxeur.
export function totals(state) {
    return [0, 1].map(i => state.rounds.reduce((sum, round) => sum + round.scores[i], 0));
}
