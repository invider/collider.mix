const LabFrame = sys.LabFrame

// TODO maybe make 'replace' as a feature of attach?
//      explore if that is feasable for all cases

// A special frame able to inject into a particular place on the tree and preserve all the structure below
function InjectLabFrame(st) {
    LabFrame.call(this, st)
}
InjectLabFrame.prototype = Object.create(LabFrame.prototype)

// a handler to take a replaced node and attach it below
InjectLabFrame.prototype.onReplace = function(node) {
    this.attach(node)
}

// detach the node and reattach all children to the parent node
InjectLabFrame.prototype.release = function() {
    const __ = this.__
    __.detach(this)
    this._ls.forEach(n => __.attach(n))
}
