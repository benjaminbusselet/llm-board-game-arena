// Un combat complet entre deux boxeurs, avec un journal JSONL.
// Usage : npm run arena:fight -- --p1 groq:<modèle> --p2 cohere:<modèle>
// Un boxeur programmé s'écrit bot:<nom> (voir bots.js), par exemple bot:hasard.
import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { BOTS } from './bots.js';
import { createFight, isValidSequence, playRound, RULES, totals } from './boxing.js';
import { createClient, MAX_ATTEMPTS, TEMPERATURE } from './players.js';
import { buildUserPrompt, parseSequence, PROMPT_VERSION, SYSTEM_PROMPT } from './prompt.js';
import { createRng } from './rng.js';

const { values } = parseArgs({ options: { p1: { type: 'string' }, p2: { type: 'string' }, quiet: { type: 'boolean', default: false } } });
if (!values.p1 || !values.p2) throw new Error('Usage : npm run arena:fight -- --p1 <boxeur> --p2 <boxeur>');

const FAULT_SEQUENCE = Array(RULES.exchanges).fill('garde'); // Round joué en garde après trois réponses invalides.

// Un boxeur rend { sequence, attempts, latencyMs, usage, fault, errors, access } pour un round.
function createBoxer(spec, index) {
    if (spec.startsWith('bot:')) {
        const bot = BOTS[spec.slice(4)];
        if (!bot) throw new Error(`Boxeur programmé inconnu : ${spec}. Choix : ${Object.keys(BOTS).join(', ')}`);
        const rng = createRng(Date.now() + index);
        return {
            id: spec,
            async check() {},
            async choose(state) {
                return { sequence: bot(state, index, rng), attempts: 1, latencyMs: 0, usage: null, fault: false, errors: [], access: null };
            },
        };
    }

    const client = createClient(spec);
    return {
        id: spec,
        check: () => client.check(),
        async choose(state) {
            const messages = [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: buildUserPrompt(state, index) },
            ];
            const usage = { prompt_tokens: 0, completion_tokens: 0 };
            const errors = [];
            const access = { waits: [], waitMs: 0, limits: {} }; // Contraintes du fournisseur rencontrées pendant ce round.
            let latencyMs = 0;
            for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                const reply = await client.ask(messages); // Une panne du fournisseur lève une erreur : le combat est annulé.
                latencyMs += reply.latencyMs;
                access.waits.push(...reply.waits);
                access.waitMs += reply.waitMs;
                access.limits = reply.limits;
                usage.prompt_tokens += reply.usage?.prompt_tokens ?? 0;
                usage.completion_tokens += reply.usage?.completion_tokens ?? 0;
                const sequence = parseSequence(reply.content);
                if (isValidSequence(sequence)) return { sequence, attempts: attempt, latencyMs, usage, fault: false, errors, access };
                errors.push(`Réponse invalide : ${String(reply.content).slice(0, 200)}`);
                messages.push(
                    { role: 'assistant', content: reply.content ?? '' },
                    { role: 'user', content: `Réponse invalide. Réponds uniquement par un objet JSON {"actions":[...]} avec exactement ${RULES.exchanges} actions autorisées.` },
                );
            }
            return { sequence: FAULT_SEQUENCE, attempts: MAX_ATTEMPTS, latencyMs, usage, fault: true, errors, access };
        },
    };
}

// Commit du code qui a joué le combat, suffixé si des fichiers suivis sont modifiés.
function gitCommit() {
    try {
        const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
        return git(['rev-parse', '--short', 'HEAD']) + (git(['status', '--porcelain', '--untracked-files=no']) ? '+modifs' : '');
    } catch {
        return null;
    }
}

const boxers = [createBoxer(values.p1, 0), createBoxer(values.p2, 1)];

// Test de disponibilité : en cas d'échec, aucun combat n'est créé.
try {
    await Promise.all(boxers.map(b => b.check()));
} catch (error) {
    console.error(`Combat non lancé, un modèle ne répond pas : ${error.message.slice(0, 200)}`);
    process.exit(1);
}

mkdirSync(new URL('./logs/', import.meta.url), { recursive: true });
const logFile = new URL(`./logs/${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`, import.meta.url);
const log = entry => appendFileSync(logFile, JSON.stringify(entry) + '\n');

log({
    event: 'start',
    date: new Date().toISOString(),
    commit: gitCommit(),
    promptVersion: PROMPT_VERSION,
    params: { temperature: TEMPERATURE, maxAttempts: MAX_ATTEMPTS },
    rules: RULES,
    boxers: boxers.map(b => b.id),
});

let state = createFight();
while (!state.over) {
    // Les deux boxeurs choisissent en même temps, sans voir le choix de l'autre.
    const choices = await Promise.allSettled(boxers.map(b => b.choose(state)));
    const failed = choices.findIndex(c => c.status === 'rejected');
    if (failed !== -1) {
        const reason = choices[failed].reason.message.slice(0, 300);
        log({ event: 'aborted', round: state.rounds.length + 1, boxer: failed, reason });
        console.error(`\nCombat annulé au round ${state.rounds.length + 1}, panne côté ${boxers[failed].id} : ${reason}`);
        process.exit(1);
    }

    const results = choices.map(c => c.value);
    state = playRound(state, results.map(r => r.sequence));
    const round = state.rounds.at(-1);
    log({ event: 'round', ...round, choices: results.map(({ sequence, ...meta }) => meta) });

    if (!values.quiet) {
        console.log(`Round ${round.number}`);
        boxers.forEach((b, i) => console.log(`  ${b.id.padEnd(40)} ${round.sequences[i].join(', ')}${results[i].fault ? ' (faute)' : ''}`));
        const last = round.exchanges.at(-1);
        console.log(`  santé ${last.health.join(' / ')} | endurance ${last.stamina.join(' / ')} | points ${round.scores.join('-')}`);
    }
}

const rounds = state.rounds.length;
const summary = {
    event: 'end',
    winner: state.winner === null ? null : boxers[state.winner].id,
    method: state.method,
    rounds,
    points: totals(state),
    health: state.boxers.map(b => b.health),
};
log(summary);
console.log(`\nRésultat : ${summary.winner ?? 'match nul'} (${summary.method}) en ${rounds} rounds, points ${summary.points.join('-')}, santé ${summary.health.join(' / ')}`);
console.log(`Journal : ${fileURLToPath(logFile)}`);
