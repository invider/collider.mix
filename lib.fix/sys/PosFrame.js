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

// translate upper (parent) x to local coordinates
// @param {number} ux - upper x (in the parent's coordinate system)
// @returns {number} - local x
PosFrame.prototype.lx = function(ux) {
    return ux - this.x
}

// translate upper (parent) y to local coordinates
// @param {number} uy - upper y (in the parent's coordinate system)
// @returns {number} - local y
PosFrame.prototype.ly = function(uy) {
    return uy - this.y
}

// translate an upper (parent) vec2 to local coordinate system
//
// Note: the incoming vec2 is mutated for better efficiency
//
// @param {array/vec2} upos - vec2 in the upper (parent) coordinate system
// @returns {array/vec2} - the incoming vec2 translated to local coordinates
PosFrame.prototype.lpos = function(upos) {
    upos[0] -= this.x
    upos[1] -= this.y
    return upos
}

// translate local x to upper (parent) coordinate system
// @param {number} lx - local x
// @returns {number} - upper x (in the parent's coordinate system)
PosFrame.prototype.ux = function(lx) {
    return lx + this.x
}

// translate local y to upper (parent) coordinate system
// @param {number} ly - local y
// @returns {number} - upper y (in the parent's coordinate system)
PosFrame.prototype.uy = function(ly) {
    return ly + this.y
}

// translate local vec2 to upper (parent) coordinate system
//
// Note: the incoming vec2 is mutated for better efficiency
//
// @param {number} lpos - vec2 in local coordinates
// @returns {array/vec2} - the incoming vec2 translated to the upper (parent) coordinate system
PosFrame.prototype.upos = function(lpos) {
    lpos[0] += this.x
    lpos[1] += this.y
    return lpos
}
