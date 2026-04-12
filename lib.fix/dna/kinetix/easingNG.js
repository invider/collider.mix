const easingNG = {

    linear: t => t,

    easeIn: t => t * t,

    easeOut: t => t * (2 - t),

    //easeInOut: t => (t <= .5)? .5 * Math.pow(2*t, 2) : .5 + .5 * ( 1 - Math.pow( 1 - (2 * (t-.5)), 2 ) ),
    easeInOut: t => (t < .5)? 2 * t * t : 1 - .5 * Math.pow(-2 * t + 2, 2),

    easeInQubic: t => t * t * t,

    easeOutQubic: t => 1 + (--t)*t*t,

    easeInOutQubic: t => (t < .5)? .5 * Math.pow(2*t, 3) : .5 + .5 * ( 1 - Math.pow(1-(2*(t-.5)), 3) ),

    easeInQuart: t => t * t * t * t,

    easeOutQuart: t => 1 - (--t) * t * t * t,

    easeInOutQuart: t => (t < .5)? 8 * t*t*t*t : 1 - 8 * (--t)*t*t*t,

    easeInQuint: t => t * t * t * t * t,

    easeOutQuint: t => 1 + (--t)*t*t*t*t,

    easeInOutQuint: t => (t < .5)? 16 * t*t*t*t*t : 1 + 16 * (--t)*t*t*t*t,

    easeInSine: t => -1 * Math.cos( t * (.5*Math.PI) ) + 1,

    easeOutSine: t => Math.sin( t * (.5*Math.PI) ),

    easeInOutSine: t => -.5 * ( Math.cos( Math.PI * t ) - 1 ),

    easeInElastic: function(t) {
        if (t === 0) return 0
        if (t === 1) return 1
        const T3 = TAU / 3

        return (-Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * T3))
    },

    cubicBezier: function(t) {
        const p1x = this.p1x || .17,
              p1y = this.p1y || .67,
              p2x = this.p2x || .83,
              p2y = this.p2y || .67
        // TODO why p1y & p2y are not used here?
        return (
              3*t*pow(1 - t, 2)
            * p1x + 3*t*t*(1 - t)
            * p2x + t*t*t
        )
    },
}
