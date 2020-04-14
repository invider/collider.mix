
// @depends(/sys/TransformationNode)
const TransformationNode = sys.TransformationNode

const df = {
    x: 0,
    y: 0,
    angle: 0,
    scale: 1,
}

function TransformNode(st) {
    augment(this, df)
    TransformationNode.call(this, st)
}
TransformNode.prototype = Object.create(TransformationNode.prototype)

TransformNode.prototype.draw = function() {
    save()
    rotate(this.angle)
    scale(this.scale, this.scale)
    translate(this.x, this.y)

    TransformationNode.prototype.draw.call(this)

    restore()
}

TransformNode.prototype.lx = function(x) {
    return (x * cos(this.angle)) * this.scale + this.x
}

TransformNode.prototype.ly = function(y) {
    return (-y * cos(this.angle)) * this.scale + this.y
}

TransformNode.prototype.gx = function(x) {
    x = (x - this.x)/this.scale
    return (x * cos(-this.angle))
}

TransformNode.prototype.gy = function(y) {
    y = (y - this.y)/this.scale
    return (-y * cos(this.angle))
}
