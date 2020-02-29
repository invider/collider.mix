'use strict'

let instances = 0

const Progress = function(dat) {
    instances++
    this.name = 'progress_' + instances

    this.x = 0
    this.y = 0
    this.w = 200
    this.h = 30 
    this.minValue = 0
    this.maxValue = 100
    this.value = this.minValue

    this.pad = 4
    this.color = {
        text: '#ff9000',
        foreground: '#A08020',
        background: '#301020',
    }

    sys.augment(this, dat)

    if (dat.horizontal === undefined) {
        if (this.w > this.h) this.horizontal = true
        else this.horizontal = false
    }
}

Progress.prototype.getText = function() {
    return '' + Math.round(((this.value-this.minValue)/(this.maxValue-this.minValue)) * 100) + '%'
}

Progress.prototype.draw = function() {
    ctx.fillStyle = this.color.background
    ctx.fillRect(this.x, this.y, this.w, this.h)

    const progress = (this.value-this.minValue)/(this.maxValue-this.minValue)
    ctx.fillStyle = this.color.foreground
    if (this.horizontal) {
        ctx.fillRect(this.x+this.pad, this.y+this.pad, (this.w-this.pad*2) * progress, this.h-this.pad*2)
    } else {
        ctx.fillRect(this.x+this.pad, this.y+this.pad + (this.h-this.pad*2)*(1-progress),
            this.w-this.pad*2, (this.h-this.pad*2) * progress)
    }

    // normalize value within limints
    this.value = lib.math.limit(this.value, this.minValue, this.maxValue)
    const text = this.getText()
    ctx.fillStyle = this.color.text
    ctx.font = this.font
    ctx.textBaseline = 'middle'
    ctx.textAlign = "center"
    ctx.fillText(text, this.x + this.w/2, this.y + this.h/2);
}

module.exports = Progress


