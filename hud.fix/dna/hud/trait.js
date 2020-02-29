'use strict'

const Component = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
}

const Draggable = {

    onMouseDrag: function(dx, dy) {
        this.x += dx
        this.y += dy
    }
}

module.exports = {
    Component: Component,
    Draggable: Draggable,
}
