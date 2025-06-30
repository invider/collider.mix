// @depends(/sys/InjectLabFrame)
const InjectLabFrame = sys.InjectLabFrame

// an injectable node, capable to scale the view
function ScaleFrame(st) {
    InjectLabFrame.call(this, augment({
        x: 1,
        y: 1,
    }, st))
}
ScaleFrame.prototype = Object.create(InjectLabFrame.prototype)

// scale by x, y and draw all subnodes
ScaleFrame.prototype.draw = function() {
    save()
    scale(this.x, this.y)

    InjectLabFrame.prototype.draw.call(this)

    restore()
}

// translate upper (parent) x to local coordinates
//
// @param {number} ux - upper x (in the parent's coordinate system)
// @returns {number} - local x
ScaleFrame.prototype.lx = function(ux) {
    return ux / this.x
}

// translate upper (parent) y to local coordinates
//
// @param {number} uy - upper y (in the parent's coordinate system)
// @returns {number} - local y
ScaleFrame.prototype.ly = function(uy) {
    return uy / this.y
}

// translate an upper (parent) vec2 to local coordinate system
//
// Note: the incoming vec2 is mutated for better efficiency
//
// @param {array/vec2} upos - vec2 in the upper (parent) coordinate system
// @returns {array/vec2} - the incoming vec2 translated to local coordinates
ScaleFrame.prototype.lpos = function(upos) {
    upos[0] = upos[0] / this.x
    upos[1] = upos[1] / this.y

    return upos
}

// translate local x to upper (parent) coordinates
//
// @param {number} lx - local x
// @returns {number} - upper x (in the parent's coordinate system)
ScaleFrame.prototype.ux = function(lx) {
    return lx * this.x
}

// translate local y to upper (parent) coordinates
//
// @param {number} ly - local y
// @returns {number} - upper y (in the parent's coordinate system)
ScaleFrame.prototype.uy = function(ly) {
    return ly * this.y
}

// translate local vec2 to upper (parent) coordinate system
//
// Note: the incoming vec2 is mutated for better efficiency
//
// @param {number} lpos - vec2 in local coordinates
// @returns {array/vec2} - the incoming vec2 translated to the upper (parent) coordinate system
ScaleFrame.prototype.upos = function(lpos) {
    lpos[0] = lpos[0] * this.x
    lpos[1] = lpos[1] * this.y

    return lpos
}
