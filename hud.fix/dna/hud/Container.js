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

// called when container needs to update it's position and size
// Redefine this function for component to react on layout changes.
Container.prototype.adjust = function() {
    this.layout()
    for (let i = this._ls.length-1; i >= 0; i--) {
        const g = this._ls[i]
        if (sys.isFun(g.adjust)) g.adjust()
    }
}

// map x from parent to local coordinate space
// @param {number} x
// @returns {number} x in local coordinate space
Container.prototype.lx = function(x) {
    return x - this.x
}

// map y from parent to local coordinate space
// @param {number} y
// @returns {number} y in local coordinate space
Container.prototype.ly = function(y) {
    return y - this.y
}

// map x from local to parent coordinate space
// @param {number} x
// @returns {number} x in parnet coordinate space
Container.prototype.gx = function(x) {
    return this.x + x
}

// map y from local to parent coordinate space
// @param {number} y
// @returns {number} y in parnet coordinate space
Container.prototype.gy = function(y) {
    return this.y + y
}

// nodes are not centered in hud by default
Container.prototype.promoteNode = function(node) {
    if (node._centered === undefined) node._centered = false
    sys.LabFrame.prototype.promoteNode.call(this, node)
}

// a service call to handle a node attached to the container.
// Calls this.adjust() to rearrange layout with new component.
Container.prototype.onAttached = function(node) {
    sys.LabFrame.prototype.onAttached.call(this, node)
    this.adjust()
}

// move a child node on top
// @param {number} i - a node index
Container.prototype.moveOnTop = function(i) {
    if (i < this._ls.length - 1) {
        const g = this._ls[i]
        this._ls.splice(i, 1)
        this._ls.push(g)
    }
}

// a service call to handle mouse click
// @param {number} x
// @param {number} y
// @param {object} e - an original mouse event object
Container.prototype.onClick = function(x, y, e) {
    //if (x < 0 || y < 0 || x > this.w || y > this.h) return
    //log.debug('click on [' + this.name + '] @' + x + 'x' + y)

    let pending = true

    for (let i = this._ls.length-1; i >= 0; i--) {
        const g = this._ls[i]
        if (!g || g.hidden || g.disabled) continue

        if (pending && ((g.within && g.within(x, y))
                || (!g.within && (
                    (g._circular
                        && dist(g.x, g.y, x, y) <= g.r)
                    || (g._centered
                        && x >= g.x - g.w/2
                        && x <= g.x + g.w/2
                        && y >= g.y - g.h/2
                        && y <= g.y + g.w/2)
                    || (g._rectangular
                        && x >= g.x
                        && x <= g.x + g.w
                        && y >= g.y
                        && y <= g.y + g.h)
                    )
                )
        )) {
            // map to node-local coordinates
            let lx, ly
            if (g.lx) {
                lx = g.lx(x)
                ly = g.ly(y)
            } else if (g.lxy) {
                const xy = g.lxy(x, y)
                lx = xy.x
                ly = xy.y
            } else {
                lx = x - g.x
                ly = y - g.y
            }
            
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

// a service call to handle mouse click
// @param {number} x
// @param {number} y
// @param {object} e - an original mouse event object
Container.prototype.onDblClick = function(x, y, e) {
    let pending = true

    for (let i = this._ls.length-1; i >= 0; i--) {
        const g = this._ls[i]

        if (!g || g.hidden || g.disabled) continue

        if (pending && ((g.within && g.within(x, y))
                || (!g.within && (
                    (g._circular
                        && dist(g.x, g.y, x, y) <= g.r)
                    || (g._centered
                        && x >= g.x - g.w/2
                        && x <= g.x + g.w/2
                        && y >= g.y - g.h/2
                        && y <= g.y + g.w/2)
                    || (x >= g.x
                        && x <= g.x + g.w
                        && y >= g.y
                        && y <= g.y + g.h)
                    )
                )
        )) {

            // map to local coordinates
            let lx, ly
            if (g.lx) {
                lx = g.lx(x)
                ly = g.ly(y)
            } else if (g.lxy) {
                const xy = g.lxy(x, y)
                lx = xy.x
                ly = xy.y
            } else {
                lx = x - g.x
                ly = y - g.y
            }

            if (sys.isFun(g.onDblClick)) {
                g.onDblClick(lx, ly, e)
            }
            pending = false
        }
    }
    return !pending
}

// handles mouse down event
// @param {number} x
// @param {number} y
// @param {number} b - buttons mask form the mouse event
// @param {object} e - original mouse event
// @returns {boolean} - true if focus is captured
Container.prototype.onMouseDown = function(x, y, b, e) {
    //if (x < 0 || y < 0 || x > this.w || y > this.h) return
    //log.debug('mouse down on [' + this.name + '] @' + x + 'x' + y)

    let pending = true
    for (let i = this._ls.length-1; i >= 0; i--) {
        const g = this._ls[i]
        if (!g || g.hidden || g.disabled) continue

        if (pending && ((g.within && g.within(x, y))
                || (!g.within && (
                    (g._circular
                        && dist(g.x, g.y, x, y) <= g.r)
                    || (g._centered
                        && x >= g.x - g.w/2
                        && x <= g.x + g.w/2
                        && y >= g.y - g.h/2
                        && y <= g.y + g.w/2)
                    || (x >= g.x
                        && x <= g.x + g.w
                        && y >= g.y
                        && y <= g.y + g.h)
                    )
                )
        )) {
            // map to local coordinates
            let lx, ly
            if (g.lx) {
                lx = g.lx(x)
                ly = g.ly(y)
            } else if (g.lxy) {
                const xy = g.lxy(x, y)
                lx = xy.x
                ly = xy.y
            } else {
                lx = x - g.x
                ly = y - g.y
            }

            if (sys.isFun(g.onMouseDown)) {
                g.onMouseDown(lx, ly, b, e)
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

// handle mouse up event
// @param {number} x
// @param {number} y
// @param {number} b - buttons mask form the mouse event
// @param {object} e - original mouse event
// @returns {boolean} - true if focus is captured
Container.prototype.onMouseUp = function(x, y, b, e) {
    //if (x < 0 || y < 0 || x > this.w || y > this.h) return
    //log.debug('mouse up on [' + this.name + '] @' + x + 'x' + y)
    for (let i = this._ls.length-1; i >= 0; i--) {
        const g = this._ls[i]
        if (!g || g.hidden || g.disabled) continue

        if (sys.isFun(g.onMouseUp)) {

            if ((g.within && g.within(x, y))
                    || (!g.within && (
                        (g._circular
                            && dist(g.x, g.y, x, y) <= g.r)
                        || (g._centered
                            && x >= g.x - g.w/2
                            && x <= g.x + g.w/2
                            && y >= g.y - g.h/2
                            && y <= g.y + g.w/2)
                        || (x >= g.x
                            && x <= g.x + g.w
                            && y >= g.y
                            && y <= g.y + g.h)
                        )
                    )
            ) {
                // map to local coordinates
                let lx, ly
                if (g.lx) {
                    lx = g.lx(x)
                    ly = g.ly(y)
                } else if (g.lxy) {
                    const xy = g.lxy(x, y)
                    lx = xy.x
                    ly = xy.y
                } else {
                    lx = x - g.x
                    ly = y - g.y
                }

                g.onMouseUp(lx, ly, e)
            }
        }
    }
}

// handle mouse move event
// @param {number} x
// @param {number} y
// @param {object} e - original mouse event
Container.prototype.onMouseMove = function(x, y, e) {
    //if (x < 0 || y < 0 || x > this.w || y > this.h) return
    //log.debug('mouse move on [' + this.name + '] @' + x + 'x' + y)
    for (let i = this._ls.length-1; i >= 0; i--) {
        const g = this._ls[i]
        if (!g || g.hidden || g.disabled) continue

        if (sys.isFun(g.onMouseMove)) {
            if ((g.within && g.within(x, y))
                    || (!g.within && (
                        (g._circular
                            && dist(g.x, g.y, x, y) <= g.r)
                        || (g._centered
                            && x >= g.x - g.w/2
                            && x <= g.x + g.w/2
                            && y >= g.y - g.h/2
                            && y <= g.y + g.w/2)
                        || (x >= g.x
                            && x <= g.x + g.w
                            && y >= g.y
                            && y <= g.y + g.h)
                        )
                    )
            ) {
                // map to local coordinates
                let lx, ly
                if (g.lx) {
                    lx = g.lx(x)
                    ly = g.ly(y)
                } else if (g.lxy) {
                    const xy = g.lxy(x, y)
                    lx = xy.x
                    ly = xy.y
                } else {
                    lx = x - g.x
                    ly = y - g.y
                }

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
}

// a service call to handle mouse wheel scroll
// @param {number} d - scroll delta
// @param {number} x
// @param {number} y
// @param {object} e - an original mouse event object
Container.prototype.onMouseWheel = function(d, x, y, e) {
    //if (x < 0 || y < 0 || x > this.w || y > this.h) return
    //log.debug('mouse move on [' + this.name + '] @' + x + 'x' + y)
    for (let i = this._ls.length-1; i >= 0; i--) {
        const g = this._ls[i]

        if (!g || g.hidden || g.disabled) continue
        if (sys.isFun(g.onMouseWheel)) {

            if ((g.within && g.within(x, y))
                    || (!g.within && (
                        (g._circular
                            && dist(g.x, g.y, x, y) <= g.r)
                        || (g._centered
                            && x >= g.x - g.w/2
                            && x <= g.x + g.w/2
                            && y >= g.y - g.h/2
                            && y <= g.y + g.w/2)
                        || (x >= g.x
                            && x <= g.x + g.w
                            && y >= g.y
                            && y <= g.y + g.h)
                        )
                    )
            ) {
                // map to local coordinates
                let lx, ly
                if (g.lx) {
                    lx = g.lx(x)
                    ly = g.ly(y)
                } else if (g.lxy) {
                    const xy = g.lxy(x, y)
                    lx = xy.x
                    ly = xy.y
                } else {
                    lx = x - g.x
                    ly = y - g.y
                }

                g.onMouseWheel(d, lx, ly, e)
            }
        }
    }
}

// a service call to handle touch start events 
// @param {number} x
// @param {number} y
// @param {object} e - an original touch event object
Container.prototype.onTouchStart = function(x, y, e) {
    if (x < 0 || y < 0 || x > this.w || y > this.h) return
    //log.debug('touch down on [' + this.name + '] @' + x + 'x' + y)

    let focusPending = true
    for (let i = this._ls.length-1; i >= 0; i--) {
        const g = this._ls[i]
        if (!g || g.hidden || g.disabled) continue

        if (focusPending && ((g.within && g.within(x, y))
                || (!g.within && (
                    (g._circular
                        && dist(g.x, g.y, x, y) <= g.r)
                    || (g._centered
                        && x >= g.x - g.w/2
                        && x <= g.x + g.w/2
                        && y >= g.y - g.h/2
                        && y <= g.y + g.w/2)
                    || (x >= g.x
                        && x <= g.x + g.w
                        && y >= g.y
                        && y <= g.y + g.h)
                    )
                )
        )) {
            // map to local coordinates
            let lx, ly
            if (g.lx) {
                lx = g.lx(x)
                ly = g.ly(y)
            } else if (g.lxy) {
                const xy = g.lxy(x, y)
                lx = xy.x
                ly = xy.y
            } else {
                lx = x - g.x
                ly = y - g.y
            }

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

// a service call to handle focus release
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

// a service call to propagate a gadget mouse capture
// @param {object} gadget
Container.prototype.captureMouse = function(gadget) {
    this.__.captureMouse(gadget)
}

// a service call to propagate a gadget mouse release
// @param {object} gadget
Container.prototype.releaseMouse = function(gadget) {
    this.__.releaseMouse(gadget)
}

// a service call to propagate a gadget touch capture
// @param {object} gadget
Container.prototype.captureTouch = function(gadget) {
    this.__.captureTouch(gadget)
}

// a service call to propagate a gadget touch release
// @param {object} gadget
Container.prototype.releaseTouch = function(gadget) {
    this.__.releaseTouch(gadget)
}

// a service call to propagate a gadget focus capture
// @param {object} gadget
Container.prototype.captureFocus = function(gadget) {
    this.__.captureFocus(gadget)
}

// a service call to propagate a gadget focus release
// @param {object} gadget
Container.prototype.releaseFocus = function(gadget) {
    this.__.releaseFocus(gadget)
}

// on focus handler
// It is responsible for raising this.focus flag
// and can contain any custom actions related to focus capture.
Container.prototype.onFocus = function() {
    this.focus = true
}

// on loosing focus handler
// It is responsible for reseting this.focus flag
// and can contain any custom actions related to loosing focus.
Container.prototype.onUnfocus = function() {
    this.focus = false
}

// draw container background layer
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

// draw container child components
Container.prototype.drawContent = function() {
    //for (let i = this._ls.length - 1; i >= 0; i--) {
    for (let i = 0; i < this._ls.length; i++) {
        let e = this._ls[i]
        if (e.draw && !e.hidden) {
            e.draw()
        }
    }
}

// draw container foreground
Container.prototype.drawForeground = function() {}

// draw container
// Performs necessary translations and clipping
// and draws background, content and foreground.
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
