// @depends(/sys/InjectLabFrame)
const InjectLabFrame = sys.InjectLabFrame

const df = {
    angle: 0
}

function RotateFrame(st) {
    augment(this, df)
    InjectLabFrame.call(this, st)
}
RotateFrame.prototype = Object.create(InjectLabFrame.prototype)

RotateFrame.prototype.draw = function() {
    save()
    rotate(this.angle)

    InjectLabFrame.prototype.draw.call(this)

    restore()
}

RotateFrame.prototype.lx = function(x) {
    return x * cos(this.angle)
}

RotateFrame.prototype.ly = function(y) {
    return -y * cos(this.angle)
}

RotateFrame.prototype.gx = function(x) {
    return x * cos(-this.angle)
}

RotateFrame.prototype.gy = function(y) {
    return -y * cos(-this.angle)
}
