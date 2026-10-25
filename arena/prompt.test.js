import { describe, expect, it } from 'vitest';
import { createGame } from '../src/engine/game.js';
import { buildUserPrompt, parseAction, renderBoard } from './prompt.js';

describe('parseAction', () => {
    it('garde le dernier objet JSON de la réponse', () => {
        expect(parseAction('Je pense à {"type":"defend"} puis {"type":"move","x":1,"y":2}')).toEqual({ type: 'move', x: 1, y: 2 });
    });

    it('renvoie null sans JSON valide', () => {
        expect(parseAction('attaque !')).toBeNull();
        expect(parseAction(undefined)).toBeNull();
    });
});

describe('prompt', () => {
    it('dessine un plateau de 10 × 10 avec les deux joueurs', () => {
        const board = renderBoard(createGame({ seed: 7 })).split('\n');
        expect(board).toHaveLength(11);
        expect(board.join('')).toContain('A');
        expect(board.join('')).toContain('B');
    });

    it('liste les coups légaux en JSON', () => {
        expect(buildUserPrompt(createGame({ seed: 7 }))).toMatch(/\{"type":"move","x":\d,"y":\d\}/);
    });
});
