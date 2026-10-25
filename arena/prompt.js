// Traduction de l'état du jeu en texte pour le LLM.
import { legalActions } from '../src/engine/game.js';

const WEAPON_SYMBOLS = { knife: 'k', pistol: 'p', grenade: 'g', rifle: 'r' };

export const SYSTEM_PROMPT = `Tu joues à un jeu de plateau tour par tour à deux joueurs, sur une grille de 10 × 10.

Règles :
- Phase de déplacement : tu avances de 1 à 3 cases en ligne droite (haut, bas, gauche, droite). Les murs et l'adversaire bloquent le passage. Les armes ne bloquent pas.
- Arriver sur une case d'arme te la fait ramasser ; ton arme actuelle est déposée sur ta case de départ.
- Armes et dégâts : knife 10, pistol 20, grenade 30, rifle 40.
- Arriver sur une case voisine de l'adversaire (haut, bas, gauche, droite) déclenche le combat. Tu frappes en premier.
- Combat, chacun son tour : "attack" inflige les dégâts de ton arme ; "defend" divise par deux les dégâts reçus tant que tu ne rattaques pas.
- Chaque joueur a 100 points de vie. Celui qui tombe à 0 perd. Au-delà de la limite de coups, c'est un match nul.

Réponds uniquement par un objet JSON choisi dans la liste des coups légaux, sans texte autour.`;

export function renderBoard(state) {
    const lines = ['   ' + [...Array(state.config.cols).keys()].join(' ')];
    for (let y = 0; y < state.config.rows; y++) {
        let line = String(y).padStart(2) + ' ';
        for (let x = 0; x < state.config.cols; x++) {
            const player = state.players.find(p => p.x === x && p.y === y);
            const weapon = state.weapons.find(w => w.x === x && w.y === y);
            if (player) line += player.id === 0 ? 'A' : 'B';
            else if (state.grid[y][x] === 'wall') line += '#';
            else if (weapon) line += WEAPON_SYMBOLS[weapon.name];
            else line += '.';
            line += ' ';
        }
        lines.push(line.trimEnd());
    }
    return lines.join('\n');
}

export function buildUserPrompt(state) {
    const me = state.players[state.active];
    const opponent = state.players[1 - state.active];
    const describe = p => `${p.id === 0 ? 'A' : 'B'} en (x=${p.x}, y=${p.y}), ${p.hp} PV, arme ${p.weapon.name} (${p.weapon.force}), posture ${p.stance ?? 'aucune'}`;
    return [
        `Tu es le joueur ${me.id === 0 ? 'A' : 'B'}. Coup ${state.ply + 1} sur ${state.config.maxPlies} maximum.`,
        `Phase : ${state.phase === 'battle' ? 'combat' : 'déplacement'}.`,
        '',
        'Plateau (x = colonne, y = ligne ; # mur, . vide, k knife, p pistol, g grenade, r rifle) :',
        renderBoard(state),
        '',
        `Toi : ${describe(me)}`,
        `Adversaire : ${describe(opponent)}`,
        '',
        'Coups légaux :',
        ...legalActions(state).map(a => JSON.stringify(a)),
    ].join('\n');
}

// Extrait le dernier objet JSON plat de la réponse (les modèles à raisonnement écrivent souvent avant).
export function parseAction(text) {
    const candidates = (text ?? '').match(/\{[^{}]*\}/g) ?? [];
    for (const candidate of candidates.reverse()) {
        try {
            return JSON.parse(candidate);
        } catch {
            // On essaie le candidat précédent.
        }
    }
    return null;
}
