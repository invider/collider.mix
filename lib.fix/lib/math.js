// Utility math functions 
'use strict'

// LCG random generator implementation
function LCGSourceFactory() {
    let _rnd_m = 0xFFFFFFFF
    let _rnd_a = 1664525
    let _rnd_c = 1013904223
    let _seed = 1

    // core random value
    function rndv() {
        _seed = (_rnd_a * _seed + _rnd_c) % _rnd_m
        return _seed
    }

    return {
        setSeed: function(v) {
            _seed = v
        },

        getSeed: function() {
            return _seed
        },

        // random float
        rndf: function rndf() {
            return rndv()/_rnd_m
        },
    }
}

// Native JS random generator implementation
function NativeRNGSourceFactory() {

    return {
        // random float [0..1)
        rndf: function rndf() {
            return Math.random()
        },
    }
}

/*
 * create a source of pseudorandom numbers
 *
 * Uses LCGSourceFactory as a default.
 *
 * Create the source, set custom seed with setSeed(seed) and use provided functions
 * to get pseudorandom sequence of numbers ( rndf(), rnd(n), rndi(N), rnds(), rnde(), shuffle() ).
 *
 * @param {function/sourceFactory} source - an optional factory function for pseudorandom number source
 * @returns {object/pseudorandomSource} - a source of pseudorandom numbers
 */
function createRandomGenerator(factory) {
    factory = factory || LCGSourceFactory

    const generator = factory()
    const rndf = generator.rndf // rndf() is the RNG core provided by the factory

    // random float in the range [v1..v2] or [0..v1] or [0..1]
    function rnd(v1, v2) {
        if (v2) {
            return v1 + rndf() * (v2 - v1)
        } else if (v1) {
            return rndf() * v1
        } else {
            return rndf()
        }
    }

    // random int in [0..maxValue)
    function rndi(v1, v2) {
        if (v2) {
            return ~~(v1 + (v2 - v1)*rndf())
        } else {
            return ~~(v1 * rndf())
        }
    }

    function RND(v1, v2) {
        if (v2) {
            return ~~(v1 + ((v2 + 1) - v1)*rndf())
        } else {
            return ~~(v1 * rndf())
        }
    }

    return {
        getSeed: function() {
            if (generator.getSeed) generator.getSeed()
            else return 0
        },
        setSeed: function(seed) {
            if (generator.setSeed) generator.setSeed(seed)
            else throw new Error(`Selected random number generator doesn't support custom seeds!`)
        },
        rndf: rndf,

        rnd:  rnd,
        rndi: rndi,
        RND:  RND,

        // random angle in radians
        rnda: function rnda() {
            return rndf()*PI2 - PI
        },

        // random sign multiplicator [-1/1] with optional -1 probability
        rnds: function rnds(n) {
            n = n || .5
            return rndf() < n? -1 : 1
        },

        // random zero/one value multiplicator [0/1] with optional zero probability (.5 by default)
        rndz: function rndz(n) {
            n = n || .5
            return rndf() < n? 0 : 1
        },

        // select random element from an object or an array
        rnde: function rnde(obj) {
            if (!obj) return
            if (Array.isArray(obj)) {
                return obj[rndi(obj.length)]
            } else if (typeof obj === 'object') {
                const keys = Object.keys(obj)
                return obj[keys[rndi(keys.length)]]
            }
            return null
        },

        // shuffle array elements
        shuffle: function shuffle(array, iter) {
            if (!array) return
            if (!iter) iter = array.length * 2

            for (let i = 0; i < iter; i++) {
                const i1 = rndi(array.length)
                const i2 = rndi(array.length)

                const e1 = array[i1]
                array[i1] = array[i2]
                array[i2] = e1
            }
            return array
        }
    }
}


// math library
module.exports = (function() { 

const PI = Math.PI
const PI2 = PI*2

const math = {
    name: 'math',

    LCGSourceFactory: LCGSourceFactory,
    NativeRNGSourceFactory: NativeRNGSourceFactory,

    // Pi constant
    PI: PI,

    // Doulbe Pi constant
    PI2: PI2,

    // calculates the length of a vector
    // @param {number} x
    // @param {number} y
    // @returns {number} - length of a vector
    length: function(x, y) {
        return Math.hypot(x, y)
    },

    // get a normalized vector as an array of [x, y]
    //
    // @param {number} x
    // @param {number} y
    // @returns {array[x, y]} - unit vector
    normalize: function(x, y) {
        var len = this.length(x, y)
        if (len === 0) return [0, 0];
        return [x/len, y/len]
    },

    /**
     * returns distance between 2 points
     *
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @returns {number}
     */
    distance: function(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return Math.sqrt(dx*dx + dy*dy)
    },

    /**
     * returns square of distance between 2 points
     *
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @returns {number}
     */
    distanceSq: function(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return dx*dx + dy*dy
    },

    /**
     * square of the distance from a point to a segment
     *
     * @param {number} px - point x 
     * @param {number} py - point y
     * @param {number} x1 - first segment point x
     * @param {number} y1 - first segment point y
     * @param {number} x2 - second segment point x
     * @param {number} y2 - second segment point y
     * @returns {number} - square of the distance
     */
    distanceToSegmentSq: function(px, py, x1, y1, x2, y2) {
        let segLen2 = this.distanceSq(x1, y1, x2, y2);
        if (segLen2 === 0) return this.distanceSq(px, py, x1, y1);
        var t = ((px - x1)*(x2 - x1) + (py - y1)*(y2 - y1)) / segLen2;
        if (t < 0) return this.distanceSq(px, py, x1, y1);
        if (t > 1) return this.distanceSq(px, py, x2, y2);
        return this.distanceSq(px, py, x1 + t*(x2 - x1), y1 + t*(y2 - y1));
    },

    /**
     * distance from a point to a segment
     *
     * @param {number} px - point x 
     * @param {number} py - point y
     * @param {number} x1 - first segment point x
     * @param {number} y1 - first segment point y
     * @param {number} x2 - second segment point x
     * @param {number} y2 - second segment point y
     * @returns {number} - distance
     */
    distanceToSegment: function(px, py, x1, y1, x2, y2) {
        return Math.sqrt(this.distanceToSegmentSq(px, py, x1, y1, x2, y2))
    },

    // normal vector to a line
    // 
    // @param {number} x1 - first point x
    // @param {number} y1 - first point y
    // @param {number} x2 - second point x
    // @param {number} y2 - second point y
    // @returns {array/2d-vector} - normal vector
    normalVector: function(x1, y1, x2, y2) {
        const dx = x2 - x1
        const dy = y2 - y1
        const len = Math.sqrt(dy*dy + dx*dx)
        return [
            -dy / len, // normal x component
            dx / len,  // normal y component
        ]
    },

    // angle of direction vector from *[x1, y1]* to *[x2, y2]* in relation to OX axis
    //
    // @param {number} x1 - first vector x coordinate
    // @param {number} y1 - first vector y coordinate
    // @param {number} x2 - second vector x coordinate
    // @param {number} y2 - second vector y coordinate
    // @returns {number/radians} - an angle of direction vector from [x1:y1] to [x2:y2]
    bearing: function(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1)
    },

    // normalize an angle to [0..2**PI] range
    //
    // @param {number/radians} a - original angle in radians
    // @returns {number/radians} - normalized angle in radians
    normalizeAngle: function(a) {
        a = a % (2*Math.PI)
        return a < 0? a + 2*Math.PI : a
    },

    // get an opposite angle normalazed in [0..2**PI] range
    //
    // @param {number/radians} a - original angle in radians
    // @returns {number/radians} - reveresed angle in radians, normalazied in [0..2*PI]
    reverseAngle: function(a) {
        a = (a + Math.PI) % (2*Math.PI)
        return a < 0? a + 2*Math.PI : a
    },

    // compute the fractional part of the argument
    //
    // @param {number} val - the original value
    // @returns {number} - the fractional part of the value
    fract: function(val) {
        return val - floor(val)
    },

    // clamp a value into the provided [min..max] range
    // @param {number} val - original value
    // @param {number} min
    // @param {number} max
    // @returns {number} - a value limited to [min..max] range
    clamp: function(val, min, max) {
        return val < min? min : val > max? max : val
    },

    // linear interpolation between start .. stop of val in [0..1]
    // @param {number} start
    // @param {number} stop
    // @param {number} val - current value, assumed to be in the range [0..1]
    lerp: function(start, stop, val) {
        return (start * (1 - val)  +  stop * val)
    },

    // linear interpolation between start .. stop of val in [0..1]
    // @param {number} start
    // @param {number} stop
    // @param {number} val - current value, assumed to be in the range [0..1]
    mix: function(start, stop, val) {
        return (start * (1 - val)  +  stop * val)
    },

    // dot product of two N2 vectors
    // useful for interception of moving objects
    // @param {number} x1
    // @param {number} y1
    // @param {number} x2
    // @param {number} y2
    dotProduct: function(x1, y1, x2, y2) {
        return x1*x2 + y1*y2
    },

    // get vector's angle in rad
    // @param {number} x
    // @param {number} y
    // @returns {number/angle} - angle in radians
    vecAngle: function(x, y) {
        return Math.atan2(y, x)
    },

    // get unit vector x from an angle
    // @param {number} a - angle in radians
    // @returns {number[0..1]} - unit vector x component
    vecX: function(a) {
        return Math.cos(a)
    },

    // get unit vector y from an angle
    // @param {number} a - angle in radians
    // @returns {number[0..1]} - unit vector y component
    vecY: function(a) {
        return Math.sin(a)
    },

    // convert degree value to radians
    // @param {number} d - angle in degrees
    // @returns {number} - angle in radians
    radians: function(d) {
        return d * DEG_TO_RAD
    },

    // convert degree value to radians
    // @param {number} d - angle in degrees
    // @returns {number} - angle in radians
    degToRad: function(d) {
        return d * DEG_TO_RAD
    },

    // convert radians value to degrees
    // @param {number} r - angle in radians
    // @returns {number} - angle in degrees
    degrees: function(r) {
        return r * RAD_TO_DEG
    },

    // convert radians value to degrees
    // @param {number} r - angle in radians
    // @returns {number} - angle in degrees
    radToDeg: function(r) {
        return r * RAD_TO_DEG
    },

    createRandomGenerator: createRandomGenerator,
}

const generator = createRandomGenerator()
augment(math, generator)

return math

})()
