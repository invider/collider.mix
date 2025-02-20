/*
particle emitter constructor
Create an emitter by providing a following structure to the constuctor:
     target.spawn(dna.Emitter, {
            x: x,  // emitter x position
            y: y,  // emitter y position
            color: color,   // particles color
            lifespan: 0.05, // emitter life span (default: 1)
            force: 1000,    // emitter force in particles/sec (default: 200)
            radius: 0,      // particle spread radius
            size: 1,        // particle size
            speed: 10,      // particle speed
            vspeed: 0,      // speed variety (a random shift)
            angle: 0,          // base angle for particle direction
            spread: 2*Math.PI, // particle spread angle - TAU for a full sicrle
            minLifespan: 0.4,  // minimum particle lifespan
            vLifespan: 0.2,    // particles lifespan variety
            drawParticle: function() {
                fill(this.color)
                rect(floor(this.x), floor(this.y), this.r, this.r)
            }
        })
Most of the provided configuration options can be skipped.

The emitter is left-destroyed when it's lifespan is over and all particles are dead.


=== Examples

Following are some real-life examples of particles use:
<li> [Explosions in Enceladus Dockyards](https://github.com/invider/enceladus-dockyards.mix/blob/master/boy-buf.mod/lib/vfx.js)
<li> [Monster hits and magic in Master of Ritual](https://github.com/invider/master-of-ritual/blob/master/mod/dna/mob/Master.js)
<li> [Teleports in station keeping](https://github.com/invider/station-keeping.mod/blob/master/lib/vfx.js)
<li> [Cyber Sneeze](https://github.com/invider/cyber-sneeze.mod/blob/master/dna/Bot.js)
*/


let FADEOUT = 0.3 // default particle fadeout value

let Particle = function(dat) {
    this.alive = true
    sys.augment(this, dat)

    if (!this.img && !this.color) this.color = '#ffffff'
    this.gr = -this.r
    this.dx = Math.cos(this.angle) * this.speed
    this.dy = Math.sin(this.angle) * this.speed

    this.evo = function(dt) {
        this.move(dt)
        this.lifespan -= dt 
        if (this.lifespan < 0) this.alive = false
    }
}

const df = {
    dead:       false,
    blend:      'source-over',
    lifespan:   1,
    force:      200,
    radius:     0,
    size:       1,
    vsize:      0,
    speed:      100,
    vspeed:     0,
    angle:      0,
    spread:     Math.PI * 2,
    minLifespan: 1,
    vLifespan:  0,
}

var Emitter = function(st) {
    augment(this, df, st)
    if (this.force) this.frequency = 1/this.force

    this.potential = 0
    this.particles = []
}

// executed when emitter is attached and needs to be initialized
Emitter.prototype.init = function() {}

Emitter.prototype.reignite = function(st) {
    augment(this, df, st)
    if (this.force) this.frequency = 1/this.force
    this.potential = 0
}

// called when emitter lifespan is out
// (but there are still can be particles flying out)
Emitter.prototype.onExhausted = function() {}

Emitter.prototype.onKill = function() {}

Emitter.prototype.moveParticle = function(dt) {
    this.x += this.dx * dt
    this.y += this.dy * dt
}
    
Emitter.prototype.drawParticle = function() {
    if (this.img) {
        ctx.globalAlpha = 0.5
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(this.img, this.x-this.r, this.y-this.r, this.r*2, this.r*2)
    } else {
        ctx.beginPath();
        if (this.lifespan < FADEOUT) {
            ctx.globalAlpha = this.lifespan/FADEOUT
        } else {
            ctx.globalAlpha = 1
        }
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI)
        ctx.fillStyle = this.color
        ctx.fill()
    }
}

Emitter.prototype.createParticle = function() {
    let x = 0
    let y = 0
    // TODO rename into spread
    if (this.radius) {
        let r = lib.math.rnd(this.radius)
        let fi = lib.math.rnda()
        x = Math.cos(fi) * r
        y = Math.sin(fi) * r
    }

    const particle = new Particle({
        img: this.img,
        color: this.color,
        x: x,
        y: y, 
        r: this.size + lib.math.rnd(this.vsize),
        speed: this.speed + lib.math.rnd(this.vspeed),
        angle: this.angle + lib.math.rnd(this.spread),
        lifespan: this.minLifespan + lib.math.rnd(this.vLifespan)
    })

    return particle
}

// find a free slot in the pool and spawn a particle
Emitter.prototype.spawn = function() {
    var p = this.createParticle()
    if (!p.draw) p.draw = this.drawParticle
    if (!p.move) p.move = this.moveParticle

    // find a slot
    var placed = false
    for (var i = 0; i < this.particles.length; i++) {
       if (!this.particles[i].alive) {
           this.particles[i] = p
           placed = true
           break;
       }
    }
    if (!placed) this.particles.push(p)
}

// emit all particles for current frame
Emitter.prototype.emit = function(dt) {
    // emitting
    this.potential += dt
    while (this.lifespan !== 0 && this.potential >= this.frequency) {
        this.potential -= this.frequency
        this.spawn()
    }
}

// evolve emitter
Emitter.prototype.evo = function(dt) {
    //if (this.dead) this.__.detach(this)

    if (this.dx) this.x += this.dx * dt
    if (this.dy) this.y += this.dy * dt

    if (this.lifespan > 0) {
        this.lifespan -= dt
        if (this.lifespan < 0) {
            this.lifespan = 0
            this.onExhausted()
        }
    }

    this.emit(dt)

    // mutating particles
    let pn = 0
    const len = this.particles.length
    for (let i = 0; i < len; i++) {
        const p = this.particles[i]
        if (p.alive) {
            pn++
            p.evo(dt)
        }
    }

    if (pn === 0 && this.lifespan === 0) {
        this.dead = true
        kill(this)
    }
}

// draw all particles
Emitter.prototype.draw = function() {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.globalCompositeOperation = this.blend

    const len = this.particles.length
    for (let i = 0; i < len; i++) {
        const p = this.particles[i]
        if (p.alive) p.draw()
    }
    ctx.restore()
}

module.exports = Emitter
