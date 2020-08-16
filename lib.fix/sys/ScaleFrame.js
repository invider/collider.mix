// @depends(/sys/InjectLabFrame)
const InjectLabFrame = sys.InjectLabFrame

const df = {
    x: 1,
    y: 1,
}

// an injectable node, capable to scale the view
function ScaleFrame(st) {
    augment(this, df)
    InjectLabFrame.call(this, st)
}
ScaleFrame.prototype = Object.create(InjectLabFrame.prototype)

// scale by x, y and draw all subnodes
ScaleFrame.prototype.draw = function() {
    save()
    scale(this.x, this.y)

    InjectLabFrame.prototype.draw.call(this)

    restore()
}

// translate global x to local coordinates
// @param {number} x - global x
// @returns {number} - local x
ScaleFrame.prototype.lx = function(x) {
    return x / this.x
}

// translate global y to local coordinates
// @param {number} y - global y
// @returns {number} - local y
ScaleFrame.prototype.ly = function(y) {
    return y / this.y
}

// translate x,y to local coordinate system
// @param {number} x - global x
// @param {number} y - global y
// @returns {object/2d-vector} - {x,y} in local coordinates
ScaleFrame.prototype.lxy = function(x, y) {
    return {
        x: x / this.x,
        y: y / this.y,
    }
}

// translate local x to global coordinates
// @param {number} x - local x
// @returns {number} - global x
ScaleFrame.prototype.gx = function(x) {
    return x * this.x
}

// translate local y to global coordinates
// @param {number} y - local y
// @returns {number} - global y
ScaleFrame.prototype.gy = function(y) {
    return y * this.y
}

// translate x,y to parent node coordinate system
// @param {number} x - local x
// @param {number} y - local y
// @returns {object/2d-vector} - {x,y} in parent node coordinates
ScaleFrame.prototype.gxy = function(x, y) {
    return {
        x: x * this.x,
        y: y * this.y,
    }
}

// calculate a vector translated to the _/lab_ coordinate system
// @param {object/2d-vector} v - source 2d vector
// @returns {object/2d-vector} - {x,y} in _/lab_ coordinates
ScaleFrame.prototype.labVector = function(v2) {
    return this.__.labVector( this.lxy(v2.x, v2.y) )
}
