const easingNG = {

    linear: t => t,

    easeIn: t => t*t,

    easeOut: t => Math.pow(1-t, 2),

    easeInOut: t => (t <= .5)? .5 * Math.pow(2*t, 2) : .5 + .5 * ( 1 - Math.pow(1-(2*(t-.5)), 2) ),

    easeInQubic: t => t*t*t,

    easeOutQubic: t => Math.pow(1-t, 3),

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
