'use strict'

// @depends(/dna/hud/Pane)
const Pane = dna.hud.Pane

// shows image nodes
function ImageInspector(st) {
    Pane.call(this, st)
}
ImageInspector.prototype = Object.create(Pane.prototype)

// open an image contained in a node
// @param {object/image} next
ImageInspector.prototype.open = function(next) {
    this.img = null

    if (lib.img.isDrawableImage(next)) {
        this.img = next
    }
}

ImageInspector.prototype.drawContent = function() {
    if (this.img) {
        blocky()
        const hScale = this.w/this.img.width
        const vScale = this.h/this.img.height
        const scale = hScale > vScale? vScale : hScale

        const w = this.img.width * scale
        const h = this.img.height * scale
        const x = (this.w - w)/2
        const y = (this.h - h)/2

        image(this.img, x, y, w, h)
    } else {
        fill(.7, .3, .3)
    }
}

ImageInspector.prototype.onKeyDown = function(e) {
    if (this.closable && e.key === 'Escape') {
        this.detach()
    }
}
