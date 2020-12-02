// @depends(/sys/InjectLabFrame)

const InjectLabFrame = sys.InjectLabFrame

const df = {
    x: 0,
    y: 0,
    w: rx(1),
    h: ry(1),
}

// an injectable node, capable to clip the view
function ClipFrame(st) {
    augment(this, df)
    InjectLabFrame.call(this, st)
}
ClipFrame.prototype = Object.create(InjectLabFrame.prototype)

// clip by x,y,w,h and draw all subnodes
ClipFrame.prototype.draw = function() {
    save()
    clip(this.x, this.y, this.w, this.h)

    InjectLabFrame.prototype.draw.call(this)

    restore()
}
