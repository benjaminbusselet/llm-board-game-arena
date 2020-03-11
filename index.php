<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>Jeu</title>
    <link rel="stylesheet" href="styles/styles.css">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
</head>

<body>

    <header class="mt-4 mb-4">
        <div class="container-fluid">
            <div class="row">
                <div class="col-sm-12 text-center">
                    <h1>Ambre VS Silas</h1>
                </div>
            </div>
        </div>
    </header>

    <div id="game">
        <div class="container-fluid">
            <div class="row">
                <!--player1info-->
                <div class="col-sm-3">
                    <div id="player1" class="row mx-auto">
                    </div>
                    <div class="row mt-3">
                        <h4 class="mx-auto">Arme</h4>
                    </div>
                    <div class="row">
                        <img class="mx-auto ambre_weapon" src="">
                    </div>
                    <div class="row mt-3">
                        <h4 class="mx-auto">Force</h4>
                    </div>
                    <div class="row">
                        <h3 class="mx-auto ambre_weapon_force">
                        </h3>
                    </div>
                    <div class="row mt-3">
                        <h1 class="mx-auto">Score</h1>
                    </div>
                    <div class="row">
                        <h1 class="mx-auto ambre_score">
                        </h1>
                    </div>
                </div>
                <!--gameboard-->
                <div class="col-sm-6 content">
                    <table class="mt-0" id="gameboard"></table>
                </div>
                <!--player2info-->
                <div class="col-sm-3">
                    <div id="player2" class="row mx-auto">
                    </div>
                    <div class="row mt-3">
                        <h4 class="mx-auto">Arme</h4>
                    </div>
                    <div class="row">
                        <img class="mx-auto silas_weapon" src="">
                    </div>
                    <div class="row mt-3">
                        <h4 class="mx-auto">Force</h4>
                    </div>
                    <div class="row">
                        <h3 class="mx-auto silas_weapon_force">
                        </h3>
                    </div>
                    <div class="row mt-3">
                        <h1 class="mx-auto">Score</h1>
                    </div>
                    <div class="row">
                        <h1 class="mx-auto silas_score">
                        </h1>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <footer class="mt-3">
        <div class="container-fluid">
            <div class="row">
                <div class="col-sm-12 text-center">
                    <h2 id="statutplayer"></h2>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-sm-12 text-center">
                    <div id="actionplayer" style="display: none;">
                        <button type="button" class="btn btn-success attackplayer">Attaque</button>
                        <button type="button" class="btn btn-danger defenseplayer">Défense</button>
                        <button type="button" class="btn btn-primary reloadgame" style="display: none;">Rejouer</button>
                    </div>
                </div>
            </div>
        </div>
    </footer>
    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
    <script src="scripts/Game.js"></script>
    <script src="scripts/Players.js"></script>
    <script src="scripts/Weapons.js"></script>
    <script src="scripts/Board.js"></script>
    <script src="scripts/main.js"></script>
</body>

</html>
