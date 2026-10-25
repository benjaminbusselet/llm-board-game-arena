import { describe, expect, it } from 'vitest';
import { applyAction, createGame, isLegal, legalActions } from './game.js';

// Plateau vide contrôlé à la main pour tester les règles.
function fixture({ p1 = { x: 0, y: 0 }, p2 = { x: 9, y: 9 }, walls = [], weapons = [] } = {}) {
    const state = createGame({ seed: 1, walls: 0 });
    state.grid = state.grid.map(row => row.map(() => 'empty'));
    walls.forEach(({ x, y }) => { state.grid[y][x] = 'wall'; });
    state.weapons = weapons;
    Object.assign(state.players[0], p1);
    Object.assign(state.players[1], p2);
    return state;
}

describe('createGame', () => {
    it('est déterministe pour une même graine', () => {
        expect(createGame({ seed: 42 })).toEqual(createGame({ seed: 42 }));
    });

    it('place les joueurs dans leur zone, avec le knife', () => {
        for (let seed = 0; seed < 50; seed++) {
            const { players, grid, weapons } = createGame({ seed });
            expect(players[0].x).toBeLessThan(3);
            expect(players[1].x).toBeGreaterThanOrEqual(7);
            expect(players[0].weapon).toEqual({ name: 'knife', force: 10 });
            expect(grid.flat().filter(c => c === 'wall')).toHaveLength(15);
            expect(weapons.map(w => w.name)).toEqual(['pistol', 'grenade', 'rifle']);
        }
    });
});

describe('legalActions', () => {
    it('propose 1 à 3 cases dans chaque direction', () => {
        const state = fixture({ p1: { x: 5, y: 5 } });
        expect(legalActions(state)).toHaveLength(12);
    });

    it('s’arrête aux murs, au bord et à l’adversaire', () => {
        const state = fixture({ p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 }, walls: [{ x: 0, y: 2 }] });
        expect(legalActions(state)).toEqual([
            { type: 'move', x: 0, y: 1 },
            { type: 'move', x: 1, y: 0 },
        ]);
    });

    it('refuse un coup hors liste', () => {
        const state = fixture({ p1: { x: 5, y: 5 } });
        expect(isLegal(state, { type: 'move', x: 6, y: 6 })).toBe(false);
        expect(isLegal(state, { type: 'attack' })).toBe(false);
        expect(() => applyAction(state, { type: 'move', x: 9, y: 0 })).toThrow();
    });
});

describe('applyAction', () => {
    it('échange l’arme et dépose l’ancienne sur la case de départ', () => {
        const state = fixture({ p1: { x: 0, y: 0 }, weapons: [{ name: 'rifle', force: 40, x: 2, y: 0 }] });
        const next = applyAction(state, { type: 'move', x: 2, y: 0 });
        expect(next.players[0].weapon).toEqual({ name: 'rifle', force: 40 });
        expect(next.weapons).toEqual([{ name: 'knife', force: 10, x: 0, y: 0 }]);
        expect(next.active).toBe(1);
        expect(state.players[0].weapon.name).toBe('knife');
    });

    it('lance le combat au contact, le joueur qui arrive frappe en premier', () => {
        const state = fixture({ p1: { x: 0, y: 0 }, p2: { x: 3, y: 0 } });
        const next = applyAction(state, { type: 'move', x: 2, y: 0 });
        expect(next.phase).toBe('battle');
        expect(next.active).toBe(0);
    });

    it('divise les dégâts par deux contre un défenseur', () => {
        let state = fixture({ p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } });
        state.phase = 'battle';
        state = applyAction(state, { type: 'defend' });
        state.players[1].weapon = { name: 'rifle', force: 40 };
        state = applyAction(state, { type: 'attack' });
        expect(state.players[0].hp).toBe(80);
        state = applyAction(state, { type: 'attack' });
        expect(state.players[1].hp).toBe(90);
    });

    it('déclare la victoire à 0 point de vie', () => {
        const state = fixture({ p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } });
        state.phase = 'battle';
        state.players[1].hp = 5;
        const next = applyAction(state, { type: 'attack' });
        expect(next.phase).toBe('over');
        expect(next.winner).toBe(0);
        expect(legalActions(next)).toEqual([]);
    });

    it('déclare un match nul à la limite de coups', () => {
        let state = fixture({ p1: { x: 0, y: 0 }, p2: { x: 9, y: 9 } });
        state.config.maxPlies = 2;
        state = applyAction(state, { type: 'move', x: 0, y: 1 });
        state = applyAction(state, { type: 'move', x: 9, y: 8 });
        expect(state.phase).toBe('over');
        expect(state.winner).toBeNull();
    });

    it('fait passer son tour à un joueur bloqué', () => {
        const state = fixture({
            p1: { x: 5, y: 5 },
            p2: { x: 0, y: 0 },
            walls: [{ x: 1, y: 0 }, { x: 0, y: 1 }],
        });
        const next = applyAction(state, { type: 'move', x: 5, y: 6 });
        expect(next.active).toBe(0);
        expect(next.phase).toBe('move');
    });
});
