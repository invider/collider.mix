/*
 * Collider.JAM Supervisor
 */
$ = scene = (function(window) {

"use strict"

// ***********
// environment
const SCRIPT_SRC = 'collider.mix/collider.js'
const UNITS_MAP = 'units.map'
const JAM_CONFIG = 'jam.config'
const canvasName = 'canvas'

const GAMEPADS = 4

// *********
// flags
let _key = {}
const _pad = function(gamepad) {
    if (gamepad === undefined) {
        const res = []
        for (let i = 0; i < GAMEPADS; i++) {
            const p = navigator.getGamepads()[i]
            if (p && p.connected) res.push(p)
        }
        return res

    } else {
        const pad = navigator.getGamepads()[gamepad]
        if (pad && pad.connected) return pad
    }
}

const _mouse = {
    x: 0,
    y: 0,
    lx: 0,
    ly: 0,
    out: false,
    buttons: 0,
}

// *********
// utilities
const isObj = function(o) {
    return !!(o && typeof o === 'object')
}
const isFun = function(f) {
    return !!(f && f.constructor && f.call && f.apply)
}
const isString = function(s) {
    return toString.call(s) == "[object String]"
}
const isNumber = function(s) {
    return toString.call(s) == "[object Number]"
}
const isArray = function(a) {
    return Array.isArray(a)
}
const isMutable = function(obj) {
    return ((typeof obj === 'object')
                || (typeof obj === 'function'))
            && (!obj._locked);
}
const isFrame = function(f) {
    return !!(f && f._frame)
}
const isEmpty = function(o) {
    if (!o) return true
    if (isObj(o)) {
        for (let prop in o) {
            if (o.hasOwnProperty(prop)) return false
        }
        return true

    } else if (isArray(o)) {
        return o.length === 0
    }
    return false
}

function mix() {
    let mixin = {}
    for (let arg = 0; arg < arguments.length; arg++) {
        for (let prop in arguments[arg]) {
            if (arguments[arg].hasOwnProperty(prop)) {
                mixin[prop] = arguments[arg][prop]
            }
        }
    }
    return mixin
}
function augment() {
    let mixin = arguments[0]
    if (!isObj(mixin) && !isFun(mixin)) mixin = {}

    for (let arg = 1; arg < arguments.length; arg++) {
        const source = arguments[arg]
        if (source && source !== mixin) for (let prop in source) {
            if (prop !== '_' && prop !== '__' && prop !== '___' && prop !== '_$') {
                if (isObj(mixin[prop]) && isObj(arguments[arg][prop])) {
                    // property is already assigned - augment it
                    if (mixin !== source[prop]) augment(mixin[prop], source[prop])
                } else {
                    mixin[prop] = source[prop];
                }
            }
        }
    }
    return mixin
}
function supplement() {
    let mixin = arguments[0]
    if (!isObj(mixin) && !isFun(mixin)) mixin = {}

    for (let arg = 1; arg < arguments.length; arg++) {
        const source = arguments[arg]
        if (isObj(source)) {
            for (let prop in source) {
                if (prop !== '_' && prop !== '__' && prop !== '___' && prop !== '_$') {
                    if (isObj(mixin[prop]) && isObj(source[prop])) {
                        if (mixin !== source[prop]) supplement(mixin[prop], source[prop])
                    } else if (mixin[prop] === undefined) {
                        mixin[prop] = source[prop];
                    }
                }
            }
        }
    }
    return mixin
}

function kill(e, s) {
    if (e.__) {
        if (isFun(e.kill)) e.kill(s)
        else if (isFun(e.onKill)) e.onKill(s)
        e.__.detach(e)
    } else {
        if (isFun(e.kill)) e.kill(s)
        else _.log.warn("can't find kill function for " + e)
    }
}

function limit(val, min, max) {
    return val<min? min : val>max? max : val
}

function hue2rgb(p, q, t) {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q-p) * 6*t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q-p) * (2/3 - t)*6
    return p
}

function rgb(r, g, b) {
    r = limit(Math.round(r * 255), 0, 255).toString(16)
    g = limit(Math.round(g * 255), 0, 255).toString(16)
    b = limit(Math.round(b * 255), 0, 255).toString(16)
    if (r.length === 1) r = '0'+r
    if (g.length === 1) g = '0'+g
    if (b.length === 1) b = '0'+b

    return '#' + r + g + b
}

function rgba(r, g, b, a) {
    r = limit(Math.round(r * 255), 0, 255).toString(16)
    g = limit(Math.round(g * 255), 0, 255).toString(16)
    b = limit(Math.round(b * 255), 0, 255).toString(16)
    a = limit(Math.round(a * 255), 0, 255).toString(16)
    if (r.length === 1) r = '0'+r
    if (g.length === 1) g = '0'+g
    if (b.length === 1) b = '0'+b
    if (a.length === 1) a = '0'+a

    return '#' + r + g + b + a
}

function RGB(r, g, b) {
    r = limit(Math.round(r), 0, 255).toString(16)
    g = limit(Math.round(g), 0, 255).toString(16)
    b = limit(Math.round(b), 0, 255).toString(16)
    if (r.length === 1) r = '0'+r
    if (g.length === 1) g = '0'+g
    if (b.length === 1) b = '0'+b

    return '#' + r + g + b
}

function RGBA(r, g, b, a) {
    r = limit(Math.round(r), 0, 255).toString(16)
    g = limit(Math.round(g), 0, 255).toString(16)
    b = limit(Math.round(b), 0, 255).toString(16)
    a = limit(Math.round(a), 0, 255).toString(16)
    if (r.length === 1) r = '0'+r
    if (g.length === 1) g = '0'+g
    if (b.length === 1) b = '0'+b
    if (a.length === 1) a = '0'+a

    return '#' + r + g + b + a
}

function hsl(h, s, l) {
    if (h > 1) h = 1
    if (s > 1) s = 1
    if (l > 1) l = 1
    if (s === 0) {
        return rgb(l, l, l)
    } 
    const q = l < 0.5? l*(1+s) : l + s - l*s
    const p = 2*l - q
    const r = hue2rgb(p, q, h + 1/3)
    const g = hue2rgb(p, q, h)
    const b = hue2rgb(p, q, h - 1/3)
    return rgb(r, g, b)
}

function hsla(h, s, l, a) {
    if (h > 1) h = 1
    if (s > 1) s = 1
    if (l > 1) l = 1
    if (a > 1) a = 1
    if (s === 0) {
        return rgba(l, l, l, a)
    } 
    const q = l < 0.5? l*(1+s) : l + s - l*s
    const p = 2*l - q
    const r = hue2rgb(p, q, h + 1/3)
    const g = hue2rgb(p, q, h)
    const b = hue2rgb(p, q, h - 1/3)
    return rgba(r, g, b, a)
}

// TODO make into regular obj.fn = before(patch, obj.fn)
const before = function(obj, fun, patch) {
    var orig = obj[fun]
    if (!orig) {
        obj[fun] = patch
    } else if (!isFun(orig)) {
        throw new Error("Can't chain before [" + fun + "] which is " + (typeof orig))
    } else {
        obj[fun] = function() {
            patch.apply(this, arguments)
            orig.apply(this, arguments)
        }
        obj[fun].first = patch
        obj[fun].after = orig
    }
}

// TODO make into regular obj.fn = after(obj.fn, patch)
const after = function(obj, fun, patch) {
    var orig = obj[fun]
    if (!orig) {
        obj[fun] = patch
    } else if (!isFun(orig)) {
        throw new Error("Can't chain after [" + fun + "] which is " + (typeof orig))
    } else {
        obj[fun] = function() {
            orig.apply(this, arguments)
            patch.apply(this, arguments)
        }
        obj[fun].first = orig 
        obj[fun].after = patch
    }
}

const chain = function(fn1, fn2) {
    if (fn1 && !isFun(fn1)) throw (`Function is expected, but found [${fn1}] of ` + (typeof fn1))
    if (fn2 && !isFun(fn2)) throw (`Function is expected, but found [${fn2}] of ` + (typeof fn2))

    if (fn1 && !fn2) return fn1
    if (!fn1 && fn2) return fn2
    if (!fn1 && !fn2) return function() {}

    const fn = function() {
        fn1.apply(this, arguments)
        fn2.apply(this, arguments)
    }
    fn.first = fn1
    fn.second = fn2
    return fn
}

const matchType = function(v) {
    v = v.trim()
    if ((v.startsWith("'") && v.endsWith("'"))
            || (v.startsWith('"') && v.endsWith('"'))) {
        return v.substring(1, v.length - 1)
    } else if (v.startsWith('#')) {
        let n = parseInt(v.substring(1), 16)
        if (!isNaN(n)) return n
    } else if (v.startsWith('0x')) {
        let n = parseInt(v.substring(2), 16)
        if (!isNaN(n)) return n
    }
    let n = parseFloat(v)
    if (!isNaN(n)) return n
    return v
};

const getParentPath = function(path) {
    return path.replace(/[^\/]+$/, '')
}

const removeExtension = function(path) {
    return path.replace(/^.*[\\\/]/, '') // remove path
}


// =======================================================
// system definitions
// =======================================================
const touchFun = function(nodeFactory) {
    return function(path) {
        if (path === undefined || path === '') return this
        if (path.startsWith('@')) return this.touch(path.substring(1))
        if (path.startsWith('/')) return this._.touch(path.substring(1))
        
        const i = path.indexOf('/')
        if (i >= 0) {
            // switch to the next target
            let nextName = path.substring(0, i)
            let nextPath = path.substring(i + 1)
            let nextNode = this[nextName]
            if (!nextNode) {
                // no existing node, provide a new one
                return this.attach(nodeFactory(nextName, this)).touch(nextPath)
            } else {
                if (isFun(nextNode.touch)) {
                    return nextNode.touch(nextPath)
                } else {
                    // looks like next node is not a frame
                    throw new Error("can't touch - the node is not a frame! [" + path + "]")
                    // TODO maybe find a reasonable way to handle simple objects touch
                }
            }
        } else {
            // TODO provide several touch strategies
            // TODO should we check that the final type is frame or object?
            // TODO should we replace it if not etc...
            // we got the name of the final frame in the path
            if (this[path]) return this[path]
            // node seems to be missing - create a new one
            return this.attach(nodeFactory(path, this))
        }
    }
}

/**
 * @alias sys.Frame
 * @param initObj
 * @constructor
 */
const Frame = function(dat) {
    this._ = this
    this._ls = []
    this._dir = {}
    if (isString(dat)) {
        this.name = dat 
    } else if (isObj(dat)) {
        augment(this, dat)
    }
}
Frame.prototype._frame = true
Frame.prototype._dna = "Frame"

Frame.prototype.path = function() {
    if (this.__) return addPath(this.__.path(), this.name)
    return this.name
}
Frame.prototype.path._meta = {
    head: 'returns the path of the node',
}

Frame.prototype.getMod = function() {
    return this.__.getMod()
}

Frame.prototype.touch = touchFun((name) => new Frame(name))

Frame.prototype.attach = function(node, name) {
    if (node === undefined || node === null) return

    if (isObj(node) || isFun(node)) {
        // attaching an object - inject mod, parent and name

        // TODO phase out mod reference for nodes - __ is enough
        node._ = this._
        node.__ = this
        Object.defineProperty(node, '_', { enumerable: false })
        Object.defineProperty(node, '__', { enumerable: false })

        // set name for the node if possible
        if (name && isObj(node)) node.name = name
        // take name from the node if not defined
        if (!name && node.name) name = node.name
	}

    let prevNode
    if (name) {
        // make sure we are not shaddowing prototype definitions
        prevNode = this[name]
        if (prevNode) this.detach(prevNode)

        if (!this.__proto__ || !this.__proto__[name]) {
            this[name] = node
        }
        this._dir[name] = node
    }
    this._ls.push(node)

    this.onAttached(node, name, this)
    if (isFun(node.init)) node.init() // initialize node
    if (prevNode && isFun(node.onReplace)) node.onReplace(prevNode)

    return node
}

Frame.prototype.link = function(node, name) {
    if (node === undefined) return
    if (isObj(node) || isFun(node)) {
        // take name from the node if not defined
        if (!name && node.name) name = node.name
	}

    if (name) {
        // make sure we are not shaddowing prototype definitions
        if (!Frame.prototype[name]) {
            this[name] = node
        }
        this._dir[name] = node
    }
    this._ls.push(node)
    return node
}

Frame.prototype.onAttached = function(node, name, parent) {
    if (this.__) this.__.onAttached(node, name, parent)
}

Frame.prototype.detach = function(node) {
    if (!node) {
        // detaching this
        let i = this.__._ls.indexOf(this);
        if (i >= 0) {
            // find index on parent
            this.__._ls.splice(i, 1);
        }
        if (this.name && this.__._dir[this.name] === this) {
            this.__.detachByName(this.name);
        }
    } else {
        let i = this._ls.indexOf(node);
        if (i >= 0) {
            // find index on parent
            this._ls.splice(i, 1);
        }
        if (node.name && (this._dir[node.name]) === node) {
            this.detachByName(node.name);
        }
    }
}

Frame.prototype.detachAll = function() {
    while(this._ls.length){
        let node = this._ls[0];
        this.detach(node)
    }
}

Frame.prototype.detachByName = function(name) {
    const obj = this[name] || this._dir[name];
    if (obj === undefined){
        throw new Error("No node with name:" + name);
    }
    //
    //  FINISH called when element detached
    //
    if (obj.finish) obj.finish();
    if (obj.propagateDetach){
        if (obj.propagateDetach instanceof Array){
            obj.propagateDetach.forEach(o => o.__.detach(o));
        } else {
            obj.propagateDetach.__.detach(obj.propagateDetach);
        }
    }

    // detach named
    delete this[name];
    delete this._dir[name];
    // detach by index if exists
    let index = this._ls.indexOf(obj);
    if (index >= 0){
        this._ls.splice(index, 1);
    }
}

Frame.prototype.apply = function(fn, predicate) {
    let i = 0
    if (isFun(predicate)) {
		this._ls.forEach( function(e) {
			if (predicate(e)) {
                fn(e)
                i++
            }
		})
    } else if (isString(predicate)) {
        let ls = this.select(predicate)
        ls.forEach( function(e) {
            fn(e)
            i++
        })
    } else {
		this._ls.forEach( function(e) {
            fn(e)
            i++
        })
    }
    return i
}

Frame.prototype.collide = function(fn, predicate) {
    let i = 0
    if (isFun(predicate)) {
        let ls = this._ls
		ls.forEach( function(e) {
			if (predicate(e)) {
                ls.forEach( function(o) {
                    if (predicate(o)) {
                        if (e !== o) fn(e, o)
                    }
                })
            }
		})
    } else if (isString(predicate)) {
        let ls = this.select(predicate)
        ls.forEach( function(e) {
            ls.forEach( function(o) {
                if (e !== o) fn(e, o)
                i++
            })
        })
    } else {
        let ls = this._ls
		ls.forEach( function(e) {
            ls.forEach( function(o) {
                if (e !== o) fn(e, o)
                i++
            })
        })
    }
    return i
}

Frame.prototype.map = function(fn) {
}

Frame.prototype.flatMap = function(fn) {
}

Frame.prototype.reduce = function(fn) {
}

Frame.prototype.selectInstance = function(of) {
    return this.select(o => o instanceof of)
}

Frame.prototype.select = function(predicate) {

    function selectFromObject(node, path, res) {
        if (!path) return

		let i = path.indexOf('/')
		if (i > 0) {
			let nextName = path.substring(0, i)
			let nextPath = path.substring(i + 1)

            const subNode = node[nextName]
            if (subNode) {
                selectFromObject(subNode, nextPath, res)
            }

        } else {
            // got the property!
            const subNode = node[path]
            if (subNode) res.push(subNode)
        }
    }

	if (isString(predicate)) {
		// select by path
		if (predicate === '') {
			// select the dir
			return this._ls.slice()
		}

		let i = predicate.indexOf('/')
		if (i > 0) {

			let nextName = predicate.substring(0, i)
			let nextPath = predicate.substring(i + 1)
			if (nextName == '..') {
				// move up
				if (!this.__) return []
				return this.__.select(nextPath)
			}

			let res = []
			for (let k in this) {
				let o = this[k]
				if (o && nextName === '*' || k.includes(nextName)
                        || (o && o.tag && isString(o.tag) && o.tag.includes(nextName))) {

					if (isFrame(o)) {
						res = res.concat(o.select(nextPath))

					} else if (isArray(o)) {
						if (nextPath === '' || nextPath === '*') res = res.concat(o)
						// TODO maybe handle index identifiers?
					} else if (isObj(o) || isFun(o)) {
                        selectFromObject(o, nextPath, res)
                        /*
						for (let j in o) {
							if (nextPath === '*' || j.includes(nextPath)) {
								res.push(o[j])
							}
						}
                        */
					}
				}
				
			}
			return res

		} else if (i === 0) {
			return _scene.select(predicate.substring(1))
		} else {
			// found the point
			if (predicate === '..') {
				// move up
				if (!this.__) return []
				return this.__
			} else if (predicate === '*') return this._ls.slice()

			let res = []
			for (let k in this._dir) {
				let o = this._dir[k]
                // TODO make possible * matching and direct #tag specifiers
				if (k === predicate || (o.tag && isString(o.tag) && o.tag.includes(predicate))) res.push(o)
			}
			return res
		}

		/*
        // switch to the next target
       return _scene.patch(nextNode, nextPath, node)
    // found the patch point - attach the node
    if (isFrame(target)) {
        if (path === '') {
            target.attach(node)
        } else {
            if (target[path]) {
                augment(target[path], node)
            } else {
                target.attach(node, path)
            }
        }
    } else if (isArray(target)) {
        target.push(node)
    } else if (isObj(target)) {
        if (path === '') throw { src: this, msg: "can't attach anonymous node to " + target }
        if (target[path]) {
            console.log('augmenting: ' + path)
            augment(target[path], node)
        } else {
            console.log('rewriting: ' + path)
            target[path] = node
        }
    }
    */
	} else if (isFun(predicate)) {
        // TODO shouldn't we search deep?
        return this._ls.filter(predicate)
	} else return []
}

Frame.prototype.selectOne = function(predicate) {
	let list = this.select(predicate)
	if (list.length > 0) return list[0]
	return undefined
}

Frame.prototype.selectOneNumber = function(predicate) {
    let list = this.select(predicate)
    if (list.length > 0) {
        if (isNaN(list[0])){
            throw new Error("Error parsing number:" + list[0])
        }
        return parseFloat(list[0])
    }
    return 0
}

Frame.prototype.kill = function() {
    // TODO shouldn't it be killThemAll?
    // kill() probably should be only on LabFrame
    this._ls.forEach(node => {
        if (isFun(node.kill)) node.kill()
    })
}



/**
 * @alias sys.LabFrame
 * @param initObj
 * @constructor
 */
const LabFrame = function(st) {
    Frame.call(this, st)
}
LabFrame.prototype = Object.create(Frame.prototype)

LabFrame.prototype.touch = touchFun((name) => new LabFrame(name))

LabFrame.prototype.spawn = function(dna, st) {
    return this._.sys.spawn(dna, st, this)
}

LabFrame.prototype.orderZ = function() {
    this._ls.sort((a, b) => {
        if (!isNumber(a.Z) && !isNumber(b.Z)) return 0;
        if (!isNumber(a.Z) && isNumber(b.Z)) return 1;
        if (isNumber(a.Z) && !isNumber(b.Z)) return -1;
        if (a.Z > b.Z) return 1;
        if (a.Z < b.Z) return -1;
        return 0;
    })
}

LabFrame.prototype.attach = function(node, name) {
    Frame.prototype.attach.call(this, node, name)

    //this._.log.sys('spawned ' + node.name)
    // normalize and augment the node
    if (isObj(node)) {
        if (!isFun(node.draw)) node.draw = false // ghost
        if (!isFun(node.evo)) node.evo = false   // prop

        // TODO probably shouldn't be called here
        //if (isFun(node.spawn)) node.spawn() // spawn handler
        node._positional = (isNumber(node.x) && isNumber(node.y))
        node._sizable = (node._positional && isNumber(node.w) && isNumber(node.h))

        if (isNumber(node.Z)) this.orderZ()
    }

    // TODO make arbitrary augmentation and dependency injection possible
    //this._.aug._ls.forEach( function(aug) {
    //    aug(node)
    //})

    return node
}

// TODO processing of attached node and event on attachment probably should be different functions
LabFrame.prototype.onAttached = function(node, name, parent) {
    // TODO attached to me and being attached to somebody should be different events!
    if (!node) {
        // current lab frame is attached
        if (isFun(this.__.onAttached)) this.__.onAttached(this, this.name, this.__)
        return
    }
},

LabFrame.prototype.evo = function(dt) {
    let dirtyZ = false
    let Z = Number.MIN_SAFE_INTEGER

    for (let i = 0; i < this._ls.length; i++) {
        const e = this._ls[i]
        if (e.evo && !e.dead && !e.paused) {
            e.evo(dt)
        }
        if (e.Z) {
            if (e.Z < Z) dirtyZ = true
            Z = e.Z
        }
    }

    if (dirtyZ) this.orderZ()
}

LabFrame.prototype.draw = function() {
    for (let i = 0; i < this._ls.length; i++) {
        const e = this._ls[i]
        if (e.draw && !e.dead && !e.hidden) {
            e.draw()
        }
    }
}

LabFrame.prototype.pause = function() {
    this.paused = true
}

LabFrame.prototype.pauseAll = function() {
    this.paused = true
    this._ls.forEach(n => {
        if (n.pauseAll) n.pauseAll()
        else if (n.pause) n.pause()
    })
}

LabFrame.prototype.resume = function() {
    this.paused = false
}

LabFrame.prototype.resumeAll = function() {
    this.paused = false
    this._ls.forEach(n => {
        if (n.resumeAll) n.resumeAll()
        else if (n.resume) n.resume()
    })
}

LabFrame.prototype.hide = function() {
    this.hidden = true
}

LabFrame.prototype.hideAll = function() {
    this.hidden = true
    this._ls.forEach(n => {
        if (n.hideAll) n.hideAll()
        else if (n.hide) n.hide()
    })
}

LabFrame.prototype.show = function() {
    this.hidden = false
}

LabFrame.prototype.showAll = function() {
    this.hidden = false
    this._ls.forEach(n => {
        if (n.showAll) n.showAll()
        else if (n.show) n.show()
    })
}

LabFrame.prototype.lx = function(x) {
    return x
}

LabFrame.prototype.ly = function(y) {
    return y
}

LabFrame.prototype.lxy = function(x, y) {
    return {
        x: x,
        y: y,
    }
}

LabFrame.prototype.gx = function(x) {
    return x
}

LabFrame.prototype.gy = function(y) {
    return y
}

LabFrame.prototype.gxy = function(x, y) {
    return {
        x: x,
        y: y,
    }
}

LabFrame.prototype.labxy = function(x, y) {
    const g = this.gxy(x, y)
    return this.__.labxy(g.x, g.y)
}

LabFrame.prototype.labVector = function(v2) {
    return this.__.labVector(v2)
}

LabFrame.prototype.poke = function(x, y, opt) {
    let lx
    let ly
    const fn = isFun(opt)? opt : false
    if (this.lx) {
        lx = this.lx(x)
        ly = this.ly(y)
    } else {
        const l = this.lxy(x, y)
        lx = l.x
        ly = l.y
    }

    for (let i = 0; i < this._ls.length; i++) {
        const node = this._ls[i]
        if (isFun(node.poke)) {
            if (fn) {
                if (fn(node)) node.poke(lx, ly, opt)
            } else {
                node.poke(lx, ly, opt)
            }
        }
    }
}

LabFrame.prototype.pick = function(x, y, ls, opt) {
    let lx
    let ly
    if (this.lx) {
        lx = this.lx(x)
        ly = this.ly(y)
    } else {
        const l = this.lxy(x, y)
        lx = l.x
        ly = l.y
    }
    const fn = isFun(opt)? opt : false

    let last
    for (let i = 0; i < this._ls.length; i++) {
        const node = this._ls[i]
        if (isFun(node.pick)) {
            let val
            if (fn) {
                if (fn(node)) val = node.pick(lx, ly, ls, opt)
                if (val) last = val
            } else {
                val = node.pick(lx, ly, ls, opt)
                if (val) last = val
            }
        }
    }
    return last
}

const CueFrame = function(st) {
    Frame.call(this, st)
}
CueFrame.prototype = Object.create(Frame.prototype)

CueFrame.prototype.touch = touchFun((name) => new CueFrame(name))

function parseCueTime(df) {
    if (!df || df.length === 0) return 0

    let time = parseInt(df)
    if (!isNumber(time)) return 0

    df = df.replace(/([0-9])+/, '')
    if (df.startsWith('ms')) time /= 1000
    else if (df.startsWith('m')) time *= 60
    else if (df.startsWith('h')) time *= 3600
    df = df.replace(/([a-z])+/, '')

    if (df.length > 0 && df.match('[0-9]')) return time + parseCueTime(df)
    return time
}

function parseTimes(df) {
    if (!df || df.length === 0) return
    if (!df.endsWith('times')) {
        throw new Error('Wrong cue format - number of times definition expected @[' + df + ']!')
    }

    let times = parseInt(df)
    if (!isNumber(times)) {
        throw new Error('Wrong cue format - number is expected @[' + df + ']!')
    }
    return times
}

CueFrame.prototype.attach = function(node, name) {
    if (!isFun(node)) throw new Error('Cue must be a function!')
    if (!name) name = node.name
    if (!isString(name)) throw new Error('Cue must have a name!')
    Frame.prototype.attach.call(this, node, name)

    // augment node
    if (name.startsWith('at')) {
        const time = parseCueTime(name.substring(2))
        node.timer = 0
        node.evo = function(dt) {
            this.timer += dt
            if (this.timer > time) {
                this(this.timer)
                this.__.detach(this)
            }
        }
    } else if (name.startsWith('each')) {
        const dfs = name.split('_')
        const time = parseCueTime(dfs[0].substring(4))
        const count = parseTimes(dfs[1])

        node.count = count
        node.timer = 0
        node.evo = function(dt) {
            this.timer += dt
            if (this.timer > time) {
                this(this.timer)
                this.timer -= time

                if (this.count > 0) {
                    this.count--
                    if (this.count === 0) this.__.detach(this)
                }
            }
        }
    } else {
        throw new Error('Wrong cue format [' + name + ']! Must be at... or each... (e.g. at1m, each5s)')
    }

    return node
}

CueFrame.prototype.evo = function(dt) {
    this._ls.forEach( e => {
        if (e.evo && !e.dead && !e.paused) e.evo(dt)
    })
}

CueFrame.prototype.pause = function() {
    this.paused = true
}

CueFrame.prototype.resume = function() {
    this.paused = false
}



// =============================================================
//                          LOADER 
// =============================================================
function extractMeta(script) {
    const meta = {}

    let pos = 0
    let line = 0
    let bufc
    let buffered = false
    let metaCount = 0
    let commentCount = 0

    // parsing utils
    function isSpace(c) {
        return c === ' ' || c === '\t'
    }

    function isNewLine(c) {
        return c === '\r' || c === '\n'
    }

    function isWhitespace(c) {
        return isSpace(c) || isNewLine(c)
    }

    function isDigit(c) {
        const code = c.charCodeAt(0) - 48
        return code >= 0 && code < 10
    }

    function isAlpha(c) {
        const d = c.chatCodeAt(0)
        return ((d >= 65 && d <= 90)
            || (d >= 97 && d <= 122)
            || (d >= 161)
        );
    }

    function isAlphaNum(c) {
        return isDigit(c) || isAlpha(c)
    }

    function isSpecial(c) {
        switch(c) {
            case "'": case '"': case '`':
            case '/':

            case ':': case ';':
            case '.': case ',':
            case '{': case '}':
            case '[': case ']':
            case '(': case ')':
            case '=': case '!':
            case '<': case '>':
            case '-': case '+':
            case '*': case '/':
            case '|': case '&':
            case '^': case '%':
                return true

        default:
                return false
        }
    }

    function isIdentifier(c) {
        return c === '_' || c === '$' || isAlphaNum(c)
    }

    // stream
    function getc() {
        if (buffered && bufc) {
            buffered = false
            return bufc
        }
        if (pos < script.src.length) {
            bufc = script.src.charAt(pos++)
            if (bufc === '\n') line++
            return bufc
        }
        bufc = undefined
    }

    function retc() {
        if (buffered) throw 'double buffering is not supported!'
        buffered = true
    }

    function ahead() {
        const c = getc()
        retc()
        return c
    }

    // tokenizer
    const ID = 1
    const SPECIAL = 2
    const STRING = 3
    const LINE_COMMENT = 4
    const BLOCK_COMMENT = 5

    function skipWhitespaces() {
        let c = getc()
        while (c && isWhitespace(c)) c = getc()
        retc()
    }

    function matchComment(type) {
        commentCount ++
        let comment = ''

        let c = getc()
        let prevc
        let lineChars = 0

        if (type === '/' && isNewLine(c)) return {
            t: LINE_COMMENT,
            v: '',
            l: line,
        }

        while(c) {

            prevc = c
            c = getc()

            if (type === '*') {
                if (prevc === '*' && c === '/') {
                    return {
                        t: BLOCK_COMMENT,
                        v: comment,
                        l: line,
                    }
                }

                if (isNewLine(prevc)) {
                    lineChars = 0
                } else if (lineChars === 0 && isWhitespace(prevc)) {
                    // don't count in whitespaces in the beginning of a line
                } else if (lineChars === 0 && prevc === '*') {
                    // skip
                    prevc = ''

                } else {
                    lineChars ++
                }

            } else {
                if (isNewLine(c)) {
                    return {
                        t: LINE_COMMENT,
                        v: (comment + prevc).trim(),
                        l: line,
                    }
                }
            }
            comment += prevc
        }
    }

    function matchString(type) {
        let c = getc()
        let prevc

        let str = ''
        let open = c !== type

        while(c && open) {
            str += c

            prevc = c
            c = getc()

            if (c === type) {
                if (prevc !== '\\') {
                    retc()
                    open = false
                }
            }
        }
        return { t: STRING, v: str }
    }

    function getToken() {
        skipWhitespaces()

        let c = getc()
        if (!c) return // no more tokens

        if (isSpecial(c)) {
            if (c === "'" || c === '"' || c === '`') {
                return matchString(c)
            } else if (c === '/') {
                c = getc()
                if (c === '/') return matchComment('/')
                else if (c === '*') return matchComment('*')
                else retc()
            }
            return { t: SPECIAL, v: c }

        } else {

            let token = ''
            while(c && !isWhitespace(c) && !isSpecial(c)) {
                token += c
                c = getc()
            }
            retc()
            return { t: ID, v: token }
        }
    }

    const tokenBuffer = {
        buffered: false,
    }

    function nextToken() {
        if (tokenBuffer.buffered) {
            tokenBuffer.buffered = false
            return tokenBuffer.token
        } else {
            tokenBuffer.token = getToken()
            return tokenBuffer.token
        }
    }

    function lookupToken() {
        const token = nextToken()
        tokenBuffer.buffered = true
        return token
    }

    function defMeta(type, name, comment, params) {
        if (name === 'exports') name = script.name

        if (comment && comment.l + 2 > line) {
            let head = comment.v.trim()
            let details

            const inextLine = head.indexOf('\n')
            if (inextLine > 0) {
                details = head.substring(inextLine).trim()
                head = head.substring(0, inextLine)
            }

            meta[name] = {
                head: head,
                details: details,
            }
            metaCount ++

        } 
        // define usage for functions
        if (type === 'function' && isString(params)) {
            if (!meta[name]) meta[name] = {}
            meta[name].usage = `(${params})`
        }
    }

    function parseFunctionParams(expectName) {
        let params = ''
        let token = nextToken()

        if (expectName && token.t === ID) token = nextToken()
        if (token.t !== SPECIAL || token.v !== '(') return

        while(token) {
            token = nextToken()
            if (token.t === SPECIAL && token.v === ')') {
                return params
            } else {
                if (params && token.t !== SPECIAL) {
                    params += ' ' + token.v
                } else {
                    params += token.v
                }
            }
        }
        return params
    }

    function parse() {
        let token = nextToken()
        let lastToken
        let lastName
        let lastComment

        while(token) {

            if (token.t === BLOCK_COMMENT) {
                lastComment = token
                if (commentCount === 1) defMeta('module', script.name, token)

            } else if (token.t === LINE_COMMENT) {
                if (lastComment && lastComment.l + 1 >= token.l) {
                    // join with previous comment
                    token.v = lastComment.v + '\n' + token.v
                    commentCount --
                }
                lastComment = token
                if (commentCount === 1) {
                    const next = lookupToken()
                    if (next.t !== LINE_COMMENT) {
                        defMeta('module', script.name, token)
                    }
                }
            }

            lastToken = token
            token = nextToken()

            if (token && lastToken) {
                if (lastToken.t === ID
                        && token.t === SPECIAL
                        && (token.v === ':' || token.v === '=')) {
                    lastName = lastToken.v

                } else if (token.t === ID
                        && token.v === 'function'
                        && lastName) {
                    // <name>: function
                    const params = parseFunctionParams(true)
                    defMeta('function', lastName, lastComment, params)
                    lastName = undefined

                } else if (token.t === SPECIAL
                        && token.v === '{'
                        && lastName) {
                    // <name>: {...}
                    defMeta('object', lastName, lastComment)
                    lastName = undefined

                } else if (token.t === SPECIAL
                        && token.v === '['
                        && lastName) {
                    // <name>: [...]
                    defMeta('array', lastName, lastComment)
                    lastName = undefined

                } else if (token.t === ID
                        && lastName) {
                    // <name>: <value>
                    defMeta('value', lastName, lastComment)
                    lastName = undefined

                } else if (lastToken.t === ID
                        && lastToken.v === 'function'
                        && token.t === ID) {
                    // function <name>
                    const params = parseFunctionParams(false)
                    defMeta('function', token.v, lastComment, params)

                } else if (lastToken.t === ID
                        && lastToken.v === 'const'
                        && token.t === ID) {
                    // const <name>
                    defMeta('const', token.v, lastComment)

                } else if (lastToken.t === ID
                        && lastToken.v === 'class'
                        && token.t === ID) {
                    // const <name>
                    defMeta('class', token.v, lastComment)
                    
                } else {
                    lastName = undefined
                }
            }
        }
    }

    parse()
    if (metaCount > 0) return meta
}

function parseClasses(src, res) {
    const rx = /(class\s*(\w[\w\d]*))/g

    let match = rx.exec(src)
    while(match) {
        res.push(match[2])
        match = rx.exec(src)
    }
}

function parseFunctions(src, res) {
    const rx = /(function\s*(\w[\w\d]*)\s*\()/g
    //const res = src.replace(rx, "module.def.$2 = $1")

    let match = rx.exec(src)
    while(match) {
        res.push(match[2])
        match = rx.exec(src)
    }
}

function parseConstants(src, res) {
    const rx = /(const\s*(\w[\w\d]*)\s*\=)/g

    let match = rx.exec(src)
    while(match) {
        res.push(match[2])
        match = rx.exec(src)
    }
}

function generateSource(script, __) {

    let def = ''
    Object.keys(__.alt._dir).forEach(f => {
        def += `let ${f} = __.alt._dir.${f};`
    })
    // declare scope
    /*
    Object.keys(__._scope).forEach(f => {
        def += `let ${f} = __._scope.${f};`
    })

    // declare drawing context
    Object.keys(__.ctx.draw).forEach(f => {
        def += `let ${f} = ctx.draw.${f};`
    })
    */

    // provide lexical scope for mod context and scope object for this. definitions
    return '(function(_, ctx, _$, module, require, sys, lib, res, dna, env, lab, mod, pub, log, cue, job, trap) {'
        + def 
        + script.src
        + script.def
    + '}).call(scope, __, __.ctx, __._$, module, require, __.sys, __.lib, __.res, __.dna, __.env, __.lab, __.mod, __.pub, __.log, __.cue, __.job, __.trap)'
    + '\n//# sourceURL=' + script.origin
}

function injectMeta(val, meta, name) {
    if (!val) return
    if (!meta) return val

    if (isFun(val) && meta[val.name]) {
        // metadata on the function itself
        val._meta = meta[val.name]

        const submetas = Object.keys(meta)
        if (submetas.length > 1) {
            // looks like we have other definitions - could be a constructor
            val._meta.dir = {}
            for (const subName of submetas) {
                if (subName !== name) { 
                    val._meta.dir[subName] = meta[subName]
                }
            }
        }

    } else if (meta[name]) {
        val._meta = meta[name]
    }

    Object.keys(meta).forEach(k => {
        const subVal = val[k]
        if (subVal && (isObj(subVal) || isFun(subVal))) {
            subVal._meta = meta[k]
        }
    })

    return val
}

function evalJS(script, _) {
    const scope = {}
    const module = {}

    // determine the scope 
    let __ = _ // default scope is loader mod
    const parentPath = getParentPath(script.path)
    // TODO should be loader mod?
    let parent = __.touch(parentPath)
    if (parent && parent._) {
        // found context from the parent node
        // TODO should search up the path until we got suitable context
        __ = parent._
    }

    function require(path) {
        __.log.sys('getting: ' + path, 'require')
        const rq = __.select(path)
        if (rq && rq.length > 0) {
            __.log.dump(rq)
            if (rq.length === 1) return rq[0]
            else return rq
        } else {
            throw 'no requirement found: [' + path + ']'
        }
    }

    script.def = ''

    let meta
    if (_scene.env.config.debug) {
        meta = extractMeta(script)
    }
    const code = generateSource(script, __)

    /*
    // TODO is there a better way to handle evaluation errors?
    try{
        val = eval(code)
    } catch (e) {
        console.error(`Error executing file: ${script.origin}`)
        console.log(code)
        throw (e)
    }
    */

    // TODO parse the source for require('')
    //      and try to resolve those before the execution
    //      if not resolved - postpone the evaluation until later in the batch
    const val = eval(code)

    if (val !== undefined) {
        return injectMeta(val, meta, script.name)

    } else if (module.exports !== undefined) {
        return injectMeta(module.exports, meta, script.name)

    } else {
        const defs = []
        parseClasses(script.src, defs)
        parseFunctions(script.src, defs)
        parseConstants(script.src, defs)

        if (defs.length > 0) {
            _.log.sys('[eval]', 'no value - reevaluating to extract definitions: ' + script.path)

            // definitions storage code
            script.def = '\n' + defs.map(d => `if (typeof ${d} !== 'undefined') module.def.${d} = ${d}`).join(';')
            const code = generateSource(script, __)

            // execute once again with definition extraction code
            const module = {
                def: {},
            }
            const scope = module.def
            eval(code)

            if (module.def) {
                if (isFun(module.def[script.name]) || isObj(module.def[script.name])) {
                    _.log.sys('found defining node for export ' + script.name + '()')
                    return module.def[script.name]
                }
                return injectMeta(module.def, meta, script.name)
            } else {
                _.log.sys('no value, exports or declarations from ' + script.path, '[eval]')
                return null
            }

        } else {
            _.log.sys('no value, exports or declarations from ' + script.path, '[eval]')
            return null
        }
    }
}

function parseLines(txt) {
    let lines = txt.match(/[^\r\n]+/g)
    lines = lines.map(l => {
        let ci = l.indexOf('--')
        if (ci >= 0) {
            return l.substring(0, ci-1).trim()
        } else {
            return l.trim()
        }
    })
    return lines.filter(l => l.length > 0)
}

function parseCSV(script, _) {
    const src = script.src
    const lines = src.match(/[^\r\n]+/g)
    // naming array
    const names = lines[0].split(',').map(e => e.trim())
    // parse objects
    const objects = []
    for (let i = 1; i < lines.length; i++) {
        const l = lines[i].trim()
        if (l.length > 0 && !l.startsWith('--') && !l.startsWith('#')) {
            // TODO more intellectual parsing, so escaped string can be included (e.g. 'one,two')
            const ol = l.split(',').map(e => e.trim()).map(e => {
                return matchType(e)
            })
            const obj = {}
            ol.forEach((e, j) => {
                if (j < names.length) {
                    obj[names[j]] = e
                } else {
                    _.log.warn('eval-csv-' + script.batch, '=> '
                        + script.path + '@' + (i+1)
                        + ': excesive value [' + e + ']')
                }
            })
            objects.push(obj)
        }
    }
    return objects
}

function parseProp(src) {
    const lines = src.match(/[^\r\n]+/g)
    // parse definitions
    const prop = {}
    for (let i = 0; i < lines.length; i++) {
        const l = lines[i].trim()
        if (l.length > 0 && !l.startsWith('--')) {
            const pair = l.split(':')
            if (pair.length === 2) {
                prop[matchType(pair[0])] = matchType(pair[1])
            }
        }
    }
    return prop
}

function evalLoadedContent(script, _) {
    //try {
    switch(script.ext) {
        case 'js':
            const val = evalJS(script, _)

            if (script.classifier) {
                // try to find a post-processor for this classifier
                if (script.classifier === 'spawn') {
                    const dna = val._dna
                    if (!dna) throw 'no _dna set for ' + script.path

                    const node = _.sys.construct(dna, val) 
                    _.patch(script.base, script.path, node)

                } else if (_.lib.ext && _.lib.ext.js && isFun(_.lib.ext.js[script.classifier])) {
                    _.log.sys("using a custom post-processor for *." + script.classifier)
                    const processedJS = _.lib.ext.js[script.classifier](val,
                                            script.name, script.path, script.base)
                    _.patch(script.base, script.path, processedJS)

                } else {
                    _.log.sys("can't find a custom post-processor for ." + script.classifier)
                    _.patch(script.base, script.path, val)
                }

            } else {
                _.patch(script.base, script.path, val)
            }
            // TODO apply definitions?
            //let declarationsFound = _.scan(scope)
            break

        case 'json':
            const jsonVal = JSON.parse(script.src);

            if (script.classifier) {
                // try to find a post-processor for this classifier
                if (_.lib.ext && _.lib.ext.json && isFun(_.lib.ext.json[script.classifier])) {
                    _.log.sys("using a custom post-processor for *." + script.classifier)
                    const processedJson = _.lib.ext.json[script.classifier](jsonVal,
                                            script.name, script.path, script.base)
                    _.patch(script.base, script.path, processedJson)
                } else {
                    _.log.sys("can't find a custom post-processor for ." + script.classifier)
                    _.patch(script.base, script.path, jsonVal)
                }
            } else {
                _.patch(script.base, script.path, jsonVal)
            }
            break

        case 'txt': _.patch(script.base, script.path, script.src); break;
        case 'lines': _.patch(script.base, script.path, parseLines(script.src)); break;
        case 'csv': _.patch(script.base, script.path, parseCSV(script, _)); break;
        case 'prop': _.patch(script.base, script.path, parseProp(script.src)); break;
        case 'fun': script.fun(); break;
        default: {
            // check out a custom parser for ext
            if (isFrame(_.lib) && isFrame(_.lib.ext) && isFun(_.lib.ext[script.ext])) {
                _.log.sys('using custom parser for *.' + script.ext)
                const parsedVal = _.lib.ext[script.ext](script.src,
                                    script.name, script.path, script.base)
                _.patch(script.base, script.path, parsedVal)
                break

            } else {
                _.patch(script.base, script.path, script.src)
                break
            }
        }
    }
    _._patchLog.push(script)
    //} catch (e) {
    //    _scene.log.err('[loader]', 'error in [' + script.path + ']' + e)
    //    throw e
    //}
}

const checkScriptDependencies = function(script, batch) {
    if (script.ext !== 'js') return []

    let depends = []

    let extendRegExp = new RegExp('@depends\\((.*?)\\)', 'g')

    let match
    while(match = extendRegExp.exec(script.src)) {
        let k = match[1]
        let dependency
        batch.forEach(s => {
            if (s.path === k) dependency = s
        })
        if (dependency) depends.push(dependency)
        else {
            _scene.log.sys('current batch:')
            _scene.log.dump(batch)
            throw '[' + script.origin + ']: dependency [' + k + '] is not found'
        }
    }
    return depends
}

const sortLoadedBatch = function(batch) {
    //this._execList[batch].sort((a, b) => a.path.localeCompare(b.path))
    let res = []

    var workBatch = batch.slice()
    let check = function(script) {
        checkScriptDependencies(script, batch).forEach(e => check(e))
        let i = workBatch.indexOf(script)
        if (i >= 0) {
            workBatch.splice(i, 1)
            res.push(script)
        }
    }

    while(workBatch.length > 0) {
        check(workBatch[0])
    }

    return res
}

const evalLoadedBatch = function(ibatch, batch, _) {

    let sortedBatch = sortLoadedBatch(batch)

    sortedBatch.forEach( script => {
        _.log.sys('eval-'+ibatch, '=> ' + script.path)
        evalLoadedContent(script, _)
    })
}

function augmentCtx(ctx) {

    const TAU = Math.PI * 2
    let mode = 0
    let shape = false
    let fontSize
    let fontName

    ctx.draw = {

        rx:function(x) {
            return ctx.width * x
        },
        ry: function(y) {
            return ctx.height * y
        },

        save: function() {
            ctx.save()
        },
        restore: function() {
            ctx.restore()
        },

        scale: function(w, h) {
            ctx.scale(w, h)
        },
        rotate: function(a) {
            ctx.rotate(a)
        },
        translate: function(x, y) {
            ctx.translate(x, y)
        },
        clip: function(x, y, w, h) {
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(x + w, y)
            ctx.lineTo(x + w, y + h)
            ctx.lineTo(x, y + h)
            ctx.closePath()
            ctx.clip()
        },
        smooth: function() {
            ctx.imageSmoothingEnabled = true
        },
        blocky: function() {
            ctx.imageSmoothingEnabled = false
        },
        alpha: function(v) {
            ctx.globalAlpha = v
        },

        stroke: function(v1, v2, v3, v4) {
            mode = 0
            if (arguments.length === 1) {
                ctx.strokeStyle = v1

            } else if (arguments.length === 3) {
                if (Number.isInteger(v1+v2+v3)) {
                    ctx.strokeStyle = RGB(v1, v2, v3)
                } else {
                    ctx.strokeStyle = hsl(v1, v2, v3)
                }

            } else if (arguments.length === 4) {
                if (Number.isInteger(v1+v2+v3+v4)) {
                    ctx.strokeStyle = RGBA(v1, v2, v3, v4)
                } else {
                    ctx.strokeStyle = hsla(v1, v2, v3, v4)
                }
            }
        },

        lineWidth: function(val) {
            ctx.lineWidth = val 
        },

        fill: function(v1, v2, v3, v4, v5, v6, v7, v8) {

            if (arguments.length === 1) {
                mode = 2
                ctx.fillStyle = v1

            } else if (arguments.length === 2) {
                mode = 1
                ctx.fillStyle = v1
                ctx.strokeStyle = v1

            } else if (arguments.length === 3) {
                mode = 2
                if (Number.isInteger(v1+v2+v3)) {
                    ctx.fillStyle = RGB(v1, v2, v3)
                } else {
                    ctx.fillStyle = hsl(v1, v2, v3)
                }

            } else if (arguments.length === 4) {
                mode = 2
                if (Number.isInteger(v1+v2+v3+v4)) {
                    ctx.fillStyle = RGBA(v1, v2, v3, v4)
                } else {
                    ctx.fillStyle = hsla(v1, v2, v3, v4)
                }

            } else if (arguments.length === 6) {
                mode = 1
                if (Number.isInteger(v1+v2+v3)) {
                    ctx.fillStyle = RGB(v1, v2, v3)
                } else {
                    ctx.fillStyle = hsl(v1, v2, v3)
                }
                if (Number.isInteger(v4+v5+v6)) {
                    ctx.strokeStyle = RGB(v4, v5, v6)
                } else {
                    ctx.strokeStyle = hsl(v4, v5, v6)
                }

            } else if (arguments.length === 8) {
                mode = 1
                if (Number.isInteger(v1+v2+v3+v4)) {
                    ctx.fillStyle = RGBA(v1, v2, v3, v4)
                } else {
                    ctx.fillStyle = hsla(v1, v2, v3, v4)
                }
                if (Number.isInteger(v5+v6+v7+v8)) {
                    ctx.strokeStyle = RGBA(v5, v6, v7, v8)
                } else {
                    ctx.strokeStyle = hsla(v5, v6, v7, v8)
                }

            } else {
                throw 'wrong color arguments for fill()'
            }
        },

        background: function(v1, v2, v3, v4) {
            if (arguments.length === 1) {

                if (isString(v1)) {
                    ctx.fillStyle = v1
                    ctx.fillRect(0, 0, ctx.width, ctx.height)
                } else {
                    ctx.drawImage(v1, 0, 0, ctx.width, ctx.height)
                }

            } else if (arguments.length === 3) {
                if (Number.isInteger(v1+v2+v3)) {
                    ctx.fillStyle = RGB(v1, v2, v3)
                } else {
                    ctx.fillStyle = hsl(v1, v2, v3)
                }
                ctx.fillRect(0, 0, ctx.width, ctx.height)

            } else if (arguments.length === 4) {
                if (Number.isInteger(v1+v2+v3+v4)) {
                    ctx.fillStyle = RGBA(v1, v2, v3, v4)
                } else {
                    ctx.fillStyle = hsla(v1, v2, v3, v4)
                }
                ctx.fillRect(0, 0, ctx.width, ctx.height)
            }
        },

        line: function(x1, y1, x2, y2) {
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
        },

        plot: function(x, y) {
            ctx.fillRect(x, y, ctx.lineWidth, ctx.lineWidth)
        },
        triangle: function(x1, y1, x2, y2, x3, y3) {
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.lineTo(x3, y3)
            ctx.closePath()
            if (mode < 2) ctx.stroke()
            if (mode > 0) ctx.fill()
        },
        quad: function(x1, y1, x2, y2, x3, y3, x4, y4) {
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.lineTo(x3, y3)
            ctx.lineTo(x4, y4)
            ctx.closePath()
            if (mode < 2) ctx.stroke()
            if (mode > 0) ctx.fill()
        },
        rect: function(x, y, w, h) {
            if (mode > 0) ctx.fillRect(x, y, w, h)
            if (mode < 2) ctx.strokeRect(x, y, w, h)
        },
        circle: function(x, y, r) {
            ctx.beginPath()
            ctx.arc(x, y, r, 0, TAU)
            if (mode < 2) ctx.stroke()
            if (mode > 0) ctx.fill()
        },
        ellipse: function(x, y, hr, vr, r) {
            ctx.beginPath()
            if (r) {
                ctx.ellipse(x, y, hr, vr, r, 0, TAU * 2)
            } else {
                ctx.ellipse(x, y, hr, vr, 0, 0, TAU)
            }
            if (mode < 2) ctx.stroke()
            if (mode > 0) ctx.fill()
        },
        arc: function(x, y, r, sa, fa) {
            ctx.beginPath()
            ctx.arc(x, y, r, sa, fa)
            if (mode < 2) ctx.stroke()
            if (mode > 0) ctx.fill()
        },
        earc: function(x, y, xr, yr, ra, sa, fa) {
            ctx.beginPath()
            ctx.ellipse(x, y, xr, yr, ra, sa, fa)
            if (mode < 2) ctx.stroke()
            if (mode > 0) ctx.fill()
        },
        polygon: function() {
            ctx.beginPath()
            ctx.moveTo(arguments[0], arguments[1])
            for (let i = 2; i < arguments.length; i++) {
                ctx.lineTo(arguments[i++], arguments[i])
            }
            ctx.closePath()
            if (mode < 2) ctx.stroke()
            if (mode > 0) ctx.fill()
        }, 

        moveTo: function(x, y) {
            if (!shape) {
                ctx.beginPath()
                shape = true
            }
            ctx.moveTo(x, y)
        },
        lineTo: function(x, y) {
            ctx.lineTo(x, y)
        },
        arcTo: function(x1, y1, x2, y2, r) {
            ctx.arcTo(x1, y1, x2, y2, r)
        },
        quadraticTo: function(cpx, cpy, ex, ey) {
            ctx.quadraticCurveTo(cpx, cpy, ex, ey)
        },
        bezierTo: function(cp1x, cp1y, cp2x, cp2y, ex, ey) {
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey)
        },
        close: function() {
            ctx.closePath()
        },
        shape: function() {
            if (mode < 2) ctx.stroke()
            if (mode > 0) ctx.fill()
        },

        font: function(font) {
            if (!font) return

            let size
            let name

            if (isString(font)) {
                const i = font.indexOf('px ')
                if (i > 0) {
                    // full size+name font qualifier
                    fontSize = parseInt(font)
                    fontName = font.substring(i + 3)
                    ctx.font = font
                    return

                } else {
                    let size = parseInt(font)
                    if (isNaN(size)) {
                        // name only
                        fontName = font
                    } else {
                        // size only
                        fontSize = size
                    }
                }

            } else if (isNumber(font)) {
                fontSize = parseInt(font)
            }

            if (!fontName) {
                const i = ctx.font.indexOf('px ')
                fontName = ctx.font.substring(i + 3)
            }
            if (!fontSize) {
                fontSize = parseInt(ctx.font)
            }
            ctx.font = fontSize + 'px ' + fontName
        },

        alignLeft: function() {
            ctx.textAlign = 'left'
        },
        alignCenter: function() {
            ctx.textAlign = 'center'
        },
        alignRight: function() {
            ctx.textAlign = 'right'
        },
        baseTop: function() {
            ctx.textBaseline = 'top'
        },
        baseMiddle: function() {
            ctx.textBaseline = 'middle'
        },
        baseBottom: function() {
            ctx.textBaseline = 'bottom'
        },
        text: function(text, x, y) {
            if (mode < 2) ctx.strokeText(text, x, y)
            if (mode > 0) ctx.fillText(text, x, y)
        },
        textWidth: function(txt) {
            if (!txt) return 0
            else return ctx.measureText(txt).width
        },
        textHeight: function() {
            return parseInt(ctx.font)
        },
        image: function(img, x, y, w, h, dx, dy, dw, dh) {
            switch(arguments.length) {
            case 3: ctx.drawImage(img, x, y); break;
            case 5: ctx.drawImage(img, x, y, w, h); break;
            case 7: ctx.drawImage(img, x, y, w, h, dx, dy); break;
            case 9: ctx.drawImage(img, x, y, w, h, dx, dy, dw, dh); break;
            }
        },

        rgb: rgb,
        rgba: rgba,
        RGB: RGB,
        RGBA: RGBA,
        hsl: hsl,
        hsla: hsla,

    }
    return ctx
}

// Mod context container
const Mod = function(dat) {
    const _ = this
    this._patchLog = []
    this._testLog = []
    this._scope = {
        key: _key,
        pad: _pad,
        mouse: _mouse,
        mix: mix,
        augment: augment,
        supplement: supplement,
        before: before,
        after: after,
        chain: chain,
        isFun: isFun,
        isObj: isObj,
        isString: isString,
        isNumber: isNumber,
        isFrame: isFrame,
        isArray: isArray,
        isEmpty: isEmpty,

        // math
        E: Math.E,
        PI: Math.PI,
        PI2: Math.PI * 2,
        TAU: Math.PI * 2,
        HALF_PI: Math.PI / 2,

        abs: Math.abs,
        pow: Math.pow,
        sqrt: Math.sqrt,
        min: Math.min,
        max: Math.max,
        ceil: Math.ceil,
        floor: Math.floor,
        round: Math.round,
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        acos: Math.acos,
        asin: Math.asin,
        atan: Math.atan,
        atan2: Math.atan2,

        // TODO should we change to determenistic one and introduce seed?
        // TODO maybe have rndi as a separate one
        rnd: function(v1, v2) {
            if (v2) {
                return v1 + Math.random() * (v2 - v1)
            } else if (v1) {
                return Math.random() * v1
            } else {
                return Math.random()
            }
        },

        RND: function(v1, v2) {
            if (v2) {
                return Math.floor(v1 + Math.random() * (v2 - v1 + 1))
            } else if (v1) {
                return Math.floor(Math.random() * (v1 + 1))
            }
            return 0
        },

        limit: limit,

        within: function(val, min, max) {
            return (val >= min && val <= max)
        },

        warp: function(val, min, max) {
            const range = max - min
            if (range <= 0) return 0;
            if (val < min) return max - Math.abs(min-val) % range
            return min + (val - min) % range
        },

        lerp: function(start, stop, v, limitRange) {
            const res = (stop - start) * v
            if (limit) {
                if (res < start) return start
                if (res > stop) return stop
            }
            return res
        },

        vmap: function(origStart, origStop, targetStart, targetStop, orig, limit) {
            let v = (orig - origStart) / (origStop - origStart)
            if (limit) {
                if (v < 0) v = 0
                if (v > 1) v = 1
            }
            return (targetStop - targetStart) * v
        },

        len: function(x, y) {
            return Math.sqrt(x*x + y*y)
        },

        dist: function(x1, y1, x2, y2) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            return Math.sqrt(dx*dx + dy*dy)
        },

        angle: function(x, y) {
            return Math.atan2(y, x)
        },

        // angle from source to target vectors
        bearing: function(sx, sy, tx, ty) {
            return Math.atan2(tx - sx, ty - sy)
        },

        kill: kill,

        sfx: function(src, vol, pan) {
            if (!pan) pan = 0
            if (!vol) vol = 1
            if (isNumber(_.env.sfxVolume)) {
                vol *= _.env.sfxVolume
            }

            if (isString(src)) {
                // find by path in resources
                src = _.res.selectOne(src)
            }

            if (src && (src instanceof Audio
                        || src instanceof HTMLAudioElement)
                    && src.readyState >= 2) {
                src.volume = vol
                src.play()
            }
        },
    }
    this.ctx = false
    this.paused = false
    this.hidden = false

    Frame.call(this, dat)

    // resources container
    this.attach(new Frame({
        name: 'res',
        _included: 0,
        _loaded: 0,
        _errors: 0,
        _execList: [],

        _schedule: function(batch, script) {
            if (!this._execList[batch]) {
                this._execList[batch] = []
            }
            this._execList[batch].push(script)
        },

        _exec: function() {
            for (let batch = 1; batch < this._execList.length; batch++) {
                if (!this._execList[batch]) continue
                this._.log.sys('eval-'+batch, '===== evaluating batch #'
                    + batch + ' for ' + this._.name + ' =====')

                // sort batch alphanumerically before the evaluation
                this._execList[batch].sort((a, b) => a.path.localeCompare(b.path))

                evalLoadedBatch(batch, this._execList[batch], this._)

                // clean up batch
                this._execList[batch] = []
            }
        },

        _startTrigger: function() {
            if (this._.env._started) return // it looks like we already started

            if (this._included <= this._loaded) {
                // OK - everything is loaded, call setup functions
                // TODO how to deal with mods with no res? how start would be triggered?
                this._.log.sys('[loader]', 'Total ' + this._loaded + ' resources are loaded in ' + this._.name)
                this._errors = 1
                this._exec()
                this._errors = 0

                this._.start()
            }
        },

        _onLoaded: function() {
            this._loaded ++
            this._startTrigger()
        },

        onAttached: function(node, name, parent) {
            if (!node) {
            }
            // on attaching a resource
            // TODO move autoloading by name to another autoloading node
            //      definitelly don't need to autoload here in /res
            //      since this is already autoloaded
            //      avoid double autoloading
            /*
            if (isString(node)) {
                console.log('attaching -> ' + name)
                console.dir(node)
                if (name) {
                    // the name for the node is specified, so put under that one
                    let rs = this._.load(node)
                    parent.attach(rs, name)
                } else {
                    // no name for the node, load to filename
                    this._.load(node, parent)
                }
            
            } else if (isArray(node)) {
                // load resource group
                let _ = this._
                let rgroup = []
                // load
                node.forEach( function(e) {
                    rgroup.push(_.load(e))
                })
                // push
                node.splice(0)
                rgroup.forEach( function(e) {
                    node.push(e)
                })
            } else {
                // just ignore - that probably already loaded resource node
            }
            */
        }
    }))
    // system functions
    //this.attach(new Frame("sys"))
    // library functions
    //this.attach(new Frame("lib"))
    // log functions
    //this.attach(new Frame("log"))

    this.attach(new Frame(), 'alt')

    // prototypes/constructors
    this.attach(new Frame(), 'dna')

    this.attach(new LabFrame(), 'lib')

    // augment functions
    // TODO remove in favor of .aug
    //this.attach(new Frame(), 'aug')
    //
    // static environment data entities
    this.attach(new Frame({
        name: "env",
        _started: false,
    }))

    // container for acting entities - actors, ghosts, props
    this.attach(new LabFrame({
        labxy: function(x, y) {
            return this.gxy(x, y)
        },
        labVector: function(v2) {
            return v2
        },
    }), 'lab')

    this.attach(new CueFrame(), 'cue')

    this.attach(new Frame(), 'job')

    // container for mods
    // TODO what to do with this autoloading?
    //      doesn't make any sense to me
    var mod = function mod(path, name) {
        if (!name) {
            let i = path.lastIndexOf('/')
            if (i >= 0) name = path.substring(i+1)
            else name = path
        }
        let nmod = this.mod.touch(name)
        // TODO we've removed fix() function for now
        //      use load instead?
        //nmod.fix(nmod, path, 'fix')
    }
    augment(mod, new Frame())

    mod.touch = touchFun((name) => {
        let mod
        if (name.endsWith('-buf')) {
            // find different convention for buffered?
            _scene.log.sys(`creating custom canvas for ${name}`)
            const canvas = document.createElement('canvas')
            const ctx = augmentCtx(canvas.getContext('2d'))

            mod = new Mod({
                name: name,
                ctx: ctx,
            })
        } else {
            mod = new Mod(name)
        }
        mod._$ = _scene
        return mod
    })
    this.attach(mod)

    // container for traps
    var trap = function trap(key, data, chain) {
        return trap.echo(key, data, chain)
    }

    trap.echo = function(key, data, chain) {
        if (this.mask && !this.mask[key]) return true
        if (this.ignore && this.ignore[key]) return true

        if (!this.__.disabled) {
            var fn = trap[key]
            if (isFun(fn)) {
                if (fn(data) === false) return false
            }
        }

        if (chain) {
            // propagate event
            this.__.mod._ls.forEach( m => {
                m.trap(key, data, chain)
            })
        }
        return true
    }

    trap.on = function(key, fn) {
        if (!key) throw 'key is expected on trap'
        if (!isFun(fn)) throw 'function is expected on trap'

        this[key] = chain(this[key], fn)
    }
    augment(trap, new Frame())

    this.attach(trap)
}

Mod.prototype = Object.create(Frame.prototype)

Mod.prototype.getMod = function() {
    return this
}

Mod.prototype.touch = touchFun((name, dir) => {
    const node = new Frame(name)
    if (name === 'box') {
        // mod/box should create mods on touch
        node.touch = dir.mod.touch
    }
    return node
})

Mod.prototype.populateAlt = function() {
    const _ = this
    Object.keys(this._scope).forEach(name => {
        const fn = _._scope[name]
        _.alt.attach(fn, name)
    })

    Object.keys(this.ctx.draw).forEach(name => {
        const fn = _.ctx.draw[name]
        _.alt.attach(fn, name)
    })
}

Mod.prototype.init = function() {
    this.___ = this._ // save node context as parent mod
    this._ = this // must be in init, since it is assigned during the regular node.attach()
    Object.defineProperty(this, '___', { enumerable: false })
    Object.defineProperty(this, '_', { enumerable: false })

    if (!this.ctx) {
        this.ctx = this.___.ctx // clone draw context from parent mod if not set explicitly
    }
    this.populateAlt()

    this.inherit()
}

function doBox(mod, boxName, start) {
    const box = mod.selectOne(boxName)
    if (box) {
        mod.mod.link(box)
        if (start) box.start()
        return true
    } else {
        _scene.log.sys(
            `unable to find box [${boxName}] in [${mod.name}]`)
    }
}

function doTest(mod, testName) {
    const test = mod.selectOne(testName)
    if (isFun(test)) {
        _scene.log.sys(`running test [${testName}] in [${mod.name}]`)
        return test()

    } else {
        _scene.log.sys(
            `unable to find test [${testName}] in [${mod.name}]`)
    }
}

Mod.prototype._runTests = function() {
    if (!isFrame(this.test)) return
    if (this.test._ls.length === 0) return

    if (isString(_scene.env.config.test)) {
        this.status = 'testing'
        const testName = _scene.env.config.test
        const test = this.test.selectOne(_scene.env.config.test)
        if (isFun(test)) {
            _scene.log.sys('running test [' + _scene.env.config.test + '] in ' + this.name)
            return test()
        } else {
            _scene.log.sys(`no test [${testName}] in ${this.name}`)
        }
        return false

    } else {
        _scene.log.sys('running tests in: ' + this.name)
        this.status = 'testing'
        
        let passed = 0
        let failed = 0
        Object.keys(this.test._dir).forEach(name => {
            const test = this.test[name]

            if (isFun(test)) {
                //_scene.log.sys('test [' + name + ']')
                try {
                    const mod = constructScene()
                    mod.ctx = _scene.ctx
                    mod.populateAlt()
                    repatchScene(mod, _scene)

                    const res = mod.test[name]()

                    passed ++
                    this._testLog.push({
                        name: name,
                        status: 'ok',
                        result: res,
                    })
                    this.log.sys('[' + name + '] Passed')

                } catch (err) {

                    failed ++
                    this._testLog.push({
                        name: name,
                        status: 'failed',
                        result: err,
                    })
                    this.log.err(err)
                    this.log.err('[' + name + '] Failed!')
                }

            }
            this.log.sys('=== Test of ' + this.name + ' ===')
            this.log.sys('Passed: ' + passed)
            this.log.sys('Failed: ' + failed)
        })
        return false
    }
}

Mod.prototype.start = function() {
    if (this.env._started) return

    this.trap('preSetup')
    this.env._started = true
    //this.inherit()

    let captured = false
    if (_scene.env.config.test) captured = this._runTests()

    if (this === _scene && _scene.env.config.box) {
        captured = doBox(_scene, 'box/' + _scene.env.config.box, false)
        if (captured) {
            this.status = 'started'
            if (isFrame(this.mod)) this.mod._ls.forEach( mod => mod.start() )
            _scene.log.sys('starting evolution of ['
                + this.path() + '/box/' + _scene.env.config.box + ']')
            return
        }
    }

    if (isFrame(this.mod)) this.mod._ls.forEach( mod => mod.start() )

    if (!captured) {
        // no test or box has captured the control
        const mod = this
        Object.keys(this).forEach(k => {
            if (k.startsWith('setup')) {
                const fn = mod[k]
                if (isFun(fn)) {
                    fn.call(mod)
                }
            }
        })
        if (isFun(this.lab.setup)) {
            this.lab.setup()
        }

        this.status = 'started'
    }
    this.trap('postSetup')

    _scene.log.sys('starting evolution of [' + this.path() + ']')
}

Mod.prototype.inherit = function() {
    this.touch('sys')

    this.link(this.___.pub)
    supplement(this.sys, this.___.sys)
    /*
        function log(msg, post) {
        log.out(msg, post)
    }
    */

    // log
    this.log = this.___.log
    this._ls.push(this.log)
    this._dir['log'] = this.log
    //const log = this.___.log
    //augment(log, new Frame())
    //this.attach(log, 'log')
    //supplement(this.log, this.___.log)
}

Mod.prototype.onAttached = function(node, name, parent) {
    if (this.__) this.__.onAttached(node, name, parent)
}

Mod.prototype.evo = function(dt) {
    // boot logic
    if (!this.env._started || this.boot) {
        // try to find and evolve boot node or mod
        if (this.boot && isFun(this.boot.evo)) {
            this.boot.evo(dt)
        }
        return
    }
    if (this.paused) return

    // evolve all entities in the lab
    if (!this.cue.paused) this.cue.evo(dt)
    if (!this.lab.paused) this.lab.evo(dt)
    //this.lab._ls.forEach( e => {
    //    if (e.evo && !e.dead && !e.paused) e.evo(dt)
    //})

    // evolve all mods
    this.mod._ls.map( function(m) {
        if (m.evo && !m.paused) m.evo(dt)
    })
}

Mod.prototype.draw = function() {
    if (!this.ctx) return

    // boot logic
    if (!this.env._started || this.boot) {
        // try to find and draw boot node or mod
        if (isFun(this.boot)) {
            this.boot()
        } else if (this.boot && isFun(this.boot.draw)) {
            this.boot.draw()
        }
        return
    }

    if (this.hidden) return

    // optional background property
    if (this.lab.background && !this.lab._dir.background) {
        this.ctx.draw.background(this.lab.background)
    }
    // possible pre-vfx
    if (this.lab.vfx) {
        this.lab.vfx.preVFX()
    }

    // draw entities in the lab
    // we might integrate this mod display as a link in the mod list
    if (!this.lab.hidden) this.lab.draw()

    // draw mods
    for (let i = 0; i < this.mod._ls.length; i++) {
        let m = this.mod._ls[i]
        if (m.draw && !m.hidden) {
            m.draw()
        }
    }

    if (this.lab.vfx) {
        this.lab.vfx.postVFX()
    }
}

Mod.prototype.patch = function(target, path, node) {
    if (!isMutable(target)) throw { src: this, msg: "can't attach to imutable node @" + path }

    if (path.startsWith('@')) path = path.substring(1)
    if (path.startsWith('/')) path = path.substring(1)

    if (path === '') {
        // patch point is a directory - find if node is named
        if (node && isString(node.name)) {
            path = node.name
        }
    }

    let i = path.indexOf('/')
    if (i >= 0) {
        // switch to the next target
        let nextName = path.substring(0, i)
        let nextPath = path.substring(i + 1)
        let nextNode = target[nextName]

        if (!nextNode) {
            // touch for a new node
            if (isFrame(target)) {
                nextNode = target.touch(nextName)
            } else if (isObj(target) || isFun(target)) {
                nextNode = {}
                target[nextName] = nextNode
            } else {
                this.log.sys('unable to patch @' + path + ' - unable to attach [' + nextName + '] to parent')
                return false
            }
            return this.patch(nextNode, nextPath, node)

        } else if (!isFrame(nextNode) && !isObj(nextNode)) {
            this.log.sys('unable to patch @' + path + ' - [' + nextName + '] is not valid for patching')
            return false
        } else {
            return this.patch(nextNode, nextPath, node)
        }
    }

    let index = -1
    let di = path.lastIndexOf('-')
    if (di > 0) {
        let strIndex = path.substring(di+1)
        index = parseInt(strIndex)
        if (isNaN(index)) {
            index = -1
        } else {
            path = path.substring(0, di)
        }
    }

    if (node !== undefined && node !== null) {
        // found the patch point - attach the node
        if (isFrame(target)) {
            if (path === '') {
                target.attach(node)
            } else if (index >= 0) {
                if (!isArray(target[path])) {
                    target.attach([], path)
                }
                target[path][index] = node
            } else {
                if (isObj(target[path])) {
                    // TODO replace or augment? how to decide?
                    //      there might be different patch modes?
                    augment(target[path], node)
                    //target[path] = node
                } else if (target[path] !== undefined) {
                    // already defined - replace
                    // TODO doesn't work property for frames - _dir and _ls stays the same
                    //      maybe different patch modes?
                    target.detach(target[path])
                    target.attach(node, path)
                    /*
                    target[path] = node
                    target._dir[path] = node
                    target._ls.push(node)
                    */
                } else {
                    target.attach(node, path)
                }
            }
        } else if (isArray(target)) {
            if (index >= 0) {
                target[index] = node
            } else {
                target.push(node)
            }
        } else if (isObj(target)) {
            if (path === '') throw { src: this, msg: "can't attach anonymous node to " + target }
            if (index >= 0) {
                if (!isArray(target[path])) {
                    target[path] = []
                }
                target[path][index] = node
            } else if (isObj(target[path])) {
                augment(target[path], node)
            } else if (target[path] !== undefined) {
                // TODO doesn't work property for frames - _dir and _ls stays the same
                target[path] = node
                target._dir[path] = node
            }
        }

        // trigger onLoad event
        if (isFun(node.onLoad)) {
            node.onLoad(this)
            node.onLoad = true // replace function with true, so we'd not call it second time
        }
        if (isFun(node.init)) {
            node.init()
        }
    }
}

// mod control

Mod.prototype.pause = function() {
    this.paused = true
}

Mod.prototype.pauseLab = function() {
    this.lab.pause()
    this.cue.pause()
}

Mod.prototype.pauseAll = function() {
    this.paused = true
    this.mod._ls.forEach(mod => mod.pauseAll())
}

Mod.prototype.resume = function() {
    this.paused = false
}

Mod.prototype.resumeLab = function() {
    this.lab.resume()
    this.cue.resume()
}

Mod.prototype.resumeAll = function() {
    this.paused = false
    this.mod._ls.forEach(mod => mod.resumeAll())
}

Mod.prototype.hide = function() {
    this.hidden = true
}

Mod.prototype.hideLab = function() {
    this.lab.hide()
}

Mod.prototype.hideAll = function() {
    this.hidden = true
    this.mod._ls.forEach(mod => mod.hideAll())
}

Mod.prototype.show = function() {
    this.hidden = false
}

Mod.prototype.showLab = function() {
    this.lab.show()
}

Mod.prototype.showAll = function() {
    this.hidden = false
    this.mod._ls.forEach(mod => mod.showAll())
}

Mod.prototype.disable = function() {
    this.disabled = true
}

Mod.prototype.disableAll = function() {
    this.disabled = true
    this.mod._ls.forEach(mod => mod.disableAll())
}

Mod.prototype.enable = function() {
    this.disabled = false
}

Mod.prototype.enableAll = function() {
    this.disabled = false
    this.mod._ls.forEach(mod => mod.enableAll())
}

Mod.prototype.on = function() {
    this.show()
    this.resume()
    this.enableAll()
}

Mod.prototype.off = function() {
    this.hide()
    this.pause()
    this.disableAll()
}



// **************************************************************
//                        patching
// **************************************************************

function getExtension(url) {
    const match = url.match(/\.[^/.]+$/)
    if (match && match.length > 0) return match[0].substring(1).toLowerCase()
    return ''
}

function getResourceName(url) {
    const name = url.replace(/^.*[\\\/]/, '') // remove path
    return name.replace(/\.[^/.]+$/, '') // remove extension
}

function removeExtention(url) {
    return url.replace(/\.[^/.]+$/, '') // remove extension
}

function attachTTF(name, url) {
    const fontStyle = document.createElement('style')
    fontStyle.appendChild(document.createTextNode("\n\
    @font-face {\n\
        font-family: '" + name + "';\n\
        src: url('" + url + "'); \n\
    }\
    "))
    return document.head.appendChild(fontStyle)
}

function attachWAV(url) {
    // TODO autoplay wav -> .auto.wav (with auto classifier)
    const node = new Audio(url)
    node.preload = true
    node.loop = false
    node.autoplay = false
    return node
}

function patchImg(_, batch, url, base, path, classifier, onLoad) {
    _.res._included ++

    var img = new Image()
    img.src = randomizeUrl(url)
    img.onload = onLoad

    if (classifier && classifier.startsWith('map')) {
        let mx = classifier.substring(3)
        let wh = mx.split('x', 2)
        if (wh.length === 2) {
            let w = parseInt(wh[0])
            let h = parseInt(wh[1])
            // TODO is it really need to be a custom fun instead of just img/tile type?
            _.res._schedule(batch, {
                origin: randomizeUrl(url),
                base: base,
                path: path,
                ext: 'fun',
                fun: function() {
                    let tileSet = new _scene.lib.img.TileSet(img, 0, 0, w, h)
                    _.patch(this.base, path, tileSet)
                }
            })
        }
    } else {
        // static image resource - scheduling the patch in batch 1
        _.res._schedule(1, {
            origin: url,
            base: base,
            path: path,
            ext: 'fun',
            fun: function() {
                _.patch(this.base, path, img)
            }
        })
    }
}

function loadJson(url) {
    const promise = new Promise(function(resolve, reject) {
        const ajax = new XMLHttpRequest()
        ajax.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    try {
                        const jsonData = JSON.parse(this.responseText)
                        resolve(jsonData)
                    } catch (err) {
                        reject(err)
                    }
                } else {
                    reject(this.status, this.responseText)
                }
            }
        }
        ajax.open("GET", randomizeUrl(url), true)
        ajax.send()
    })

    return promise 
}

function scheduleLoad(_, batch, url, base, path, name, ext, classifier) {
    _.res._included ++

    var ajax = new XMLHttpRequest()
    ajax.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                // content is loaded
                const script = {
                    origin: url,
                    path: path,
                    base: base,
                    name: name,
                    ext: ext,
                    classifier: classifier,
                    src: this.responseText,
                }
                if (batch === 0) {
                    // boot scripts are evaluated imediately
                    _.log.sys('eval-0/boot', '=> ' + script.path)
                    evalLoadedContent(script, _)
                } else {
                    // push the script into the exec list
                    _.res._schedule(batch, script)
                }

                _.res._onLoaded()
            } else {
                _.log.sys('loader-' + batch, 'unable to load ' + url)
            }
        }
    }
    ajax.open("GET", randomizeUrl(url), true)
    ajax.send()
}

Mod.prototype.patchNode = function(unitId, unitUrl, path) {
    const unit = _scene._units[unitId]
    if (unit) {
        const targetPath = addPath(unit.mount,
                    removeExtention(removeExtention(path)))
        _scene.log.sys('[patch]', 'patching ' + targetPath)
        _scene.batchLoad(0, addPath(unit.id, path), _scene, addPath(unit.mount, targetPath))
    } else {
        _scene.log.err('[patch]', `unable to patch ${targetPath}`)
    }
}


Mod.prototype.batchLoad = function(batch, url, base, path) {
    const _ = this
    //_.log.sys('batch-#' + batch, 'url: ' + url + ' base: ' + base.name + ' path: ' + path)

    function onLoad() {
        if (_scene.env.config.latency) {
            let max_wait = 5
            let delay = Math.floor(Math.random() * max_wait) * 1000
            setTimeout(function() {
                _.res._onLoaded()
            }, delay)
        } else {
            _.res._onLoaded()
        }
    }

    const ext = getExtension(url)
    const resourceName = getResourceName(url)
    let name = resourceName
    let classifier = false // classifies additional actions, like .map12x12 etc...

    const i = resourceName.indexOf('.')
    if (i > 0) {
        name = resourceName.substring(0, i) // simplify name by removing the classifier
        classifier = resourceName.substring(i+1) // extract the classifier
    }

    name = path? path.replace(/^.*[\\\/]/, '') : name // take the name form path

    _.log.sys('loader-' + batch, '.' + ext + ': ' + url + ' -> ' + addPath(base.name, path))

    switch (ext) {
        case 'png': case 'jpeg': case 'jpg': case 'svg': case 'gif':
            patchImg(_, batch, url, base, path, classifier, onLoad)
            break

        case 'ttf':
            attachTTF(name, url)
            break

        case 'wav':
        case 'ogg':
        case 'mp3':
            if (base) _.patch(base, path, attachWAV(url))
            break

        case 'js': case 'json': case 'yaml':
        case 'txt': case 'prop': case 'lines': case 'csv':
            scheduleLoad(_, batch, url, base, path, name, ext, classifier)
            break

        default:
            //_.log.sys('loader-' + batch, 'ignoring resource by type: [' + url + ']')
            scheduleLoad(_, batch + 1, url, base, path, name, ext, classifier)
    }
}

function addPath(base, path) {
    if (!base) return path
    if (!path) return base
    if (base.endsWith('/')) {
        if (path.startsWith('/')) return base + path.substring(1)
        else return base + path
    } else if (path.startsWith('/')) {
        return base + path
    } else {
        return base + '/' + path
    }
}

function normalizeDirPath(path) {
    if (path.length > 0 && !path.endsWith('/')) return path + '/';
    return path
}

function randomizeUrl(url) {
    // TODO look at the global env config - useful only in dynamic debug mode
    if (_scene.env.config.debug) {
        return url + '?' + Math.random()
    } else {
        return url + '?' + Math.random()
        //return url
    }
}

function fixUnitMountPoint(unit) {
    unit.name = removeExtension(unit.id)
    unit.name = (unit.name
            .replace('.mod', '')
            .replace('.fix', '')
            .replace('mod', '')
            .replace('fix', ''))
    if (!unit.mount) {
        if (unit.type === 'mod' && unit.name.length > 0) {
            // non-root mod
            unit.mount = addPath('mod', unit.name)
        } else {
            unit.mount = unit.name
        }
    }
}


function isUnitAvailable(unitId, loadingQueue) {
    let available = false 
    loadingQueue.forEach(unit => {
        if (unit.id === unitId) available = true
    })
    return available
}

function validateUnitRequirements(unit, loadingQueue) {
    if (!isArray(unit.require)) return true // no requirements

    let res = true
    unit.require.forEach(rq => {
        if (!isUnitAvailable(rq, loadingQueue)) res = false
    })
    return res 
}

function queueUnits(unitsToLoad, loadingQueue) {
    if (unitsToLoad.length === 0) return

    let nexti = -1
    let nextUnit = null
    for (let i = 0; i < unitsToLoad.length; i++) {
        if (validateUnitRequirements(unitsToLoad[i], loadingQueue)) {
            nexti = i
            nextUnit = unitsToLoad[i]
            break
        }
    }

    if (nexti >= 0) {
        unitsToLoad.splice(nexti, 1)
        loadingQueue.push(nextUnit)
        queueUnits(unitsToLoad, loadingQueue)
    } else {
        // requirements is not satisfied for the rest of the queue
        const msg = "some units can't be loaded due to missing requirements"
        _scene.log.err(msg)
        unitsToLoad.forEach(u => {
            const req = u.require.join(', ')
            _scene.log.err('[' + u.id + '] requires: ' + req)
            _scene.log.dump(unitsToLoad)
            _scene.log.dump(loadingQueue)
        })
        throw msg
    }
}

function isIgnored(url, ignoreList) {
    let ignored = false
    ignoreList.forEach(irexp => {
        if (irexp.test(url)) ignored = true
    })
    return ignored
}

Mod.prototype.loadUnits = function(baseMod, target) {
    target = normalizeDirPath(target)
    this.log.sys('[loader]', '[' + this.name + '] loading: [' + baseMod.name + '] <= [' + target + ']') 
    // TODO check that baseMod is actually a mod?
    let currentMod = baseMod
    let loaderMod = this

    // load collider.units definition
    let url = addPath(target, UNITS_MAP)
    loadJson(randomizeUrl(url))
        .then(units => {
            if (!units) return
            loaderMod._units = units
            
            let unitsToLoad = []
            Object.keys(units).forEach(unitId => {
                const unit = units[unitId]
                unit.id = unitId 
                fixUnitMountPoint(unit)

                if (unit.type === 'mod' || (unit.type === 'fix' && unit.load === 'auto')) {
                    unitsToLoad.push(unit)
                }
            })

            const loadQueue = []
            queueUnits(unitsToLoad, loadQueue)
            loaderMod.log.sys('units loading order: ' + loadQueue.map(u => u.id).join(', '))

            let ignoreList = []
            loadQueue.forEach(unit => {
                if (isArray(unit.ignore)) ignoreList = ignoreList.concat(unit.ignore)
            })
            ignoreList = ignoreList.map(e => new RegExp(e))

            // schedule the loading
            let batch = 2 // 0 is for boot, 1 is for static resources
            loadQueue.forEach(unit => {
                const ls = unit.ls || []
                ls.forEach(resLocalUrl => {
                    // remove ext and classifier and add unit mount point to get mod path
                    const targetPath = addPath(unit.mount, removeExtention(removeExtention(resLocalUrl)))
                    const url = addPath(unit.id, resLocalUrl)

                    if (isIgnored(url, ignoreList)) {
                        loaderMod.log.sys('loader-' + batch, 'ignoring by rule: ' + url)
                    } else {
                        if (targetPath.startsWith('boot') || targetPath.startsWith('/boot')) {
                            loaderMod.batchLoad(0, url, currentMod, targetPath)
                        } else {
                            loaderMod.batchLoad(batch, url, currentMod, targetPath)
                        }
                    }
                })
                batch++
            })
        })
        .catch(err => {
            console.log(err)
            _scene.log.err('[loader]', 'errors on units loading')
        })
}

function constructLog() {
    const log = console.log.bind(window.console, '>')
    augment(log, new Frame())
    /*
    const log = function log(msg, post) {
        log.out(msg, post)
    }
    */ 

    /*
    mod.log.attach(function err(msg, post) {
        post? console.log.call(console, '! [' + msg + '] ' + post) : console.log('! ' + msg) 
    }, 'err')
    mod.log.attach(function warn(msg, post) {
        post? console.log.call(console, '? [' + msg + '] ' + post) : console.log('? ' + msg) 
    }, 'warn')
    mod.log.attach(function out(msg, post) {
        post? console.log.call(console, '> [' + msg + '] ' + post) : console.log('> ' + msg) 
    }, 'out')
    mod.log.attach(function debug(msg, post) {
        post? console.log.call(console, '. [' + msg + '] ' + post) : console.log('# ' + msg) 
    }, 'debug')
    mod.log.attach(function sys(msg, post) {
        post? console.log.call(console, '$ [' + msg + '] ' + post) : console.log.call(console, '$ ' + msg) 
    }, 'sys')
    mod.log.attach(function dump(obj) {
        console.dir.call(console, obj)
    }, 'dump')
    */
    log.attach(
        console.error.bind(window.console, '!'),
        'err')
    log.attach(
        console.warn.bind(window.console, '?'),
        'warn')
    log.attach(
        console.log.bind(window.console, '>'),
        'out')
    log.attach(
        console.log.bind(window.console, '.'),
        'debug')
    log.attach(
        console.log.bind(window.console, '$'),
        'sys')
    log.attach(
        console.log.bind(window.console),
        'raw')
    log.attach(
        console.dir.bind(window.console),
        'dump')
    log.attach(
        console.table.bind(window.console),
        'tab')

    return log
}

// ***********************
// collider scene construction
function constructScene() {
    const mod = new Mod()
    mod.name = '/'

    mod._ = mod // set the context
    mod._$ = mod // root context
    mod.__ = false // don't have any parents
    mod.___ = mod // parent context
    Object.defineProperty(mod, '_', { enumerable: false })
    Object.defineProperty(mod, '_$', { enumerable: false })
    Object.defineProperty(mod, '__', { enumerable: false })
    Object.defineProperty(mod, '___', { enumerable: false })
    mod.inherit = function() {}

    // sys
    mod.attach(new Frame({
        name: "sys",
    }))
    mod.sys.attach(mix)
    mod.sys.attach(augment)
    mod.sys.attach(supplement)
    mod.sys.attach(before)
    mod.sys.attach(after)
    mod.sys.attach(chain)

    mod.sys.attach(Mod)
    mod.sys.attach(Frame)
    mod.sys.attach(LabFrame)
    mod.sys.attach(CueFrame)

    mod.sys.attach(isObj)
    mod.sys.attach(isFun)
    mod.sys.attach(isNumber)
    mod.sys.attach(isString)
    mod.sys.attach(isArray)
    mod.sys.attach(isMutable)
    mod.sys.attach(isFrame)
    mod.sys.attach(isEmpty)

    // pub
    mod.attach(new Frame({
        name: 'pub',
    }))

    // log
    const log = constructLog()
    mod.attach(log, 'log')

    // setup env
    mod.env.TARGET_FPS = 60
    mod.env.MAX_EVO_STEP = 0.01
    mod.env.MAX_EVO_PER_CYCLE = 0.3
    //mod.env.mouseX = 0
    //mod.env.mouseY = 0
    //mod.env.mouseLX = 0
    //mod.env.mouseLY = 0
    mod.env.key = _key  // down key set
    mod.env.pad = _pad
    mod.env.mouse = _mouse
    mod.env.config = {}

    // setup default background
    mod.lab.background = '#121313'

    mod.setConfig = function(config) {
        augment(this.env.config, config)
        this.lab.background = config.background || this.lab.background
    }

    return mod
}

function repatchScene(mod, proto) {
    if (proto && proto._patchLog && proto._patchLog.length > 0) {
        proto._patchLog.forEach(script => {
            try {
                script.base = mod
                evalLoadedContent(script, mod)
            } catch (err) {
                console.log(err)
            }
        })
    }
}

// root
const _scene = constructScene()

/*
_scene.path = function() {
    return '/'
}
*/

// augment with env from the global scope
// TODO need to move for later - once everything is loaded and populated
// TODO disable for now - need to figure out if we need that at all
//augment(_scene.env, window['_env$'])


// TODO is it deprecated? or any use for that?
_scene.packDeclarations = function(target) {
    // normalize target
    if (!isObj(target)) target = window

    var pak = {}
    target['_def$'] = pak

    // search for declarations
    for (var key in target) {
        if (key.startsWith('_boot$') || key.startsWith('_patch$') || key.indexOf('@') >= 0) {
            pak[key] = target[key]
            target[key] = false
        }
    }
}

// ********************************************
// sys functions

// *****************************************************
// LIFECYCLE
// main scene lifecycle - bootstrap, cycle[evo, draw]
//
const preboot = function() {
    _scene.log.sys('[loader]', 'loading config: ' + JAM_CONFIG)

    loadJson(JAM_CONFIG)
        .then(function(config) {
            if (config) {
                _scene.log.sys(' = Config =: ' + JSON.stringify(config));
                _scene.setConfig(config)
            }
            bootstrap()
        })
        .catch((err) => {
            _scene.log.sys('[loader]', 'unable to get [' + JAM_CONFIG + ']: ' + err)
            bootstrap()
        })
}

const bootstrap = function() {
    _scene.log.sys('jam', '*** booting up ***')

    // binding to the graphical context by convention
    let canvas = document.getElementById(canvasName)
    if (canvas == null) {
        // precreated canvas is not found, so create one
        canvas = document.createElement(canvasName);
        canvas.id = canvasName;
        canvas.style.zIndex   = 1;
        canvas.style.border   = "0px";
        canvas.style.margin = "0px";
        canvas.style.padding = "0px";
        canvas.style.position = "absolute";
        canvas.style.display = "block";
        document.body.appendChild(canvas);
        
        // style the body
        document.body.style.margin = "0"
        document.body.style.padding = "0"
        document.body.style.overflow = "hidden";
        document.body.setAttribute("scroll", "no");
    }

    // bind context
    _scene.ctx = augmentCtx(canvas.getContext("2d"))
    _scene.populateAlt()

    _scene.loadUnits(_scene, _scene.env.syspath)

    // pack existing declarations in global scope first
    // TODO decide do we need those at all? since there is no scope in there
    //_scene.packDeclarations()

    /*
    // load jam root mod
    _scene.fix(_scene, _scene.env.syspath + 'jam', 'fix')
    // loading ext in basepath, if not found - loading in syspath
    _scene.fix(_scene, 'ext', 'fix', false, function(topology) {
        if (topology.length === 0) {
            _scene.log.sys('fix', 'no ext mod found in basepath! Loading system ext')
            _scene.fix(_scene, _scene.env.syspath + 'ext', 'fix', 2)
        }
    })
    // load default mod
    try {
        _scene.fix(_scene, 'mod', 'fix')
    } catch (e) {}
    // load default named mod (for foo.html -> foo/ or foo.mod/)
    if (_scene.env.basename && _scene.env.basename.length > 0 && _scene.env.basename != 'mod') {
        try {
            _scene.fix(_scene, _scene.env.basename, 'fix')
        } catch (e) {}
        try {
            _scene.fix(_scene, _scene.env.basename + '.mod', 'fix')
        } catch (e) {}
    }

    // scan global just in case of some definitions there
    _scene.scan()

    // load custom declarations packed before
    // TODO - maybe a better way to postpone it? scripts are loaded async
    //        so we need an event when core is loaded for that
    _scene.scan(window._def$)
    */

    if (_scene.env.config.fullscreen) {
        // TODO turn for --full-screen startup tag
        // TODO add isFun checks
        if (isFun(canvas.webkitRequestFullScreen)) canvas.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)
        if (isFun(canvas.mozRequestFullScreen)) canvas.mozRequestFullScreen() //Firefox
        if (isFun(canvas.msRequestFullscreen)) canvas.msRequestFullscreen()
        if (isFun(canvas.requestFullscreen)) canvas.requestFullscreen()
    }
    startCycle()
    startFlow()
}

function startCycle() {
    expandCanvas(canvasName)
    focus()
    setInterval(focus, 100)

    // initiate the game loop
    console.log('*** [jam] starting main cycle ***')
    _scene.env.lastFrame = performance.now()
    window.requestAnimFrame(cycle) /*
    // old-fasioned way to setup animation
    if (!_scene.env.TARGET_FPS) {
        setInterval(cycle, 1)
    } else {
        setInterval(cycle, 1000/_scene.env.TARGET_FPS)
    }
    */
}

function openSocket(url, retry) {
    const TAG = '[flow]'
    const socket = new WebSocket(url)

    socket.onopen = function() {
        _scene.log.sys(TAG, `started the flow at: ${url}`)
    }

    socket.onclose = function(err) {
        const timeout = Math.min(retry * 2, 60) || 5
        _scene.log.sys(TAG, `flow is closed, trying to reestablish in ${timeout}s...`)
        setTimeout(() => openSocket(url, timeout), timeout * 1000)
    }

    socket.onmessage = function(msg) {
        //_scene.log(TAG, msg.data.toString())
        if (isString(msg.data)) {
            const parts = msg.data.split(':')
            _scene.patchNode(parts[0], parts[1], parts[2])
        }
    }

    _scene.flow = function(msg) {
        console.dir(socket)
        if (socket.readyState !== 1) return
        socket.send(msg)
    }
}

function startFlow(url) {
    if (!_scene.env.config.debug && !_scene.env.config.flow) return

    const socketProtocol = (window.location.protocol === 'https:'? 'wss:' : 'ws:')
    openSocket(`${socketProtocol}//${window.location.host}/flow/`)
}

function expandCanvas(name) {
    var canvas = document.getElementById(name)
    if (!canvas) return

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const ctx = canvas.getContext("2d")

    let mode = canvas.getAttribute('mode')
    if (!mode) mode = 'fullscreen'

    if (_scene.env.canvasStyle === 'preserve' || _scene.env.config.preserveCanvas) { 
        _scene.ctx.width = canvas.width
        _scene.ctx.height = canvas.height
    } else if (mode === 'fix-aspect') {
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        const aspect = parseFloat(canvas.getAttribute('aspect'))
        const minHBorder = parseFloat(canvas.getAttribute('minHBorder'))
        const minVBorder = parseFloat(canvas.getAttribute('minVBorder'))
        const portAspect = viewportWidth / viewportHeight

        let targetWidth = viewportWidth
        let targetHeight = viewportHeight
        if (minHBorder > 0) targetWidth = targetWidth - minHBorder*2
        if (minVBorder > 0) targetHeight = targetHeight - minVBorder*2

        if (portAspect > aspect) {
            // viewport is actually wider
            targetWidth = Math.round(targetHeight * aspect)
        } else {
            // viewport is higher
            targetHeight = Math.round(targetWidth / aspect)
        }
        const hborder = Math.round((viewportWidth - targetWidth)/2)
        const vborder = Math.round((viewportHeight - targetHeight)/2)

        canvas.width = ctx.width = targetWidth
        canvas.height = ctx.height = targetHeight
        canvas.style.width = targetWidth + 'px'
        canvas.style.height = targetHeight + 'px'
        canvas.style.left = hborder + 'px'
        canvas.style.top = vborder + 'px'

    } else if (mode === 'fix-res') {
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        let targetWidth = canvas.getAttribute('targetWidth')
        let targetHeight = canvas.getAttribute('targetHeight')
        // TODO maybe show an error that we are expecting custom attributes in here?
        if (!targetWidth) targetWidth = viewportWidth
        if (!targetHeight) targetHeight = viewportHeight

        // calculate canvas scale respecting the aspect
        const aspect = targetWidth / targetHeight
        const vscale = viewportWidth / targetWidth
        const hscale = viewportHeight / targetHeight
        let scale = hscale
        if (hscale > vscale) scale = vscale

        const hborder = Math.round((viewportWidth - (targetWidth*scale))/2)
        const vborder = Math.round((viewportHeight - (targetHeight*scale))/2)

        canvas.width = ctx.width = targetWidth
        canvas.height = ctx.height = targetHeight
        canvas.style.width = Math.round(targetWidth * scale) + 'px'
        canvas.style.height = Math.round(targetHeight * scale) + 'px'
        canvas.style.left = hborder + 'px'
        canvas.style.top = vborder + 'px'

    } else {
        // default full-screen canvas
        //_scene.ctx.width = canvas.width = viewportWidth
        //_scene.ctx.height = canvas.height = viewportHeight
        _scene.env.width = _scene.ctx.width = canvas.width = viewportWidth
        _scene.env.height = _scene.ctx.height = canvas.height = viewportHeight
        canvas.style.width = viewportWidth + 'px'
        canvas.style.height = viewportHeight + 'px'

    }
    _scene.draw() // it doesn't work without forced redraw
}

function expandView() {
    // TODO modify to support multiple canvases and custom resize
    expandCanvas(canvasName)
    if (_scene.trap) _scene.trap('resize')
}

// ******************************************************
function cycle(now) {
    //var now = Date.now()
    let dt = (now - _scene.env.lastFrame)/1000

    // show, react and update cycle
    _scene.dt = dt
    _scene.draw()

    // max evolution threshold
    if (dt > _scene.env.MAX_EVO_PER_CYCLE) {
        dt = _scene.env.MAX_EVO_PER_CYCLE
    }

    // evolve multiple times in small quants
    // to compensate possible lag due to rendering delays
    while(dt > 0) {
        if (dt > _scene.env.MAX_EVO_STEP) {
            _scene.evo(_scene.env.MAX_EVO_STEP)
        } else {
            _scene.evo(dt)
        }
        dt -= _scene.env.MAX_EVO_STEP
    }
    _scene.env.lastFrame = now
	window.requestAnimFrame(cycle)
}



// ***************
// events handling
// TODO move to external system traps
// TODO maybe move out events to a system fix?
//
function handleMouseMove(e) {
    e = e || window.event

    /*
    _scene.env.mouseLX = _scene.env.mouseX
    _scene.env.mouseLY = _scene.env.mouseY
    _scene.env.mouseX = e.pageX
    _scene.env.mouseY = e.pageY
    */
    _mouse.lx = _mouse.x
    _mouse.ly = _mouse.y
    _mouse.x = e.pageX
    _mouse.y = e.pageY
    _mouse.dx = _mouse.x - _mouse.lx
    _mouse.dy = _mouse.y - _mouse.ly

    _scene.trap('mouseMove', e, true)
    e.preventDefault()
    e.stopPropagation()
    return false
}

function handleMouseWheel(e) {
    _scene.trap('mouseWheel', e, true)
    return false
}

function handleMouseDown(e) {
    _scene.trap('mouseDown', e, true)
    _mouse.buttons = e.buttons
    e.preventDefault()
    e.stopPropagation()
    return false
}

function handleMouseUp(e) {
    _scene.trap('mouseUp', e, true)
    _mouse.buttons = e.buttons
    e.preventDefault()
    e.stopPropagation()
    return false
}

function handleMouseClick(e) {
    _scene.trap('click', e, true)
    e.preventDefault()
    e.stopPropagation()
    return false
}

function handleMouseDoubleClick(e) {
    _scene.trap('dblClick', e, true)
    e.preventDefault()
    e.stopPropagation()
    return false
}

function handleMouseOut(e) {
    /*
    for (var k in _scene.env.key) {
        delete _scene.env.key[k]
    }
    */
    _mouse.out = true
    Object.keys(_key).forEach(k => {
        delete _key[k]
    })
    _scene.trap('mouseOut', e, true)
}

function handleMouseOver(e) {
    _mouse.out = false
    _scene.trap('mouseOver', e, true)
}

function handleTouchStart(e) {
    _scene.trap('touchStart', e, true)
    return false
}

function handleTouchEnd(e) {
    _scene.trap('touchEnd', e, true)
    return false
}

function handleTouchMove(e) {
    _scene.trap('touchMove', e, true)
    return false
}

function handleTouchCancel(e) {
    _scene.trap('touchCancel', e, true)
    return false
}

function handleContextMenu(e) {
    _scene.trap('mouseContext', e, true)
    e.preventDefault()
    e.stopPropagation()
    return false
}

function handleKeyDown(e) {
    let keyName = e.code.substring(0, 1).toLowerCase()
        + e.code.substring(1)

    _key[keyName] = true
    _key[e.key] = true

    let chain = _scene.trap(keyName + 'Down', e, true)
    if (chain) {
        chain = _scene.trap('keyDown', e, true)
    }

    if (!chain)  {
        e.preventDefault()
        e.stopPropagation()
        return false;
    }
    return true
}

function handleKeyUp(e) {
    let keyName = e.code.substring(0, 1).toLowerCase()
        + e.code.substring(1)

    delete _key[keyName]
    delete _key[e.key]

    let chain = _scene.trap(keyName + 'Up', e, true)
    if (chain) {
        chain = _scene.trap('keyUp', e, true)
    }

    if (!chain)  {
        e.preventDefault()
        e.stopPropagation()
        return false
    }
    return true
}

function handleHashChange() {
    if (location.hash.startsWith('#test')) {
        doTest(_scene, location.hash.substring(1))
    } else if (location.hash.startsWith('#box')) {
        doBox(_scene, location.hash.substring(1), true)
    } else {
        _scene.trap('hash', location.hash)
    }
}


// *****************
// setup environment

// determine system path
let scripts = document.getElementsByTagName('script')
for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src.endsWith(SCRIPT_SRC)) {
        let path = scripts[i].src.split('?')[0]
        let syspath = path.split('/').slice(0, -2).join('/')+'/'
        let htmlhost = location.href.split('/').slice(0, -1).join('/')+'/'
        let pagename = location.href.split('/').slice(-1).join('').split('?').slice(0, 1).join('')
        let htmlname = pagename.split('.').slice(0, -1).join('')
        
        if (syspath.startsWith(htmlhost)) {
            // we can shorten the syspath to a relative value
            syspath = syspath.substring(htmlhost.length)
        }
        _scene.env.basepath = htmlhost
        _scene.env.basename = htmlname
        _scene.env.syspath = syspath
        _scene.env.title = document.title

        // check out test hash
        if (location.hash) {
            if (location.hash.startsWith('#test')) {
                // determine test name
                const testName = location.hash.substring(6)
                if (testName.length === 0) {
                    _scene.env.config.test = true
                } else {
                    _scene.env.config.test = testName
                }
            } else if (location.hash.startsWith('#box')) {
                // determine box name
                _scene.env.config.box = location.hash.substring(5)
            }
        } 

        _scene.log.sys('=== Environment ===')
        _scene.log.sys('basename: ' + _scene.env.basename)
        _scene.log.sys('syspath: ' + _scene.env.syspath)
        _scene.log.sys('basepath: ' + _scene.env.basepath)
        _scene.log.sys('title: ' + _scene.env.title)
        break
    }
}

function focus() {
    window.focus()
}

// bind events to target
// TODO move to external system setup
function bindHandlers(target) {
    if (!target) return
    target.onresize = expandView
    target.onload = preboot
    target.onmousedown = handleMouseDown
    target.onmouseup = handleMouseUp
    target.onclick = handleMouseClick
    target.onmouseout = handleMouseOut
    target.onmouseover = handleMouseOver
    target.ondblclick = handleMouseDoubleClick
    target.oncontextmenu = handleContextMenu
    target.onmousemove = handleMouseMove
    target.onkeydown = handleKeyDown
    target.onkeyup = handleKeyUp
    target.onhashchange = handleHashChange

    target.addEventListener('wheel', handleMouseWheel)
    target.addEventListener('touchstart', handleTouchStart)
    target.addEventListener('touchend', handleTouchEnd)
    target.addEventListener('touchmove', handleTouchMove)
    target.addEventListener('touchcancel', handleTouchCancel)
}
bindHandlers(window)


// extend window with universal requestAnimFrame
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(callback, element) {
            window.setTimeout(callback, 1000/_scene.env.TARGET_FPS)
         }
})();

return _scene;

}(window))
