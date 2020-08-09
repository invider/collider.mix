//
// target-following zoom in/out camera constructor
//
const SlideCamera = function(dat) {
    this.name = 'cam'
    this.x = 0
    this.y = 0
    this.scale = 1
    this.scaleTarget = 0
    this.scaleSpeed = 1
    this.zoomStep = .2
    this.target = false
    this.targetingPrecision = 1
    this.speed = 1
    this.zoomOnPlusMinus = false
    this.keys = []

    sys.Frame.call(this, dat)
}

SlideCamera.prototype = new sys.LabFrame()

SlideCamera.prototype.worldX = function(x) {
    return (x-ctx.width/2)/this.scale + this.x
}

SlideCamera.prototype.worldY = function(y) {
    return (y-ctx.height/2)/this.scale + this.y
}

SlideCamera.prototype.getViewport = function() {
    return [
        this.worldX(0),
        this.worldY(0),
        this.worldX(ctx.width),
        this.worldY(ctx.height)
    ]
}

SlideCamera.prototype.screenX = function(x) {
    return (x - this.x)*this.scale + ctx.width/2
}

SlideCamera.prototype.screenY = function(y) {
    return (y - this.y)*this.scale + ctx.height/2
}

SlideCamera.prototype.gx = function(x) {
    return (x - this.x)*this.scale + ctx.width/2
}

SlideCamera.prototype.gy = function(y) {
    return (y - this.y)*this.scale + ctx.height/2
}

SlideCamera.prototype.gxy = function(x, y) {
    return {
        x: (x - this.x)*this.scale + ctx.width/2,
        y: (y - this.y)*this.scale + ctx.height/2,
    }
}

SlideCamera.prototype.lx = function(x) {
    return (x-ctx.width/2)/this.scale + this.x
}

SlideCamera.prototype.ly = function(y) {
    return (y-ctx.height/2)/this.scale + this.y
}

SlideCamera.prototype.lxy = function(x, y) {
    return {
        x: (x-ctx.width/2)/this.scale + this.x,
        y: (y-ctx.height/2)/this.scale + this.y,
    }
}

SlideCamera.prototype.inView = function(x, y) {
    let sx = this.screenX(x)
    let sy = this.screenY(y)
    return (sx >= 0 && sx <= ctx.width && sy >= 0 && sy <= ctx.height)
}

/*
SlideCamera.prototype.pick = function(screenX, screenY) {
    let wx = this.worldX(screenX)
    let wy = this.worldY(screenY)

    let res = []
    this._ls.forEach( e => {
        if (e.draw && !e.dead && !e.hidden && e._sizable
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

SlideCamera.prototype.bindZoom = function() {
    let cam = this
    sys.after(trap, 'equalDown', function() {
        cam.zoomStart(0)
    })
    sys.after(trap, 'equalUp', function() {
        cam.zoomStop(0)
    })

    sys.after(trap, 'minusDown', function() {
        cam.zoomStart(1)
    })
    sys.after(trap, 'minusUp', function() {
        cam.zoomStop(1)
    })
}

SlideCamera.prototype.init = function() {
    if (this.zoomOnPlusMinus) this.bindZoom()
}

SlideCamera.prototype.zoom = function(z) {
    this.scaleTarget *= z
}

SlideCamera.prototype.zoomAt = function(scale) {
    this.scaleTarget = scale
}

SlideCamera.prototype.zoomStart = function(dir) {
    this.keys[dir] = true
}

SlideCamera.prototype.zoomStop = function(dir) {
    this.keys[dir] = false
}

SlideCamera.prototype.follow = function(dt) {
    let dx = this.target.x - this.x
    let dy = this.target.y - this.y
    if (abs(dx) < this.targetingPrecision
            && abs(dy) < this.targetingPrecision) {

        // camera is within precision range
        if (this.pinOnTarget) {
            this.x = this.target.x
            this.y = this.target.y
        }
        if (!this.keepFollowing) this.target = false

    } else {

        let fi = Math.atan2(dy, dx);
        const ndx = Math.cos(fi) * this.speed / this.scale * dt
        const ndy = Math.sin(fi) * this.speed / this.scale * dt

        this.x += abs(ndx) < abs(dx)? ndx : dx
        this.y += abs(ndy) < abs(dy)? ndy : dy
    }
}

SlideCamera.prototype.evo = function(dt) {
    this._ls.forEach( e => {
        if (e.evo && !e.dead && !e.paused) e.evo(dt)
    })

    if (this.target) this.follow(dt)

    if (this.keys[0]) {
        this.scale += this.scaleSpeed * dt
    }
    if (this.keys[1]) {
        this.scale -= this.scaleSpeed * dt
    }

    if (this.scaleTarget) {
        if (this.scale < this.scaleTarget) {
            this.scale += this.scaleSpeed * dt
            if (this.scale > this.scaleTarget) {
                this.scale = this.scaleTarget
                this.scaleTarget = 0
            }

        } else if (this.scale > this.scaleTarget) {
            this.scale -= this.scaleSpeed * dt
            if (this.scale < this.scaleTarget) {P
                this.scale = this.scaleTarget
                this.scaleTarget = 0
            }
        }
    }

}

SlideCamera.prototype.draw = function(dt) {
    ctx.save()
	let sw = env.width
	let sh = env.height
    let vp = this.getViewport()
    
    ctx.translate(sw/2, sh/2) // half-screen shift
	ctx.scale(this.scale, this.scale);
	ctx.translate(-this.x, -this.y)

    /*
    // draw viewport
    ctx.strokeStyle = '#ff0000'
    ctx.strokeRect(vp[0], vp[1], vp[2]-vp[0], vp[3]-vp[1])
    */
	    
    this._ls.forEach( e => {
        if (e.draw && !e.dead && !e.hidden) {
            // culling
            if (e._sizable) {
                if ((e._centered
                            && e.x+e.w/2 >= vp[0]
                            && e.x-e.w/2 <= vp[2]
                            && e.y+e.h/2 >= vp[1]
                            && e.y-e.h/2 <= vp[3])
                        || (e.x+e.w >= vp[0]
                            && e.x  <= vp[2]
                            && e.y+e.h >= vp[1]
                            && e.y  <= vp[3])) {
                    e.draw()
                }
            } else if (e._circular) {
                if (e.x+e.r >= vp[0]
                        && e.x-e.r <= vp[2]
                        && e.y+e.r >= vp[1]
                        && e.y-e.r <= vp[3]) {
                    e.draw()
                }

            } else {
                e.draw()
            }
        }
    })

    ctx.restore()
}
