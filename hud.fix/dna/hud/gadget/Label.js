'use strict'

// @depends(/env/hud)

let instances = 0

// a static text label
const Label = function Label(dat) {
    this.name = 'label' + ++instances
    this.textAlign = "left"
    this.textBaseline = 'top'

    if (!dat) dat = {}
    else if (sys.isString(dat)) dat = { text: dat }

    sys.augment(this, dat)

    // must follow preconfigure
    if (dat.text) this.setText(dat.text)
    else this.setText('Label ' + instances)
}

Label.prototype.init = function() {
    this.setStyle('label')
}

Label.prototype.setStyle = function(base) {
    // preconfigure
    // TODO use addPath function here to properly join
    this.color = this.__.style(base + '/content')
    this.font = this.__.style(base + '/font')
    this.adjust()
}

Label.prototype.adjust = function() {
    ctx.font = this.font
    this.tw = ctx.measureText(this.text).width
    this.th = parseInt(this.font)
    this.w = this.tw
    this.h = this.th
}

// set label text
// @param {string} text
Label.prototype.setText = function(text) {
    this.text = text
    this.adjust()
}

Label.prototype.draw = function() {
    ctx.fillStyle = this.color
    ctx.font = this.font
    ctx.textAlign = this.textAlign
    ctx.textBaseline = this.textBaseline
    ctx.fillText(this.text, this.x, this.y);
}

return Label
