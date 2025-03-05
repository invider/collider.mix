// mutable array-based 2d vector operations

// construct a 2d vector from x and y values
// @param {number} x
// @param {number} y
// @returns {Array/vector2d} - created 2d vector array
function create(x, y) {
    return [ x, y ]
}

// clone a 2d vector into another array
// @param {Array/vector2d} v - source 2d vector
// @returns {Array/vector2d} - cloned 2d vector array
function clone(v) {
    return v.slice()
}

// construct a unit 2d vector array from an angle
// @param {number/angle} fi
// @returns {Array/vector2d} - created 2d vector array
function unit(fi) {
    return [
        Math.cos(fi),
        Math.sin(fi),
    ]
}

// normalize provided vector to unit size
// @param {Array/vector2d} - vector to normalize
// @returns {Array/vector2d} - normalized original vector
function normalize(v) {
    const l = Math.sqrt(v[0]*v[0] + v[1]*v[1])
    if (l !== 0) {
        v[0] /= l
        v[1] /= l
    } else {
        v[0] = 0
        v[1] = 0
    }
    return v
}

// inverse provided vector
// @param {Array/vector2d} - vector to inverse
// @returns {Array/vector2d} - inversed original vector
function inverse(v) {
    v[0] *= -1
    v[1] *= -1
    return v
}


function add(v1, v2) {
    v1[0] += v2[0]
    v1[1] += v2[1]
    return v1
}

// add vectors with second vector represented as source coordinates
function addxy(v, x, y) {
    v[0] += x
    v[1] += y
    return v
}

function sub(v1, v2) {
    v1[0] -= v2[0]
    v1[1] -= v2[1]
    return v1
}

function subxy(v1, x, y) {
    v1[0] -= x
    v1[1] -= y
    return v1
}

function dot(v1, v2) {
    return (v1[0] * v2[0] + v1[1] * v2[1])
}

function mul(v1, v2) {
    v1[0] *= v2[0]
    v1[1] *= v2[1]
    return v1
}

function mulxy(v1, x, y) {
    v1[0] *= x
    v1[1] *= y
    return v1
}

function length2(v) {
    return (v[0]*v[0] + v[1]*v[1])
}

function angle(v) {
    return Math.atan2(v[1], v[0])
}

function dump(v) {
    return ('[' + round(v[0]) + ':' + round(v[1]) + ']')
}

module.exports = {

    // scalar multiplication of 2d vector array
    // @param {Array/vector2d} v - source 2d vector
    // @returns {Array/vector2d} - scaled 2d vector array
    scale: function(v1, val) {
        return [ v1[0]*val, v1[1]*val ]
    },
    bearing: function(s, t) {
        return Math.atan2(s[0] - t[0], s[1] - t[1])
    },

    create,
    clone,
    unit,
    normalize,
    inverse,
    add,
    addxy,
    sub,
    subxy,
    dot,
    mul,
    mulxy,
    length: function length(v) {
        return Math.hypot(v[0], v[1])
    },
    length2,
    angle,
    dump,
}
