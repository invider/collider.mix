//
// full-screen target-following sliding and zooming camera 
//
// Ideal for top-down or side-view scene perspective management
// similar to what one can find in platformers, jRPGs
// and real-time strategy games.
//
// SlideCamera supports automatic culling of objects
// outside the viewport.
// Culling works for all entities attached directly
// under the camera node with _positional and _sizeable
// flags set - e.g. they MUST have x and y values
// defined when the entity was attached and also
// w and h defined for rectangular objects
// and r for the circular ones.
// Also make sure the _centered flag is properly set -
// MUST be true if x&y coordinates define the center
// of the object and *false* when they define
// the top-left corner or the object rectangle.
// All other objects will always be drawn,
// since the camera can't automatically determine
// culling rules for them.
//
// If you need to define custom culling rules
// (e.g. *r* value doesn't represent exact visible radius
// and it needs to be calculated dynamically),
// you have to redefine the _draw()_ method
// in the camera to reflect the visibility logic.
//
// SlideCamera can follow a positional target
// (it can be any object with x and y).
// When the target is not set, it can work in a free-roaming mode.
// In this mode, a gamer can move and zoom the viewport.
//
// You can setup zoom in/out and move speed
// with *speed* and *zoomSpeed* properties accordingly.
//
// Spawn camera somewhere in /lab and
// then spawn all actors into the camera.
//
// A typical structure may look like this:
//
//     /lab
//       |
//       |--cam
//       |   |
//       |   |-- mob
//       |   |-- fx
//       |
//       |--hud
// The first node in _lab_ is SlideCamera
// and it contains nodes _mob_ for all actors
// and _fx_ for special effects like particles.
//
// Separating the two is a good idea,
// since we want our particles to be "over"
// the actors.
//
// Following the camera in _lab_, there is _hud_.
// It is an overlay layer with objects not supposed
// to be affected by the camera. Like a map, a score tab or other UI elements.
//
// You may create such structure during the setup
// of the game in /setup.js:
//
//     lab.spawn('SlideCamera', {
//         name: 'cam',
//         x: 0,
//         y: 0,
//         zoomOnPlusMinus: true,
//     })
//     // create a substructure in /lab/cam
//     lab.cam.touch('mob')
//     lab.cam.touch('fx')
//
//     // create a hero
//     lab.cam.mob.spawn(dna.Hero, {...})
//     
//     // create a spider and some spider-related visual effect
//     lab.cam.mob.spawn(dna.Spider, {...})
//     lab.cam.fx.spawn(dna.teleportFx, {...})
//
// Now we can tell the camera to slide at some coordinates:
//
//     lab.cam.follow({ x: 101, y: 101 }, false)
// Note, that we don't want to keep following.
// The camera target will be reset once it reached the coordinates.
//
// Next, follow and pin on the hero:
//
//     lab.cam.pinOnTarget = true
//     lab.cam.follow( lab.cam.mob.hero, true )
// And zoom in a little
//     lab.cam.zoom(1.5)
// Use viewport() to get viewport rectangle coordinates (x, y, w, h).
//
// Use gx, gy, gxy to get screen coordinates from camera-ones.
//
// Use lx, ly, lxy to get camera-world coordinates form the screen-ones.

class SlideView {

    constructor(st) {

        augment({
            x:     0,
            y:     0,
            zoom:  1,
            flipY: false,
        }, st)

    }

    adjust() {}

    getFOV() {
        return HALF_PI
    }

    getFocusDistance() {
        return (this.__.w / this.zoom) / (2 * tan(QUARTER_PI))
    }

    setFocusDistance(fd) {
        this.zoom = this.__.w / (2 * fd * tan(QUARTER_PI))
    }

    getZoom() {
        return this.zoom
    }

    setZoom(zoom) {
        this.zoom = zoom
    }

    getWidth() {
        return this.__.w / this.zoom
    }

    getHeight() {
        return this.__.h / this.zoom
    }

    getRect() {
        const __ = this.__

        return {
            x: __.lx(0),
            y: __.ly(0),
            w: __.w / this.zoom,
            h: __.h / this.zoom,
        }
    }

    getEdges() {
        const __ = this.__

        return [
            __.lx(0),
            __.ly(0),
            __.lx(__.w),
            __.ly(__.h),
        ]
    }

    within(x, y, r) {
        r = r ?? 0
        
        const x1 = __.lx(0),
              y1 = __.ly(0),
              x2 = __.lx(__.w),
              y2 = __.ly(__.h)

        return (
            x + r >= x1
            && x - r <= x2
            && y + r >= y1
            && y - r <= y2
        )
    }

    isVisible(e) {
        const x1 = __.lx(0),
              y1 = __.ly(0),
              x2 = __.lx(__.w),
              y2 = __.ly(__.h)

        if (e.r !== undefined) {
            return (
                e.x + e.r >= x1
                && e.x - e.r <= x2
                && e.y + e.r >= y1
                && e.y - e.r <= y2
            )
        } else if (e.w !== undefined && e.h !== undefined) {
            // expect rectangular
            return ((e._centered
                        && e.x + .5 * e.w >= x1
                        && e.x - .5 * e.w <= x2
                        && e.y + .5 * e.h >= y1
                        && e.y - .5 * e.h <= y2)
                    || (e.x + e.w >= x1
                        && e.x <= x2
                        && e.y + e.h >= y1
                        && e.y <= y2))
        }
    }

}

const MOVE_UP    = 1,
      MOVE_LEFT  = 2,
      MOVE_DOWN  = 3,
      MOVE_RIGHT = 4,
      ZOOM_IN    = 5,
      ZOOM_OUT   = 6

class KeyboardControlPod {

    constructor(st) {
        augment(this, {
            name:    'keyboardControl',

            bind: {
                moveUp:    'ArrowUp',
                moveLeft:  'ArrowLeft',
                moveDown:  'ArrowDown',
                moveRight: 'ArrowRight',
                zoomIn:    'Equal',
                zoomOut:   'Minus',
            },

            actions:    [],
            zoomSpeed:  2,
            slideSpeed: 600,
        }, st)
    }

    init() {
        this.bindTraps()
    }

    bindTraps() {
        const _ = this

        trap.on('keyDown', function(e) {
            if (e.repeat) return

            const bind = _.bind
            switch(e.code) {
                case bind.moveUp:    _.actuate(MOVE_UP);    break;
                case bind.moveLeft:  _.actuate(MOVE_LEFT);  break;
                case bind.moveDown:  _.actuate(MOVE_DOWN);  break;
                case bind.moveRight: _.actuate(MOVE_RIGHT); break;
                case bind.zoomIn:    _.actuate(ZOOM_IN);    break;
                case bind.zoomOut:   _.actuate(ZOOM_OUT);   break;
            }
        })

        trap.on('keyUp', function(e) {
            const bind = _.bind
            switch(e.code) {
                case bind.moveUp:    _.cutOff(MOVE_UP);    break;
                case bind.moveLeft:  _.cutOff(MOVE_LEFT);  break;
                case bind.moveDown:  _.cutOff(MOVE_DOWN);  break;
                case bind.moveRight: _.cutOff(MOVE_RIGHT); break;
                case bind.zoomIn:    _.cutOff(ZOOM_IN);    break;
                case bind.zoomOut:   _.cutOff(ZOOM_OUT);   break;
            }
        })
    }

    actuate(action) {
        if (this.__.disabled) return // ignore the action while the camera is disabled

        this.actions[action] = true
    }

    act(action, dt) {
        const view = this.__.view
        switch(action) {
            case MOVE_UP:
                if (view.verticalLock) return
                view.y = view.y - (this.slideSpeed / view.zoom) * dt
                break
            case MOVE_LEFT:
                if (view.horizontalLock) return
                view.x = view.x - (this.slideSpeed / view.zoom) * dt
                break
            case MOVE_DOWN:
                if (view.verticalLock) return
                view.y = view.y + (this.slideSpeed / view.zoom) * dt
                break
            case MOVE_RIGHT:
                if (view.horizontalLock) return
                view.x = view.x + (this.slideSpeed / view.zoom) * dt
                break
            case ZOOM_IN:
                view.setZoom( view.getZoom() * (1 + this.zoomSpeed * dt))
                break
            case ZOOM_OUT:
                view.setZoom( view.getZoom() * (1 - this.zoomSpeed * dt))
                break
        }
    }

    cutOff(action) {
        this.actions[action] = false
    }

    cutOffAll() {
        for (let i = this.actions.length - 1; i >= 0; i--) {
            this.actions[i] = false
        }
    }

    evo(dt) {
        for (let i = 1; i < this.actions.length; i++) {
            if (this.actions[i]) this.act(i, dt)
        }
    }

    onDisable() {
        this.cutOffAll()
    }
}

class MouseControlPod {

    constructor(st) {
        augment(this, {
            name: 'mouseControl',

            accumulatedZoom: 0,

            zoomSpeed:       2,
            zoomSensitivity: 0.0005,
            slideEdge:       0.025,
            slideSpeed:      400,
        }, st)
    }

    init() {
        this.bindTraps()
    }

    bindTraps() {
        const _ = this

        trap.on('mouseWheel', (e) => {
            if (_.__.disabled) return
            const view = _.__.view

            if (e.deltaY !== 0) {
                if (e.deltaY < 0 && this.accumulatedZoom > 0) this.accumulatedZoom = 0
                else if (e.deltaY > 0 && this.accumulatedZoom < 0) this.accumulatedZoom = 0
                this.accumulatedZoom += e.deltaY * _.zoomSensitivity
            }
        })
    }

    evo(dt) {
        const __ = this.__
        const view = __.view

        if (this.accumulatedZoom < 0) {
            view.setZoom( view.getZoom() * (1 + this.zoomSpeed * dt))

            this.accumulatedZoom += dt
            if (this.accumulatedZoom >= 0) this.accumulatedZoom = 0
        } else if (this.accumulatedZoom > 0) {
            view.setZoom( view.getZoom() * (1 - this.zoomSpeed * dt))

            this.accumulatedZoom -= dt
            if (this.accumulatedZoom <= 0) this.accumulatedZoom = 0
        }

        const mx = mouse.x - __.x,
              my = mouse.y - __.y
        if (!mouse.out
                && mx >= 0 && mx < __.w
                && my >= 0 && my < __.h) {

            if (!view.horizontalLock) {
                if (mx < this.slideEdge * __.w) {
                    view.x = view.x - (this.slideSpeed / view.zoom) * dt
                } else if (mx > __.w - this.slideEdge * __.w) {
                    view.x = view.x + (this.slideSpeed / view.zoom) * dt
                }
            }

            if (!view.verticalLock) {
                if (my < this.slideEdge * __.h) {
                    view.y = view.y - (this.slideSpeed / view.zoom) * dt
                } else if (my > __.h - this.slideEdge * __.h) {
                    view.y = view.y + (this.slideSpeed / view.zoom) * dt
                }
            }
        }
    }

    onDisable() {
        this.accumulatedZoom = 0
    }

}

class ZoomConstraints {

    constructor(st) {
        augment(this, {
            Z:    -17,
            name: 'zoomConstraints',

            min: 0.1,
            max: 10,
        }, st)
    }

    evo(dt) {
        const _ = this.__.view
        _.zoom = clamp(_.zoom, this.min, this.max)
    }

}

class ZoneConstraints {

    constructor(st) {
        augment(this, {
            Z:    -11,
            name: 'zoneConstraints',

            x1:    0,
            x2:    0,
            y1:    0,
            y2:    0,
        }, st)
    }

    evo(dt) {
        const { x1, y1, x2, y2 } = this
        const view = this.__.view
        const edges = view.getEdges()

        view.horizontalLock = false
        view.verticalLock = false

        if (edges[0] <= x1) {
            if (edges[2] >= x2) {
                // outside of bounds - center the view
                view.x = edges[0] + .5 * (edges[2] - edges[0])
                view.horizontalLock = true
            } else {
                // stick to the left
                view.x = x1 + .5 * view.getWidth()
            }
        } else if (edges[2] >= x2) {
            // stick to the right
            view.x = x2 - .5 * view.getWidth()
        }

        if (edges[1] <= y1) {
            if (edges[3] >= y2) {
                // outside of bounds - center the view
                view.y = edges[1] + .5 * (edges[3] - edges[1])
                view.verticalLock = true
            } else {
                // stick to the left
                view.y = y1 + .5 * view.getHeight()
            }
        } else if (edges[3] >= y2) {
            // stick to the right
            view.y = y2 - .5 * view.getHeight()
        }
    }
}

class ElasticZoneConstraints {

    constructor(st) {
        augment(this, {
            Z:    -11,
            name: 'ElasticZoneConstraints',

            x1:    0,
            x2:    0,
            y1:    0,
            y2:    0,

            correctionSpeed: 100,
        }, st)
    }

    evo(dt) {
        const { x1, y1, x2, y2 } = this
        const view = this.__.view
        const edges = view.getEdges()

        view.horizontalLock = false
        view.verticalLock = false

        if (edges[0] <= x1) {
            if (edges[2] >= x2) {
                // outside of bounds - center the view
                this.targetX = x1 + .5 * (x2 - x1)
            } else {
                // stick to the left
                this.targetX = x1 + .5 * view.getWidth()
            }
        } else if (edges[2] >= x2) {
            // stick to the right
            this.targetX = x2 - .5 * view.getWidth()
        } else {
            this.targetX = view.x
        }

        if (edges[1] <= y1) {
            if (edges[3] >= y2) {
                // outside of bounds - center the view
                this.targetY = y1 + .5 * (y2 - y1)
            } else {
                // stick to the left
                this.targetY = y1 + .5 * view.getHeight()
            }
        } else if (edges[3] >= y2) {
            // stick to the right
            this.targetY = y2 - .5 * view.getHeight()
        } else {
            this.targetY = view.y
        }

        if (this.targetX < view.x) {
            view.x = max(view.x - (this.correctionSpeed * dt) / view.zoom, this.targetX)
        } else if (this.targetX > view.x) {
            view.x = min(view.x + (this.correctionSpeed * dt) / view.zoom, this.targetX)
        }

        if (this.targetY < view.y) {
            view.y = max(view.y - (this.correctionSpeed * dt) / view.zoom, this.targetY)
        } else if (this.targetY > view.y) {
            view.y = min(view.y + (this.correctionSpeed * dt) / view.zoom, this.targetY)
        }
    }
}

class SlideCameraNG extends sys.LabFrame {

    constructor(st) {
        super( augment({
            name: 'port',

            x:     0,
            y:     0,
            w:     0,
            h:     0,
            view:  new SlideView(),

            target: null,
        }, st) )
        this.view.__ = this
        if (!isFun(this.adjustViewport) && !st.w && !st.h) {
            this.fullscreen = true
        } else {
            this.fullscreen = false
        }
    }

    bindContext() {
        this.ctx = this.getMod().ctx
    }

    init() {
        this.bindContext()
        this.adjust()
    }

    adjustViewportToFullscreen() {
        // fullscreen viewport
        this.x = 0
        this.y = 0
        this.w = this.ctx.width
        this.h = this.ctx.height
    }

    adjust() {
        if (this.fullscreen) {
            this.adjustViewportToFullscreen()
        } else if (isFun(this.adjustViewport)) {
            this.adjustViewport()
        }
        this.view.adjust()
    }

    // translate local x to the parent coordinate space
    //
    // @param {number} lx
    // @returns {number} - upper x
    ux(lx) {
        return (lx - this.view.x)*this.view.zoom + .5 * this.w + this.x
    }

    // translate local y to the parent coordinate space
    //
    // @param {number} ly
    // @returns {number} - upper y
    uy(ly) {
        return (ly - this.view.y)*this.view.zoom + .5 * this.h + this.y
    }

    // translate local 2D vector to the parent coordinate space
    //
    // @param {array/vec2} v
    // @returns {array/vec2} - transformed vector
    upos(v) {
        v[0] = (lx - this.view.x)*this.view.zoom + .5 * this.w + this.x,
        v[1] = (ly - this.view.y)*this.view.zoom + .5 * this.h + this.y
    }

    // translate parent coordinates x to the local coordinate space
    //
    // @param {number} ux
    // @returns {number} - local x
    lx(ux) {
        return (ux - this.x - .5 * this.w)/this.view.zoom + this.view.x
    }

    // translate parent coordinates y to the local coordinate space
    //
    // @param {number} uy
    // @returns {number} - local y
    ly(uy) {
        return (uy - this.y - .5 * this.h)/this.view.zoom + this.view.y
    }

    // translate parent x and y to the local coordinate space
    //
    // @param {array/vec2} v
    // @returns {array/vec2} - object with local x and y
    lpos(v) {
        v[0] = (v[0] - this.x - .5 * this.w)/this.view.zoom + this.view.x
        v[1] = (v[1] - this.y - .5 * this.h)/this.view.zoom + this.view.y
    }

    lookAt(x, y, zoom) {
        this.view.x = x
        this.view.y = y
        if (zoom) this.view.zoom = zoom
    }

    pick(x, y, list, opt) {
        // test coordinates against viewport
        if (x < this.x || x > this.x + this.w || y < this.y || y > this.y + this.h) return

        let lx
        let ly
        if (this.lx) {
            lx = this.lx(x)
            ly = this.ly(y)
        } else {
            const lpos = this.lpos([x, y])
            lx = lpos[0]
            ly = lpos[1]
        }
        const ls = isArr(list)? list : null
        const fn = isFun(opt)? opt : (isFun(list)? list : null)

        let last
        function pickFromList(sourceList) {
            for (let i = 0; i < sourceList.length; i++) {
                const node = sourceList[i]

                // probe by-convention picking procedures
                // TODO maybe have some option to allow or skip this step? Like _pickable or something...
                if (!node.hidden &&
                          ((node.within && node.within(lx, ly))
                        || (node._centered && node._circular
                            && distance(lx, ly, node.x, node.y) <= node.r)
                        || (node._centered
                            && lx >= node.x - node.w/2
                            && lx <= node.x + node.w/2
                            && ly >= node.y - node.h/2
                            && ly <= node.y + node.h/2)
                        || (node._rectangular
                            && !node._centered
                            && lx >= node.x
                            && lx <= node.x + node.w
                            && ly >= node.y
                            && ly <= node.y + node.h)
                )) {
                    if (fn) {
                        if (fn(node)) {
                            if (ls) ls.push(node)
                            last = node
                        }
                    } else {
                        if (ls) ls.push(node)
                        last = node
                    }
                }

                // try custom picking routine
                if (isFun(node.pick)) {
                    let val
                    if (fn) {
                        if (fn(node)) val = node.pick(lx, ly, ls, opt)
                    } else {
                        val = node.pick(lx, ly, ls, opt)
                    }
                    if (val) last = val
                }
            }
        }

        const sourceList = this.getDisplayList()
        pickFromList(sourceList)

        return last
    }

    // returns the list of nodes to be displayed by the draw() function
    //
    // Camera child nodes are returned by default.
    // Redefine this method to customize the rendering target,
    // e.g. to achieve the following layout:
    //     lab
    //      |-cam
    //      |-world
    // You can return world._ls list to render instead of the cam children.
    // This approach can be more preferable in some scenarios,
    // like multiple camera.
    // If you keep all entities under a camera it would be
    // cumbersome to keep them visible when you switch to another camera -
    // the entities have to be either moved into the new camera
    // or linked somehow, since its going to render only the included entities
    // by default.
    // And it gets even harder when you need to display the output
    // of two camera at the same time - sometimes we need to have
    // multiple viewports into the same world on the screen,
    // e.g. the main view and a minimap in a realtime strategy
    // or a security camera in a stealth platformer.
    //
    // Redefining _getDisplayList()_ allows you 
    // 
    // to move them out all world entities each time you switch
    // between the cameras. And will be really tricky (but still possible)
    // if you have multiple cameras
    getDisplayList() {
        return this._ls
    }

    getContext() {
        return this.ctx
    }

    drawList(list, edges) {
        const ctx = this.getContext()

        list.forEach( e => e.draw() )
        /*
        list.forEach( e => {
            if (e.draw && !e.dead && !e.hidden) {
                // culling
                if (e._rectangular) {
                    if ((e._centered
                                && e.x+e.w/2 >= vx1
                                && e.x-e.w/2 <= vx2
                                && e.y+e.h/2 >= vy1
                                && e.y-e.h/2 <= vy2)
                            || (e.x+e.w >= vx1
                                && e.x  <= vx2
                                && e.y+e.h >= vy1
                                && e.y  <= vy2)) {
                        e.draw()
                    }
                } else if (e._circular) {
                    if (e.x+e.r >= vx1
                            && e.x-e.r <= vx2
                            && e.y+e.r >= vy1
                            && e.y-e.r <= vy2) {
                        e.draw()
                    }

                } else {
                    e.draw()
                }
            }
        })
        */
    }

    draw(dt) {
        const { x, y, w, h } = this
        const ctx = this.getContext()
        const ls  = this.getDisplayList()

        /*
        // hint the viewport
        alpha(.3)
        lineWidth(8)
        stroke(.15, .4, .5)
        rect(this.x, this.y, this.w, this.h)
        alpha(1)
        */

        ctx.save()
        if (!this.fullscreen) {
            // clip to the viewport
            ctx.beginPath()
            ctx.moveTo(x,     y    )
            ctx.lineTo(x + w, y    )
            ctx.lineTo(x + w, y + h)
            ctx.lineTo(x,     y + h)
            ctx.closePath()
            ctx.clip()
        }
        ctx.translate(.5 * this.w + this.x, .5 * this.h + this.y) // half-screen shift if needed
        ctx.scale(this.view.zoom, this.view.zoom)
        ctx.translate(-this.view.x, -this.view.y)

        // draw the view field
        // ctx.strokeStyle = '#ff0000'
        // ctx.strokeRect(vx1, vpy2, vp.w, vp.h)
        const edges = this.view.getEdges()

        this.drawList(ls, edges)

        /*
        // hint the edge
        save()
        lineWidth(1)
        stroke(this.edgeColor)
        ctx.beginPath()
        ctx.moveTo(edges[0], edges[1])
        ctx.lineTo(edges[2], edges[1])
        ctx.lineTo(edges[2], edges[3])
        ctx.lineTo(edges[0], edges[3])
        ctx.closePath()
        ctx.stroke()
        restore()
        */

        ctx.restore()
    }

    enable() {
        super.enable()

        const ls = this._ls
        for (let i = ls.length - 1; i >= 0; i--) {
            const e = ls[i]
            if (isFun(e.onEnable)) e.onEnable()
        }
    }

    disable() {
        super.disable()

        const ls = this._ls
        for (let i = ls.length - 1; i >= 0; i--) {
            const e = ls[i]
            if (isFun(e.onDisable)) e.onDisable()
        }
    }

}

SlideCameraNG.SlideView = SlideView
SlideCameraNG.KeyboardControlPod = KeyboardControlPod
SlideCameraNG.MouseControlPod = MouseControlPod
SlideCameraNG.ZoomConstraints = ZoomConstraints
SlideCameraNG.ZoneConstraints = ZoneConstraints
SlideCameraNG.ElasticZoneConstraints = ElasticZoneConstraints

/*
const SlideCamera = function(st) {
    this.name = 'cam'
    this.x = 0
    this.y = 0
    this.scale = 1
    this.scaleTarget = 0
    this.zoomSpeed = 0.5
    this.zoomStep = .2
    this.target = null
    this.pinOnTarget = false
    this.keepFollowing = false
    this.targetingPrecision = 1
    this.speed = 100
    this.zoomOnPlusMinus = false
    this.keys = []

    sys.Frame.call(this, st)
}

// check if local coordinates are in the viewport
// @param {number} x - local x
// @param {number} y - local y
// @returns {boolean} - true if local x:y are in the viewport
SlideCamera.prototype.inView = function(x, y) {
    let sx = this.gx(x)
    let sy = this.gy(y)
    return (sx >= 0 && sx <= ctx.width && sy >= 0 && sy <= ctx.height)
}

// follow the target
// The camera keeps following, until the distance is < _targetingPrecision_.
// At this point the target is considered reached.
//
// The camera keeps following the target if _keepFollowing_ flag is set.
//
// If _pinOnTarget_ is true, the camera coordinates will be fixed to target coordinates.
// This is the best way to "pin" the camera to an object and avoid
// jiggling artefacts.
//
// @param {object/xy} target - a positional target for the camera to follow
// @param {boolean} keepFollowing - keep following after the camera reached the position.
//
SlideCamera.prototype.follow = function(target, keepFollowing) {
    this.target = target
    this.keepFollowing = !!keepFollowing
}

// set relative zoom target
// accepts values relative to the current scale, where current scale is considered 1
// @param {number} z - relative value, e.g. 1.2 to zoom 20% in, 0.8 to zoom 20% out
SlideCamera.prototype.zoom = function(z) {
    this.scaleTarget = this.scale * z
}

// set absolute zoom target
// @param {number} scale
SlideCamera.prototype.zoomAt = function(scale) {
    this.scaleTarget = scale
}

// follow a target if one is defined
// Shouldn't be called manually.
// It is called automatically as a part of evo(dt) process
// @params {number} dt - delta time in seconds
SlideCamera.prototype.evoFollow = function(dt) {
    let dx = this.target.x - this.x
    let dy = this.target.y - this.y
    if (abs(dx) < this.targetingPrecision
            && abs(dy) < this.targetingPrecision) {

        // camera is within precision range
        if (this.pinOnTarget) {
            this.x = this.target.x
            this.y = this.target.y
        }
        if (!this.keepFollowing) this.target = null

    } else {

        let fi = Math.atan2(dy, dx);
        const ndx = Math.cos(fi) * this.speed / this.scale * dt
        const ndy = Math.sin(fi) * this.speed / this.scale * dt

        this.x += abs(ndx) < abs(dx)? ndx : dx
        this.y += abs(ndy) < abs(dy)? ndy : dy
    }
}

// evolve the camera and all included entities
// @param {number} dt - delta time in seconds
SlideCamera.prototype.evo = function(dt) {
    if (this.target) this.evoFollow(dt)

    if (this.scaleTarget) {
        if (this.scale < this.scaleTarget) {
            this.scale *= 1 + this.zoomSpeed * dt
            if (this.scale > this.scaleTarget) {
                this.scale = this.scaleTarget
                this.scaleTarget = 0
            }

        } else if (this.scale > this.scaleTarget) {
            this.scale *= 1 - this.zoomSpeed * dt
            if (this.scale < this.scaleTarget) {
                this.scale = this.scaleTarget
                this.scaleTarget = 0
            }
        }
    }
}
*/
