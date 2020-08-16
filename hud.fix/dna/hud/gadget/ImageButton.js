'use strict'

const Button = dna.hud.gadget.Button

const defaults = {
    x: 0,
    y: 0,
    w: 100, 
    h: 100, 
    text: '',
    base: res.hud.buttonPane,
    font: env.hud.font,
    fontHeight: env.hud.baseHeight,
    scale: 1,
    imgScale: 1,
    hoverZoom: 0.02,
    toggleZoom: -0.02,
    imageX: 0,
    imageY: 0,
}

// a button with an icon
const ImageButton = function(dat) {
    sys.supplement(this, defaults)
    Button.call(this, dat)
    this.adjust()
}
ImageButton.prototype = Object.create(Button.prototype)

ImageButton.prototype.adjust = function() {
    this.w = this.base.width * this.scale
    this.h = this.base.height * this.scale
}

ImageButton.prototype.drawBackground = function() {
    let sh = 0, sv = 0
    if (this.toggled) {
        sh = this.w * this.toggleZoom
        sv = this.h * this.toggleZoom
    } else if (this._hover) {
        sh = this.w * this.hoverZoom
        sv = this.h * this.hoverZoom
    }
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.base, this.x-sh, this.y-sv, this.w+sh*2, this.h+sv*2)
}

ImageButton.prototype.drawImage = function() {
    let sh = 0, sv = 0
    if (this.toggled) {
        sh = this.img.width * this.toggleZoom
        sv = this.img.height * this.toggleZoom
    } else if (this._hover) {
        sh = this.img.width * this.hoverZoom
        sv = this.img.height * this.hoverZoom
    }

    const x = this.x + this.w/2 - this.img.width/2 * this.imgScale
    const y = this.y + this.h/2 - this.img.height/2 * this.imgScale
    ctx.drawImage(this.img, x - sh, y - sh,
        (this.img.width + sh*2) * this.imgScale,
        (this.img.height + sv*2) * this.imgScale)
}

ImageButton.prototype.draw = function() {
    this.drawBackground()
    if (this.img) this.drawImage()
    if (this.text) this.drawContent()
}

module.exports = ImageButton
