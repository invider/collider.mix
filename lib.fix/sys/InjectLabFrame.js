const LabFrame = sys.LabFrame

// TODO maybe make 'replace' as a feature of attach?
//      explore if that is feasable for all cases

function InjectLabFrame(st) {
    LabFrame.call(this, st)
}
InjectLabFrame.prototype = Object.create(LabFrame.prototype)

InjectLabFrame.prototype.onReplace = function(node) {
    this.attach(node)
}

InjectLabFrame.prototype.release = function() {
    const __ = this.__
    __.detach(this)
    this._ls.forEach(n => __.attach(n))
}
