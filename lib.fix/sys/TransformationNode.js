const LabFrame = sys.LabFrame

// TODO maybe make 'replace' as a feature of attach?
//      explore if that is feasable for all cases

function TransformationNode(st) {
    LabFrame.call(this, st)
}
TransformationNode.prototype = Object.create(LabFrame.prototype)

TransformationNode.prototype.onReplace = function(node) {
    this.attach(node)
}

TransformationNode.prototype.release = function() {
    const __ = this.__
    __.detach(this)
    this._ls.forEach(n => __.attach(n))
}
