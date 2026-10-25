// Affichage : lit l'état du moteur et le dessine. Aucune règle du jeu ici.
import './styles.css';
import { applyAction, createGame, legalActions } from '../engine/game.js';
import { CHARACTERS } from '../characters.js';

const board = document.querySelector('#gameboard');
const status = document.querySelector('#status');
const buttons = {
    attack: document.querySelector('#attack'),
    defend: document.querySelector('#defend'),
    reload: document.querySelector('#reload'),
};

let state = createGame({ names: CHARACTERS.map(c => c.name) });

document.querySelector('#title').textContent = `${CHARACTERS[0].name} VS ${CHARACTERS[1].name}`;
document.querySelectorAll('[data-player]').forEach(panel => {
    panel.querySelector('.avatar').style.backgroundImage = `url(${CHARACTERS[panel.dataset.player].avatar})`;
});

function play(action) {
    state = applyAction(state, action);
    render();
}

function render() {
    const reachable = legalActions(state).filter(a => a.type === 'move');
    board.replaceChildren();
    for (let y = 0; y < state.config.rows; y++) {
        const row = board.insertRow();
        for (let x = 0; x < state.config.cols; x++) {
            const cell = row.insertCell();
            const player = state.players.find(p => p.x === x && p.y === y);
            const weapon = state.weapons.find(w => w.x === x && w.y === y);
            if (state.grid[y][x] === 'wall') cell.className = 'wall';
            if (player) cell.style.backgroundImage = `url(${CHARACTERS[player.id].avatar})`;
            else if (weapon) cell.style.backgroundImage = `url(/img/${weapon.name}.png)`;
            if (reachable.some(a => a.x === x && a.y === y)) {
                cell.classList.add('reachable');
                cell.addEventListener('click', () => play({ type: 'move', x, y }));
            }
        }
    }

    document.querySelectorAll('[data-player]').forEach(panel => {
        const player = state.players[panel.dataset.player];
        panel.querySelector('.weapon-img').src = `/img/${player.weapon.name}.png`;
        panel.querySelector('.weapon-force').textContent = player.weapon.force;
        panel.querySelector('.hp').textContent = player.hp;
    });

    const active = state.players[state.active];
    if (state.phase === 'over') {
        status.textContent = state.winner === null ? 'Match nul' : `Victoire de ${state.players[state.winner].name}`;
    } else {
        status.textContent = `C'est au tour de ${active.name}`;
    }
    buttons.attack.hidden = buttons.defend.hidden = state.phase !== 'battle';
    buttons.reload.hidden = state.phase !== 'over';
}

buttons.attack.addEventListener('click', () => play({ type: 'attack' }));
buttons.defend.addEventListener('click', () => play({ type: 'defend' }));
buttons.reload.addEventListener('click', () => location.reload());

render();
