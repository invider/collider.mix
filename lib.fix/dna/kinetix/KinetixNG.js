class KinetixNG {

    constructor(st) {
        augment(this, {
            name: 'kinetix',
            keys: [],
        }, st)
    }

    hold() {
    }

    key(mapFn, easing) {
        // TODO resurrect a zombie if possible
        const k = {
            // initial state
            at:     env.time,

            // === key setup ===
            easing: easing,
            mapFn:  mapFn,
            freq:   1,
            steps:  1,
            // flags setup
            mirror: false,
            loop:   false,
            dead:   false,
            // event handlers setup
            onStep: null,
            onKill: null,

            // key state
            dead:   false,
            mark:   0,
        }

        this.keys.push(k)
        this.last = k
        return this
    }

    freq(fq) {
        this.last.freq = fq
        return this
    }

    steps(n) {
        this.last.steps = n
        return this
    }

    loop() {
        this.last.loop = true
        return this
    }

    mirror() {
        this.last.mirror = true
        return this
    }

    onStep(stepFn) {
        this.last.onStep = stepFn
        return this
    }

    onKill(killFn) {
        this.last.onKill = killFn
        return this
    }

    get() {
        return this.last
    }

    evo(dt) {
        const keys = this.keys,
              N    = keys.length
        for (let i = 0; i < N; i++) {
            const key = keys[i]
            if (!key.dead) {
                const t = (env.time - key.at) * key.freq,  // time in easing scale [0..1...]
                      T = t | 0  // full steps

                if (t - key.mark > 1) {
                    key.mark = T
                    if (key.onStep) key.onStep()
                    // TODO what to do with the exact 1, 2, 3 hits? should we map them?

                    if (!key.loop && T >= key.steps) {
                        key.mapFn( key.easing(1), T )
                        key.dead = true
                        if (key.onKill) key.onKill()
                        continue
                    }
                }

                if (key.mirror) {
                    const tt = t % 2
                    if (tt >= 1) {
                        const ttt = 1 - (tt - 1)
                        key.mapFn( key.easing(ttt), t )
                    } else {
                        const ttt = t % 1
                        key.mapFn( key.easing(ttt), t )
                    }
                } else {
                    const tt = t % 1
                    key.mapFn( key.easing(tt), t )
                }
            }
        }
    }
}
