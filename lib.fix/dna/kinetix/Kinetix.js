/*
 * Kinetix is a tweening controller
 *
 * Spawn it somewhere in /lab. Usually it goes to /lab/control,
 * where all of control ghosts are placed by convention.
 *
 * Tweening is a way to place values in between other values over a timespan.
 * Let's assume we want to show a transparent actor
 * by gradually increasing it's alpha value.
 *
 * We can create an animation key on the alpha value like this:
 *
 *     lab.control.kinetix.key( actorNode, {
 *         key: 'alpha',
 *         easing: dna.kinetix.easing.triangle,
 *         loop: false,
 *     })
 *
 * Or maybe we want it to pulse with a predefined frequency:
 *
 *     lab.control.kinetix.key( pulsingNode, {
 *         map: v => pulsingNode.alpha = .5 + v * .5,
 *         freq: 2,
 *         easing: dna.kinetix.easing.triangle,
 *         loop: false,
 *     })
 *
 * Easing functions are always return values between 0..1,
 * but you can always customize them with a map function.
 * So to map it to an **x** value 0..100, just do:
 *
 *     v => node.value = v * 100
 *
 *
 * There are some flags you can use for setup of a animation key:
 *
 *     * loop:      is the key should be infinitely looped
 *     * exclusive: when true, all other keys on the same target will be canceled
 *     * follow:    follow the last key on the target if present
 */
class Kinetix {

    constructor(st) {
        this.name = 'kinetix'
        this.keys = []

        augment(this, st)
    }

    // push a new animation key
    // @param key - a key object
    push(key) {
        this.keys.push(key)
    }

    // create a key on the provided target
    // @param {object} target - a target object
    // @param {object} opt - key options
    // @returns key - created key
    key(target, opt) {
        if (!target) {
            log.warn('skipping the key - no kinetix target specified!')
            return
        }
        // TODO allow alternative key implementations
        const proto = dna.kinetix.key

        if (opt.exclusive) {
            this.clearTarget(target)
        }

        const key = {}
        augment(key, proto)

        opt.kinetix = this
        opt.target = target
        key.setup(opt)

        if (opt.follow) {
            const prevKey = this.locateTargetKey(target)
            if (prevKey) prevKey.thenKey(key)
        }
        this.push(key)

        return key
    }

    locateTargetKey(target) {
        for (let i = this.keys.length - 1; i >= 0; i--) {
            const key = this.keys[i]
            if (key.verifyTarget(target)) return key
        }
    }

    clearTarget(target) {
        let keyCount = 0
        for (let i = 0; i < this.keys.length; i++) {
            const key = this.keys[i]
            if (!key.dead && key.verifyTarget(target)) {
                key.cancel()
                keyCount ++
            }
        }
        return keyCount
    }

    evo(dt) {
        const keys = this.keys
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            if (key.dead) {
                defer(() => {
                    const i = keys.indexOf(key)
                    if (i >= 0) {
                        keys.splice(i, 1)
                    }
                })
            } else if (key.active) {
                key.evo(dt)
            }
        }
    }
}
