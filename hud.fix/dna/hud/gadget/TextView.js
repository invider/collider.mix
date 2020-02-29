'use strict'

// @depends(/dna/hud/Container)
const Container = dna.hud.Container
// @depends(/dna/hud/gadget/Slider)
const Slider = dna.hud.gadget.Slider
// @depends(/dna/hud/gadget/TextPane)
const TextPane = dna.hud.gadget.TextPane

const defaultStyle = {
    slideStep: 24,
}

let instances = 0

function TextView(st) {
    if (!this.name) this.name = 'textView' + ++instances

    this.clip = true
    this.disabled = false
    this.hidden = false
    this.opaque = true

    this.style = augment({}, defaultStyle)

    Container.call(this, st)

    this.attach(new Slider({
        name: 'slider',
        x: 0,
        y: 0,
        w: 15,
        h: 100,
        onScroll: (pos) => {
            this.pane.moveTo(Math.round(this.slider.pos))
            this.sync()
        },
    }))

    const view = this
    this.attach(new TextPane({
        name: 'pane',
        text: st.text,

        onMouseWheel: function(d, x, y, e) {
            if (d < 0) {
                view.moveCursor(view.style.slideStep*2)
            } else if (d > 0) {
                view.moveCursor(-view.style.slideStep*2)
            }
        }

    }))
    this.slider.pane = this.pane
}
TextView.prototype = Object.create(Container.prototype)

TextView.prototype.adjust = function() {
    if (!this.slider || !this.pane) return

    this.pane.x = this.slider.w
    this.pane.y = 0
    this.pane.w = this.w - this.slider.w
    this.pane.h = this.h
    this.pane.adjust()

    this.slider.h = this.h
    this.slider.step = this.slider.span/2
    this.slider.adjust()
    this.sync()
}

TextView.prototype.sync = function() {
    this.slider.max = this.pane.page.h
    this.slider.span = this.h
    this.slider.step = this.h/2
    this.slider.scrollSpeed = this.h/8
    this.slider.pos = this.pane.ty
}

TextView.prototype.moveCursor = function(shift) {
    this.pane.scroll(shift)
    this.sync()
    if (this.onMove) this.onMove()
}

TextView.prototype.setText = function(txt) {
    this.text = txt
    this.pane.setText(txt)
    this.sync()
}

TextView.prototype.onKeyDown = function(e) {
    if (!this.focus) return
    if (e.altKey || e.ctrlKey || e.metaKey) return

    switch(e.key) {
        case 'ArrowDown': case 'j':
            this.moveCursor(this.style.slideStep); break;
        case 'ArrowUp': case 'k':
            this.moveCursor(-this.style.slideStep); break;
        case 'ArrowLeft': case 'PageUp': case 'h':
            this.moveCursor(-this.slider.span+1); break;
        case 'ArrowRight': case 'PageDown': case 'l':
            this.moveCursor(this.slider.span-1); break;
    }
}

/*
TextView.prototype.drawContent = function() {
    fill(.2, .6, .7)
    rect(10, 10, 40, 40)
}
*/
