// Traduction des règles et de l'état du combat en texte pour le LLM.
// Toutes les valeurs viennent de RULES : le prompt ne peut pas contredire le moteur.
import { createHash } from 'node:crypto';
import { ACTIONS, RULES, totals } from './boxing.js';

const R = RULES;
const percent = x => `${Math.round(x * 100)} %`;

export const SYSTEM_PROMPT = `Tu es un boxeur dans un combat de ${R.rounds} rounds contre un autre boxeur.

Déroulement :
- À chaque round, vous choisissez tous les deux ${R.exchanges} actions, en secret et en même temps.
- Elles sont ensuite jouées dans l'ordre : ta 1re action contre sa 1re, ta 2e contre sa 2e, etc.
- Chacun commence avec ${R.health} de santé et ${R.stamina} d'endurance.
- Un boxeur dont la santé tombe à 0 perd par KO.
- Sans KO après ${R.rounds} rounds, le combat se décide aux points : à chaque round, celui qui a subi le moins de dégâts marque 10, l'autre 9.

Actions :
- "jab" : ${R.damage.jab} dégâts, coûte ${R.cost.jab} d'endurance. Le coup le plus rapide.
- "crochet" : ${R.damage.crochet} dégâts, coûte ${R.cost.crochet}. Vitesse moyenne.
- "uppercut" : ${R.damage.uppercut} dégâts, coûte ${R.cost.uppercut}. Le coup le plus lent.
- "garde" : coûte ${R.cost.garde}. Bloque le jab et renvoie ${R.guardCounter.jab} dégâts. Laisse passer ${percent(R.guard.crochet)} du crochet et ${percent(R.guard.uppercut)} de l'uppercut.
- "esquive" : coûte ${R.cost.esquive}. Fait rater le crochet (et renvoie ${R.dodgeCounter.crochet} dégâts) et l'uppercut (et renvoie ${R.dodgeCounter.uppercut} dégâts). Le jab touche quand même.
- "recuperation" : rend ${R.recovery} d'endurance, mais les coups reçus pendant cette action font ${percent(R.vulnerable)} de leurs dégâts.

Coup contre coup : les deux touchent. Le plus rapide réduit le plus lent : avec un cran de retard, le coup garde ${percent(R.slower[1])} de ses dégâts ; avec deux crans (uppercut contre jab), ${percent(R.slower[2])}.

Endurance : un coup lancé sans l'endurance nécessaire ne garde que ${percent(R.tired)} de ses dégâts. Chacun récupère ${R.roundRecovery} d'endurance entre deux rounds.

Réponds uniquement par un objet JSON de cette forme, sans texte autour :
{"actions":["action 1","action 2","action 3","action 4"]}
Le tableau contient exactement ${R.exchanges} actions parmi : ${ACTIONS.join(', ')}.`;

// Empreinte du prompt système : change dès que les consignes ou les valeurs changent.
export const PROMPT_VERSION = createHash('sha256').update(SYSTEM_PROMPT).digest('hex').slice(0, 8);

// État du combat vu par le boxeur numéro `me` (0 ou 1).
export function buildUserPrompt(state, me) {
    const mine = state.boxers[me];
    const theirs = state.boxers[1 - me];
    const points = totals(state);
    const history = state.rounds.map(round => {
        const dealt = round.exchanges.reduce((sum, e) => sum + e.damage[1 - me], 0);
        const taken = round.exchanges.reduce((sum, e) => sum + e.damage[me], 0);
        return `Round ${round.number} : toi ${round.sequences[me].join(', ')} | adversaire ${round.sequences[1 - me].join(', ')} | dégâts infligés ${dealt}, subis ${taken} | points ${round.scores[me]}-${round.scores[1 - me]}`;
    });
    return [
        `Round ${state.rounds.length + 1} sur ${R.rounds}.`,
        `Toi : ${mine.health} de santé, ${mine.stamina} d'endurance.`,
        `Adversaire : ${theirs.health} de santé, ${theirs.stamina} d'endurance.`,
        `Points des juges : toi ${points[me]}, adversaire ${points[1 - me]}.`,
        '',
        history.length ? 'Rounds précédents :' : 'Aucun round joué.',
        ...history,
        '',
        `Donne tes ${R.exchanges} actions pour ce round.`,
    ].join('\n');
}

// Extrait la séquence du dernier objet JSON de la réponse (les modèles à raisonnement écrivent souvent avant).
export function parseSequence(text) {
    const candidates = (text ?? '').match(/\{[^{}]*\}/g) ?? [];
    for (const candidate of candidates.reverse()) {
        try {
            const { actions } = JSON.parse(candidate);
            if (Array.isArray(actions)) return actions;
        } catch {
            // On essaie le candidat précédent.
        }
    }
    return null;
}
