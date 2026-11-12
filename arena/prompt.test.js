import { describe, expect, it } from 'vitest';
import { createFight, playRound, RULES } from './boxing.js';
import { buildUserPrompt, parseSequence, SYSTEM_PROMPT } from './prompt.js';

describe('prompt système', () => {
    it('reprend les valeurs du moteur', () => {
        expect(SYSTEM_PROMPT).toContain(`${RULES.health} de santé`);
        expect(SYSTEM_PROMPT).toContain(`"uppercut" : ${RULES.damage.uppercut} dégâts, coûte ${RULES.cost.uppercut}`);
    });
});

describe('prompt du round', () => {
    it('présente le premier round sans historique', () => {
        const prompt = buildUserPrompt(createFight(), 0);
        expect(prompt).toContain('Round 1 sur');
        expect(prompt).toContain('Aucun round joué.');
    });

    it('montre à chaque boxeur l’historique de son point de vue', () => {
        const state = playRound(createFight(), [
            ['jab', 'jab', 'jab', 'jab'],
            ['garde', 'garde', 'garde', 'garde'],
        ]);
        expect(buildUserPrompt(state, 0)).toContain('toi jab, jab, jab, jab | adversaire garde, garde, garde, garde | dégâts infligés 0, subis 16 | points 9-10');
        expect(buildUserPrompt(state, 1)).toContain('toi garde, garde, garde, garde | adversaire jab, jab, jab, jab | dégâts infligés 16, subis 0 | points 10-9');
    });
});

describe('lecture de la réponse', () => {
    it('lit un objet JSON seul', () => {
        expect(parseSequence('{"actions":["jab","garde","esquive","crochet"]}')).toEqual(['jab', 'garde', 'esquive', 'crochet']);
    });

    it('prend le dernier objet quand le modèle raisonne avant de répondre', () => {
        const reply = 'Je pense à {"actions":["jab","jab","jab","jab"]} mais finalement :\n```json\n{"actions":["garde","jab","jab","uppercut"]}\n```';
        expect(parseSequence(reply)).toEqual(['garde', 'jab', 'jab', 'uppercut']);
    });

    it('renvoie null sans JSON exploitable', () => {
        expect(parseSequence('Je choisis le jab.')).toBeNull();
        expect(parseSequence('{"actions":"jab"}')).toBeNull();
        expect(parseSequence(undefined)).toBeNull();
    });
});
