class Board {
    constructor(line, column) {
        this.line = line;
        this.column = column;
    }

    // Initialisation du plateau

    initBoard() {
        const table = $("#gameboard");
        const tbody = $('<tbody></tbody>').appendTo(table);
        for (let rows = 0; rows < this.line; rows++) {
            const row = $('<tr></tr>').appendTo(tbody);
            for (let cols = 0; cols < this.column; cols++) {
                const cell = $('<td></td>').appendTo(row)
                    .attr('data-line', rows)
                    .attr('data-col', cols)
                    .attr('class', 'empty');
                $('.empty').off('click');
            }
        }
    }

    // Initialisation des murs

    createWall(nbcell) {

        const array = $('.empty').toArray();
        for (let i = 0; i < nbcell; i++) {
            const wallposition = array[Math.floor(Math.random() * array.length)];
            $(wallposition).removeClass('empty').addClass('wall');

        }
    }

    // Attribution des côtés de la carte

    createArea() {
        $('[data-col]').each(function () {
            if ($(this).data('col') < 3 && $(this).is(".empty") === true) {
                $(this).attr('class', 'area1');
            }
        });
        $('[data-col]').each(function () {
            if ($(this).data('col') > 6 && $(this).is(".empty") === true) {
                $(this).attr('class', 'area2');
            }
        });
    }
}
