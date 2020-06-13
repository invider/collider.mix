'use strict'

// a window showing node content

//@depends(/dna/hud/Container)
const Container = dna.hud.Container
//@depends(/dna/hud/gadget/DynamicList)
const DynamicList = dna.hud.gadget.DynamicList

const defaults = {
    status: '/',
    dir: $,
    x: 0,
    y: 0,
    w: 200,
    h: 200,
}

function mark(ch, n) {
    let s = ''
    for (let i = 0; i < n; i++) s += ch
    return s
}

function findName(node, parent, key) {
    if (sys.isObj(node) && node.name) return node.name

    let name = 'anonymous'
    if (key) name = key

    if (sys.isFrame(parent)) {
        Object.keys(parent._dir).forEach(k => {
            if (parent[k] === node) name = k
        })

    } else if (sys.isArray(parent)) {
        name = '#' + parent.indexOf(node)

    } else if (sys.isObj(parent)) {
        Object.keys(parent).forEach(k => {
            if (parent[k] === node) name = k
        })
    }
    return name
}

function nodeTitle(node, dir, i, key) {
    //let title = '#' + i + ': '
    let title = ''

    if (key) title += key + ': '

    if (sys.isFrame(node)) {
        if (node.name !== '/') title += node.name
        if (sys.isFun(node)) title += '()'
        title += '/'
        if (node._ls.length < 7) title += mark('.', node._ls.length)
        else title += '*'
    } else if (sys.isFun(node)) {
        title += findName(node, dir, key) + '()'
    } else if (sys.isObj(node)) {
        title += '{ ' + findName(node, dir, key) + ' }'
    } else if (sys.isArray(node)) {
        title += '[ ' + findName(node, dir, key) + ' ]'
    } else {
        if (key) {
            title += node
        } else {
            title += findName(node, dir, key) + ': ' + node
        }
    }
    return title
}

const FrameInspector = function(dat) {
    this.lastPos = []
    this.lastSelect = []
    this.lastName = []
    this.trail = []
    augment(this, defaults)
    DynamicList.call(this, dat)

    this.adjust()
}
FrameInspector.prototype = Object.create(DynamicList.prototype)

FrameInspector.prototype.saveLocation = function(node) {
    if (this.trail[this.trail.length - 1] !== node) {
        this.trail.push(node)
    }
}

FrameInspector.prototype.back = function() {
    if (this.trail.length > 0) {
        this.dir = this.trail.pop()
        this.updatePath()
        if (this.onMove) this.onMove()
    }
}

FrameInspector.prototype.onKeyDown = function(e) {
    if (e.key === 'Enter' && e.shiftKey) {
        if (this.selected >= 0) this.onItemAction(this.selected, 3);
    } else if (e.key === 'Backspace') {
        this.back()
    } else if (e.key === 'Escape') {
        if (this.closable) this.detach()
    } else {
        DynamicList.prototype.onKeyDown.call(this, e)
    }
}

FrameInspector.prototype.updatePath = function() {
    let t = this.dir
    let path = findName(t)

    while(t.__) {
        t = t.__
        let name = findName(t)
        if (name === '/') name = ''
        path = name + '/' + path
    }
    if (path === 'anonymous') this.status = ''
    else {
        this.status = path
        this.lastPath = path
    }
}

FrameInspector.prototype.item = function(i, d) {
    const dir = d? d : this.dir

    let sh = 0
    if (dir.__) {
        if (i === 0) return {
            name: '..',
            node: dir.__,
        }
        sh = 1
    }

    if (sys.isFrame(dir)) {
        if (i < 0) {
            return dir._ls.length + sh
        } else {
            return {
                name: nodeTitle(dir._ls[i-sh], dir, i-sh),
                node: dir._ls[i-sh]
            }
        }
    } else if (sys.isObj(dir)) {
        //const keys = Object.keys(dir)
        const keys = []
        for (let k in dir) {
            keys.push(k)
        }

        if (i < 0) {
            return keys.length + sh
        } else {
            return {
                key: keys[i-sh],
                name: keys[i-sh],
                //name: nodeTitle(dir[keys[i-sh]], dir, i-sh, keys[i-sh]),
                node: dir[keys[i-sh]],
            }
        }
    }
}

FrameInspector.prototype.selectedNode = function() {
    const item = this.item(this.selected)
    if (!item) return
    return item.node
}

FrameInspector.prototype.open = function(next) {
    if (next && (sys.isObj(next) || sys.isFrame(next))) {
        this.lastName.push(findName(next))
        this.lastPos.push(this.pos)
        this.pos = 0
        this.selected = 0
        this.slider.pos = 0
        if (this.dir !== next) this.saveLocation(this.dir)
        if (sys.isFrame(next)) {
            this.dir = next
            //this.max = next._ls.length
        } else if (sys.isObj(next)) {
            // normalize first
            this.dir = next
            //this.max = 0
            for (let k in next) this.max++
            /*
            // Why did I make that?
            this.dir = {
                _dir: {},
                _ls: [],
            }

            Object.keys(next).forEach(k => {
                this.dir[k] = next[k]
                if (!k.startsWith('_')) {
                    this.dir._dir[k] = next[k]
                    this.dir._ls.push(next[k])
                }
            })
            this.max = this.dir._ls.length
            */
        }
        this.updatePath()
        this.adjust()
    } else {
        log.out(next)
        log.dump(next)
    }
}

FrameInspector.prototype.onItemAction = function(i, action) {
    const item = this.item(i)

    if ((item.name === '..' && action === 0) || action === 2) {
        if (this.dir.__) {
            // going up the tree
            let pos = 0
            let sel = 0
            if (this.lastPos.length > 0) {
                pos = this.lastPos.pop()
                sel = this.lastSelect.pop()
            }

            this.saveLocation(this.dir)
            this.dir = this.dir.__
            this.pos = pos
            this.selected = sel
            this.slider.pos = pos
            //this.max = this.dir._ls.length
            this.updatePath()
            this.adjust()
        }
    } else if (action === 1) {
        log.out(item.node)
        log.dump(item.node)

    } else if (action === 3) {
        /*
        const next = item.node
        if (next && (sys.isObj(next) || sys.isFrame(next))) {
            const expl = new FrameInspector({
                x: this.x + this.w,
                y: this.y,
                w: this.w,
                h: this.h,
            })
            this.__.attach(expl)
            expl.trail.push(expl.dir)
            if (!this.disabled) log('^^^' + this.dir.name)
            expl.dir = next
            expl.pane.updatePath()
        }
        */

    } else {
        const next = item.node
        this.__.open(next)
        this.lastSelect.push(i)
    }

    if (this.onMove) this.onMove()
}

function nodeToIcon(item) {
    const node = item.node

    if (node instanceof HTMLImageElement) return node

    if (sys.isFrame(node)) {
        if (item.node.name === '/') return res.hud.icon.home
        if (item.name === '..') return res.hud.icon.up
        if (item.name.startsWith('sys')) return res.hud.icon.sys
        if (item.name.startsWith('lib')) return res.hud.icon.lib
        if (item.name.startsWith('env')) return res.hud.icon.env
        if (item.name.startsWith('res')) return res.hud.icon.res
        if (item.name.startsWith('dna')) return res.hud.icon.dna
        if (item.name.startsWith('lab')) return res.hud.icon.lab
        if (item.name.startsWith('log')) return res.hud.icon.log
        if (item.name.startsWith('mod')) return res.hud.icon.mod
        if (item.name.startsWith('cue')) return res.hud.icon.cue
        if (item.name.startsWith('trap')) return res.hud.icon.trap
        return res.hud.icon.frame
    }
    if (sys.isFun(node)) {
        if (/^[A-Z]/.test(item.name)) return res.hud.icon._dir['constructor']
        return res.hud.icon.fun
    }
    if (sys.isObj(node)) return res.hud.icon.object
    if (sys.isString(node)) return res.hud.icon.text
    if (sys.isArray(node)) return res.hud.icon.array
    return res.hud.icon.file
}

FrameInspector.prototype.drawItem = function(item, i, iy) {
    let x = this.slider.w + this.itemsPadding
    const h = this.itemHeight()
    const iconToTextSpacing = 10
    const magnify = 3

    if (!nodeToIcon(item)) console.log('no icon for ' + item.name)

    if (i === this.selected) {
        fill(this.color.selected)
        image(nodeToIcon(item), x-magnify, iy-magnify, h+magnify*2, h+magnify*2)
    } else {
        fill(this.color.text)
        image(nodeToIcon(item), x, iy, h, h)
    }

    x += this.itemHeight() + iconToTextSpacing

    font(this.font)
    alignLeft()
    baseMiddle()
    text(item.name, x, iy + this.itemHeight()/2)
    return h
}

FrameInspector.prototype.onItemClick = function(i) {
    DynamicList.prototype.onItemClick.call(this, i)
    if (this.onMove) this.onMove()
}

module.exports = FrameInspector

