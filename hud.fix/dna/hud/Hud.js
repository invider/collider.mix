'use strict'

//
// top-level UI container that handles all the events
//
// @depends(/dna/hud/Container)
let instances = 0
let Hud = function(dat) {
    this.name = 'hud' + ++instances
    dna.hud.Container.call(this, dat)

    this.span = true
    this.transparent = true
    this.captured = []
    this.touched = []
    this.focused = []

    this.x = 0
    this.y = 0
    this.w = ctx.width
    this.h = ctx.height

    //sys.augment(this, dat)
    
    // fix preset if not present
    //env.attach(sys.clone(dna.hud.preset), 'hud')

    // append another trap on click event
    let hud = this

    sys.after(trap, 'click', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return

        const x = hud.lx(e.pageX)
        const y = hud.ly(e.pageY)
        hud.onClick(x, y, e)
    })

    sys.after(trap, 'dblClick', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return

        const x = hud.lx(e.pageX)
        const y = hud.ly(e.pageY)
        hud.onDblClick(x, y, e)
    })

    sys.after(trap, 'mouseDown', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return

        const x = hud.lx(e.pageX)
        const y = hud.ly(e.pageY)
        hud.onMouseDown(x, y, e.buttons, e)
    })

    sys.after(trap, 'mouseUp', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return

        const x = hud.lx(e.pageX)
        const y = hud.ly(e.pageY)
        hud.onMouseUp(x, y, e.buttons, e)
    })


    sys.after(trap, 'mouseMove', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return

        const x = hud.lx(e.pageX)
        const y = hud.ly(e.pageY)
        hud.onMouseMove(x, y, e)
    })

    sys.after(trap, 'mouseWheel', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return

        const x = hud.lx(e.pageX)
        const y = hud.ly(e.pageY)
        hud.onMouseWheel(e.wheelDelta, x, y, e)
    })

    sys.after(trap, 'touchStart', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return

        let x = e.touches[0].clientX * (ctx.width/window.innerWidth) - hud.x
        let y = e.touches[0].clientY * (ctx.height/window.innerHeight) - hud.y
        hud.onTouchStart(x, y, e)
    })

    sys.after(trap, 'touchEnd', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return
        hud.onTouchEnd(e)
    })

    sys.after(trap, 'keyDown', function(e) {
        hud.onKeyDown(e)
    })

    sys.after(trap, 'keyUp', function(e) {
        hud.onKeyUp(e)
    })

    sys.after(trap, 'resize', function(e) {
        hud.expand()
        hud.adjust()
    })

    this.saveSize()
}

const Container = dna.hud.Container
Hud.prototype = Object.create(Container.prototype)

Hud.prototype.style = function(path, source) {
    source = source? source : this._style
    source = source? source : env.hud
    return lib.hud.style(path, source)
}

Hud.prototype.saveSize = function() {
    this._w = this.w
    this._h = this.h
}

Hud.prototype.isResized = function() {
    return (this._w !== this.w || this._h !== this.h)
}

Hud.prototype.adjust = function() {
    Container.prototype.adjust.call(this)
    this.saveSize()
}

Hud.prototype.lx = function(x) {
    return x - this.x
}

Hud.prototype.ly = function(y) {
    return y - this.y
}



Hud.prototype.onMouseDown = function(x, y, b, e) {
    return Container.prototype.onMouseDown.call(this, x, y, b, e)
}

Hud.prototype.onMouseUp = function(x, y, b, e) {
    this.captured.forEach(g => {
        if (sys.isFun(g.onMouseUp)) g.onMouseUp(x, y, e)
    })
    Container.prototype.onMouseUp.call(this, x, y, b, e)
    this.releaseMouse()
}

Hud.prototype.onMouseMove = function(x, y, e) {
    const dx = _._$.env.mouse.x - _._$.env.mouse.lx
    const dy = _._$.env.mouse.y - _._$.env.mouse.ly
    this.captured.forEach(g => {
        if (sys.isFun(g.onMouseMove)) g.onMouseMove(dx, dy, e)
        if (sys.isFun(g.onMouseDrag)) g.onMouseDrag(dx, dy, e)
    })
    Container.prototype.onMouseMove.call(this, x, y, e)
}

/*
Hud.prototype.onTouchStart = function(x, y, e) {
    this.touched.forEach(g => {
        if (sys.isFun(g.onTouchStart)) g.onTouchStart(x, y, e)
    })
    return Container.prototype.onTouchStart.call(this, x, y, e)
}
*/

Hud.prototype.onTouchEnd = function(e) {
    this.releaseTouch(e)
}


Hud.prototype.onKeyDown = function(e) {
    this.focused.forEach(g => {
        if (sys.isFun(g.onKeyDown)) g.onKeyDown(e)
    })
}

Hud.prototype.onKeyUp = function(e) {
    this.focused.forEach(g => {
        if (sys.isFun(g.onKeyUp)) g.onKeyUp(e)
    })
}

Hud.prototype.expand = function() { // calculate operating area
    this.x = 0
    this.y = 0
    this.w = ctx.width
    this.h = ctx.height
}

Hud.prototype.captureMouse = function(gadget) {
    gadget._captured = true
    if (this.captured.indexOf(gadget) < 0) this.captured.push(gadget)
}

Hud.prototype.releaseMouse = function() {
    this.captured.forEach(g => {
        g._captured = false
    })
    this.captured = []
}

Hud.prototype.captureTouch = function(gadget) {
    gadget._touched = true
    if (this.touched.indexOf(gadget) < 0) this.touched.push(gadget)
}

Hud.prototype.releaseTouch = function(e) {
    this.touched.forEach(g => {
        g._touched = false
        if (sys.isFun(g.onTouchEnd)) g.onTouchEnd(e)
    })
    this.touched = []
}

Hud.prototype.captureFocus = function(gadget) {
    if (this.focused.indexOf(gadget) < 0) {
        gadget.focus = true
        if (sys.isFun(gadget.onFocus)) gadget.onFocus()
        this.focused.push(gadget)
    }
}

Hud.prototype.releaseFocus = function(gadget) {
    if (!gadget) {
        this.focused = []

    } else if (gadget.focus) {
        gadget.focus = false

        const i = this.focused.indexOf(gadget)
        if (i >= 0) {
            this.focused.splice(i, 1)
            if (sys.isFun(gadget.onUnfocus)) {
                gadget.onUnfocus()
            }
            if (sys.isFun(gadget.onReleasedFocus)) {
                gadget.onReleasedFocus()
            }
        }
    }
}

Hud.prototype.draw = function() {
    if (this.span) this.expand()
    if (this.isResized()) this.adjust()
    Container.prototype.draw.call(this)
}

module.exports = Hud
