'use strict'

// @depends(/dna/hud/Container)
const Container = dna.hud.Container
// @depends(/dna/hud/gadget/Slider)
const Slider = dna.hud.gadget.Slider


let instances = 0

// a text console component - can be used in a chatbot-like or a command-response loop scenarios
const Console = function(dat) {
    if (!this.name) this.name = 'console' + ++instances

    this.focus = false
    this.clip = true
    this.disabled = false
    this.hidden = false
    this.blink = 0.5
    this.cursor = String.fromCharCode(0x2588)
    this.prompt = '> '
    this.hspacing = 15
    this.lineSpacing = 28
    this.sliderWidth = 15

    this.command = ''
    this.lines = []
    this.blinkState = 0

    this.font = env.hud.font
    this.baseHeight = env.hud.baseHeight

    this.color = {
        content: '#e0b000',
    }
    dna.hud.Container.call(this, dat)

    this.attach(new Slider({
        name: 'slider',
        horizontal: false,
        x: 0,
        y: 20,
        w: 0,
        h: this.h-40,
    }))

    this.adjustSliders()
}
Console.prototype = Object.create(Container.prototype)

Console.prototype.resize = function(w, h) {
    this.w = w
    this.h = h
    this.adjustSliders()
}

Console.prototype.adjustSliders = function() {
    this.slider.x = this.w - this.sliderWidth
    this.slider.y = 0
    this.slider.w = this.sliderWidth
    this.slider.h = this.h

    this.slider.span = Math.floor(this.h / this.lineSpacing) - 1
    this.slider.step = Math.round(this.slider.span/2)
    this.slider.max = Math.max(this.lines.length, 0)
}
    
Console.prototype.onFocus = function() {
    this.blinkState = this.blink*2
}

Console.prototype.clear = function() {
    this.lines = []
}

Console.prototype.pushLine = function(line) {
    this.lines.push(line)
}

Console.prototype.pushText = function(text) {
    if (!text) return

    if (!sys.isString(text)) {
        if (sys.isObj(text)) {
            text._ = undefined
            text.__ = undefined
            text.___ = undefined
            text = JSON.stringify(text, null, 4)
        } else {
            text = '' + text
        }
    }
    const con = this
    const splited = text.split(/\r?\n/g) || []
    splited.forEach(l => con.pushLine(l))
}

Console.prototype.print = function(msg) {
    this.pushText(msg)
    this.adjustSliders()
    this.slider.set(this.lines.length - 1)
}

Console.prototype.echo = function(msg) {
    this.print(this.prompt + msg)
}

Console.prototype.execute = function() {
    this.echo(this.command)
    this.onCommand(this.command)
    this.command = ''
}

Console.prototype.onCommand = function(cmd) {
    // redefine to get custom command behavior
}

Console.prototype.onKeyDown = function(e) {
    if (e.key === 'Escape') {
        this.command = ''
    } else if (e.key === 'Backspace') {
        if (this.command.length > 0) {
            this.command = this.command.substring(0, this.command.length-1)
        }
    } else if (e.key === 'Enter') {
        this.execute()
    } else if (e.key.length === 1) {
        this.command += e.key
    }
}

Console.prototype.onMouseWheel = function(d, x, y, e) {
    if (d < 0) {
        this.slider.drag(this.slider.scrollSpeed)
    } else if (d > 0) {
        this.slider.drag(-this.slider.scrollSpeed)
    }
}

Console.prototype.evo = function(dt) {
    if (!this.focus) return

    this.blinkState -= dt
    if (this.blinkState < 0) {
        this.blinkState = this.blink * 2
    }
}

Console.prototype.drawForeground = function() {
    ctx.font = this.font
    ctx.fillStyle = this.color.content
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'

    let x = this.hspacing
    let y = this.h

    let text = this.prompt + this.command
    if (this.focus && this.blinkState < this.blink) {
        text += this.cursor
    }
    ctx.fillText(text, x, y)

    let i = this.slider.top() - 1
    while (i >= 0 && i < this.lines.length && y > this.lineSpacing) {
        y -= this.lineSpacing
        ctx.fillText(this.lines[i--], x, y)
    }
}
    
module.exports = Console
