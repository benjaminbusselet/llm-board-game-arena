class Players {
    constructor(name, nickname, place, statut, action, score) {
        this.name = name
        this.nickname = nickname
        this.place = place
        this.statut = statut
        this.action = action
        this.score = score
        this.weapon = new Weapons("knife", 10)
    }

    // Initialisation des joueurs

    initPlayers() {

        const playerarray = $("." + this.place).toArray();
        const position = playerarray[Math.floor(Math.random() * playerarray.length)];

        $(position).removeClass(this.place).removeClass('empty').addClass(this.nickname).addClass(this.statut);

        $('*[class^="area"]').removeClass(this.place).addClass('empty');
    }
};
