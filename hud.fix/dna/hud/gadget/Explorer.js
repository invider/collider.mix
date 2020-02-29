'use strict'

// a window showing node content

//@depends(/dna/hud/Window)
const Window = dna.hud.Window
//@depends(/dna/hud/gadget/DynamicList)
const DynamicList = dna.hud.gadget.DynamicList

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

const NodeList = function(dat) {
    this.lastPos = []
    this.lastSelect = []
    this.lastName = []
    DynamicList.call(this, dat)
}
NodeList.prototype = Object.create(DynamicList.prototype)

NodeList.prototype.onKeyDown = function(e) {
    if (e.key === 'Enter' && e.shiftKey) {
        if (this.selected >= 0) this.onItemAction(this.selected, 3);
    } else if (e.key === 'Backspace') {
        if (this.__.trail.length > 0) {
            this.__.dir = this.__.trail.pop()
            this.__.pane.updatePath()
        }
    } else if (e.key === '\\') {
        log.dump(this.__.dir)
    } else if (e.key === 'Escape') {
        if (this.__.closable) this.__.detach()
    } else {
        DynamicList.prototype.onKeyDown.call(this, e)
    }
}

NodeList.prototype.updatePath = function() {
    let t = this.__.dir
    let path = findName(t)

    while(t.__) {
        t = t.__
        let name = findName(t)
        if (name === '/') name = ''
        path = name + '/' + path
    }
    if (path === 'anonymous') this.__.status = ''
    else {
        this.__.status = path
        this.__.lastPath = path
    }
}

NodeList.prototype.item = function(i, d) {
    const dir = d? d : this.__.dir

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

NodeList.prototype.open = function(next) {
    if (next && (sys.isObj(next) || sys.isFrame(next))) {
        this.lastName.push(findName(next))
        this.lastPos.push(this.pos)
        this.pos = 0
        this.selected = 0
        this.slider.pos = 0
        this.__.trail.push(this.__.dir)
        if (sys.isFrame(next)) {
            this.__.dir = next
            //this.max = next._ls.length
        } else if (sys.isObj(next)) {
            // normalize first
            this.__.dir = next
            //this.max = 0
            for (let k in next) this.max++
            /*
            // Why did I make that?
            this.__.dir = {
                _dir: {},
                _ls: [],
            }

            Object.keys(next).forEach(k => {
                this.__.dir[k] = next[k]
                if (!k.startsWith('_')) {
                    this.__.dir._dir[k] = next[k]
                    this.__.dir._ls.push(next[k])
                }
            })
            this.max = this.__.dir._ls.length
            */
        }
        this.updatePath()
        this.adjust()
    } else {
        log.out(next)
        log.dump(next)
    }
}

NodeList.prototype.onItemAction = function(i, action) {
    const item = this.item(i)

    if ((item.name === '..' && action === 0) || action === 2) {
        if (this.__.dir.__) {
            // going up the tree
            let pos = 0
            let sel = 0
            if (this.lastPos.length > 0) {
                pos = this.lastPos.pop()
                sel = this.lastSelect.pop()
            }

            this.__.trail.push(this.__.dir)
            this.__.dir = this.__.dir.__
            this.pos = pos
            this.selected = sel
            this.slider.pos = pos
            //this.max = this.__.dir._ls.length
            this.updatePath()
            this.adjust()
        }
    } else if (action === 1) {
        log.out(item.node)
        log.dump(item.node)
    } else if (action === 3) {
        const next = item.node
        if (next && (sys.isObj(next) || sys.isFrame(next))) {
            const expl = new Explorer({
                x: this.__.x + this.__.w,
                y: this.__.y,
                w: this.__.w,
                h: this.__.h,
            })
            this.__.__.attach(expl)
            expl.trail.push(expl.dir)
            expl.dir = next
            expl.pane.updatePath()
        }
    } else {
        const next = item.node
        this.open(next)
        this.lastSelect.push(i)
    }

    if (this.__.onStateChange) this.__.onStateChange()
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
        if (/^[A-Z]/.test(item.name)) return res.hud.icon.constructor
        return res.hud.icon.fun
    }
    if (sys.isObj(node)) return res.hud.icon.object
    if (sys.isString(node)) return res.hud.icon.text
    if (sys.isArray(node)) return res.hud.icon.array
    return res.hud.icon.file
}

NodeList.prototype.drawItem = function(item, i, iy) {
    let x = this.slider.w + this.itemsPadding
    const h = this.itemHeight()
    const iconToTextSpacing = 10
    const magnify = 3

    if (!nodeToIcon(item)) console.log(item.name)
    if (i === this.selected) {
        ctx.fillStyle = this.color.selected
        ctx.drawImage(nodeToIcon(item), x-magnify, iy-magnify, h+magnify*2, h+magnify*2)
    } else {
        ctx.fillStyle = this.color.text
        ctx.drawImage(nodeToIcon(item), x, iy, h, h)
    }

    x += this.itemHeight() + iconToTextSpacing

    ctx.font = this.font
    ctx.textBaseline = 'center'
    ctx.textAlign = "left"
    ctx.fillText(item.name, x, iy + this.itemHeight()/2)
    return h
}

const defaults = {
    title: '',
    status: '/',
    x: 0,
    y: 0,
    w: 200,
    h: 200,
    dir: _._$,
    trail: [],
}

let instances = 0
const Explorer = function(dat) {
    if (!this.name) this.name = 'explorer' + ++instances
    sys.supplement(this, defaults)

    Window.call(this, dat)
    sys.augment(this, dat)

    this.attach(new NodeList({
        x: 0,
        y: 0,
        w: 10,
        h: 10,
        itemsPadding: 10,
    }), 'pane')
    this.pane.updatePath()
    this.adjust()
}
Explorer.prototype = Object.create(Window.prototype)

Explorer.prototype.selectedNode = function() {
    const item = this.pane.item(this.pane.selected)
    if (!item) return
    return item.node
}


Explorer.prototype.open = function(next) {
    this.pane.open(next)
}

module.exports = Explorer

