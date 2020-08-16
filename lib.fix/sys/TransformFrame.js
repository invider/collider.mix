
// @depends(/sys/InjectLabFrame)

const df = {
    x: 0,
    y: 0,
    angle: 0,
    scale: 1,
}

// an injectable node, capable to translate, scale and rotate the view
//
// Note, that regular lx(), ly(), gx() and gy() don't work here
// and have been disabled due to rotation logic.
//
// Use lxy() and gxy() instead.
//
function TransformFrame(st) {
    augment(this, df)
    InjectLabFrame.call(this, st)
}
TransformFrame.prototype = Object.create(sys.InjectLabFrame.prototype)

// transform and draw all subnodes
// Following transformations are performed:
// * translate to -x, -y
// * scale to 1/scale
// * rotate to -angle
TransformFrame.prototype.draw = function() {
    save()
    translate(-this.x, -this.y)
    scale(1/this.scale, 1/this.scale)
    rotate(-this.angle)

    InjectLabFrame.prototype.draw.call(this)

    restore()
}

TransformFrame.prototype.lx = false

TransformFrame.prototype.ly = false

TransformFrame.prototype.gx = false

TransformFrame.prototype.gy = false

// translate x,y to local coordinate system
// @param {number} x - global x
// @param {number} y - global y
// @returns {object/2d-vector} - {x,y} in local coordinates
TransformFrame.prototype.lxy = function(x, y) {
    const lx = (x - this.x)/this.scale
    const ly = (y - this.y)/this.scale

    return {
        x: lx * cos(-this.angle) - ly * sin(-this.angle),
        y: lx * sin(-this.angle) + ly * cos(-this.angle),

    }
}

// translate x,y to parent node coordinate system
// @param {number} x - local x
// @param {number} y - local y
// @returns {object/2d-vector} - {x,y} in parent node coordinates
TransformFrame.prototype.gxy = function(x, y) {
    return {
        x: (x * cos(this.angle) - y * sin(this.angle))
                * this.scale + this.x,
        y: (x * sin(this.angle) + y * cos(this.angle))
                * this.scale + this.y,
    }
}

// calculate a vector translated to the _/lab_ coordinate system
// @param {object/2d-vector} v - source 2d vector
// @returns {object/2d-vector} - {x,y} in _/lab_ coordinates
TransformFrame.prototype.labVector = function(v) {
    const s = this.scale
    return this.__.labVector({
        x: (x * cos(this.angle) - y/s * sin(this.angle)) * s,
        y: (x * sin(this.angle) + y/s * cos(this.angle)) * s,
    })
}
