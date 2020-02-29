'use strict'

// @depends(/dna/hud/Container)
const Container = dna.hud.Container
// @depends(/dna/hud/gadget/Slider)
const Slider = dna.hud.gadget.Slider

let instances = 0
const DynamicList = function(dat) {
    if (!this.name) this.name = 'dlist' + ++instances

    this.clip = true
    this.disabled = false
    this.hidden = false
    this.opaque = true

    this.pos = 0
    this.selected = -1
    this.span = 0
    this.step = this.span/2
    this.max = 0

    this.itemsPadding = 5
    this.font = env.hud.font
    this.baseHeight = env.hud.baseHeight

    this.color = {
        text: '#C0C0C8',
        selected: '#A9D000',
    }
    dna.hud.Container.call(this, dat)

    this.attach(new Slider({
        name: 'slider',
        x: 0,
        y: 0,
        w: 15,
        h: this.h,
        onScroll: (pos) => {
            this.pos = Math.round(this.slider.pos)
        },
    }))

    this.resize(this.w, this.h)
}
DynamicList.prototype = Object.create(Container.prototype)

DynamicList.prototype.resize = function(w, h) {
    this.w = w
    this.h = h
    this.adjust()
}

DynamicList.prototype.adjust = function() {
    this.slider.h = this.h
    this.slider.span = this.h/(this.baseHeight + this.itemsPadding)
    this.slider.step = this.slider.span/2
    this.slider.max = this.max + 1
    this.span = Math.floor(this.slider.span)
}

DynamicList.prototype.adjustPosition = function() {
    if (this.selected >= 0 && this.pos > this.selected) {
        this.pos = this.selected
        this.slider.pos = this.pos
    } else if (this.pos + this.span - 1 < this.selected) {
        this.pos = this.selected - this.span + 1
        this.slider.pos = this.pos
    }
}

DynamicList.prototype.items = function() {
    return []
}

DynamicList.prototype.onDblClick = function(x, y, b, e) {
    if (!this.focus) return

    const i = this.pos + Math.floor(y/this.itemHeight())
    if (x > this.slider.w + this.itemsPadding) {
        this.onItemClick(i)
        this.onItemAction(i, 0)
    }

    Container.prototype.onDblClick.call(this, x, y, b, e)
}

DynamicList.prototype.onClick = function(x, y, b, e) {
    // determine the item # if any
    if (!this.focus) return

    const i = this.pos + Math.floor(y/this.itemHeight())
    if (x > this.slider.w + this.itemsPadding) {
        this.onItemClick(i)
    }

    Container.prototype.onClick.call(this, x, y, b, e)
}

DynamicList.prototype.onItemClick = function(i) {
    this.selected = i
} 

DynamicList.prototype.onItemAction = function(i, a) {
    log.out('action [' + a + '] for #' + i + ' - redefine onItemAction() to specify')
}

DynamicList.prototype.moveCursor = function(shift) {
    this.selected = lib.math.limit(this.selected + shift, 0, this.max)
    this.adjustPosition()
    if (this.onMove) this.onMove()
}

DynamicList.prototype.onKeyDown = function(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    switch(e.key) {
    case 'ArrowDown': case 'j':
            this.moveCursor(1)
            break

    case 'ArrowUp': case 'k':
            this.moveCursor(-1)
            break

    case 'ArrowLeft': case 'PageUp':
            this.moveCursor(-this.span+1)
            break;

    case 'ArrowRight': case 'PageDown':
            this.moveCursor(this.span-1)
            break

    case 'Enter': case 'l':
        if (this.selected >= 0) this.onItemAction(this.selected, 0)
        if (this.onMove) this.onMove()
        break

    case ' ': if (this.selected >= 0)
            this.onItemAction(this.selected, 1)
            break

    case 'Backspace': case 'h':
            if (this.selected >= 0) this.onItemAction(this.selected, 2)
            if (this.onMove) this.onMove()
            break
    }
}

DynamicList.prototype.onKeyUp = function(e) {}

DynamicList.prototype.onMouseWheel = function(d, x, y, e) {
    if (x <= this.slider.w) return Container.prototype.onMouseWheel.call(this, d, x, y, e)
    if (d < 0) {
        this.moveCursor(1)
    } else if (d > 0) {
        this.moveCursor(-1)
    }
}

DynamicList.prototype.itemHeight = function() {
    return this.baseHeight + this.itemsPadding
}

DynamicList.prototype.drawItem = function(item, i, iy) {
    let x = this.slider.w + this.itemsPadding

    if (i === this.selected) ctx.fillStyle = this.color.selected
    else ctx.fillStyle = this.color.text

    ctx.font = this.font
    ctx.textBaseline = 'top'
    ctx.textAlign = "left"
    ctx.fillText(item, x, iy);
    return this.itemHeight()
}

DynamicList.prototype.drawBackground = function() {
    if (!this.opaque) Container.prototype.drawBackground.call(this)
}

DynamicList.prototype.drawForeground = function() {
    // TODO maybe a function that returs an element by i?
    //      would be much more effective for longer lists
    let item = false
    let items = false
    if (sys.isFun(this.item)) {
        item = this.item
        this.max = this.item(-1) - 1
    } else {
        items = sys.isFun(this.items)? this.items() : this.items
        this.max = items.length - 1
    }

    this.adjust()

    // fix position if needed
    if (this.pos > this.max) {
        this.slider.pos = this.pos
    } else if (this.pos < 0) {
        this.pos = 0
        this.slider.pos = this.pos
    }

    let i = this.pos
    let iy = 0

    while (i <= this.max && iy < this.h) {
        iy += this.drawItem(this.item? this.item(i) : items[i], i, iy)
        i++
    }
}

module.exports = DynamicList
