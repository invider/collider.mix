'use strict'

// holds a collection of widgets, but shows only an active one

//@depends(/dna/hud/Container)
const Container = dna.hud.Container

let instances = 0

const MonoContainer = function(st) {
    // name can be assigned from child constructors!
    if (!this.name) this.name = 'monoContainer' + ++instances

    Container.call(this, st)
}
MonoContainer.prototype = Object.create(Container.prototype)

MonoContainer.prototype.adjust = function() {
    this.layout()
    if (this.active && isFun(this.active.adjust)) this.active.adjust()
}

MonoContainer.prototype.activate = function(id) {
    if (isString(id)) {
        const g = this._dir[id]
        if (g) this.active = g
    } else {
        const g = this._ls[id]
        if (g) this.active = g
    }
    this.adjust()
}

MonoContainer.prototype.drawContent = function() {
    //for (let i = this._ls.length - 1; i >= 0; i--) {
    const g = this.active
    if (g && g.draw && !g.hidden) {
        g.draw()
    }
}

MonoContainer.prototype.draw = function() {
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

MonoContainer.prototype.onClick = function(x, y, e) {
    //if (x < 0 || y < 0 || x > this.w || y > this.h) return
    //log.debug('click on [' + this.name + '] @' + x + 'x' + y)

    const g = this.active
    if (g && !g.hidden && !g.disabled && g._sizable) {
        const lx = x - g.x
        const ly = y - g.y
        if (lx >= 0 && lx <= g.w && ly >= 0 && ly <= g.h) {
            if (sys.isFun(g.onClick)) {
                g.onClick(lx, ly, e)
            }
            if (sys.isFun(g.onFocus)) {
                this.captureFocus(g)
            }
        }
        return true
    }
    return false
}

MonoContainer.prototype.onDblClick = function(x, y, e) {
    const g = this.active
    if (g) {
        if (g.hidden || g.disabled || !g._sizable) return

        const lx = x - g.x
        const ly = y - g.y
        if (lx >= 0 && lx <= g.w && ly >= 0 && ly <= g.h) {
            if (sys.isFun(g.onDblClick)) {
                g.onDblClick(lx, ly, e)
            }
        }
    }
}

MonoContainer.prototype.onMouseDown = function(x, y, b, e) {
    if (x < 0 || y < 0 || x > this.w || y > this.h) return

    const g = this.active
    if (g) {
        const lx = x - g.x
        const ly = y - g.y
        if (lx >= 0 && lx <= g.w && ly >= 0 && ly <= g.h) {
            if (sys.isFun(g.onMouseDown)) {
                g.onMouseDown(lx, ly, e)
            }
            if (sys.isFun(g.onMouseDrag)) {
                this.captureMouse(g)
            }
            if (sys.isFun(g.onFocus)) {
                this.captureFocus(g)
            }
            return true

        } else {
            this.releaseFocus(g)
        }
    }
    return false 
}

MonoContainer.prototype.onMouseUp = function(x, y, b, e) {
    if (x < 0 || y < 0 || x > this.w || y > this.h) return

    const g = this.active
    if (g && sys.isFun(g.onMouseUp)) {
        const lx = x - g.x
        const ly = y - g.y
        if (!g._captured
                && (lx >= 0 && lx <= g.w && ly >= 0 && ly <= g.h)) {
            g.onMouseUp(lx, ly, e)
        }
    }
}

MonoContainer.prototype.onMouseMove = function(x, y, e) {
    //if (x < 0 || y < 0 || x > this.w || y > this.h) return

    const g = this.active

    if (g && sys.isFun(g.onMouseMove)) {
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
}

MonoContainer.prototype.onMouseWheel = function(d, x, y, e) {
    //if (x < 0 || y < 0 || x > this.w || y > this.h) return

    const g = this.active

    if (g && sys.isFun(g.onMouseWheel)) {
        const lx = x - g.x
        const ly = y - g.y
        if (lx >= 0 && lx <= g.w && ly >= 0 && ly <= g.h) {
            g.onMouseWheel(d, lx, ly, e)
        }
    }
}

MonoContainer.prototype.onTouchStart = function(x, y, e) {
    if (x < 0 || y < 0 || x > this.w || y > this.h) return

    let focusPending = true

    const g = this.active
    if (g) {
        const lx = x - g.x
        const ly = y - g.y

        if (focusPending && lx >= 0 && lx <= g.w
                        && ly >= 0 && ly <= g.h) {

            if (sys.isFun(g.onTouchStart)) {
                g.onTouchStart(lx, ly, e)
            }
            if (sys.isFun(g.onTouchDrag)) {
                this.captureTouch(g)
            }
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

MonoContainer.prototype.onTouchEnd = function(x, y, b, e) {
    if (x < 0 || y < 0 || x > this.w || y > this.h) return

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

MonoContainer.prototype.onReleasedFocus = function() {
    const g = this.active
    if (g) {
        if (sys.isFun(g.onFocus)) {
            this.releaseFocus(g)
        }
        if (sys.isFun(g.onReleasedFocus)) {
            g.onReleasedFocus()
        }
    }
}

module.exports = MonoContainer
