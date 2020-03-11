class Weapons {
    constructor(name, force) {
        this.name = name
        this.force = force
    }

    // Initialisation des armes

    initWeapon() {
        const weaponarray = $('.empty').toArray();
        const position = weaponarray[Math.floor(Math.random() * weaponarray.length)];
        $(position).attr('class', this.name);
    }
}
