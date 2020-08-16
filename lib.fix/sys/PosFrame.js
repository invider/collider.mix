// @depends(/sys/InjectLabFrame)

const InjectLabFrame = sys.InjectLabFrame

const df = {
    x: 0,
    y: 0,
}

// an injectable node, capable to translate the view
function PosFrame(st) {
    augment(this, df)
    InjectLabFrame.call(this, st)
}
PosFrame.prototype = Object.create(InjectLabFrame.prototype)

// translate by x,y and draw all subnodes
PosFrame.prototype.draw = function() {
    save()
    translate(this.x, this.y)

    InjectLabFrame.prototype.draw.call(this)

    restore()
}

// translate global x to local coordinates
// @param {number} x - global x
// @returns {number} - local x
PosFrame.prototype.lx = function(x) {
    return x - this.x
}

// translate global y to local coordinates
// @param {number} y - global y
// @returns {number} - local y
PosFrame.prototype.ly = function(y) {
    return y - this.y
}

// translate x,y to local coordinate system
// @param {number} x - global x
// @param {number} y - global y
// @returns {object/2d-vector} - {x,y} in local coordinates
PosFrame.prototype.lxy = function(x, y) {
    return {
        x: x - this.x,
        y: y - this.y,
    }
}

// translate local x to global coordinates
// @param {number} x - local x
// @returns {number} - global x
PosFrame.prototype.gx = function(x) {
    return x + this.x
}

// translate local y to global coordinates
// @param {number} y - local y
// @returns {number} - global y
PosFrame.prototype.gy = function(y) {
    return y + this.y
}

// translate x,y to parent node coordinate system
// @param {number} x - local x
// @param {number} y - local y
// @returns {object/2d-vector} - {x,y} in parent node coordinates
PosFrame.prototype.gxy = function(x, y) {
    return {
        x: x + this.x,
        y: y + this.y,
    }
}
