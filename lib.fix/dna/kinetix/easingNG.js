function bounceOut(t) {
    const D = 2.75
    const st = t / 1

    if (st < (1/D)) return 7.5625 * st * st

    if (st < (2/D)) {
        const st2 = st - (1.5/D)
        return (7.5625 * st2 * st2) + 0.75
    }

    if (st < (2.5/D)) {
        const st2 = st - (2.25/D)
        return (7.5625 * st2 * st2) + 0.9375
    }

    const st2 = st - (2.625/D)
    return (7.5625 * st2 * st2) + 0.984375
}

const easingNG = {

    linear: t => t,

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

    quad: {
        in: t => t * t,

        out: t => t * (2 - t),

        //easeInOut: t => (t <= .5)? .5 * Math.pow(2*t, 2) : .5 + .5 * ( 1 - Math.pow( 1 - (2 * (t-.5)), 2 ) ),
        inOut: t => (t < .5)? 2 * t * t : 1 - .5 * Math.pow(-2 * t + 2, 2),
    },

    qubic: {
        in: t => t * t * t,

        out: t => 1 + (--t)*t*t,

        inOut: t => (t < .5)? .5 * Math.pow(2*t, 3) : .5 + .5 * ( 1 - Math.pow(1-(2*(t-.5)), 3) ),
    },

    quart: {
        in: t => t * t * t * t,

        out: t => 1 - (--t) * t * t * t,

        inOut: t => (t < .5)? 8 * t*t*t*t : 1 - 8 * (--t)*t*t*t,
    },

    quint: {
        in: t => t * t * t * t * t,

        out: t => 1 + (--t)*t*t*t*t,

        inOut: t => (t < .5)? 16 * t*t*t*t*t : 1 + 16 * (--t)*t*t*t*t,
    },

    sine: {
        in: t => -1 * Math.cos( t * (.5*Math.PI) ) + 1,

        out: t => Math.sin( t * (.5*Math.PI) ),

        inOut: t => -.5 * ( Math.cos( Math.PI * t ) - 1 ),
    },

    circ: {
        in: t => 1 - Math.sqrt(1 - Math.pow(t, 2)),

        out: t => Math.sqrt(1 - Math.pow(t - 1, 2)),

        inOut: t => (
            (t < .5)? .5 * (1 - Math.sqrt(1 - Math.pow(2 * t, 2)))
                      : .5 * (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1)
        )
    },

    expo: {
        in: t => (t === 0)? 0 : Math.pow(2, 10 * t - 10),

        out: t => (t === 1)? 1 : 1 - Math.pow(2, -10 * t),

        inOut: t => {
            if (t === 0) return 0
            if (t === 1) return 1
            return (t < .5)? .5 * Math.pow(2, 20 * t - 10) : .5 * (2 - Math.pow(2, -20 * t + 10))
        },
    },

    back: {
        in: t => t * t * ( ((this.mag ?? 1.7) + 1 ) * t - (this.mag ?? 1.7) ),

        out: t => {
            // TODO introduce set() and clean() functions to set and reset the "mag" value
            const mag = this.mag ?? 1.7
            const st = ( t / 1 ) - 1
            return ((st * st * ( (mag + 1) * st + mag )) + 1)
        },

        inOut: t => {
            const mag = this.mag ?? 1.7,
                  t2 = 2 * t,
                  t3 = t2 - 2,
                  s = mag * 1.5

            if(t2 < 1) return ( .5 * t2 * t2 * ( ((s + 1) * t2) - s) )
            return ( .5 * (t3 * t3 * ((s + 1) * t3 + s) + 2) )
        },
    },

    bounce: {
        in: t => 1 - bounceOut(1 - t),

        out: bounceOut,

        inOut: t => (t < .5)? .5 * (1 - bounceOut(1 - 2 * t)) : .5 * (1 + bounceOut(2 * t - 1)),
    },

    elastic: {
        in: t => {
            if (t === 0) return 0
            if (t === 1) return 1
            const T3 = TAU / 3

            return (-Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * T3))
        },

        out: t => {
            if (t === 0) return 0
            if (t === 1) return 1
            const T3 = TAU / 3

            return (Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * T3) + 1)
        },

        inOut: t => {
            if (t === 0) return 0
            if (t === 1) return 1
            const T45 = TAU / 4.5

            if (t < .5) return ( -.5 * (Math.pow(2,  20 * t - 10) * Math.sin((20 * t - 11.125) * T45)) )
            return ( .5 * (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * T45)) + 1 )
        },
    },

}

function catalog() {
    const __ = easingNG
    const ls  = []
    const dir = {}

    function capitalize(name) {
        if (!name) return ''
        return (name.substring(0, 1).toUpperCase() + name.substring(1))
    }

    function nextNode(node, name) {
        if (isFun(node)) {
            node.alias = name
            ls.push(node)
            dir[name] = node
        } else if (isObj(node)) {
            Object.keys(node).forEach(key => {
                const val = node[key]
                const nextName = name + capitalize(key)
                nextNode(val, nextName)
            })
        }
    }
    nextNode(__, 'ease')

    __._ls  = ls
    __._dir = dir
}
catalog()


