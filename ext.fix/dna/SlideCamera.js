//
// target-following zoom in/out camera constructor
//
const SlideCamera = function(dat) {
    this.name = 'cam'
    this.x = 0
    this.y = 0
    this.scale = 1
    this.target = false
    this.targetingPrecision = 1
    this.speed = 1
    this.zoomOnPlusMinus = false

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

SlideCamera.prototype.bindZoom = function() {
    let cam = this
    sys.after(trap, 'equalDown', function() {
        cam.zoom(1.2)
    })
    sys.after(trap, 'minusDown', function() {
        cam.zoom(0.8)
    })
}

SlideCamera.prototype.init = function() {
    if (this.zoomOnPlusMinus) this.bindZoom()
}

SlideCamera.prototype.zoom = function(z) {
    this.scale *= z
}

SlideCamera.prototype.follow = function(dt) {
    let dx = this.target.x - this.x
    let dy = this.target.y - this.y
    if (dx < this.targetingPrecision
                && dx > -this.targetingPrecision
                && dy < this.targetingPrecision
                && dy > -this.targetingPrecision) {

        // camera is within precision range
        if (!this.keepFollowing) this.target = false
        return
    }
    let fi = Math.atan2(dy, dx);
    this.x += Math.cos(fi) * this.speed / this.scale * dt
    this.y += Math.sin(fi) * this.speed / this.scale * dt
}

SlideCamera.prototype.evo = function(dt) {
    this._ls.forEach( e => {
        if (e.evo && !e.dead && !e.paused) e.evo(dt)
    })

    if (this.target) this.follow(dt)
}

SlideCamera.prototype.draw = function(dt) {
    ctx.save()
	let sw = ctx.width
	let sh = ctx.height
    let sw2 = sw/2
    let sh2 = sh/2
    let vp = this.getViewport()
    
    ctx.translate(sw2, sh2)
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
            if (e._sizable
                    && e.x+e.w/2 >= vp[0]
                    && e.x-e.w/2 <= vp[2]
                    && e.y+e.h/2 >= vp[1]
                    && e.y-e.h/2 <= vp[3]) {
                e.draw()
            } else {
                e.draw()
            }
        }
    })

    ctx.restore()
}
