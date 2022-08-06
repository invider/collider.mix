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
 */
class Kinetix {
    constructor(st) {
        this.name = 'kinetix'
        this.keys = []

        augment(this, st)
    }

    push(key) {
        this.keys.push(key)
    }

    key(target, opt) {
        if (!target) {
            log.warn('skipping the key - no kinetix target specified!')
            return
        }
        // TODO allow alternative key implementations
        const proto = dna.kinetix.key

        const key = {}
        augment(key, proto)

        opt.kinetix = this
        opt.target = target
        key.setup(opt)
        this.push(key)

        return key
    }

    evo(dt) {
        for (let i = 0; i < this.keys.length; i++) {
            const key = this.keys[i]
            if (key.active) {
                key.evo(dt)
            }
        }
    }
}
