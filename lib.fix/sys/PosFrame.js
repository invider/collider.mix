
// @depends(/sys/InjectLabFrame)
const InjectLabFrame = sys.InjectLabFrame

const df = {
    x: 0,
    y: 0,
}

function PosFrame(st) {
    augment(this, df)
    InjectLabFrame.call(this, st)
}
PosFrame.prototype = Object.create(InjectLabFrame.prototype)

PosFrame.prototype.draw = function() {
    save()
    translate(this.x, this.y)

    InjectLabFrame.prototype.draw.call(this)

    restore()
}

PosFrame.prototype.lx = function(x) {
    return x + this.x
}

PosFrame.prototype.ly = function(y) {
    return y + this.y
}

PosFrame.prototype.gx = function(x) {
    return x - this.x
}

PosFrame.prototype.gy = function(y) {
    return y - this.y
}
