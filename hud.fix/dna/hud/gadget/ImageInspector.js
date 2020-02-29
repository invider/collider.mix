'use strict'

// @depends(/dna/hud/Pane)
const Pane = dna.hud.Pane

function ImageInspector(st) {
    Pane.call(this, st)
}
ImageInspector.prototype = Object.create(Pane.prototype)

ImageInspector.prototype.open = function(next) {
    this.img = null

    if (next instanceof HTMLImageElement) {
        this.img = next
    }
}

ImageInspector.prototype.drawContent = function() {
    if (this.img) {
        blocky()
        image(this.img, 0, 0, this.w, this.h)
    } else {
        fill(.7, .3, .3)
    }
}
