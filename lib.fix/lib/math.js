'use strict'

// math library
module.exports = (function() { 

const PI = Math.PI
const PI2 = PI*2

// LCG random generator implementation

var _rnd_m = 0xFFFFFFFF, _rnd_a = 1664525, _rnd_c = 1013904223;
var _seed = 1

function rndv() {
	_seed = (_rnd_a * _seed + _rnd_c) % _rnd_m
	return _seed
}

return {
    name: 'math',

    PI: PI,
    PI2: PI2,

    // calculates the length of a vector
    length: function(x, y) {
        return Math.sqrt(x*x + y*y)
    },

    // get a normalized vector as an array of [x, y]
    normalize: function(x, y) {
        var len = this.length(x, y)
        if (len === 0) return [0, 0];
        return [x/len, y/len]
    },

    /**
     * returns distance between 2 dots
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @returns {number}
     */
    distance: function(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return Math.sqrt(dx*dx + dy*dy)
    },

    /**
     * returns square of distance between 2 dots
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @returns {number}
     */
    distanceSq: function(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return dx*dx + dy*dy
    },
    /**
     *
     * @param px
     * @param py
     * @param x1
     * @param y1
     * @param x2
     * @param y2
     * @returns {*|number}
     */
    distanceToSegmentSq: function(px, py, x1, y1, x2, y2) {
        let segLen2 = this.distanceSq(x1, y1, x2, y2);
        if (segLen2 === 0) return this.distanceSq(px, py, x1, y1);
        var t = ((px - x1)*(x2 - x1) + (py - y1)*(y2 - y1)) / segLen2;
        if (t < 0) return this.distanceSq(px, py, x1, y1);
        if (t > 1) return this.distanceSq(px, py, x2, y2);
        return this.distanceSq(px, py, x1 + t*(x2 - x1), y1 + t*(y2 - y1));
    },

    // calculates a distance from a point to a segment
    distanceToSegment: function(px, py, x1, y1, x2, y2) {
        return Math.sqrt(this.distanceToSegmentSq(px, py, x1, y1, x2, y2))
    },

    // angle from the source to the target coordinates
    targetAngle: function(sx, sy, tx, ty) {
        return Math.atan2(tx - sx, ty - sy)
    },

    // normalize an angle to 0..2*PI range
    normalizeAngle: function(a) {
        a = a % (2*Math.PI)
        return a < 0? a + 2*Math.PI : a
    },

    // get an opposite vector normalazed in 0..2*PI range
    reverseAngle: function(a) {
        a = (a + Math.PI) % (2*Math.PI)
        return a < 0? a + 2*Math.PI : a
    },

    // limit the value within provided min..max range
    limit: function(val, min, max) {
        return val < min? min : val > max? max : val
    },

    // linear interpolation of the value between v1 .. v2 and t in [0..1]
    linear: function(v1, v2, t) {
        return (v2 - v1) * t + v1
    },

    // dot product of two N2 vectors
    // useful for interception of moving objects
    dotProduct: function(x1, y1, x2, y2) {
        return x1*x2 + y1*y2
    },

    // get vector's angle in rad
    vecAngle: function(x, y) {
        return Math.atan2(y, x)
    },

    // get unit vector x from an angle
    vecX: function(a) {
        return Math.cos(a)
    },

    // get unit vector y from an angle
    vecY: function(a) {
        return Math.sin(a)
    },

    // convert degree value to radians
    degToRad: function(d) {
        return d * (Math.PI / 180)
    },

    // convert radians value to degrees
    radToDeg: function(r) {
        return r * (180 / Math.PI)
    },

    // **********
	// randomness
    
    // random float
	rndf: function rndf() {
		return rndv()/_rnd_m
	},

    // random angle in radians
	rndfi: function rndfi() {
		return this.rndf()*PI2 - PI
	},

    // random float in [0-maxValue)
	rnd: function rnd(topLimit){
		return rndv()/_rnd_m * topLimit 
	},

    // random int in [0..maxValue)
	rndi: function rndi(topLimit){
		return ~~this.rnd(topLimit)
	},

    // random sign multiplicator [1/-1]
	rnds: function rnds() {
		return this.rndf() < .5? -1 : 1
	},

    // select random element from an object or an array
	rnde: function rnde(obj) {
        if (!obj) return
        if (Array.isArray(obj)) {
            return obj[this.rndi(obj.length)]
        } else if (typeof obj === 'object') {
            const keys = Object.keys(obj)
            return obj[keys[this.rndi(keys.length)]]
        }
        return null
	},

    // shuffle array elements
    shuffle: function shuffle(array, iter) {
        if (!array) return
        if (!iter) iter = array.length * 2

        for (let i = 0; i < iter; i++) {
            const i1 = this.rndi(array.length)
            const i2 = this.rndi(array.length)

            const e1 = array[i1]
            array[i1] = array[i2]
            array[i2] = e1
        }
        return array
    }
}

})()
