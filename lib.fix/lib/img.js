'use strict'

// image manipulation tools

// construct tileset from the image
const TileSet = function(img, sx, sy, tw, th) {
    this.img = img
    this.sx = sx
    this.sy = sy
    this.tw = tw
    this.th = th
    this.iw = floor((img.width - this.sx) / this.tw)
    this.ih = floor((img.height - this.sy) / this.th)
}

// a service call to setup the drawing context
TileSet.prototype.init = function() {
    this.drawImage = image
}

// clone current tileset
TileSet.prototype.clone = function() {
    return new TileSet(this.img, this.sx, this.sy, this.tw, this.th)
}

// draw the tiles
TileSet.prototype.draw = function(tilex, x, y, w, h) {
    w = (w || this.tw) | 0
    h = (h || this.th) | 0

    const ix = tilex % this.iw
    const iy = floor(tilex / this.iw)
    const tx = (ix * this.tw + this.sx) | 0
    const ty = (iy * this.th + this.sy) | 0

    // WARNING! A dirty hack is needed to prevent tile artifacts!
    // For some stupid reason we need to fix integer coordinates with floats
    // to avoid out-of-range pixels getting rendered :(
    // The sub-pixel 0.1 shift is selected empirically and seems to work.
    this.drawImage(this.img, tx+.1, ty+.1, this.tw-.2, this.th-.2, x, y, w, h)
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

    // determine if object is a drawable image
    // @param {object} target
    isDrawableImage: function(target) {
        return (
               target instanceof HTMLImageElement
            || target instanceof HTMLCanvasElement
            || target instanceof SVGImageElement
            || target instanceof HTMLVideoElement
            // OffscreenCanvas is experimental, so can be undefined
            || (typeof OffscreenCanvas !== 'undefined'
                && (target instanceof OffscreenCanvas))
            || (typeof ImageBitmap !== 'undefined'
                && (target instanceof ImageBitmap))
        )
    },
}
