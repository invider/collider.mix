const POW = 2

const easingNG = {

    linear: t => t,

    easeIn: t => Math.pow(t, POW),

    easeOut: t => Math.pow(1-t, POW),

    easeInOut: t => (t <= .5)? .5 * Math.pow(2*t, POW) : .5 + .5 * ( 1 - Math.pow(1-(2*(t-.5)), POW) ),

}
