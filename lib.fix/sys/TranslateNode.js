
// @depends(/sys/TransformationNode)
const TransformationNode = sys.TransformationNode

const df = {
    x: 0,
    y: 0,
}

function TranslateNode(st) {
    augment(this, df)
    TransformationNode.call(this, st)
}
TranslateNode.prototype = Object.create(TransformationNode.prototype)

TranslateNode.prototype.draw = function() {
    save()
    translate(this.x, this.y)

    TransformationNode.prototype.draw.call(this)

    restore()
}
