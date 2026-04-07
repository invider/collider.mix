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
            at:     env.time,
            freq:   1,
            times:  1,
            easing: easing,
            mapFn:  mapFn,

            mirror: false,
            loop:   false,
            dead:   false,
        }

        this.keys.push(k)
        this.last = k
        return this
    }

    freq(fq) {
        this.last.freq = fq
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

    done(doneFn) {
        this.last.done = doneFn
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
                const t = (env.time - key.at) * key.freq
                if (t > key.times && !key.loop) {
                    key.mapFn( key.easing(1), 1 )
                    key.dead = true
                    if (key.done) key.done()
                } else {
                    if (key.mirror) {
                        const tt = t % 2
                        if (tt >= 1) {
                            const ttt = 1 - (tt - 1)
                            key.mapFn( key.easing(ttt), ttt )
                        } else {
                            const ttt = t % 1
                            key.mapFn( key.easing(ttt), ttt )
                        }
                    } else {
                        const tt = t % 1
                        key.mapFn( key.easing(tt), tt )
                    }
                }
            }
        }
    }
}
