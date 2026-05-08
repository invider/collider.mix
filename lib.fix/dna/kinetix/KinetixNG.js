/*
 * KinetixNG is a tweening/animation controller.
 *
 * It is placed in /job by convention and manages
 * the lifecycle of multiple animations.
 *
 *
 *
 * Kinetix has an automatic object pool optimize memory allocations,
 * since hundreds of keys can be active at the same time.
 *
 * The pooling is controlled by the following properties:
 *
 *    MIN_CAPACITY:          128,
 *    COMPACTION_THRESHOLD: .8,
 *    MAX_GRAVEYARD:         4096,
 *
 * The most efficient strategy is to set MIN_CAPACITY
 * to the expected maximum of simultineously active keys
 * during a typical play session. Kinetix will preallocate
 * that capacity and will preserve it during compaction cycles.
 *
 * A compaction is triggered when the number of dead keys
 * exceeds the provided COMPACTION_THRESHOLD.
 * After a sudden peak, we might end up with a lot of
 * dead keys way above MIN_CAPACITY.
 * It is inefficient to iterate over a lot of dead keys
 * all the time, so compaction is necessary to bring
 * dead/alive ratio back down.
 *
 *
 */
class KinetixNG {

    constructor(st) {
        augment(this, {
            name: 'kinetix',
            keys: [],

            // setup
            MIN_CAPACITY:          128,
            COMPACTION_THRESHOLD: .8,
            MAX_GRAVEYARD:         4096,
        }, st)
        this.refillToCapacity()
    }

    refillToCapacity() {
        while(this.keys.length < this.MIN_CAPACITY) {
            this.keys.push({
                __:   this,
                dead: true,
            })
        }
    }

    // TODO?
    hold() {
        return this
    }

    tween(mapFn, easing) {
        // TODO resurrect a zombie if possible
        let k
        for (let i = this.keys.length - 1; i >= 0; i--) {
            const key = this.keys[i]
            if (key.dead) {
                k = key  // found a zombie!
                break
            }
        }
        if (!k) {
            // no zombies found, so create a new key
            k = {}
            this.keys.push(k)
        }

        // setup the key
        // TODO avoid object allocation here for efficiency?
        extend(k, {
            __:     this,
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
            // event handlers setup
            onStep: null,
            onKill: null,

            // key state
            dead:   false,
            mark:   0,
        })

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

    key() {
        return this.last
    }

    // TODO deprecate to key()
    get() {
        return this.last
    }

    compact() {
        const ls = []

        // copy alive
        for (let i = 0; i < N; i++) {
            const key = keys[i]
            if (!key.dead) {
                ls.push(key)
            }
        }

        this.keys = ls
        this.refillToCapacity()
    }

    evo(dt) {
        const keys = this.keys,
              N    = keys.length
        if (N === 0) return

        let dead = 0
        for (let i = 0; i < N; i++) {
            const key = keys[i]
            if (key.dead) {
                dead ++
            } else {
                const t = (env.time - key.at) * key.freq,  // time in easing scale [0..1...]
                      T = t | 0  // full steps

                if (t - key.mark > 1) {
                    // next step
                    key.mark = T
                    if (key.onStep) key.onStep(T)
                    // TODO what to do with the exact 1, 2, 3 hits? should we map them?
                    
                    // close the value range
                    if (key.mirror && key.mark % 2 > 0) {
                        key.mapFn( key.easing(0), T )
                    } else {
                        key.mapFn( key.easing(1), T )
                    }

                    if (!key.loop && T >= key.steps) {
                        key.dead = true
                        if (key.onKill) key.onKill()
                        continue
                    }
                }

                if (key.mirror) {
                    const t2 = t % 2
                    if (t2 >= 1) {
                        const tt = 1 - (t2 - 1)
                        key.mapFn( key.easing(tt), t )
                    } else {
                        const tt = t % 1
                        key.mapFn( key.easing(tt), t )
                    }
                } else {
                    const tt = t % 1
                    key.mapFn( key.easing(tt), t )
                }
            }
        }
        
        const deadRate = (dead / N)
        if (N > this.MIN_CAPACITY && deadRate >= this.COMPACTION_THRESHOLD) {
            this.compact()
        }
    }
}

