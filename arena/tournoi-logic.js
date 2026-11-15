// Logique pure des éliminatoires (sans réseau ni fichier), selon arena/REGLEMENT.md §5, §6 et §8.
import { createRng } from './rng.js';

// Transforme un texte en graine numérique : un tirage par zone et par phase, indépendant de l'ordre des matchs.
export function hashSeed(text) {
    let h = 2166136261;
    for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return h >>> 0;
}

export const rngFor = (seed, ...parts) => createRng(hashSeed([seed, ...parts].join('|')));

export function shuffle(rng, array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const toPairs = list => Array.from({ length: list.length / 2 }, (_, i) => [list[2 * i], list[2 * i + 1]]);

// §6 : ramener la zone à 2 × places candidats par des barrages tirés au sort. Les autres sont exemptés.
export function planBarrages(candidates, places, rng) {
    const barrages = candidates.length - 2 * places;
    if (barrages < 0) throw new Error(`Zone impossible : ${candidates.length} candidats pour ${places} places`);
    const shuffled = shuffle(rng, candidates);
    return { pairs: toPairs(shuffled.slice(0, 2 * barrages)), exempts: shuffled.slice(2 * barrages) };
}

// Tour suivant : tirage au sort des modèles restants en paires.
export const pairUp = (models, rng) => toPairs(shuffle(rng, models));

const sum = (fights, key, id) => fights.reduce((total, f) => total + (f[key][id] ?? 0), 0);

// §5 : décide un match de 2 combats. Rend { done: false } tant qu'il manque un combat ou le combat supplémentaire.
// Un combat : { winner: id | null, points: { id: n }, health: { id: n }, faults: { id: n } }.
export function resolveMatch({ a, b, combats }, tiebreakRng) {
    if (combats.length < 2) return { done: false };
    const wins = id => combats.filter(f => f.winner === id).length;
    if (wins(a) !== wins(b)) return { done: true, winner: wins(a) > wins(b) ? a : b, motif: 'combats gagnés' };

    const firstTwo = combats.slice(0, 2);
    const points = [sum(firstTwo, 'points', a), sum(firstTwo, 'points', b)];
    if (points[0] !== points[1]) return { done: true, winner: points[0] > points[1] ? a : b, motif: 'points des juges' };

    const healthGap = [sum(firstTwo, 'health', a) - sum(firstTwo, 'health', b)];
    if (healthGap[0] !== 0) return { done: true, winner: healthGap[0] > 0 ? a : b, motif: 'différence de santé' };

    if (combats.length === 2) return { done: false }; // Combat supplémentaire à jouer.

    const faults = [sum(combats, 'faults', a), sum(combats, 'faults', b)];
    if (faults[0] !== faults[1]) return { done: true, winner: faults[0] < faults[1] ? a : b, motif: 'moins de fautes' };
    return { done: true, winner: tiebreakRng() < 0.5 ? a : b, motif: 'tirage au sort' };
}
