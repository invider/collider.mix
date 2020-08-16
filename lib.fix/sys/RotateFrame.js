// @depends(/sys/InjectLabFrame)
const InjectLabFrame = sys.InjectLabFrame

const df = {
    angle: 0
}

// an injectable node, capable to rotate the view
function RotateFrame(st) {
    augment(this, df)
    InjectLabFrame.call(this, st)
}
RotateFrame.prototype = Object.create(InjectLabFrame.prototype)

// rotate by andle and and draw all subnodes
RotateFrame.prototype.draw = function() {
    save()
    rotate(this.angle)

    InjectLabFrame.prototype.draw.call(this)

    restore()
}

// translate x,y to local coordinate system
// @param {number} x - global x
// @param {number} y - global y
// @returns {object/2d-vector} - {x,y} in local coordinates
RotateFrame.prototype.lxy = function(x, y) {
    return {
        x: x * cos(this.angle) - y * sin(this.angle),
        y: x * sin(this.angle) + y * cos(this.angle),
    }
}

// translate x,y to parent node coordinate system
// @param {number} x - local x
// @param {number} y - local y
// @returns {object/2d-vector} - {x,y} in parent node coordinates
RotateFrame.prototype.gxy = function(x, y) {
    return {
        x: x * cos(-this.angle) - y * sin(-this.angle),
        y: x * sin(-this.angle) + y * cos(-this.angle),
    }
}

RotateFrame.prototype.lx = false

RotateFrame.prototype.ly = false

RotateFrame.prototype.gx = false

RotateFrame.prototype.gy = false

// calculate a vector translated to the _/lab_ coordinate system
// @param {object/2d-vector} v - source 2d vector
// @returns {object/2d-vector} - {x,y} in _/lab_ coordinates
RotateFrame.prototype.labVector = function(v2) {
    return this.__.labVector( this.gxy(v2.x, v2.y) )
}
