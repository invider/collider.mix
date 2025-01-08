/*
 * Wormhole Bootloader
 *
 * To configure the boot loader, use env.config.boot structure.
 * You can set it through config.json in the root of your project.
 *
 * Possible options are:
 *
 * hold: minimum hold time in seconds
 * fade: fade out time in seconds
 * wait: black screen wait time in seconds
 * base: background color
 * content: content color (effect and text)
 * fadeBase: fading out color, usually totally black '#000000'
 * bootSfx: boot sound effect name placed in res.sfx, 'boot' by default
 * sfxVolume: boot sound effect volume
 *
 */
'use strict'

// boot config values
let base = hsl(.1, 0, 0)
let content = hsl(.54, 1, .5)
let contentTest = hsl(.17, 1, .55)
let contentErr  = hsl(.01, 1, .55)   // error red
let contentFast = hsl(.1, 1, .5)     // collider orange
let fadeBase = hsl(.1, 0, 0)
//const COLOR = hsl(.98, 1, .6)
//const COLOR = hsl(.1, 1, .5)
//const COLOR = hsl(.3, 1, .5)
//const COLOR = hsl(.35, 1, .5)

const df = {
    power:    1.5,
    hold:     3.5,
    fade:     1,
    wait:     0.5,
    blackout: 2,
    labelFadeIn: 1,
}

let power    = df.power
let hold     = df.hold
let fade     = df.fade
let wait     = df.wait
let blackout = df.blackout
let bootSfx  = 'boot'
let sfxVolume = .5
let labelFadeIn = df.labelFadeIn

// boot state
let bootState = 'loading'
let bootTimer = 0
let stateTimer = 0
let label = ''


// boot implementation values
const BASE = rx(1) > ry(1)? ry(1) : rx(1)
const FBASE = BASE * .04

let labelFont = FBASE+'px moon'
let lowFont = FBASE*.75 + 'px moon'

const R3 = ry(.4)
const POWERED_BY = 'Powered by Collider.JAM'
const ERROR = 'Error'

const ALERT = 'Alert!'
const ALERT_MESSAGE = 'Air Raid Alert! Proceed to the nearest shelter!'

const ACTIVE = 0
const FADEIN = 1
const FADEOUT = 2
const STABLE = 5

const RING = 0
const CONNECTOR = 1
const LABEL = 3

const DEAD = 11

const FQ = 5
const DIR = 0

let x = rx(.5)
let y = ry(.5)
const R1 = BASE * .075
const R2 = BASE * .2

const SPEED = BASE * 5
const RSPEED = TAU*2
const TSPEED = BASE * .5
const STEP = (R2-R1)/15
const STEPV = 2
const W = BASE * .003

const FADE = 1.2
const TEXT_FADEOUT = 2

const MIN_ANGLE = 0.2
const MAX_ANGLE = PI/2

const worms = []
const targets = []

function init() {
    if (env.config.boot) {
        const bt = env.config.boot
        // TODO move into a config structure and extend with env.config.boot
        hold = bt.hold              || hold
        fade = bt.fade              || fade
        wait = bt.wait              || wait
        base = bt.base              || base
        content = bt.content        || content
        fadeBase = bt.fadeBase      || fadeBase
        bootSfx = bt.sfx            || bootSfx
        sfxVolume = bt.volume       || sfxVolume
    }
    //if (env.config.fast) hold = 0 // no hold on fast flag
    if (env.config.debug && !env.config.slow) hold = 0 // no hold on debug
}

function reset() {
    init()
    worms.length = 0
    stateTimer = 0
    bootState = 'blackout'
    label    = ''
    power    = df.power
    hold     = df.hold
    fade     = df.fade
    wait     = df.wait
    blackout = df.blackout
    spawnedPoweredBy = false
    $.boot   = this
}

function evoWorm(dt) {
    let activeSegments = 0
    this.sg.forEach(segment => {
        segment.evo(dt)
        if (segment.state < DEAD) activeSegments ++
    })
    if (activeSegments === 0) {
        this.state = DEAD
    }
}

function drawWorm() {
    this.sg.forEach(segment => segment.draw())
}

let outerRingWorms = 0

/*
function showPoweredBy(s) {
    const len = rnd(BASE*.05, BASE*.2)

    const line = spawnLineSegment(s.worm,
        x, y + R1,
        x, y + R3,
        function(t) {
            const pwrd = spawnTextSegment(t.worm,
                t.x2, t.y2 + BASE * .02,
                0, POWERED_BY)
            pwrd.font = poweredByFont
            pwrd.state = STABLE
        }
    )
    line.targetTime *= 2

    const sh = BASE*.02

    const l2 = spawnLineSegment(s.worm, x-sh,  y+R1, x-sh, y + R3)
    l2.targetTime *= 3

    const l3 = spawnLineSegment(s.worm, x+sh, y+R1, x+sh, y + R3)
    l3.targetTime *= 3
}
*/

function spawnTextSegment(worm, st) {
    // x, y, dir, msg, fadein, keep, fadeout) {
    const sg = extend({
        state:   FADEIN,
        time:    0,
        fadein:  0,
        keep:    0,
        fadeout: 0,
        rx:     .5,
        ry:     .5,
        x:       0,
        y:       0,
        dir:     0,
        msg:     '...',

        evo: function(dt) {
            if (this.state === DEAD) return

            this.time += dt
            if (this.state === FADEOUT && this.time >= this.fadeout) this.state = DEAD
        },

        draw: function(dt) {
            if (this.state === DEAD) return

            save()
            switch(this.state) {
                case FADEIN:
                    alpha(min(this.time/this.fadein, 1))
                    if (this.time >= this.fadein) {
                        this.time = 0
                        this.state = ACTIVE
                    }
                    break

                case ACTIVE:
                    alpha(1)
                    if (this.keep && this.time >= this.keep) {
                        this.time = 0
                        this.state = FADEOUT
                    }
                    break

                case FADEOUT:
                    alpha(max(1 - this.time/this.fading, 0))
                    break
            }

            if (this.font) font(this.font)
            else font(lowFont)
            fill(content)
            baseMiddle()
            if (this.dir < 0) alignLeft()
            else if (this.dir > 0) alignRight()
            else alignCenter()

            text(this.msg, this.rx? rx(this.rx) : this.x, this.ry? ry(this.ry) : this.y)
            restore()
        },
    }, st)

    worm.sg.push(sg)
    return sg
}

function spawnLineSegment(worm, x1, y1, x2, y2, onTarget) {
    const length = lib.math.distance(x1, y1, x2, y2)
    const targetTime = length/TSPEED

    const sg = {
        state: ACTIVE,
        time: 0,
        worm: worm,
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        length: length,
        targetTime: targetTime,
        onTarget: onTarget,

        evo: function(dt) {
            this.time += dt
            if (this.state === ACTIVE && this.time >= this.targetTime) {
                this.time = 0
                this.state = FADEOUT
                if (this.onTarget) this.onTarget(this)
            }
            if (this.state === FADEOUT && this.time >= FADE) {
                this.state = DEAD
            }
        },

        draw: function() {
            if (this.state === DEAD) return

            save()
            if (this.state === FADEOUT) {
                alpha(1 - this.time/FADE)
            }

            const a = lib.math.bearing(this.x1, this.y1, this.x2, this.y2)

            let l = this.length
            if (this.state === ACTIVE) l = this.time/this.targetTime * this.length

            lineWidth(W)
            stroke(content)
            line(this.x1, this.y1, this.x1 + sin(a)*l, this.y1 + cos(a)*l)

            restore()
        },
    }
    worm.sg.push(sg)
    return sg
}

function spawnSegment(worm, type, orbit, angle, target) {
    let dir = DIR
    if (dir === 0) dir = ~~(Math.random() * 2 + 1) - 2

    const sg = {
        state: ACTIVE,
        time: 0,
        worm: worm,
        type: type,
        orbit: orbit,
        dir: dir,
        angle: angle,
        shift: 0,
        target: target,

        onTarget: function() {
            this.state = FADEOUT

            // spawn next segment
            switch(this.type) {
            case RING:
                if (this.orbit >= R2) {
                    // end of the ring
                    outerRingWorms ++
                    /*
                    if (outerRingWorms === 1) {
                        showPoweredBy(this)
                        return 
                    }
                    */

                    //targets.push('/hero-' + outerRingWorms + '.png')

                    if (targets.length > 0) {
                        const label = targets.pop()
                        const a = this.angle
                        const len = this.orbit + rnd(BASE*.1, BASE*.2)

                        spawnLineSegment(this.worm,
                            x + cos(a) * this.orbit,
                            y + sin(a) * this.orbit,
                            x + cos(a) * len,
                            y + sin(a) * len,
                            function(t) {
                                let len = rnd(rx(.05), rx(.4)-R2)
                                if (t.x1 > t.x2) len *= -1

                                spawnLineSegment(t.worm,
                                    t.x2, t.y2,
                                    t.x2 + len, t.y2,
                                    function(t) {
                                        let dir = 0
                                        let sx = 0
                                        if (len < 0) {
                                            dir = 1
                                            sx -= BASE*.01
                                        } else {
                                            dir = -1
                                            sx += BASE*.01
                                        }
                                        const sg = spawnTextSegment(t.worm, {
                                            x:       t.x2 + sx,
                                            y:       t.y2,
                                            dir:     dir,
                                            msg:     label,
                                            fadein:  TEXT_FADEOUT,
                                            keep:    0,
                                            fadeout: 0,
                                        })
                                        // x, y, dir, msg, fadein, keep, fadeout) {
                                        //   t.x2 + sx, t.y2, dir, label, TEXT_FADEOUT)
                                    })
                            }
                        )
                    }
                    return
                }

                if (this.dir < 0) {
                    spawnSegment(this.worm, CONNECTOR, this.orbit,
                        this.angle - this.shift, STEP * RND(1, STEPV))
                } else {
                    spawnSegment(this.worm, CONNECTOR, this.orbit,
                        this.angle + this.shift, STEP * RND(1, STEPV))
                }
                break;

            case CONNECTOR:
                spawnSegment(this.worm, RING, this.orbit + this.target, this.angle,
                        rnd(MIN_ANGLE, MAX_ANGLE))
                break;
            }

            this.target = 1
        },

        evo: function(dt) {
            if (this.state === DEAD) return

            this.time += dt
            if (this.state === FADEOUT) {
                this.target -= dt/FADE
                if (this.target <= 0) this.state = DEAD
                return
            }

            switch (this.type) {
            case RING: this.shift += RSPEED * dt; break;
            case CONNECTOR: this.shift += SPEED * dt; break;
            case LABEL:
                if (!this.state === STABLE && this.time > this.target) this.state = DEAD
                break;
            }

            if (this.shift >= this.target) {
                this.shift = this.target
                this.onTarget()
            }
        },

        draw: function() {
            if (this.state === DEAD) return

            save()
            if (this.state === FADEOUT) {
                alpha(this.target)
            }

            lineWidth(W)
            stroke(content)

            switch(this.type) {
            case RING:
                if (this.dir < 0) {
                    arc(x, y, this.orbit, this.angle-this.shift, this.angle)
                } else {
                    arc(x, y, this.orbit, this.angle, this.angle + this.shift)
                }
                break;

            case CONNECTOR:
                line(
                    x + cos(this.angle) * this.orbit,
                    y + sin(this.angle) * this.orbit,
                    x + cos(this.angle) * (this.orbit + this.shift),
                    y + sin(this.angle) * (this.orbit + this.shift)
                )
                break;

            case LABEL:
                if (this.state === STABLE) {
                    alpha(max(this.time/FADE, 1))
                } else {
                    let a = this.time/this.target
                    if (a < .5) a *= 2
                    else a = min(1 - (a-0.5)*2, 0)
                    alpha(a)
                }

                if (this.font) font(this.font)
                else font(lowFont)
                fill(content)
                baseMiddle()
                if (this.dir < 0) alignLeft()
                else if (this.dir > 0) alignRight()
                else alignCenter()

                text(this.label, this.orbit, this.angle)
                break;
            }
            restore()
        },
    }
    worm.sg.push(sg)
    return sg
}

function spawnWorm() {
    // find a fossil
    let worm = false
    worms.forEach(w => {
        if (w.state === DEAD) worm = w
    })

    if (!worm) {
        worm = {
            evo: evoWorm,
            draw: drawWorm,
        }
        worms.push(worm)
    }

    augment(worm, {
        state: ACTIVE,
        sg: [],
    })

    spawnSegment(worm, RING, R1, 1, 2)
    return worm
}

let spawnedPoweredBy = false
function evoContent(dt) {
    if (bootState !== 'blackout' && bootState !== 'loading' && bootState !== 'holding') return

    worms.forEach(w => {
        if (w.state < DEAD) w.evo(dt)
    })

    // spawn
    if (rnd() < FQ * dt) {
        spawnWorm()
    }
    
    // spawn powered by
    if (!spawnedPoweredBy && stateTimer > power) {
        const w = spawnWorm()
        spawnTextSegment(w, {
            rx:      .5,
            ry:      .9,
            dir:     0,
            msg:     env.config.alert? ALERT_MESSAGE : POWERED_BY,
            fadein:  1,
            keep:    0,
            fadeout: 0,
        })
        spawnedPoweredBy = true
    }

    //loading += dt/10
}

function drawContent() {
    background(base)

    // anchor to the center of the screen
    x = rx(.5)
    y = ry(.5)

    ctx.lineCap = 'round'
    worms.forEach(w => {
        if (w.state < DEAD) w.draw()
    })

    save()
    alpha( bootTimer > labelFadeIn? 1 : bootTimer / labelFadeIn )
    font(labelFont)
    fill(content)
    alignCenter()
    baseMiddle()
    text(label, x, y)
    restore()
}

// ************************
// generic bootloader logic

function updateLoadingStatus() {
    let loaded = this._.___.res._loaded
    let included = this._.___.res._included

    let amount = 1
    if (bootState === 'blackout' || bootState === 'loading' || bootState === 'holding') {
        // we are faking percentage to include time left to hold
        if (hold === 0) amount = min(loaded/included, 1)
        else {
            const holdRate = min(stateTimer/hold, 1)
            amount = min((loaded/included + holdRate)/2, 1)
        }
    }

    if (env.config.debug) {
        content = contentFast
    }

    if (env.config.alert) {
        // air raid alert
        label = ALERT
        content = contentErr
    } else if (res._errors) {
        // a boot-time error
        label = ERROR
        content = contentErr
    } else {
        // calculate the loading status in %
        const percent = Math.floor(amount * 100)
        label = `${percent}%`
    }
}

function evoBoot(dt) {
    bootTimer += dt
    stateTimer += dt

    switch (bootState) {
    case 'blackout':
        if (stateTimer >= blackout) {
            stateTimer = 0
            bootState = 'loading'
        }
        break

    case 'loading':
        if (env._started) {
            bootState = 'holding'
        }
        break;

    case 'holding':
        if (!env.config.alert && stateTimer >= hold) {
            stateTimer = 0
            bootState = 'fading'

            const sound = !res.sfx || res.sfx[bootSfx]
            if (sound) sfx(sound, sfxVolume)
        }
        break;

    case 'fading':
        if (stateTimer >= fade) {
            stateTimer = 0
            bootState = 'waiting'
        }
        break;

    case 'waiting':
        if (stateTimer >= wait) {
            bootState= 'self-destruct'
        }
        break;

    case 'self-destruct':
        kill(this)
        delete $.boot
        $._boot = this
        trap('postBoot')
        break;
    }
}

function evo(dt) {
    this.evoBoot(dt)
    //if (!this.canvasFixed) return
    this.evoContent(dt)
}

function draw() {
    if (bootState === 'waiting' || bootState === 'self-destruct') {

        background(fadeBase)
        return
    }
    if (bootState === 'blackout') {
        alpha(stateTimer/blackout)
    }

    background(base)
    //if (!this.canvasFixed) return

    save()

    this.updateLoadingStatus()

    drawContent()

    if (bootState === 'fading') {
        ctx.globalAlpha = stateTimer/fade
        background(fadeBase)
    }

    restore()
}

function getStatus() {
    return {
        bootState,
        stateTimer,
        loaded: this._.___.res._loaded,
        included: this._.___.res._included,
    }
}
