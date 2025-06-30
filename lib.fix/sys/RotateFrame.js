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

// translate an upper (parent) vec2 to local coordinate system
//
// Note: the incoming vec2 is mutated for better efficiency
//
// @param {array/vec2} upos - vec2 in the upper (parent) coordinate system
// @returns {array/vec2} - the incoming vec2 translated to local coordinates
RotateFrame.prototype.lpos = function(upos) {
    const ux = upos[0] * cos(this.angle) - upos[1] * sin(this.angle)
    const uy = upos[0] * sin(this.angle) + upos[1] * cos(this.angle)

    upos[0] = ux
    upos[1] = uy
    return upos
}

// translate local vec2 to upper (parent) coordinate system
//
// Note: the incoming vec2 is mutated for better efficiency
//
// @param {number} lpos - vec2 in local coordinates
// @returns {array/vec2} - the incoming vec2 translated to the upper (parent) coordinate system
RotateFrame.prototype.upos = function(lpos) {
    const lx = lpos[0] * cos(-this.angle) - lpos[1] * sin(-this.angle)
    const ly = lpos[0] * sin(-this.angle) + lpos[1] * cos(-this.angle)

    lpos[0] = lx
    lpos[1] = ly
    return lpos
}

RotateFrame.prototype.lx = false

RotateFrame.prototype.ly = false

RotateFrame.prototype.ux = false

RotateFrame.prototype.uy = false

