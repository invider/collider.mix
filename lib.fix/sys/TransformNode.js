
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
    translate(this.x, this.y)
    rotate(this.angle)
    scale(this.scale, this.scale)

    TransformationNode.prototype.draw.call(this)

    restore()
}
