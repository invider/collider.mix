'use strict'

// TODO move up the hierarchy, since this is not a gadget by itself

// @depends(/env/hud)
// @depends(/dna/hud/Container)
const Container = dna.hud.Container

const Touch = function(dat) {
    sys.augment(this, dat)
}
Touch.prototype.draw = function() {
    //ctx.fillStyle = '#ff0000'
    //ctx.fillRect(this.x, this.y, this.w, this.h)
}

const Bar = function(dat) {
    this.name = 'bar'
    sys.augment(this, dat)
}
Bar.prototype.adjust = function() {
    const s = this.__
    const up = s.up
    const down = s.down 
    this.bh = s.h-s.barPadding*2

    const p = s.pos/s.max
    const l = s.span/s.max
    this.y = max(this.by + this.bh*p, s.barPadding)
    this.h = min(this.bh*l, s.h - s.barPadding*2)
    this.w = s.w - s.barPadding*2

    up.h = this.y
    up.w = this.w
    down.y = this.y + this.h
    down.h = s.h - down.y
    down.w = this.w
    
}
Bar.prototype.draw = function() {
    this.adjust()

    ctx.fillStyle = '#808080'
    ctx.fillRect(this.x, this.y, this.w, this.h)
    /*
    ctx.fillStyle = env.hud.preset.color
    ctx.font = env.hud.preset.font
    ctx.textBaseline = 'middle'
    ctx.textAlign = "center"
    ctx.fillText(Math.round(this.__.pos), this.x + this.w/2, this.y + this.h/2);
    */
}

Bar.prototype.onMouseDrag = function(dx, dy) {
    const move = dy/this.bh
    this.__.drag(this.__.max * move)
}

let instances = 0

// can be used to select a range of values in the span between min and max
// Use inside a composite component that needs a scrollbar-like functionality -
// e.g. a scrollable text field.
const Slider = function(dat) {
    instances++
    this.name = 'slider' + instances

    this.clip = false
    this.disabled = false
    this.hidden = false

    this.x = 0
    this.y = 0
    this.w = 10
    this.h = 100

    this.pos = 0
    this.span = 20
    this.step = this.span/2
    this.max = 100
    this.scrollSpeed = 1

    this.barPadding = 2
    dna.hud.Container.call(this, dat)

    const slider = this
    this.attach(new Touch({
        name: 'up',
        x: 0,
        y: 0,
        w: this.w,
        h: 0,
        onClick: () => slider.drag(-this.step),
    }))
    this.attach(new Touch({
        name: 'down',
        x: 0,
        y: this.h-40,
        w: this.w,
        h: 0,
        onClick: () => slider.drag(this.step),
    }))
    this.attach(new Bar({
        by: this.barPadding,
        x: this.barPadding,
        w: this.w-this.barPadding*2,
        y: 0,
        h: 0,
    }))
}
Slider.prototype = Object.create(Container.prototype)

Slider.prototype.onMouseDown = function(x, y, e) {
    this.active = true
    this.captureMouse(this)
    Container.prototype.onMouseDown.call(this, x, y, e)
}

Slider.prototype.onMouseUp = function(x, y, e) {
    this.active = false
    Container.prototype.onMouseUp.call(this, x, y, e)
}

Slider.prototype.onMouseWheel = function(d, x, y, e) {
    if (d < 0) {
        this.drag(this.scrollSpeed)
    } else if (d > 0) {
        this.drag(-this.scrollSpeed)
    }
}

// move slider and trigger onScroll() event
// @param {number} step - steps to move, can be negative if moving up
Slider.prototype.drag = function(step) {
    this.slide(step)
    this.onScroll(this.pos)
}

// scroll event handler
Slider.prototype.onScroll = function(pos) {}

// slide for specified steps
// @param {number} step - number of steps, can be negative if moving up
Slider.prototype.slide = function(step) {
    const maxPos = max(this.max-this.span, 0)
    this.pos = limit(this.pos+step, 0, maxPos)
}

// set the slider position
Slider.prototype.set = function(pos) {
    const maxPos = max(this.max-this.span, 0)
    this.pos = limit(pos, 0, maxPos)
}

// get current value
Slider.prototype.val = function() {
    return Math.round(this.pos)
}

// get the slider top value - it's position + span limited by max
Slider.prototype.top = function() {
    const top = Math.round(this.pos + this.span)
    return min(top, this.max)
}

Slider.prototype.drawBackground = function() {
    if (this.active) ctx.fillStyle = '#45454570'
    else ctx.fillStyle = '#40404060'
    ctx.fillRect(0, 0, this.w, this.h)
}

module.exports = Slider
