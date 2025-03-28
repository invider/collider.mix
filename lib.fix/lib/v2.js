function copy(v) {
    return {
        x: v.x,
        y: v.y,
    }
}

function create(x, y) {
    return {
        x: x,
        y: y,
    }
}

function unit(fi) {
    return {
        x: Math.cos(fi),
        y: Math.sin(fi),
    }
}

function zero() {
    return {
        x: 0,
        y: 0,
    }
}

function normalize(v) {
    const l = Math.sqrt(v.x*v.x + v.y*v.y)
    if (l !== 0) {
        return {
            x: v.x/l,
            y: v.y/l,
        }
    } else {
        return {
            x: 0,
            y: 0,
        }
    }
}

function inverse(v) {
    return {
        x: -1 * v.x,
        y: -1 * v.y,
    }
}

function at(v, x, y) {
    return {
        x: v.x + x,
        y: v.y + y,
    }
}

function add(v1, v2) {
    return {
        x: v1.x + v2.x,
        y: v1.y + v2.y,
    }
}

function sub(v1, v2) {
    return {
        x: v1.x - v2.x,
        y: v1.y - v2.y,
    }
}

function dot(v1, v2) {
    return (v1.x * v2.x + v1.y * v2.y)
}

function mul(v1, v2) {
    return {
        x: v1.x * v2.x,
        y: v1.y * v2.y,
    }
}


function length2(v) {
    return (v.x*v.x + v.y*v.y)
}

function init() {
    extend(this, {
        scale: function scale(v1, val) {
            return {
                x: v1.x * val,
                y: v1.y * val,
            }
        },
        angle: function angle(v) {
            return Math.atan2(v.y, v.x)
        },
        length: function(v) {
            return Math.hypot(v.x, v.y)
        },
    })
}

function dump(v) {
    return ('[' + round(v.x) + ':' + round(v.y) + ']')
}
