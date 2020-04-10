
// @depends(/sys/TransformationNode)
const TransformationNode = sys.TransformationNode

const df = {
    angle: 0
}

function RotateNode(st) {
    augment(this, df)
    TransformationNode.call(this, st)
}
RotateNode.prototype = Object.create(TransformationNode.prototype)

RotateNode.prototype.draw = function() {
    save()
    rotate(this.angle)

    TransformationNode.prototype.draw.call(this)

    restore()
}
