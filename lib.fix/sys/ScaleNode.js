
// @depends(/sys/TransformationNode)
const TransformationNode = sys.TransformationNode

const df = {
    x: 1,
    y: 1,
}

function ScaleNode(st) {
    augment(this, df)
    TransformationNode.call(this, st)
}
ScaleNode.prototype = Object.create(TransformationNode.prototype)

ScaleNode.prototype.draw = function() {
    save()
    scale(this.x, this.y)

    TransformationNode.prototype.draw.call(this)

    restore()
}
