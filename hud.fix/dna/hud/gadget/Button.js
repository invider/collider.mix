'use strict'

let instances = 0

// a visual component that has to be pushed to invoke an action
const Button = function(dat) {
    this.name = 'button_' + ++instances
    if (!this.text && !this.text === '') {
        this.text = 'Button ' + instances
    }
    this.disabled = false
    this.toggled = false

    this.x = 0
    this.y = 0
    this.w = 20
    this.h = 20

    this.hspace = 5
    this.vspace = 5
    this.font = env.hud.font
    this.fontHeight = env.hud.baseHeight

    this.injectStyle('button')
    sys.augment(this, dat)
    this.adjust()
}

Button.prototype.injectStyle = function(base) {
    const s = lib.hud.style
    this.color = {
        active: {
            base: s(base + '/base'),
            content: s(base + '/content'),
            font: s(base + '/font'),
        },
        hover: {
            base: s(base + '/hover/base.hi'),
            content: s(base + '/hover/content.hi'),
            font: s(base + '/hover/font.hi'),
        },
        toggled: {
            base: s(base + '/toggled/base.low'),
            content: s(base + '/toggled/content.hi'),
            font: s(base + '/toggled/font.low'),
        },
        disabled: {
            base: s(base + '/disabled/base.low'),
            content: s(base + '/disabled/content.low'),
            font: s('button/disabled/font.low'),
        },
    }
}

// a service method to adjust component in the updated layout
// Usually invoked automatically when component is added
// or layout is changed.
Button.prototype.adjust = function() {
    ctx.font = this.font
    const m = ctx.measureText(this.text)
    const requestW = m.width + this.hspace*2
    const requestH = this.fontHeight + this.vspace*2
    if (this.w < requestW) this.w = requestW
    if (this.h < requestH) this.h = requestH
}

Button.prototype.onMouseDown = function() {
    this.toggled = true
}

Button.prototype.onMouseUp = function() {
    this.toggled = false
}

// needs to be defined to capture the mouse 
Button.prototype.onMouseDrag = function() {}

// need this to be defined for _hover flag to be working
Button.prototype.onMouseMove = function() {}

// get current state name - active | disabled | toggled | hover
// @returns {string} - button state based on flags
Button.prototype.getState = function() {
    if (this.disabled) return 'disabled'
    if (this.toggled) return 'toggled'
    if (this._hover) return 'hover'
    return 'active'
}

Button.prototype.drawBackground = function() {
    const cset = this.color[this.getState()]
    ctx.fillStyle = cset.base
    ctx.fillRect(this.x, this.y, this.w, this.h)
}

Button.prototype.drawContent = function() {
    const cset = this.color[this.getState()]
    ctx.fillStyle = cset.content
    ctx.font = cset.font
    ctx.textBaseline = 'middle'
    ctx.textAlign = "center"
    ctx.fillText(this.text, this.x + this.w/2, this.y + this.h/2);
}

Button.prototype.draw = function() {
    this.drawBackground()
    this.drawContent()
}

return Button
