// Partie complète entre deux joueurs, avec un journal des coups en JSONL.
// Usage : npm run arena:play -- --p1 groq:<modèle> --p2 openrouter:<modèle> [--seed 42] [--max-plies 200]
import { mkdirSync, appendFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { applyAction, createGame } from '../src/engine/game.js';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createPlayer, MAX_ATTEMPTS, TEMPERATURE } from './players.js';
import { PROMPT_VERSION, renderBoard } from './prompt.js';

// Commit du code qui a joué la partie, suffixé si des fichiers suivis sont modifiés.
function gitCommit() {
    try {
        const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
        return git(['rev-parse', '--short', 'HEAD']) + (git(['status', '--porcelain', '--untracked-files=no']) ? '+modifs' : '');
    } catch {
        return null;
    }
}

const { values } = parseArgs({
    options: {
        p1: { type: 'string', default: 'random' },
        p2: { type: 'string', default: 'random' },
        seed: { type: 'string' },
        'max-plies': { type: 'string', default: '200' },
        quiet: { type: 'boolean', default: false },
    },
});

const seed = values.seed ? Number(values.seed) : Date.now();
const players = [createPlayer(values.p1), createPlayer(values.p2)].map((p, i) => ({ ...p, id: `${i === 0 ? 'A' : 'B'} ${p.id}` }));

// Test de disponibilité des deux modèles : en cas d'échec, aucune partie n'est créée.
try {
    await Promise.all(players.map(p => p.check()));
} catch (error) {
    console.error(`Partie non lancée, un modèle ne répond pas : ${error.message.slice(0, 200)}`);
    process.exit(1);
}

let state = createGame({ seed, names: players.map(p => p.id), maxPlies: Number(values['max-plies']) });

mkdirSync(new URL('./logs/', import.meta.url), { recursive: true });
const logFile = new URL(`./logs/${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`, import.meta.url);
const log = entry => appendFileSync(logFile, JSON.stringify(entry) + '\n');

log({ event: 'start', date: new Date().toISOString(), commit: gitCommit(), promptVersion: PROMPT_VERSION, params: { temperature: TEMPERATURE, maxAttempts: MAX_ATTEMPTS, maxPlies: state.config.maxPlies }, seed, players: players.map(p => p.id), board: state.grid, weapons: state.weapons, positions: state.players.map(({ x, y }) => ({ x, y })) });
if (!values.quiet) console.log(renderBoard(state) + '\n');

const stats = players.map(() => ({ moves: 0, latencyMs: 0, promptTokens: 0, completionTokens: 0, retries: 0, fallbacks: 0 }));

while (state.phase !== 'over') {
    const active = state.active;
    let result;
    try {
        result = await players[active].chooseAction(state);
    } catch (error) {
        log({ event: 'aborted', ply: state.ply + 1, player: active, reason: error.message });
        console.error(`\nPartie annulée au coup ${state.ply + 1} : ${error.message}`);
        process.exit(1);
    }
    const before = state.phase;
    state = applyAction(state, result.action);

    const s = stats[active];
    s.moves++;
    s.latencyMs += result.latencyMs;
    s.promptTokens += result.usage?.prompt_tokens ?? 0;
    s.completionTokens += result.usage?.completion_tokens ?? 0;
    s.retries += result.attempts - 1;
    s.fallbacks += result.fallback ? 1 : 0;

    log({ event: 'action', ply: state.ply, player: active, phase: before, ...result, hp: state.players.map(p => p.hp) });
    if (!values.quiet) {
        const flag = result.fallback ? ' (aléatoire après échecs)' : '';
        console.log(`#${state.ply} ${players[active].id} : ${JSON.stringify(result.action)}${flag} | PV ${state.players.map(p => p.hp).join(' / ')}`);
    }
}

const summary = {
    event: 'end',
    winner: state.winner === null ? null : players[state.winner].id,
    plies: state.ply,
    stats: players.map((p, i) => ({ player: p.id, ...stats[i], avgLatencyMs: Math.round(stats[i].latencyMs / Math.max(1, stats[i].moves)) })),
};
log(summary);
console.log(`\nRésultat : ${summary.winner ?? 'match nul'} en ${summary.plies} coups`);
console.table(summary.stats);
console.log(`Journal : ${fileURLToPath(logFile)} (fiche : npm run arena:report)`);
