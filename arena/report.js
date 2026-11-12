// Fiches Markdown tirées des journaux JSONL : une fiche par partie, et un tableau de synthèse.
// Usage : npm run arena:report                  (fiche du dernier journal)
//         npm run arena:report -- <journal>     (fiche d'un journal précis)
//         npm run arena:report -- --summary     (synthèse de toutes les parties, arena/games/README.md)
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderBoard } from './prompt.js';

const LOGS_DIR = fileURLToPath(new URL('./logs/', import.meta.url));
const GAMES_DIR = fileURLToPath(new URL('./games/', import.meta.url));

function readGame(path) {
    const entries = readFileSync(path, 'utf8').trim().split('\n').map(line => JSON.parse(line));
    return {
        name: basename(path, '.jsonl'),
        start: entries.find(e => e.event === 'start'),
        actions: entries.filter(e => e.event === 'action'),
        end: entries.find(e => e.event === 'end'),
        aborted: entries.find(e => e.event === 'aborted'),
    };
}

// Compteurs d'un joueur, recalculés depuis les coups : le journal reste la seule source.
function playerStats(game, index) {
    const actions = game.actions.filter(a => a.player === index);
    const errors = actions.flatMap(a => a.errors ?? []);
    const illegal = errors.filter(e => e.startsWith('Coup illégal')).length;
    const sum = pick => actions.reduce((total, a) => total + (pick(a) ?? 0), 0);
    return {
        moves: actions.length,
        illegal,
        apiErrors: errors.length - illegal,
        fallbacks: actions.filter(a => a.fallback).length,
        latencyMs: sum(a => a.latencyMs),
        promptTokens: sum(a => a.usage?.prompt_tokens),
        completionTokens: sum(a => a.usage?.completion_tokens),
    };
}

const avg = (total, count) => (count ? Math.round(total / count) : 0);
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
const describeAction = a => (a.type === 'move' ? `déplacement vers (${a.x}, ${a.y})` : a.type);

function gameSheet(game) {
    const { start, actions, end } = game;
    const board = renderBoard({
        config: { rows: start.board.length, cols: start.board[0].length },
        grid: start.board,
        weapons: start.weapons,
        players: start.positions.map((p, id) => ({ id, ...p })),
    });
    const lastHp = actions.at(-1)?.hp ?? [];
    const stats = start.players.map((_, i) => playerStats(game, i));

    return [
        `# ${start.players.join(' contre ')}`,
        '',
        '## Mise en place',
        '',
        table(['Paramètre', 'Valeur'], [
            ['Date', start.date ?? 'inconnue'],
            ['Seed (plateau, armes, positions)', start.seed],
            ['Commit du code', start.commit ?? 'inconnu'],
            ['Version du prompt', start.promptVersion ?? 'inconnue'],
            ['Température', start.params?.temperature ?? 'inconnue'],
            ['Essais par coup avant repli aléatoire', start.params?.maxAttempts ?? 'inconnu'],
            ['Limite de coups', start.params?.maxPlies ?? 'inconnue'],
        ]),
        '',
        'Plateau de départ (# mur, k knife, p pistol, g grenade, r rifle). Le joueur A commence.',
        '',
        '```',
        board,
        '```',
        '',
        '## Résultat',
        '',
        end
            ? `${end.winner ? `Victoire de **${end.winner}**` : '**Match nul**'} en ${end.plies} coups. Points de vie finaux : ${lastHp.join(' / ')}.`
            : game.aborted
                ? `**Partie annulée** au coup ${game.aborted.ply}, hors classement. ${game.aborted.reason}`
                : 'Partie interrompue avant la fin.',
        '',
        '## Statistiques',
        '',
        table(
            ['Joueur', 'Coups', 'Coups illégaux', 'Erreurs API', 'Replis aléatoires', 'Latence moyenne', 'Tokens entrée', 'Tokens sortie'],
            start.players.map((player, i) => {
                const s = stats[i];
                return [player, s.moves, s.illegal, s.apiErrors, s.fallbacks, `${avg(s.latencyMs, s.moves)} ms`, s.promptTokens, s.completionTokens];
            }),
        ),
        '',
        '## Déroulé',
        '',
        table(
            ['Coup', 'Joueur', 'Phase', 'Action', 'Essais', 'PV A / B'],
            actions.map(a => [
                a.ply,
                a.player === 0 ? 'A' : 'B',
                a.phase === 'battle' ? 'combat' : 'déplacement',
                describeAction(a.action) + (a.fallback ? ' (aléatoire)' : ''),
                a.attempts,
                a.hp.join(' / '),
            ]),
        ),
        '',
    ].join('\n');
}

// Synthèse par modèle sur les parties terminées au format actuel (les journaux d'essai antérieurs sont ignorés).
function summarySheet(games) {
    const models = new Map();
    for (const game of games) {
        game.start.players.forEach((player, i) => {
            const model = player.slice(2); // Retire le préfixe « A » ou « B ».
            const m = models.get(model) ?? { games: 0, wins: 0, draws: 0, losses: 0, moves: 0, illegal: 0, fallbacks: 0, latencyMs: 0, tokens: 0 };
            const s = playerStats(game, i);
            m.games++;
            if (game.end.winner === null) m.draws++;
            else if (game.end.winner === player) m.wins++;
            else m.losses++;
            m.moves += s.moves;
            m.illegal += s.illegal;
            m.fallbacks += s.fallbacks;
            m.latencyMs += s.latencyMs;
            m.tokens += s.promptTokens + s.completionTokens;
            models.set(model, m);
        });
    }
    const ranked = [...models.entries()].sort(([, a], [, b]) => b.wins / b.games - a.wins / a.games);
    return [
        '# Résultats',
        '',
        `${games.length} parties. Protocole : [BENCHMARK.md](../BENCHMARK.md).`,
        '',
        table(
            ['Modèle', 'Parties', 'Victoires', 'Nuls', 'Défaites', 'Coups illégaux', 'Replis aléatoires', 'Latence moyenne', 'Tokens par partie'],
            ranked.map(([model, m]) => [model, m.games, m.wins, m.draws, m.losses, m.illegal, m.fallbacks, `${avg(m.latencyMs, m.moves)} ms`, avg(m.tokens, m.games)]),
        ),
        '',
        '## Parties',
        '',
        ...games.map(g => `- [${g.start.players.join(' contre ')}](${g.name}.md) : ${g.end.winner ?? 'match nul'} en ${g.end.plies} coups`),
        '',
    ].join('\n');
}

const logPaths = () => readdirSync(LOGS_DIR).filter(f => f.endsWith('.jsonl')).sort().map(f => LOGS_DIR + f);
const arg = process.argv[2];
mkdirSync(GAMES_DIR, { recursive: true });

if (arg === '--summary') {
    const games = logPaths().map(readGame).filter(g => g.start?.promptVersion && g.end);
    for (const game of games) writeFileSync(`${GAMES_DIR}${game.name}.md`, gameSheet(game));
    writeFileSync(`${GAMES_DIR}README.md`, summarySheet(games));
    console.log(`Synthèse de ${games.length} parties : ${GAMES_DIR}README.md`);
} else {
    const path = arg ?? logPaths().at(-1);
    if (!path) throw new Error('Aucun journal dans arena/logs/');
    const game = readGame(path);
    const out = `${GAMES_DIR}${game.name}.md`;
    writeFileSync(out, gameSheet(game));
    console.log(`Fiche : ${out}`);
}
