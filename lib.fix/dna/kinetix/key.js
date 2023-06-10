/*
 * A key is the main kinematix concept.
 *
 * A key keeps animation going.
 *
 * The most generic key has 4 key elements:
 *  * tick(dt) - keep the timer going
 *  * easing() - calculate current easing value
 *  * map(val) - map easing value to property value
 *  * apply(val) - apply updated value to the property
 *
 * You can also can handle events like:
 *
 *   * onComplete()
 *   * onCancel()
 *
 */

const df = {
    timer: 0,
    mark: 0,
    freq: 1,
}

function tickWithHold(dt) {
    if (this.hold > 0) {
        this.hold -= dt
    } else {
        this.timer += dt
    }
}

module.exports = {

    setup: function(st) {
        extend(this, df)
        this.next = []

        this.easing = dna.kinetix.easing.triangle
        if (st) {
            extend(this, st)
            if (st.shape) {
                const easing = dna.kinetix.easing[st.shape]
                if (!easing) {
                    throw `unable to find shape [${st.shape}]`
                }
                this.easing = easing
            }
            if (!st.prev) this.activate()
        }

        // configure tick
        if (this.hold && this.hold > 0) {
            this.tick = tickWithHold
        }
    },

    activate() {
        this.active = true
        if (this.onActivate) this.onActivate()
    },

    tick(dt) {
        this.timer += dt
    },

    step(t, v) {
        if (this.onComplete) this.onComplete()
        if (!this.loop) this.kill()
    },

    // map easing value on property value
    map: function(val) {
        return this.from + (this.to - this.from) * val
    },

    apply: function(val) {
        this.target[this.key] = val
    },

    evo: function(dt) {
        this.tick(dt)

        const t = this.timer * this.freq
        this.apply( this.map( this.easing(t)))
    },

    then(target, opt) {
        opt.prev = this
        const key = this.kinetix.key(target, opt)
        this.next.push(key)
        return key
    },

    thenKey(key) {
        if (!key) return
        this.next.push(key)
    },

    verifyTarget(target) {
        return this.target === target
    },

    cancel() {
        if (this.onCancel) this.onCancel()
        else if (this.onComplete) this.onComplete()
        this.kill()
    },

    kill() {
        this.active = false
        this.dead = true

        // TODO enable next
        this.next.forEach(n => n.activate())
    },
}
