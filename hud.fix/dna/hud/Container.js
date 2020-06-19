'use strict'

// an element to group and organize other elements

let instances = 0

const defaults = {
    clip: true,
    transparent: false, // don't draw background if true
    color: {
        background: '#32323470',
        active:  {
            frame: '#ffff00',
            background: '#343635B0',
        }
    },
    showActiveFrame: false,
}

let Container = function(dat) {
    // name can be assigned from child constructors!
    if (!this.name) this.name = 'container' + ++instances
    sys.supplement(this, defaults)

    sys.LabFrame.call(this, dat)
}
Container.prototype = Object.create(sys.LabFrame.prototype)

Container.prototype.style = function(path, source) {
    source = source? source : this._style
    return this.__.style(path, source)
}

Container.prototype.layout= function() {}

Container.prototype.adjust = function() {
    this.layout()
    for (let i = this._ls.length-1; i >= 0; i--) {
        const g = this._ls[i]
        if (sys.isFun(g.adjust)) g.adjust()
    }
}

Container.prototype.onAttached = function(node) {
    sys.LabFrame.prototype.onAttached.call(this, node)
    this.adjust()
}

Container.prototype.moveOnTop = function(i) {
    if (i < this._ls.length - 1) {
        const g = this._ls[i]
        this._ls.splice(i, 1)
        this._ls.push(g)
    }
}

Container.prototype.onClick = function(x, y, e) {
    //if (x < 0 || y < 0 || x > this.w || y > this.h) return
    //log.debug('click on [' + this.name + '] @' + x + 'x' + y)

    let pending = true

    for (let i = this._ls.length-1; i >= 0; i--) {
        const g = this._ls[i]
        if (g.hidden || g.disabled || !g._sizable) continue

        const lx = x - g.x
        const ly = y - g.y
        if (pending && lx >= 0 && lx <= g.w && ly >= 0 && ly <= g.h) {
            if (sys.isFun(g.onClick)) {
                g.onClick(lx, ly, e)
            }
            if (sys.isFun(g.onFocus)) {
                this.captureFocus(g)
                if (!g.keepZ) this.moveOnTop(i)
            }
            pending = false

        } 
    }
    return !pending
}

Container.prototype.onDblClick = function(x, y, e) {
    this._ls.forEach(g => {
        if (g.hidden || g.disabled || !g._sizable) return

        const lx = x - g.x
        const ly = y - g.y
        if (lx >= 0 && lx <= g.w && ly >= 0 && ly <= g.h) {
            if (sys.isFun(g.onDblClick)) {
                g.onDblClick(lx, ly, e)
            }
        }
    })
}

Container.prototype.onMouseDown = function(x, y, b, e) {
    if (x < 0 || y < 0 || x > this.w || y > this.h) return
    //log.debug('mouse down on [' + this.name + '] @' + x + 'x' + y)

    let pending = true
    for (let i = this._ls.length-1; i >= 0; i--) {
        const g = this._ls[i]
        if (g.hidden || g.disabled || !g._sizable) continue

        const lx = x - g.x
        const ly = y - g.y
        if (pending && lx >= 0 && lx <= g.w && ly >= 0 && ly <= g.h) {
            if (sys.isFun(g.onMouseDown)) {
                g.onMouseDown(lx, ly, e)
            }
            if (sys.isFun(g.onMouseDrag)) {
                this.captureMouse(g)
            }
            if (sys.isFun(g.onFocus)) {
                this.captureFocus(g)
                if (!g.keepZ) this.moveOnTop(i)
            }
            pending = false

        } else {
            this.releaseFocus(g)
        }
    }
    return !pending
}

Container.prototype.onMouseUp = function(x, y, b, e) {
    if (x < 0 || y < 0 || x > this.w || y > this.h) return
    //log.debug('mouse up on [' + this.name + '] @' + x + 'x' + y)
    this._ls.forEach(g => {
        if (g.hidden || g.disabled || !g._sizable) return

        if (sys.isFun(g.onMouseUp)) {
            const lx = x - g.x
            const ly = y - g.y
            if (!g._captured && (lx >= 0 && lx <= g.w && ly >= 0 && ly <= g.h)) {
                g.onMouseUp(lx, ly, e)
            }
        }
    })
}

Container.prototype.onMouseMove = function(x, y, e) {
    //if (x < 0 || y < 0 || x > this.w || y > this.h) return
    //log.debug('mouse move on [' + this.name + '] @' + x + 'x' + y)
    this._ls.forEach(g => {
        if (g.hidden || g.disabled || !g._sizable) return
        if (sys.isFun(g.onMouseMove)) {
            const lx = x - g.x
            const ly = y - g.y
            if (!g._captured && (lx >= 0 && lx <= g.w && ly >= 0 && ly <= g.h)) {
                if (!g._hover) {
                    g._hover = true
                    if (sys.isFun(g.onMouseEnter)) g.onMouseEnter(lx, ly, e)
                }
                g.onMouseMove(lx, ly, e)
            } else {
                g._hover = false
            }
        }
    })
}

Container.prototype.onMouseWheel = function(d, x, y, e) {
    //if (x < 0 || y < 0 || x > this.w || y > this.h) return
    //log.debug('mouse move on [' + this.name + '] @' + x + 'x' + y)
    this._ls.forEach(g => {
        if (g.hidden || g.disabled || !g._sizable) return
        if (sys.isFun(g.onMouseWheel)) {
            const lx = x - g.x
            const ly = y - g.y
            if (lx >= 0 && lx <= g.w && ly >= 0 && ly <= g.h) {
                g.onMouseWheel(d, lx, ly, e)
            }
        }
    })
}

Container.prototype.onTouchStart = function(x, y, e) {
    if (x < 0 || y < 0 || x > this.w || y > this.h) return
    //log.debug('touch down on [' + this.name + '] @' + x + 'x' + y)

    let focusPending = true
    for (let i = this._ls.length-1; i >= 0; i--) {
        const g = this._ls[i]
        if (g.hidden || g.disabled || !g._sizable) continue

        const lx = x - g.x
        const ly = y - g.y

        if (focusPending && lx >= 0 && lx <= g.w
                        && ly >= 0 && ly <= g.h) {

            if (sys.isFun(g.onTouchStart)) {
                g.onTouchStart(lx, ly, e)
            }
            this.captureTouch(g)

            if (sys.isFun(g.onFocus)) {
                this.captureFocus(g)
                if (!g.keepZ) this.moveOnTop(i)
            }
            focusPending = false

        } else {
            this.releaseFocus(g)
        }
    }
    return !focusPending
}

/*
Container.prototype.onTouchEnd = function(e) {
    if (x < 0 || y < 0 || x > this.w || y > this.h) return
    //log.debug('touch end on [' + this.name + '] @' + x + 'x' + y)

    this._ls.forEach(g => {
        if (sys.isFun(g.onTouchEnd)) {
            const lx = x - g.x
            const ly = y - g.y
            if (!g._captured && (lx >= 0 && lx <= g.w && ly >= 0 && ly <= g.h)) {
                g.onTouchEnd(lx, ly, e)
            }
        }
    })
}
*/

Container.prototype.onReleasedFocus = function() {
    this._ls.forEach(g => {
        if (sys.isFun(g.onFocus)) {
            this.releaseFocus(g)
        }
        if (sys.isFun(g.onReleasedFocus)) {
            g.onReleasedFocus()
        }
    })

}

Container.prototype.captureMouse = function(gadget) {
    this.__.captureMouse(gadget)
}

Container.prototype.releaseMouse = function(gadget) {
    this.__.releaseMouse(gadget)
}

Container.prototype.captureTouch = function(gadget) {
    this.__.captureTouch(gadget)
}

Container.prototype.releaseTouch = function(gadget) {
    this.__.releaseTouch(gadget)
}

Container.prototype.captureFocus = function(gadget) {
    this.__.captureFocus(gadget)
}

Container.prototype.releaseFocus = function(gadget) {
    this.__.releaseFocus(gadget)
}

Container.prototype.onFocus = function() {
    this.focus = true
}

Container.prototype.onUnfocus = function() {
    this.focus = false
}

Container.prototype.drawBackground = function() {
    if (this.transparent) return

    if (this.focus) ctx.fillStyle = this.color.active.background
    else ctx.fillStyle = this.color.background
    ctx.fillRect(0, 0, this.w, this.h)

    if (this.showActiveFrame && this.focus) {
        ctx.strokeStyle = this.color.active.frame
        ctx.strokeStyle = '#ffff00'
        ctx.lineWidth = 4
        ctx.strokeRect(0, 0, this.w, this.h)
    }
}

Container.prototype.drawContent = function() {
    //for (let i = this._ls.length - 1; i >= 0; i--) {
    for (let i = 0; i < this._ls.length; i++) {
        let e = this._ls[i]
        if (e.draw && !e.hidden) {
            e.draw()
        }
    }
}

Container.prototype.drawForeground = function() {}

Container.prototype.draw = function() {
    if (this.hidden) return
    ctx.save()
    ctx.translate(this.x, this.y)
    if (this.clip) {
        ctx.beginPath()
        ctx.rect(0,0,this.w,this.h)
        ctx.clip()
    }

    this.drawBackground()
    this.drawContent()
    this.drawForeground()

    ctx.restore()
}

module.exports = Container
