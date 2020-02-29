'use strict'

// a movable window component

//@depends(/env/hud)
//@depends(/dna/hud/Container)
const Container = dna.hud.Container 

const defaults = {
    hidden: false,
    folded: false,
    disabled: false,
    focus: false,
    resizable: true,
    minifiable: true,
    closable: true,
    movable: true,

    title: '',
    status: '',

    font: env.hud.font,
    baseHeight: env.hud.baseHeight,
    color: {
        text: '#d0d9d0',
        tag: '#007060',
        dtag: '#005040',
        bar: '#202020',
        stretch: '#253030',
        stretchLine: '#556060',
        close: '#253030',
        closeLine: '#556060',
    },
    pads: {
        tag: 6
    },
}
    

const Tag = function(dat) {
    this.name = 'tag'
    this.keepZ = true
    sys.augment(this, { x: 0, y: 0, w: 0, h: 0 })
    sys.augment(this, dat)
}
Tag.prototype.draw = function() {
    if (this.__.disabled) ctx.fillStyle = this.__._style.tag.baseLow
    else if (this.__.focus) ctx.fillStyle = this.__._style.tag.baseHi
    else ctx.fillStyle = this.__._style.tag.base
    ctx.fillRect(this.x, this.y, this.w, this.h)

    ctx.fillStyle = this.__._style.tag.content
    ctx.font = this.__._style.tag.font
    ctx.textBaseline = 'middle'
    ctx.textAlign = "center"
    ctx.fillText(this.__.title, this.w/2,  this.y + this.h/2);
}
Tag.prototype.onMouseDrag = function(dx, dy) {
    if (this.__.movable) {
        this.__.x += dx
        this.__.y += dy
    }
}
Tag.prototype.onDblClick = function() {
    if (this.__.closable) {
        this.__.detach()
    }
}
Tag.prototype.onFocus = function() {
    this.__.captureFocus(this.__.pane)
}

const Bar = function(dat) {
    this.name = 'bar'
    this.keepZ = true
    sys.augment(this, { x: 0, y: 0, w: 0, h: 0 })
    sys.augment(this, dat)
}
Bar.prototype.draw = function() {
    ctx.fillStyle = this.__._style.bar.base
    ctx.fillRect(this.x, this.y, this.w, this.h)

    ctx.fillStyle = this.__._style.bar.content
    ctx.font = this.__.font
    ctx.textBaseline = 'middle'
    ctx.textAlign = "left"
    ctx.fillText(this.__.status, this.x + this.__.pads.tag, this.y + this.h/2);
}
Bar.prototype.onFocus = function() {
    this.__.captureFocus(this.__.pane)
}

const Stretch = function(dat) {
    this.name = 'stretch'
    this.keepZ = true
    sys.augment(this, { x: 0, y: 0, w: 0, h: 0 })
    sys.augment(this, dat)
}
Stretch.prototype.draw = function() {
    ctx.fillStyle = this.__._style.control.base
    ctx.fillRect(this.x, this.y, this.w, this.h)

    ctx.strokeStyle = this.__._style.control.content
    ctx.lineWidth = 3

    const d = this.w/3
    const f = 10
    ctx.moveTo(this.x+d, this.y+this.h-f)
    ctx.lineTo(this.x+this.w-f, this.y+this.h-f)

    ctx.moveTo(this.x+this.w-f, this.y+d)
    ctx.lineTo(this.x+this.w-f, this.y+this.h-f)
    ctx.stroke()
}
Stretch.prototype.onMouseDrag = function(dx, dy) {
    this.__.w += dx
    this.__.h += dy
    this.__.adjust()
    return false
}
Stretch.prototype.onDblClick = function(dx, dy) {
    const window = this.__
    const container = window.__

    window.x = 0
    window.y = 0
    window.resize(container.w, container.h)
}

const Close = function(dat) {
    this.name = 'close'
    this.keepZ = true
    sys.augment(this, { x: 0, y: 0, w: 0, h: 0 })
    sys.augment(this, dat)
}
Close.prototype.draw = function() {
    ctx.fillStyle = this.__._style.control.base
    ctx.fillRect(this.x, this.y, this.w, this.h)

    ctx.strokeStyle = this.__._style.control.content
    ctx.lineWidth = 3

    const d = this.w/4

    ctx.moveTo(this.x+d, this.y+d)
    ctx.lineTo(this.x+this.w-d, this.y+this.h-d)
    ctx.moveTo(this.x+this.w-d, this.y+d)
    ctx.lineTo(this.x+d, this.y+this.h-d)
    ctx.stroke()
}
Close.prototype.onClick = function() {
    log.out('closing the window ' + this.name)
    this.__.detach()
}

let instances = 0
const Window = function(dat) {
    if (!this.name) this.name = 'window' + ++instances

    sys.supplement(this, defaults)
    Container.call(this, dat)

    this.attach(new Tag())
    this.attach(new Bar())
    if (this.resizable) this.attach(new Stretch())
    if (this.closable) this.attach(new Close())

    if (dat && dat.pane) {
        this.setPane(dat.pane)
    } else {
        this.setPane(new Container({
            name: 'pane',
            attach: function(node, name) {
                Container.prototype.attach.call(this, node, name)
            },
            transparent: true
        }))
    }
    this.adjust()
}
Window.prototype = Object.create(Container.prototype)

Window.prototype.init = function() {
    this.injectStyle('window')
}

Window.prototype.setPane = function(pane) {
    this.attach(pane, 'pane')
}

Window.prototype.attach = function(node, name) {
    Container.prototype.attach.apply(this, arguments)
}

Window.prototype.injectStyle = function(b) {
    const c = this.__
    this._style = {
        font: c.style(b + '/font'),
        content: c.style(b + '/content'),
        tag: {
            baseHi: c.style(b + '/tag/base.hi'),
            base: c.style(b + '/tag/base'),
            content: c.style(b + '/tag/content'),
            font: c.style(b + '/tag/font'),
        },
        bar: {
            base: c.style(b + '/bar/base'),
            content: c.style(b + '/bar/content'),
            font: c.style(b + '/bar/font'),
        },

        control: {
            base: c.style(b + '/control/base'),
            content: c.style(b + '/control/content'),
        },
    }
}

Window.prototype.onFocus = function() {
    this.captureFocus(this.pane)
}

Window.prototype.resize = function(w, h) {
    this.w = w
    this.h = h
    this.adjust()
}

Window.prototype.adjust = function() {
    
    if (this.tag) {
        this.tag.x = 0
        this.tag.y = 0
        this.tag.w = this.w
        this.tag.h = this.baseHeight + this.pads.tag*2
    }

    if (this.close) {
        this.close.y = 0
        this.close.h = this.tag.h
        this.close.w = this.close.h
        this.close.x = this.w - this.tag.h
    }

    if (this.bar) {
        this.bar.x = 0
        this.bar.w = this.w
        this.bar.h = this.baseHeight + this.pads.tag*2
        this.bar.y = this.h - this.bar.h
    }

    if (this.stretch) {
        this.stretch.y = this.bar.y
        this.stretch.h = this.bar.h
        this.stretch.x = this.w - this.bar.h
        this.stretch.w = this.bar.h
    }

    if (this.pane) {
        this.pane.x = 2
        this.pane.w = this.w - 4
        this.pane.y = this.tag.h+1
        this.pane.h = this.h - this.tag.h - this.bar.h
        if (sys.isFun(this.pane.adjust)) this.pane.adjust()
    }
}

module.exports = Window

