// @depends(/sys/InjectLabFrame)
const InjectLabFrame = sys.InjectLabFrame

const df = {
    x: 1,
    y: 1,
}

function ScaleFrame(st) {
    augment(this, df)
    InjectLabFrame.call(this, st)
}
ScaleFrame.prototype = Object.create(InjectLabFrame.prototype)

ScaleFrame.prototype.draw = function() {
    save()
    scale(this.x, this.y)

    InjectLabFrame.prototype.draw.call(this)

    restore()
}

ScaleFrame.prototype.lx = function(x) {
    return x * this.x
}

ScaleFrame.prototype.ly = function(y) {
    return y * this.y
}

ScaleFrame.prototype.gx = function(x) {
    return x / this.x
}

ScaleFrame.prototype.gy = function(y) {
    return y / this.y
}
