// Logique pure du jeu : aucun accès au DOM. L'état est un objet JSON sérialisable.
import { createRng, pick } from './rng.js';

export const WEAPONS = {
    knife: 10,
    pistol: 20,
    grenade: 30,
    rifle: 40,
};

export const DEFAULTS = {
    rows: 10,
    cols: 10,
    walls: 15,
    boardWeapons: ['pistol', 'grenade', 'rifle'],
    startWeapon: 'knife',
    hp: 100,
    maxMoveDistance: 3,
    zoneWidth: 3,
    maxPlies: 200,
};

const DIRECTIONS = [
    { dx: 0, dy: -1 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 0 },
];

// Création d'une partie

export function createGame({ seed = Date.now(), names = ['Joueur 1', 'Joueur 2'], ...options } = {}) {
    const config = { ...DEFAULTS, ...options };
    const rng = createRng(seed);

    // On régénère tant que les deux joueurs ne peuvent pas se rejoindre.
    for (let attempt = 0; attempt < 100; attempt++) {
        const state = generate(config, rng, names);
        if (playersConnected(state)) {
            return { ...state, seed };
        }
    }
    throw new Error('Impossible de générer un plateau jouable');
}

function generate(config, rng, names) {
    const { rows, cols } = config;
    const grid = Array.from({ length: rows }, () => Array(cols).fill('empty'));
    const weapons = [];

    const freeCells = (filter = () => true) => {
        const cells = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (grid[y][x] === 'empty' && !weapons.some(w => w.x === x && w.y === y) && filter(x, y)) {
                    cells.push({ x, y });
                }
            }
        }
        return cells;
    };

    for (let i = 0; i < config.walls; i++) {
        const { x, y } = pick(rng, freeCells());
        grid[y][x] = 'wall';
    }

    for (const name of config.boardWeapons) {
        const { x, y } = pick(rng, freeCells());
        weapons.push({ name, force: WEAPONS[name], x, y });
    }

    const zones = [
        x => x < config.zoneWidth,
        x => x >= cols - config.zoneWidth,
    ];
    const players = zones.map((zone, id) => {
        const { x, y } = pick(rng, freeCells(zone));
        return {
            id,
            name: names[id],
            hp: config.hp,
            weapon: { name: config.startWeapon, force: WEAPONS[config.startWeapon] },
            stance: null,
            x,
            y,
        };
    });

    return {
        config,
        grid,
        weapons,
        players,
        active: 0,
        phase: 'move',
        winner: null,
        ply: 0,
        history: [],
    };
}

function playersConnected(state) {
    const [p1, p2] = state.players;
    const seen = new Set([`${p1.x},${p1.y}`]);
    const queue = [{ x: p1.x, y: p1.y }];
    while (queue.length) {
        const { x, y } = queue.shift();
        for (const { dx, dy } of DIRECTIONS) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx === p2.x && ny === p2.y) return true;
            const key = `${nx},${ny}`;
            if (inBounds(state, nx, ny) && state.grid[ny][nx] !== 'wall' && !seen.has(key)) {
                seen.add(key);
                queue.push({ x: nx, y: ny });
            }
        }
    }
    return false;
}

// Coups légaux

export function legalActions(state) {
    if (state.phase === 'battle') {
        return [{ type: 'attack' }, { type: 'defend' }];
    }
    if (state.phase === 'move') {
        return reachableCells(state, state.active).map(({ x, y }) => ({ type: 'move', x, y }));
    }
    return [];
}

export function isLegal(state, action) {
    return legalActions(state).some(a => sameAction(a, action));
}

function sameAction(a, b) {
    if (!b || a.type !== b.type) return false;
    return a.type !== 'move' || (a.x === b.x && a.y === b.y);
}

function reachableCells(state, playerId) {
    const player = state.players[playerId];
    const opponent = state.players[1 - playerId];
    const cells = [];
    for (const { dx, dy } of DIRECTIONS) {
        for (let step = 1; step <= state.config.maxMoveDistance; step++) {
            const x = player.x + dx * step;
            const y = player.y + dy * step;
            if (!inBounds(state, x, y) || state.grid[y][x] === 'wall' || (x === opponent.x && y === opponent.y)) {
                break;
            }
            cells.push({ x, y });
        }
    }
    return cells;
}

// Application d'un coup : renvoie un nouvel état, l'état d'origine n'est pas modifié.

export function applyAction(state, action) {
    if (!isLegal(state, action)) {
        throw new Error(`Coup illégal : ${JSON.stringify(action)}`);
    }
    const next = structuredClone(state);
    const player = next.players[next.active];
    const opponent = next.players[1 - next.active];
    next.history.push({ ply: next.ply, player: next.active, action });
    next.ply++;

    if (action.type === 'move') {
        const from = { x: player.x, y: player.y };
        player.x = action.x;
        player.y = action.y;

        // Ramasser une arme : l'ancienne est déposée sur la case de départ.
        const found = next.weapons.find(w => w.x === action.x && w.y === action.y);
        if (found) {
            next.weapons = next.weapons.filter(w => w !== found);
            next.weapons.push({ ...player.weapon, ...from });
            player.weapon = { name: found.name, force: found.force };
        }

        if (Math.abs(player.x - opponent.x) + Math.abs(player.y - opponent.y) === 1) {
            next.phase = 'battle'; // Le joueur qui arrive au contact frappe en premier.
        } else {
            switchTurn(next);
        }
    } else if (action.type === 'attack') {
        player.stance = 'attack';
        const damage = opponent.stance === 'defend' ? Math.round(player.weapon.force / 2) : player.weapon.force;
        opponent.hp = Math.max(0, opponent.hp - damage);
        if (opponent.hp === 0) {
            next.phase = 'over';
            next.winner = player.id;
            return next;
        }
        switchTurn(next);
    } else if (action.type === 'defend') {
        player.stance = 'defend';
        switchTurn(next);
    }

    if (next.ply >= next.config.maxPlies && next.phase !== 'over') {
        next.phase = 'over';
        next.winner = null; // Match nul par limite de coups.
    }
    return next;
}

function switchTurn(state) {
    state.active = 1 - state.active;
    // Un joueur bloqué passe son tour ; si les deux le sont, match nul.
    if (state.phase === 'move' && reachableCells(state, state.active).length === 0) {
        state.active = 1 - state.active;
        if (reachableCells(state, state.active).length === 0) {
            state.phase = 'over';
            state.winner = null;
        }
    }
}

function inBounds(state, x, y) {
    return x >= 0 && y >= 0 && x < state.config.cols && y < state.config.rows;
}
