const HIDDEN = 0
const WAIT = 1
const FADE_IN = 2
const KEEP = 3
const FADE_OUT = 4

const defaults = {
    name: 'foreground', // important to have this name when fading a mod
    wait: 0,
    fadein: 1,
    keep: 1,
    fadeout: 1,
    state: WAIT,
    color: '#000000',
    destruct: false,
}

class Transition {

    constructor(st) {
        augment(this, defaults)
        this.transit(st)
    }

    init() {
        if (this.name === 'foreground'
                && this.__
                && this.__.__ instanceof sys.Mod) {
            // move draw function, so it will be run in the end of mod's draw()
            this.drawForeground = this.draw
            this.draw = false
        }
    }

    transit(st) {
        augment(this, st);

        this.state = WAIT
        this.time = this.wait
        this.fader = 1

        if (this.onWait) this.onWait()
        // switch state forward if needed
        for (let i = 0; i < 4; i++) this.evo(0)
    }

    evo(dt) {
        if (this.state === HIDDEN) return;

        this.fader = this.fader - dt / this.time;

        if (this.time === 0 || this.fader <= 0) {
              this.fader = 1;

              switch(this.state) {
              case WAIT:
                      this.state = FADE_IN;
                      this.time = this.fadein;
                      if (this.onFadein) this.onFadein()
                      break;
              case FADE_IN:
                      this.state = KEEP;
                      this.time = this.keep;
                      if (this.onKeep) this.onKeep()
                      break;
              case KEEP:
                      this.state = FADE_OUT;
                      this.time = this.fadeout;
                      if (this.onFadeout) this.onFadeout()
                      break;
              case FADE_OUT:
                      if (this.onHidden) this.onHidden()
                      this.state = HIDDEN;
                      if (this.destruct) kill(this)
                      break;
              }
        }
    }

    drawBackground() {
        blocky();
        if (this.image) {
            image(this.image, 0, 0,
                this.__.rx(1), this.__.ry(1))
        } else {
            background(this.color)
        }
    }

    drawContent() {}
    
    draw() {
        if (this.state === HIDDEN || this.state === WAIT) return;

        save()
        switch (this.state) {
          case FADE_IN:
            alpha(1 - this.fader);
            break;
          case KEEP:
            alpha(1);
            break;
          case FADE_OUT:
            alpha(this.fader);
            break;
        }

        this.drawBackground()
        this.drawContent()
        restore()
    }
}
