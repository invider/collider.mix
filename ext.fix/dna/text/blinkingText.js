//
// blinking text factory
//
// create by passing the construction object: {
//     font: text font, e.g. '32px zekton'
//     align: text alignment against coordinates (left/right/center)
//     fillStyle: the color string for the text, e.g. '#ffffff'
//     x: y: coordinates
//         or as an alternative
//     rx: ry: relative coordinates in percents,
//             e.g. 50x50 for the screen center
// }
//
let BlinkingText = function(dat) {
    this.align ="center";
    this.font = '72px zekton'
    this.fillStyle = '#FFA000'
    
    sys.augment(this, dat)

    if (dat.rx) this.x = dat.rx/100 * ctx.width
    else this.x = dat.x
    if (dat.ry) this.y = dat.ry/100 * ctx.height
    else this.y = dat.y
}

BlinkingText.prototype.evo = function(dt) {
}

BlinkingText.prototype.draw = function() {
    ctx.font = this.font
    ctx.textAlign = this.align
    ctx.fillStyle = this.fillStyle

    ctx.fillText(this.txt, this.x, this.y) 
}

module.exports = function(dat) {
    return new BlinkingText(dat)
}
