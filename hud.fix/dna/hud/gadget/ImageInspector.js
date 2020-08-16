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
        image(this.img, 0, 0, this.w, this.h)
    } else {
        fill(.7, .3, .3)
    }
}

ImageInspector.prototype.onKeyDown = function(e) {
    if (this.closable && e.key === 'Escape') {
        this.detach()
    }
}
