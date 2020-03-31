'use strict'
// @depends(/dna/hud/gadget/TextView)
// @depends(/dna/hud/gadget/FrameInspector)
// @depends(/dna/hud/gadget/ImageInspector)

// @depends(/dna/hud/MonoContainer)
const MonoContainer = dna.hud.MonoContainer

const defaults = {
    x: 0,
    y: 0,
    w: 100,
    h: 100,
    trail: [],
}

function NodeInspector(st) {
    augment(this, defaults)
    MonoContainer.call(this, st)
}
NodeInspector.prototype = Object.create(MonoContainer.prototype)

NodeInspector.prototype.init = function() {
    const inspector = this

    this.spawn('/dna/hud/gadget/TextView', {
        name: 'textInspector',
        onKeyDown: function(e) {
            if (e.key === 'Backspace') {
                inspector.back()
            }
        },
    })
    this.spawn('/dna/hud/gadget/FrameInspector', {
        name: 'frameInspector',
        onMove: function() {
            if (inspector.onMove) inspector.onMove()
        }
    })
    this.spawn('/dna/hud/gadget/ImageInspector', {
        name: 'imageInspector',
        onKeyDown: function(e) {
            if (e.key === 'Backspace') {
                inspector.back()
            }
        },
    })

    this.open($)
}

NodeInspector.prototype.layout = function() {
    const g = this.active
    if (!g) return
    g.x = 0
    g.y = 0
    g.w = this.w
    g.h = this.h
}

NodeInspector.prototype.selectedNode = function() {
    if (this.active.name !== 'frameInspector') return
    return this.active.selectedNode()
}

NodeInspector.prototype.ensureActive = function(id) {
    if (this.active && this.active.name === id) return

    if (!this.disabled && this.active) {
        this.hud.releaseFocus(this.active)
    }

    this.activate(id)
    if (!this.disabled) {
        this.hud.captureFocus(this.active)
    }
}

NodeInspector.prototype.sync = function() {
    const next = this.dir

    if (!next) {
        this.ensureActive('textInspector')
        this.active.setText('')

    } else if (lib.img.isDrawableImage(next)) {
        this.ensureActive('imageInspector')
        this.active.open(next)

    } else if (isFrame(next) || isObj(next)) {
        this.ensureActive('frameInspector')
        this.active.open(next)

    } else {
        this.ensureActive('textInspector')
        this.active.setText(next.toString())
    }
}

NodeInspector.prototype.back = function() {
    if (this.trail.length === 0) return

    const cur = this.trail.pop()
    const prev = this.trail.pop()
    this.land(prev)
}

NodeInspector.prototype.open = function(next) {
    if (!this.disabled) this.trail.push(next)
    this.dir = next
    this.sync()
}

NodeInspector.prototype.land = function(next) {
    this.open(next)
    if (this.onStateChange) this.onStateChange()
}

NodeInspector.prototype.select = function(node) {
    if (!this.active || this.active.name !== 'frameInspector') return
    if (!node) return
    
    let i = this.dir._ls.indexOf(node)
    if (i >= 0) {
        if (this.dir.__) i++
        this.active.selected = i
    }
}

NodeInspector.prototype.getDir = function() {
    if (this.active.name === 'frameInspector') {
        this.dir = this.active.dir
    }
    return this.dir
}

NodeInspector.prototype.onFocus = function() {}

NodeInspector.prototype.onKeyDown = function(e) {
    switch(e.code) {
        case 'Escape':
            this.land(_.___)
            break
        case 'Backslash':
            console.dir(this.selectedNode() || this.dir)
            break
    }
}
