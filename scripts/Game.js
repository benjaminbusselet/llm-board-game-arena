class Game {
    constructor(player1, player2, weapon1, weapon2, weapon3, weapon4) {
        this.activePlayer = player1
        this.passivePlayer = player2
        this.weapon1 = weapon1
        this.weapon2 = weapon2
        this.weapon3 = weapon3
        this.weapon4 = weapon4
        $('.ambre_score').text(`${this.activePlayer.score}`);
        $('.ambre_weapon').attr('src', 'img/' + this.activePlayer.weapon.name + '.png');
        $('.ambre_weapon_force').text(`${this.activePlayer.weapon.force}`);
        $('.silas_score').text(`${this.passivePlayer.score}`);
        $('.silas_weapon').attr('src', 'img/' + this.passivePlayer.weapon.name + '.png');
        $('.silas_weapon_force').text(`${this.passivePlayer.weapon.force}`);
        $("#statutplayer").text("C'est au tour de " + this.activePlayer.name);

    }

    // Initialisation des mouvements des joueurs

    movePlayers() {

        this.activePlayer.position = {
            x: $("." + this.activePlayer.nickname).data('col'),
            y: $("." + this.activePlayer.nickname).data('line')
        }

        this.passivePlayer.position = {
            x: $("." + this.passivePlayer.nickname).data('col'),
            y: $("." + this.passivePlayer.nickname).data('line')
        }

        let listetop = [];
        for (let i = -3; i <= 0; i++) {
            listetop.push([this.activePlayer.position.x, this.activePlayer.position.y + i]);
        }
        listetop.reverse();
        listetop.every((e) => {
            if ($("[data-col=" + e[0] + "][data-line=" + e[1] + "]").is($("." + this.passivePlayer.nickname))) {
                return false;
            } else if ($("[data-col=" + e[0] + "][data-line=" + e[1] + "]").is($("." + this.passivePlayer.place))) {
                return false;
            } else if ($("[data-col=" + e[0] + "][data-line=" + e[1] + "]").is($(".wall"))) {
                return false;
            } else {
                $("[data-col=" + e[0] + "][data-line=" + e[1] + "]").removeClass('empty').addClass(this.activePlayer.statut);
                return true;
            }
        })

        let listeleft = [];
        for (let i = -3; i <= 0; i++) {
            listeleft.push([this.activePlayer.position.x + i, this.activePlayer.position.y]);
        }
        listeleft.reverse();
        listeleft.every((e) => {
            if ($("[data-col=" + e[0] + "][data-line=" + e[1] + "]").is($("." + this.passivePlayer.nickname))) {
                return false;
            } else if ($("[data-col=" + e[0] + "][data-line=" + e[1] + "]").is($("." + this.passivePlayer.place))) {
                return false;
            } else if ($("[data-col=" + e[0] + "][data-line=" + e[1] + "]").is($(".wall"))) {
                return false;
            } else {
                $("[data-col=" + e[0] + "][data-line=" + e[1] + "]").removeClass('empty').addClass(this.activePlayer.statut);
                return true;
            }
        })

        let listedown = [];
        for (let i = 0; i <= 3; i++) {
            listedown.push([this.activePlayer.position.x, this.activePlayer.position.y + i]);
        }
        listedown.every((e) => {
            if ($("[data-col=" + e[0] + "][data-line=" + e[1] + "]").is($("." + this.passivePlayer.nickname))) {
                return false;
            } else if ($("[data-col=" + e[0] + "][data-line=" + e[1] + "]").is($("." + this.passivePlayer.place))) {
                return false;
            } else if ($("[data-col=" + e[0] + "][data-line=" + e[1] + "]").is($(".wall"))) {
                return false;
            } else {
                $("[data-col=" + e[0] + "][data-line=" + e[1] + "]").removeClass('empty').addClass(this.activePlayer.statut);
                return true;
            }
        })

        let listright = [];
        for (let i = 0; i <= 3; i++) {
            listright.push([this.activePlayer.position.x + i, this.activePlayer.position.y]);
        }
        listright.every((e) => {
            if ($("[data-col=" + e[0] + "][data-line=" + e[1] + "]").is($("." + this.passivePlayer.nickname))) {
                return false;
            } else if ($("[data-col=" + e[0] + "][data-line=" + e[1] + "]").is($("." + this.passivePlayer.place))) {
                return false;
            } else if ($("[data-col=" + e[0] + "][data-line=" + e[1] + "]").is($(".wall"))) {
                return false;
            } else {
                $("[data-col=" + e[0] + "][data-line=" + e[1] + "]").removeClass('empty').addClass(this.activePlayer.statut);
                return true;
            }
        })
        $("." + this.activePlayer.nickname).removeClass(this.activePlayer.statut);

        $("." + this.activePlayer.statut).on("click", event => {
            if ($(event.currentTarget).is($("." + this.weapon1.name)) === true) {
                $("." + this.activePlayer.nickname).removeClass().addClass(this.activePlayer.weapon.name);
                $("." + this.activePlayer.statut).removeClass(this.activePlayer.statut).addClass('empty');
                $("." + this.weapon1.name).removeClass('empty');
                $(event.currentTarget).addClass(this.activePlayer.nickname);
                this.activePlayer.weapon.name = this.weapon1.name;
                this.activePlayer.weapon.force = this.weapon1.force;

            } else if ($(event.currentTarget).is($("." + this.weapon2.name)) === true) {
                $("." + this.activePlayer.nickname).removeClass().addClass(this.activePlayer.weapon.name);
                $("." + this.activePlayer.statut).removeClass(this.activePlayer.statut).addClass('empty');
                $("." + this.weapon2.name).removeClass('empty');
                $(event.currentTarget).addClass(this.activePlayer.nickname);
                this.activePlayer.weapon.name = this.weapon2.name;
                this.activePlayer.weapon.force = this.weapon2.force;

            } else if ($(event.currentTarget).is($("." + this.weapon3.name)) === true) {
                $("." + this.activePlayer.nickname).removeClass().addClass(this.activePlayer.weapon.name);
                $("." + this.activePlayer.statut).removeClass(this.activePlayer.statut).addClass('empty');
                $("." + this.weapon3.name).removeClass('empty');
                $(event.currentTarget).addClass(this.activePlayer.nickname);
                this.activePlayer.weapon.name = this.weapon3.name;
                this.activePlayer.weapon.force = this.weapon3.force;

            } else if ($(event.currentTarget).is($("." + this.weapon4.name)) === true) {
                $("." + this.activePlayer.nickname).removeClass().addClass(this.activePlayer.weapon.name);
                $("." + this.activePlayer.statut).removeClass(this.activePlayer.statut).addClass('empty');
                $("." + this.weapon4.name).removeClass('empty');
                $(event.currentTarget).addClass(this.activePlayer.nickname);
                this.activePlayer.weapon.name = this.weapon4.name;
                this.activePlayer.weapon.force = this.weapon4.force;

            } else {
                $("." + this.activePlayer.nickname).removeClass().addClass('empty');
                $("." + this.activePlayer.statut).removeClass(this.activePlayer.statut).addClass('empty');
                $(event.currentTarget).removeClass().addClass(this.activePlayer.nickname);
            }
            $('.' + this.activePlayer.nickname + '_weapon').attr('src', 'img/' + this.activePlayer.weapon.name + '.png');
            $('.' + this.activePlayer.nickname + '_weapon_force').text(`${this.activePlayer.weapon.force}`);
            $('.empty').off('click');
            $("." + this.activePlayer.nickname).off('click');
            this.checkposition()
        })
    }

    // Vérification du positionnement des joueurs

    checkposition() {
        let clickposition = {
            x: $(event.currentTarget).data('col'),
            y: $(event.currentTarget).data('line')
        }

        if ((clickposition.y === this.passivePlayer.position.y + 1 && clickposition.x === this.passivePlayer.position.x) || (clickposition.y === this.passivePlayer.position.y - 1 && clickposition.x === this.passivePlayer.position.x) || (clickposition.x === this.passivePlayer.position.x + 1 && clickposition.y === this.passivePlayer.position.y) || (clickposition.x === this.passivePlayer.position.x - 1 && clickposition.y === this.passivePlayer.position.y)) {

            this.battlePlayers();

        } else {
            this.switchPlayers();
            this.movePlayers();
        }
    }

    // Interversion des joueurs

    switchPlayers() {

        this.activePlayer.statut = "passive"
        this.passivePlayer.statut = "active"

        // switch active player
        let temp = this.activePlayer;
        this.activePlayer = this.passivePlayer;
        this.passivePlayer = temp;

        $("#statutplayer").text("C'est au tour de " + this.activePlayer.name);
    }

    // initialisation de la bataille finale

    battlePlayers() {

        $("#actionplayer").show();

        $(".attackplayer").on("click", event => {

            this.activePlayer.action = 'attack';

            if (this.passivePlayer.action === "defend") {
                this.passivePlayer.score -= Math.round(this.activePlayer.weapon.force / 2);
            } else {
                this.passivePlayer.score -= this.activePlayer.weapon.force;
            }

            $('.' + this.passivePlayer.nickname + '_score').text(`${this.passivePlayer.score}`);

            if (this.passivePlayer.score <= 0) {
                $('.content').empty().addClass(this.activePlayer.nickname);
                $("#statutplayer").empty().html("<h2> Victoire de " + this.activePlayer.name + "</h2>");
                $(".attackplayer").hide();
                $(".defenseplayer").hide();
                $(".reloadgame").show();
                $(".reloadgame").on("click", event => {
                    location.reload();
                })
            } else {
                $('.attackplayer').off('click');
                $('.defenseplayer').off('click');
                this.switchPlayers();
                this.battlePlayers();
            }

        })

        $(".defenseplayer").on("click", event => {
            this.activePlayer.action = 'defend';
            $('.attackplayer').off('click');
            $('.defenseplayer').off('click');
            this.switchPlayers();
            this.battlePlayers();
        })
    }
};
