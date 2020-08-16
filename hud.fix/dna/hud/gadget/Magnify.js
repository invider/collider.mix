'use strict'

//@depends(/dna/hud/Window)
const Window = dna.hud.Window
//@depends(/dna/hud/Pane)
const Pane = dna.hud.Pane

function toImage(imageData) {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);

    let image = new Image();
    image.src = canvas.toDataURL();
    return image;
}

const ContentPane = function(dat) {
    sys.augment(this, dat)
}
ContentPane.prototype = Object.create(Pane.prototype)

ContentPane.prototype.drawContent = function() {
    this.__.verifyZPosition()
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, this.w, this.h)

    const mx = Math.ceil(this.__.hRes/2)
    const my = Math.ceil(this.__.vRes/2)

    if (env.mouse.x !== this.lx || env.mouse.y !== this.ly) {
        this.lx = env.mouse.x
        this.ly = env.mouse.y
        const baseX = this.lx - mx
        const baseY = this.ly - my 

        const imgData = ctx.getImageData(baseX, baseY,
            this.__.hRes, this.__.vRes)
        const pixels = imgData.data
        const img = toImage(imgData)

        const i = 4*(this.__.hRes * my + mx)
        const colorValue = '#'
                + pixels[i  ].toString(16)
                + pixels[i+1].toString(16)
                + pixels[i+2].toString(16)
        this.__.status = colorValue

        const cp = this
        setTimeout(() => cp.img = img, 100)
    }

    if (!this.img) return
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.img, 0, 0, this.w, this.h)

    const hScale = this.w/this.__.hRes
    const vScale = this.h/this.__.vRes
    ctx.strokeStyle = '#ffff00'
    ctx.lineWidth = 1
    ctx.strokeRect(mx*hScale, my*vScale, hScale, vScale)
    

    //ctx.putImageData(imgData, this.__.x, this.__.y);

    /*
    // Loop over each pixel and invert the color.
    for (var i = 0, n = pix.length; i < n; i += 4) {
        pix[i  ] = 255 - pix[i  ]; // red
        pix[i+1] = 255 - pix[i+1]; // green
        pix[i+2] = 255 - pix[i+2]; // blue
        // i+3 is alpha (the fourth element)
    }
    */
}

const defaults = {
    title: 'Magnify',
    x: 0,
    y: 0,
    w: 300,
    h: 340,
    hRes: 33,
    vRes: 33,
    clip: true,
    resizable: false,
    closable: false,
}

let instances = 0

// magnifies an area around the mouse cursor
const Magnify = function(dat) {
    if (!this.name) this.name = 'magnify' + ++instances
    sys.supplement(this, defaults)

    dat.pane = new ContentPane()
    Window.call(this, dat)
    sys.augment(this, dat)
}
Magnify.prototype = Object.create(Window.prototype)

Magnify.prototype.verifyZPosition = function() {
    // make sure we are on top of things
    if (!(this.__._ls[this.__._ls.length-1] instanceof Magnify)) {
        log.out('fixing POS for ' + (this.__._ls[this.__._ls.length-1] instanceof Magnify))
        this.__.detach(this)
        this.__.attach(this)
    }
}

module.exports = Magnify
