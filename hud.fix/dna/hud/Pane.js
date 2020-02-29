'use strict'

// a rudimentary graphical HUD component

const Pane = function(st) {
    this.x = 0
    this.y = 0
    this.w = 0
    this.h = 0
    sys.augment(this, st)
}

Pane.prototype.drawBackground = function() {} 

Pane.prototype.drawContent = function() {}

Pane.prototype.draw = function() {
    if (this.hidden) return
    ctx.save()
    ctx.translate(this.x, this.y)
    // clip
    ctx.beginPath()
    ctx.rect(0,0,this.w,this.h)
    ctx.clip()

    this.drawBackground()
    this.drawContent()
    ctx.restore()
}

module.exports = Pane
