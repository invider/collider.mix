//
// target-following sliding and zooming camera 
//
// SlideCamera supports automatic culling,
// so objects outside the viewport are not drawn.
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

SlideCamera.prototype = new sys.LabFrame()

// translate local x to global coordinates
// @param {number} x
// @returns {number} - global x
SlideCamera.prototype.gx = function(x) {
    return (x - this.x)*this.scale + ctx.width/2
}

// translate local y to global coordinates
// @param {number} y
// @returns {number} - global y
SlideCamera.prototype.gy = function(y) {
    return (y - this.y)*this.scale + ctx.height/2
}

// translate local x and y to global coordinates
// @param {number} x
// @param {number} y
// @returns {object/2d-vector} - object with global x and y
SlideCamera.prototype.gxy = function(x, y) {
    return {
        x: (x - this.x)*this.scale + ctx.width/2,
        y: (y - this.y)*this.scale + ctx.height/2,
    }
}

// translate global x to local coordinates
// @param {number} x
// @returns {number} - local x
SlideCamera.prototype.lx = function(x) {
    return (x-ctx.width/2)/this.scale + this.x
}

// translate global y to local coordinates
// @param {number} y
// @returns {number} - local y
SlideCamera.prototype.ly = function(y) {
    return (y-ctx.height/2)/this.scale + this.y
}

// translate global x and y to local coordinates
// @param {number} x
// @param {number} y
// @returns {object/2d-vector} - object with local x and y
SlideCamera.prototype.lxy = function(x, y) {
    return {
        x: (x-ctx.width/2)/this.scale + this.x,
        y: (y-ctx.height/2)/this.scale + this.y,
    }
}

// get camera viewport
// @returns {object/viewport-rectangle} - viewport x, y, w and h
SlideCamera.prototype.viewport = function() {
    const x = this.lx(0)
    const y = this.ly(0)
    return {
        x: x,
        y: y,
        w: this.lx(ctx.width) - x,
        h: this.ly(ctx.height) - y,
    }
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

/*
SlideCamera.prototype.pick = function(screenX, screenY) {
    let wx = this.worldX(screenX)
    let wy = this.worldY(screenY)

    let res = []
    this._ls.forEach( e => {
        if (e.draw && !e.dead && !e.hidden && e._positional && e._rectangular
                && e.x <= wx
                && e.x + e.w >= wx
                && e.y <= wy
                && e.y + e.h >= wy) {
            res.push(e)
        }
    })
    return res
}
*/

// create traps for Plus/Minus keys to control camera zoom in/out
// called automatically, when (camera.zoomOnPlusMinus === true)
SlideCamera.prototype.bindZoom = function() {
    let cam = this
    trap.on('equalDown', function() {
        cam.startMoving(0)
    })
    trap.on('equalUp', function() {
        cam.stopMoving(0)
    })

    trap.on('minusDown', function() {
        cam.startMoving(1)
    })
    trap.on('minusUp', function() {
        cam.stopMoving(1)
    })
}

// complete necessary bindings
SlideCamera.prototype.init = function() {
    if (this.zoomOnPlusMinus) this.bindZoom()
}

// move camera at specified coordinates
// @param {number} x
// @param {number} y
SlideCamera.prototype.lookAt = function(x, y) {
    this.x = x
    this.y = y
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

// activate a movement
// @params {number} dir - movement time (0 - zoom out, 1 - zoom in)
SlideCamera.prototype.startMoving = function(dir) {
    this.keys[dir] = true
}

// stop a movement
// @params {number} dir - movement time (0 - zoom out, 1 - zoom in)
SlideCamera.prototype.stopMoving = function(dir) {
    this.keys[dir] = false
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
    this._ls.forEach( e => {
        if (e.evo && !e.dead && !e.paused) e.evo(dt)
    })

    if (this.target) this.evoFollow(dt)

    if (this.keys[0]) {
        this.scale *= 1 + this.zoomSpeed * dt
    }
    if (this.keys[1]) {
        this.scale *= 1 - this.zoomSpeed * dt
    }

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

// draw entities in the viewport
SlideCamera.prototype.draw = function(dt) {
    ctx.save()
	const sw = ctx.width,
          sh = ctx.height,
          vp = this.viewport(),
          vx1 = vp.x,
          vy1 = vp.y,
          vx2 = vp.x + vp.w,
          vy2 = vp.y + vp.h
    
    ctx.translate(sw/2, sh/2) // half-screen shift
	ctx.scale(this.scale, this.scale);
	ctx.translate(-this.x, -this.y)

    /*
    // draw viewport
    ctx.strokeStyle = '#ff0000'
    ctx.strokeRect(vx1, vpy2, vp.w, vp.h)
    */
	    
    this._ls.forEach( e => {
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

    ctx.restore()
}
