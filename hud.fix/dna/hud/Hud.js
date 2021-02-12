'use strict'

//
// top-level UI container that handles all the events
//
// @depends(/dna/hud/Container)
let instances = 0
let Hud = function(st) {
    this.name = 'hud' + ++instances
    dna.hud.Container.call(this, st)

    this.span = true
    this.transparent = true
    this.captured = []
    this.touched = []
    this.focused = []

    this.x = 0
    this.y = 0
    this.w = ctx.width
    this.h = ctx.height

    //sys.augment(this, st)
    
    // fix preset if not present
    //env.attach(sys.clone(dna.hud.preset), 'hud')
    this.saveSize()
}

const Container = dna.hud.Container
Hud.prototype = Object.create(Container.prototype)

Hud.prototype.init = function() {
    this.injectTraps()
}

Hud.prototype.injectTraps = function() {
    // append another trap on click event
    const hud = this
    const mod = this.getMod()
    const localTrap = mod.trap

    sys.after(localTrap, 'click', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return

        const x = hud.lx(e.pageX)
        const y = hud.ly(e.pageY)
        hud.onClick(x, y, e)
    })

    sys.after(localTrap, 'dblClick', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return

        const x = hud.lx(e.pageX)
        const y = hud.ly(e.pageY)
        hud.onDblClick(x, y, e)
    })

    sys.after(localTrap, 'mouseDown', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return

        const x = hud.lx(e.pageX)
        const y = hud.ly(e.pageY)
        hud.onMouseDown(x, y, e.buttons, e)
    })

    sys.after(localTrap, 'mouseUp', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return

        const x = hud.lx(e.pageX)
        const y = hud.ly(e.pageY)
        hud.onMouseUp(x, y, e.buttons, e)
    })


    sys.after(localTrap, 'mouseMove', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return

        const x = hud.lx(e.pageX)
        const y = hud.ly(e.pageY)
        hud.onMouseMove(x, y, e)
    })

    sys.after(localTrap, 'mouseWheel', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return

        const x = hud.lx(e.pageX)
        const y = hud.ly(e.pageY)
        hud.onMouseWheel(e.wheelDelta, x, y, e)
    })

    sys.after(localTrap, 'touchStart', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return

        let x = e.touches[0].clientX * (ctx.width/window.innerWidth) - hud.x
        let y = e.touches[0].clientY * (ctx.height/window.innerHeight) - hud.y
        hud.onTouchStart(x, y, e)
    })

    sys.after(localTrap, 'touchEnd', function(e) {
        if (hud.hidden || hud.disabled
                || hud._.hidden || hud._.disabled) return
        hud.onTouchEnd(e)
    })

    sys.after(localTrap, 'keyDown', function(e) {
        hud.onKeyDown(e)
    })

    sys.after(localTrap, 'keyUp', function(e) {
        hud.onKeyUp(e)
    })

    sys.after(localTrap, 'resize', function(e) {
        hud.expand()
        hud.adjust()
    })
}

Hud.prototype.style = function(path, source) {
    source = source? source : this._style
    source = source? source : env.hud
    return lib.hud.style(path, source)
}

// a service call to save the size to use by isResized() later
Hud.prototype.saveSize = function() {
    this._w = this.w
    this._h = this.h
}

// a service call to test if the hud has been resized
Hud.prototype.isResized = function() {
    return (this._w !== this.w || this._h !== this.h)
}

// called when hud needs to update it's position and size
Hud.prototype.adjust = function() {
    Container.prototype.adjust.call(this)
    this.saveSize()
}


// translate global x to local coordinates
// @param {number} x - global x
// @returns {number} - local x
Hud.prototype.lx = function(x) {
    return x - this.x
}

// translate global y to local coordinates
// @param {number} y - global y
// @returns {number} - local y
Hud.prototype.ly = function(y) {
    return y - this.y
}

// translate x,y to local coordinate system
// @param {number} x - global x
// @param {number} y - global y
// @returns {object/2d-vector} - {x,y} in local coordinates
Hud.prototype.lxy = function(x, y) {
    return {
        x: x - this.x,
        y: y - this.y,
    }
}

// translate local x to global coordinates
// @param {number} x - local x
// @returns {number} - global x
Hud.prototype.gx = function(x) {
    return x + this.x
}

// translate local y to global coordinates
// @param {number} y - local y
// @returns {number} - global y
Hud.prototype.gy = function(y) {
    return y + this.y
}

// translate x,y to parent node coordinate system
// @param {number} x - local x
// @param {number} y - local y
// @returns {object/2d-vector} - {x,y} in parent node coordinates
Hud.prototype.gxy = function(x, y) {
    return {
        x: x + this.x,
        y: y + this.y,
    }
}


// handles mouse down event
// @param {number} x
// @param {number} y
// @param {number} b - buttons mask form the mouse event
// @param {object} e - original mouse event
// @returns {boolean} - true if focus is captured
Hud.prototype.onMouseDown = function(x, y, b, e) {
    return Container.prototype.onMouseDown.call(this, x, y, b, e)
}

// handle mouse up event
// @param {number} x
// @param {number} y
// @param {number} b - buttons mask form the mouse event
// @param {object} e - original mouse event
// @returns {boolean} - true if focus is captured
Hud.prototype.onMouseUp = function(x, y, b, e) {
    this.captured.forEach(g => {
        if (sys.isFun(g.onMouseUp)) g.onMouseUp(x, y, e)
    })
    Container.prototype.onMouseUp.call(this, x, y, b, e)
    this.releaseMouse()
}

// handle mouse move event
// @param {number} x
// @param {number} y
// @param {object} e - original mouse event
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

// a service call to handle touch end events 
// @param {object} e - an original touch event object
Hud.prototype.onTouchEnd = function(e) {
    this.releaseTouch(e)
}


// a service call to handle key down events
// @param {object} e - an original key event
Hud.prototype.onKeyDown = function(e) {
    this.focused.forEach(g => {
        if (sys.isFun(g.onKeyDown)) g.onKeyDown(e)
    })
}

// a service call to handle key up events
// @param {object} e - an original key event
Hud.prototype.onKeyUp = function(e) {
    this.focused.forEach(g => {
        if (sys.isFun(g.onKeyUp)) g.onKeyUp(e)
    })
}

// a service call to expand the hud to the whole screen
Hud.prototype.expand = function() { // calculate operating area
    this.x = 0
    this.y = 0
    this.w = ctx.width
    this.h = ctx.height
}

// a service call tracking gadget mouse capture
// Includes a gadget into the captured list.
// @param {object} gadget
Hud.prototype.captureMouse = function(gadget) {
    gadget._captured = true
    if (this.captured.indexOf(gadget) < 0) this.captured.push(gadget)
}

// a service call to clear the captured gadgets list
Hud.prototype.releaseMouse = function() {
    this.captured.forEach(g => {
        g._captured = false
    })
    this.captured = []
}

// a service call for tracking touched gadgets
// Includes a gadget into the captured list.
// @param {object} gadget
Hud.prototype.captureTouch = function(gadget) {
    gadget._touched = true
    if (this.touched.indexOf(gadget) < 0) this.touched.push(gadget)
}

// a service call to clear the touched gadgets list
Hud.prototype.releaseTouch = function(e) {
    this.touched.forEach(g => {
        g._touched = false
        if (sys.isFun(g.onTouchEnd)) g.onTouchEnd(e)
    })
    this.touched = []
}

// a service call to track focused gadgets
// Includes a gadget into the focused list
// @param {object/gadget}
Hud.prototype.captureFocus = function(gadget) {
    if (this.focused.indexOf(gadget) < 0) {
        gadget.focus = true
        if (sys.isFun(gadget.onFocus)) gadget.onFocus()
        this.focused.push(gadget)
    }
}

// a service call to clear the focused gadgets list
// @param {object/gadget}
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

// draw the hud
Hud.prototype.draw = function() {
    if (this.span) this.expand()
    if (this.isResized()) this.adjust()
    Container.prototype.draw.call(this)
}

module.exports = Hud
