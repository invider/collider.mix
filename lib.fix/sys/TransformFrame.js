// @depends(/sys/InjectLabFrame)


// an injectable node, capable to translate, scale and rotate the view
//
// Note, that regular lx(), ly(), gx() and gy() don't work here
// and have been disabled due to rotation logic.
//
// Use lxy() and gxy() instead.
//
function TransformFrame(st) {
    sys.InjectLabFrame.call(this, augment({
        x: 0,
        y: 0,
        angle: 0,
        scale: 1,
    }, st))
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

TransformFrame.prototype.ux = false

TransformFrame.prototype.uy = false

// translate an upper (parent) vec2 to local coordinate system
//
// Note: the incoming vec2 is mutated for better efficiency
//
// @param {array/vec2} upos - vec2 in the upper (parent) coordinate system
// @returns {array/vec2} - the incoming vec2 translated to local coordinates
TransformFrame.prototype.lpos = function(upos) {
    const lx = (upos[0] - this.x)/this.scale
    const ly = (upos[1] - this.y)/this.scale

    upos[0] = lx * cos(-this.angle) - ly * sin(-this.angle)
    upos[1] = lx * sin(-this.angle) + ly * cos(-this.angle)

    return upos
}

// translate local vec2 to upper (parent) coordinate system
//
// Note: the incoming vec2 is mutated for better efficiency
//
// @param {number} lpos - vec2 in local coordinates
// @returns {array/vec2} - the incoming vec2 translated to the upper (parent) coordinate system
TransformFrame.prototype.upos = function(lpos) {
    const ux = (lpos[0] * cos(this.angle) - lpos[1] * sin(this.angle))
            * this.scale + this.x
    const uy = (lpos[0] * sin(this.angle) + lpos[1] * cos(this.angle))
            * this.scale + this.y

    lpos[0] = ux
    lpos[1] = uy
    return lpos
}

