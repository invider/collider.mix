const df = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    iw: 0,
    ih: 0,
    step: 32,
    blocky: true,
}

/*
 * a grid of tiles
 *
 * Allows to create and show a grid of tiles
 * based on provided tileset and tilex map.
 *
 * A tileset is a set of tiles created by
 * slicing a regular image into fixed-size cells.
 * Each cell has a number called tilex.
 * The indexing starts from 0 and goes left-to-right
 * and top-down.
 * We can use tilex to address a particular cell
 * in the tileset.
 *
 * A tilex map defines tilexes for each cell
 * in the grid.
 *
 * To construct:
 *     lab.spawn('Tiles', {
 *         name: 'platform',
 *         x: 0,     // platform X offset
 *         y: 0,     // platform Y offset
 *         iw: 16,   // width in tiles
 *         ih: 16,   // height in tiles
 *         step: 32, // cell width
 *         data: tilexMap,    // array of integers
 *                            // each is a tilex in the provided tileset
 *         tileset: tileSet,  // can be created directly in /res
 *                            // with classifier like 'tileset.map16x16.png'
 *     }
 *
 * Tilex map is just an array of integer values
 * each representing a tilex in the provided tileset, e.g.:
 *
 *     tileset: [ -1, 1, 1, -1, -1, 0, 0, -1]
 * In this example, for a grid of 4x2,
 * the top row has two tilex blocks #1.
 * Negative values are the missing tiles and going to be transparent.
 * The second row has two #0 tilex blocks in the middle
 * and transparent spaces to the left and right.
 *
 * Tilexes #0 and #1 are the first and the second cells
 * in the provided tileset.
 *
 * Tiles don't have any defined physics or behavior
 * and must be extended to provided those.
 *
 * You can use tiles.pick(x, y) to get a tilex
 * for provided coordinates.
 */
class Tiles {

    constructor(st) {
        augment(this, df)
        augment(this, st)
        this.adjust()
    }

    // a service call to adjust tiles position and size
    adjust() {
        if (!this.w) this.w = this.iw * this.step
        if (!this.h) this.h = this.ih * this.step
    }

    // render tiles within viewport
    draw() {
        const sx = this.x
        const sy = this.y
        const step = this.step

        let vp = false
        if (this.viewport) vp = this.viewport()

        let stx = 0
        let sty = 0
        let etx = this.iw
        let ety = this.ih

        if (vp) {
            stx = Math.floor((vp[0] - sx)/step)
            if (stx < 0) stx = 0
            else if (stx > this.iw) return // out of viewport

            sty = Math.floor((vp[1] - sy)/step)
            if (sty < 0) sty = 0
            else if (sty > this.ih) return // out of viewport

            etx = Math.ceil((vp[2] - sx)/step)
            if (etx > this.iw) etx = this.iw
            else if (etx < 0) return // out of viewport

            ety = Math.ceil((vp[3] - sy)/step)
            if (ety > this.ih) ety = this.ih
            else if (ety < 0) return // out of viewport
        }

        if (this.blocky) blocky()
        else smooth()

        for (let y = sty; y < ety; y++) {
            for (let x = stx; x < etx; x++) {
                const tilex = this.map[y * this.iw + x]
                if (tilex >= 0) {
                    this.tileset.draw(tilex,
                        sx + x*step,
                        sy + y*step,
                        step,
                        step
                    )
                }
            }
        }
    }

    // pick a tilex at coordinates
    pick(x, y) {
        const tx = floor((x - this.x)/this.step)
        const ty = floor((y - this.y)/this.step)
        return this.map[ty * this.iw + tx]
    }

    // collect a tilex to the list
    collect(x, y, ls) {
        const tx = floor((x - this.x)/this.step)
        const ty = floor((y - this.y)/this.step)
        const tilex = this.map[ty * this.iw + tx]
        if (ls) ls.push(tilex)
        return tilex
    }
}
