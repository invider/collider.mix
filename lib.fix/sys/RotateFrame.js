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

RotateFrame.prototype.lxy = function(x, y) {
    return {
        x: x * cos(this.angle) - y * sin(this.angle),
        y: x * sin(this.angle) + y * cos(this.angle),
    }
}

RotateFrame.prototype.gxy = function(x, y) {
    return {
        x: x * cos(-this.angle) - y * sin(-this.angle),
        y: x * sin(-this.angle) + y * cos(-this.angle),
    }
}

RotateFrame.prototype.lx = false

RotateFrame.prototype.ly = false

RotateFrame.prototype.gx = false

RotateFrame.prototype.gy = false
