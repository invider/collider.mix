// @depends(/dna/hud/Transition)
const Transition = dna.hud.Transition

const HIDDEN = 0
const WAIT = 1
const FADE_IN = 2
const KEEP = 3
const FADE_OUT = 4

class AlphaFader extends Transition {

    constructor(st) {
        super(st)
        this.color = '#400000'
    }

    init() {
        this.draw = false
    }

    preVFX() {
        switch (this.state) {
          case FADE_IN:
            alpha(this.fader)
            break
          case KEEP:
            alpha(0)
            break
          case FADE_OUT:
            alpha(1 - this.fader)
            break
        }
    }

    postVFX() {
        alpha(1)
    }
}
