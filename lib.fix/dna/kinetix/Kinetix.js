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
