// Éliminatoires du tournoi, selon arena/REGLEMENT.md. État dans arena/tournoi.json, reprise automatique.
// Usage :
//   npm run arena:tournoi -- --seed <entier>   crée le tournoi et tire les barrages, sans jouer (publier la graine avant de jouer)
//   npm run arena:tournoi -- --limite <n>      joue au plus n combats, puis s'arrête (quotas des fournisseurs)
//   npm run arena:tournoi -- --resultats       affiche l'état des zones
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { pairUp, planBarrages, resolveMatch, rngFor } from './tournoi-logic.js';

const { values } = parseArgs({ options: { seed: { type: 'string' }, limite: { type: 'string' }, resultats: { type: 'boolean', default: false } } });
const STATE_FILE = new URL('./tournoi.json', import.meta.url);
const DAY_MS = 24 * 3600 * 1000;
const save = state => writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');

const newMatch = (state, zone, tour, [a, b]) => ({ id: `${zone}/${tour}/${a}~${b}`, zone, tour, a, b, combats: [], annules: {}, reporteLe: null, vainqueur: null, motif: null });
const matchesOf = (state, zone, tour) => state.matchs.filter(m => m.zone === zone && (!tour || m.tour === tour));

// Crée le tour suivant d'une zone quand le précédent est terminé.
function advance(state) {
    for (const zone of state.zones) {
        if (zone.termine) continue;
        const done = tour => matchesOf(state, zone.editeur, tour).every(m => m.vainqueur);
        if (!zone.barragesTires) {
            const plan = planBarrages(zone.candidats, zone.places, rngFor(state.seed, zone.editeur, 'barrages'));
            zone.barragesTires = true;
            zone.exemptes = plan.exempts;
            state.matchs.push(...plan.pairs.map(pair => newMatch(state, zone.editeur, 'barrage', pair)));
        }
        if (!zone.principalTire && done('barrage')) {
            const survivors = [...zone.exemptes, ...matchesOf(state, zone.editeur, 'barrage').map(m => m.vainqueur)];
            zone.principalTire = true;
            state.matchs.push(...pairUp(survivors, rngFor(state.seed, zone.editeur, 'principal')).map(pair => newMatch(state, zone.editeur, 'principal', pair)));
        }
        if (zone.principalTire && done('principal')) {
            zone.termine = true;
            zone.qualifies = matchesOf(state, zone.editeur, 'principal').map(m => m.vainqueur);
        }
    }
}

function init(seed) {
    if (!/^\d+$/.test(seed)) throw new Error('La graine est un entier positif.');
    const { zones } = JSON.parse(readFileSync(new URL('./participants.json', import.meta.url), 'utf8'));
    const state = {
        seed: Number(seed),
        creeLe: new Date().toISOString(),
        zones: zones.filter(z => z.modeles.length > z.places).map(z => ({ editeur: z.editeur, places: z.places, candidats: z.modeles })),
        matchs: [],
    };
    advance(state);
    save(state);
    console.log(`Tournoi créé avec la graine ${state.seed} : ${state.matchs.length} barrages tirés.`);
    console.log('Publier arena/tournoi.json (commit et push) avant de jouer, puis relancer sans --seed.');
}

// Joue un combat par un processus fight.js. Rend { ok: true, fight } ou { ok: false, kind: 'annule' | 'non-lance', model }.
function playFight(p1, p2) {
    const run = spawnSync(process.execPath, ['--env-file-if-exists=.env', 'arena/fight.js', '--p1', p1, '--p2', p2, '--quiet'], { encoding: 'utf8' });
    if (run.status !== 0) {
        const text = run.stderr ?? '';
        const refused = text.match(/un modèle ne répond pas : (\S+) : /);
        const cancelled = text.match(/panne côté (\S+) :/);
        return { ok: false, kind: refused ? 'non-lance' : 'annule', model: (refused ?? cancelled)?.[1] ?? null, detail: text.slice(0, 300) };
    }
    const file = run.stdout.match(/Journal : (.+)/)[1];
    const events = readFileSync(file, 'utf8').trim().split('\n').map(line => JSON.parse(line));
    const end = events.find(e => e.event === 'end');
    const rounds = events.filter(e => e.event === 'round');
    const ids = [p1, p2];
    const byId = list => Object.fromEntries(ids.map((id, i) => [id, list[i]]));
    return {
        ok: true,
        fight: {
            journal: file,
            winner: end.winner,
            methode: end.method,
            points: byId(end.points),
            health: byId(end.health),
            faults: byId(ids.map((_, i) => rounds.filter(r => r.choices[i].fault).length)),
        },
    };
}

function forfeit(match, loser, motif) {
    match.vainqueur = loser === match.a ? match.b : match.a;
    match.motif = `forfait de ${loser} (${motif})`;
}

// Joue le prochain combat d'un match. Rend true si un combat a eu lieu, false si le match est reporté ou terminé.
function playNext(state, match) {
    if (match.reporteLe && Date.now() < Date.parse(match.reporteLe)) return false;
    const swap = match.combats.length % 2 === 1; // Les boxeurs alternent l'ordre d'appel, sans effet sur le jeu.
    const [p1, p2] = swap ? [match.b, match.a] : [match.a, match.b];
    console.log(`Combat ${match.combats.length + 1} : ${match.a} contre ${match.b}`);
    const result = playFight(p1, p2);

    if (result.ok) {
        match.combats.push(result.fight);
        match.reporteLe = null;
        console.log(`  Résultat : ${result.fight.winner ?? 'nul'} (${result.fight.methode})`);
    } else if (result.kind === 'non-lance') {
        // §9 : report de 24 heures, une seule fois, puis forfait.
        if (match.reportOK) forfeit(match, result.model, 'ne répond pas au test d’avant-match');
        else { match.reportOK = true; match.reporteLe = new Date(Date.now() + DAY_MS).toISOString(); }
        console.log(`  Non lancé (${result.model}) : ${match.vainqueur ? match.motif : 'match reporté de 24 h'}`);
    } else {
        // §9 : combat annulé et rejoué ; deux annulations du même modèle = forfait.
        console.log(`  Annulé, panne côté ${result.model} : ${result.detail}`);
        if (result.model) {
            match.annules[result.model] = (match.annules[result.model] ?? 0) + 1;
            if (match.annules[result.model] >= 2) forfeit(match, result.model, 'deux combats annulés');
        }
    }

    if (!match.vainqueur) {
        const decision = resolveMatch(match, rngFor(state.seed, match.id, 'tirage'));
        if (decision.done) { match.vainqueur = decision.winner; match.motif = decision.motif; }
    }
    if (match.vainqueur) console.log(`  Match gagné par ${match.vainqueur} (${match.motif})`);
    save(state);
    return result.ok;
}

function report(state) {
    for (const zone of state.zones) {
        console.log(`\n${zone.editeur} : ${zone.places} places, ${zone.candidats.length} candidats${zone.termine ? ', terminé' : ''}`);
        for (const m of matchesOf(state, zone.editeur)) {
            const score = m.vainqueur ? `→ ${m.vainqueur} (${m.motif})` : `${m.combats.length} combat(s) joué(s)${m.reporteLe ? `, reporté au ${m.reporteLe}` : ''}`;
            console.log(`  ${m.tour.padEnd(9)} ${m.a} / ${m.b} ${score}`);
        }
        if (zone.termine) console.log(`  Qualifiés : ${zone.qualifies.join(', ')}`);
    }
}

if (values.seed !== undefined) {
    if (existsSync(STATE_FILE)) throw new Error('arena/tournoi.json existe déjà : la graine ne change plus.');
    init(values.seed);
    process.exit(0);
}
if (!existsSync(STATE_FILE)) throw new Error('Aucun tournoi. Créer avec --seed <entier>.');
const state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
if (values.resultats) { report(state); process.exit(0); }

let remaining = values.limite === undefined ? Infinity : Number(values.limite);
for (let progress = true; progress && remaining > 0;) {
    progress = false;
    advance(state);
    save(state);
    for (const match of state.matchs.filter(m => !m.vainqueur)) {
        if (remaining <= 0) break;
        if (playNext(state, match)) { remaining--; progress = true; }
        else if (match.vainqueur || !match.reporteLe) progress = true; // Forfait ou annulation : le tour suivant peut s'ouvrir.
    }
}
report(state);
console.log(`\nFichier : ${fileURLToPath(STATE_FILE)}`);
