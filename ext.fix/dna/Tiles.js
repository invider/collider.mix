const df = {
    x: 0,
    y: 0,
    tw: 0,
    th: 0,
    step: 32,
}

class Tiles {

    constructor(st) {
        augment(this, df)
        augment(this, st)
    }

    drawTile(tilex, x, y) {
        this.tileset.draw(tilex, x, y, this.step, this.step)
    }

    draw() {
        const sx = this.x
        const sy = this.y

        let vp = false
        if (this.viewport) vp = this.viewport()

        let stx = 0
        let sty = 0
        let etx = this.tw
        let ety = this.th

        if (vp) {
            stx = Math.floor((vp[0] - sx)/this.step)
            if (stx < 0) stx = 0
            else if (stx > this.tw) return // out of viewport

            sty = Math.floor((vp[1] - sy)/this.step)
            if (sty < 0) sty = 0
            else if (sty > this.th) return // out of viewport

            etx = Math.ceil((vp[2] - sx)/this.step)
            if (etx > this.tw) etx = this.tw
            else if (etx < 0) return // out of viewport

            ety = Math.ceil((vp[3] - sy)/this.step)
            if (ety > this.th) ety = this.th
            else if (ety < 0) return // out of viewport
        }

        for (let y = sty; y < ety; y++) {
            for (let x = stx; x < etx; x++) {
                const tilex = this.map[y * this.tw + x]
                if (tilex >= 0) {
                    this.drawTile(tilex,
                        sx + x*this.step,
                        sy + y*this.step
                    )
                }
            }
        }
    }

    pick(x, y, ls) {
        const tx = floor((x - this.x)/this.step)
        const ty = floor((y - this.y)/this.step)
        const tilex = this.map[ty * this.tw + tx]
        if (ls) ls.push(tilex)
        return tilex
    }
}
