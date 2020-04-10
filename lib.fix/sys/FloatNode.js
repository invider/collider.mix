
const LabFrame = sys.LabFrame

const Transformer = {
    'move': class Move {
        constructor(st) {
            augment(this, st)
        }
        on() {
        }
        evo(dt) {
        }
        draw(dt) {
        }
    }
}

function FloatNode(st) {
    LabFrame.call(this, st)

    this.keypoints = []
}
FloatNode.prototype = Object.create(LabFrame.prototype)

FloatNode.prototype.onReplace = function(node) {
    this.attach(node)
}

FloatNode.prototype.evo = function(dt) {
    LabFrame.prototype.evo.call(this, dt)
}

FloatNode.prototype.draw = function() {
    save()
    translate(rx(.5), ry(.5))
    scale(.5, .5)

    LabFrame.prototype.draw.call(this)

    restore()
}

FloatNode.prototype.release = function() {
    const __ = this.__
    __.detach(this)
    this._ls.forEach(n => __.attach(n))
}
