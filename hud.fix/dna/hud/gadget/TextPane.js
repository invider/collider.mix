'use strict'

// @depends(/dna/hud/Pane)
const Pane = dna.hud.Pane

const defaultStyle = {
    wrap: true,
    padding: 10,
    lineSpacing: 5,
}

function TextPane(st) {
    this.tx = 0
    this.ty = 0

    const s = env.hud
    this.style = {
        font: s.font,
        base: s.base,
        content: s.content,
    }
    augment(this.style, defaultStyle)

    // create an empty page
    this.page = {
        w: 0,
        h: 0,
        blocks: [],
    }

    Pane.call(this, st)
}
TextPane.prototype = Object.create(Pane.prototype)

TextPane.prototype.setText = function(txt) {
    this.text = txt
    this.adjust()
}

TextPane.prototype.adjust = function() {
    this.prerender()
    this.moveTo(this.ty)
}

// move text pane to y coordinate
// the value is bounded by [0 .. page.h-view.h]
TextPane.prototype.moveTo = function(y) {
    this.ty = limit(y, 0, max(this.page.h - this.h, 0))
}

// scroll the view up or down by value determined in [dy]
TextPane.prototype.scroll = function(dy) {
    this.moveTo(this.ty + dy)
}

TextPane.prototype.prerender = function() {
    if (!this.text) this.text = ''

    const wrap = this.style.wrap
    const pad = this.style.padding
    const lineSpacing = this.style.lineSpacing

    const fnt = this.style.font
    font(fnt)
    let th = textHeight()
    const spaceWidth = textWidth(' ')

    let x = pad
    let y = pad
    const w = this.w - 2*pad
    const h = this.h - 2*pad

    const page = {
        w: 0,
        h: 0,
        blocks: [],
    }

    function lineFeed() {
        // move cursor to the next line
        y += th + lineSpacing
        x = pad
    }

    function slide(tw) {
        x += tw
    }

    function print(txt, tw) {
        page.blocks.push({
            x: x,
            y: y,
            w: tw,
            h: th,
            t: txt,
        })
        x += tw
        const ph = y + th
        if (ph > page.h) page.h = ph
        if (x > page.w) page.w = x
    }

    function println(txt, dx) {
        print(txt, dx)
        lineFeed()
    }

    function renderWord(word) {
        const ww = textWidth(word)
        if (x + ww > w && x > pad) {
            lineFeed()
            print(word, ww + spaceWidth)
        } else {
            print(word, ww + spaceWidth)
        }
    }

    function renderLine(line) {
        const lw = textWidth(line)
        if (wrap) {
            if (x + lw > w) {
                // time to split!
                const words = line.split(/(\s+)/)
                for (let i = 0; i < words.length; i++) {
                    renderWord(words[i])
                }

            } else {
                println(line, lw)
            }

        } else {
            println(line, lw)
        }
    }

    function renderContent(content) {
        const lines = content.split(/[\r\n]/g)
        for (let i = 0; i < lines.length; i++) {
            renderLine(lines[i])
        }
    }

    renderContent(this.text)
    this.page = page
}

TextPane.prototype.drawContent = function() {
    const s = this.style

    font(s.font)
    fill(s.content)
    alignLeft()
    baseTop()

    for (let i = 0; i < this.page.blocks.length; i++) {
        const b = this.page.blocks[i]

        // clip if outside the range
        if (b.y+b.h >= this.ty
                && b.y < this.ty + this.h
                && b.x+b.w >= this.tx
                && b.x < this.tx + this.w) {
            text(b.t, b.x - this.tx, b.y - this.ty)
        }
    }

}

TextPane.prototype.drawBackground = function() {
    background(this.style.base)
}
