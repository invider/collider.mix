const easing = {

    saw: function(t) {
        // detect next step
        const fv = floor(t)
        if (fv > this.mark) this.step()
        this.mark = fv

        return t % 1
    },

    triangle: function(t) {
        // detect next step
        const m = floor(t)
        if (m > this.mark) this.step()
        this.mark = m

        const w = t % 1
        const odd = (t|0) % 2 === 1
        return odd? 1-w : w
    },

    sin: function(t) {
        // detect next step
        const m = floor(t)
        if (m > this.mark) this.step()
        this.mark = m

        return abs(sin(t * HALF_PI))
    },

    quad: function(t) {
        // detect next step
        const m = floor(t)
        if (m > this.mark) this.step()
        this.mark = m

        const w = t % 1
        const odd = (t|0) % 2 === 1
        return odd? 1-w*w : w*w
    },

    cubic: function(t) {

        // detect next step
        const m = floor(t)
        if (m > this.mark) this.step()
        this.mark = m

        const w = t % 1
        const odd = (t|0) % 2 === 1
        return odd? 1-w*w*w : w*w*w
    },

    quart: function(t) {
        // detect next step
        const m = floor(t)
        if (m > this.mark) this.step()
        this.mark = m

        const w = t % 1
        const odd = (t|0) % 2 === 1
        return odd? 1-w*w*w*w : w*w*w*w
    },

    elastic: function(t) {
        const m = floor(t)
        if (m > this.mark) this.step()
        this.mark = m

        t = t % HALF_PI
        return (.04 - .04/t) * Math.sin(25*t) + 1;
        /*
        return ((t -= .5) < 0 ?
            (.02 + .01/t) * sin(50 * t)
            : (.02 - .01/t) * sin(50 * t) + 1
        );
        */
    },

    cubicBezier: function(t) {
        // detect next step
        const m = floor(t)
        if (m > this.mark) this.step()
        this.mark = m

        t = t % 1
        const p1x = this.p1x || .17
        const p1y = this.p1y || .67
        const p2x = this.p2x || .83
        const p2y = this.p2y || .67
        const val = (3*t*pow(1 - t, 2)
            * p1x + 3*t*t*(1 - t)
            * p2x + t*t*t)
        
        return val
    },
}
