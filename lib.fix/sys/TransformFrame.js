// @depends(/sys/InjectLabFrame)
const InjectLabFrame = sys.InjectLabFrame

const df = {
    x: 0,
    y: 0,
    angle: 0,
    scale: 1,
}

function TransformNode(st) {
    augment(this, df)
    InjectLabFrame.call(this, st)
}
TransformNode.prototype = Object.create(InjectLabFrame.prototype)

TransformNode.prototype.draw = function() {
    save()
    translate(-this.x, -this.y)
    scale(1/this.scale, 1/this.scale)
    rotate(-this.angle)

    InjectLabFrame.prototype.draw.call(this)

    restore()
}

TransformNode.prototype.lx = false

TransformNode.prototype.ly = false

TransformNode.prototype.gx = false

TransformNode.prototype.gy = false

TransformNode.prototype.lxy = function(x, y) {
    const lx = (x - this.x)/this.scale
    const ly = (y - this.y)/this.scale

    return {
        x: lx * cos(-this.angle) - ly * sin(-this.angle),
        y: lx * sin(-this.angle) + ly * cos(-this.angle),

    }
}

TransformNode.prototype.gxy = function(x, y) {
    return {
        x: (x * cos(this.angle) - y * sin(this.angle))
                * this.scale + this.x,
        y: (x * sin(this.angle) + y * cos(this.angle))
                * this.scale + this.y,
    }
}

TransformNode.prototype.labVector = function(v) {
    const s = this.scale
    return this.__.labVector({
        x: (x * cos(this.angle) - y/s * sin(this.angle)) * s,
        y: (x * sin(this.angle) + y/s * cos(this.angle)) * s,
    })
}
