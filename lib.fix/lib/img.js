'use strict'

// image manipulation tools

// construct tileset from the image
var TileSet = function(img, sx, sy, tw, th) {
    this.img = img
    this.sx = sx
    this.sy = sy
    this.tw = tw
    this.th = th
    this.smooth = false
}

TileSet.prototype.init = function() {
    this.ctx = this._.ctx
}

TileSet.prototype.draw = function(tilex, x, y, w, h) {
    if (!w) w = this.tw
    if (!h) h = this.th

    let ix = this.sx + tilex*this.tw
    let iy = this.sy + this.th * Math.floor(ix / this.img.width)
    ix = ix % this.img.width
    if (this.ctx){
        this.ctx.imageSmoothingEnabled = this.smooth
        this.ctx.drawImage(this.img, ix, iy, this.tw, this.th, x, y, w, h)
    } else {
        debugger;
        console.error("No context");
    }
}

module.exports = {
    TileSet: TileSet,

    // make a screenshot and download with specified filename
    screenshot: function(filename) {
        if (!filename) filename = 'jam-screenshot'
        // open in a new tab
        // window.open(ctx.canvas.toDataURL('image/png'));
        let dataURL = ctx.canvas.toDataURL('image/png');

        this.downloadDataURL(dataURL, filename)
    },

    // make a screenshot of a screen area
    screenshotArea: function(filename, x, y, w, h) {
        if (!filename) filename = 'jam-screenshot'
        const idata = ctx.getImageData(x, y, w, h)
        const dataURL= this.imgToDataURL(idata)

        this.downloadDataURL(dataURL, filename)
    },

    // download a data url by creating a hyperlink and clicking it
    downloadDataURL: function(dataURL, name, ext) {
        if (!name) name = 'jam-image'
        if (!ext) ext = 'png'
        let a  = document.createElement('a');
        a.href = dataURL;
        a.download = name + '.' + ext
        a.click()
    },

    // convert image to a canvas with the same size and image content
    imgToCanvas: function(img) {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height

        if (img instanceof ImageData) {
            context.putImageData(img, 0, 0)
        } else {
            context.drawImage(img, 0, 0, img.width, img.height)
        }
        return canvas
    },

    // convert image to a data url
    imgToDataURL: function(img, type) {
        if (!type) type = 'image/png'
        return this.imgToCanvas(img).toDataURL(type)
    },

    // get image data from a provided image
    imgData: function(img) {
        const canvas = this.imgToCanvas(img)
        const context = canvas.getContext('2d')
        return context.getImageData(0, 0, img.width, img.height)
    },

    isDrawableImage: function(target) {
        return (
               target instanceof HTMLImageElement
            || target instanceof HTMLCanvasElement
            || target instanceof SVGImageElement
            || target instanceof HTMLVideoElement
            // OffscreenCanvas is experimental, so can be undefined
            || (typeof OffscreenCanvas !== 'undefined'
                && (target instanceof OffscreenCanvas))
            || target instanceof ImageBitmap
        )
    },
}
