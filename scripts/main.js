$(document).ready(function () {

    // Création du plateau
    const gameBoard = new Board(10, 10);
    gameBoard.initBoard();

    // création des murs
    gameBoard.createWall(15);

    // créations des armes
    const weapon1 = new Weapons("pistol", 20)
    weapon1.initWeapon();
    const weapon2 = new Weapons("grenade", 30)
    weapon2.initWeapon();
    const weapon3 = new Weapons("rifle", 40)
    weapon3.initWeapon();
    const weapon4 = new Weapons("knife", 10)

    // créations des joueurs
    gameBoard.createArea();

    const player1 = new Players("Ambre", "ambre", "area1", "active", null, 100);
    player1.initPlayers();

    const player2 = new Players("Silas", 'silas', "area2", null, null, 100);
    player2.initPlayers();

    // Lancement du jeu
    const game = new Game(player1, player2, weapon1, weapon2, weapon3, weapon4);
    game.movePlayers();
});
