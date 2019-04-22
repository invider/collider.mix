/*
 * Collider.JAM Supervisor
 */
$ = scene = (function(window) {

"use strict"

// ***********
// environment
let SCRIPT_SRC = 'collider.mix/jam.js'
let UNITS_JSON = 'units.map'
let canvasName = 'canvas'


// *********
// utilities
const isObj = function(o) {
    return !!(o && typeof o === 'object')
}
const isFun = function(f) {
    return !!(f && f.constructor && f.call && f.apply);
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

function mix() {
    var arg, prop, mixin = {};
    for (arg = 0; arg < arguments.length; arg++) {
        for (prop in arguments[arg]) {
            if (arguments[arg].hasOwnProperty(prop)) {
                mixin[prop] = arguments[arg][prop];
            }
        }
    }
    return mixin;
}
function augment() {
    let mixin = arguments[0];
    for (let arg = 1; arg < arguments.length; arg++) {
        if (arguments[arg]) for (let prop in arguments[arg]) {
            if (isObj(mixin[prop]) && isObj(arguments[arg][prop])) {
                augment(mixin[prop], arguments[arg][prop])
            } else {
                mixin[prop] = arguments[arg][prop];
            }
        }
    }
    return mixin;
}
function supplement() {
    let mixin = arguments[0];
    for (let arg = 1; arg < arguments.length; arg++) {
        for (let prop in arguments[arg]) {
            if (!mixin[prop]) {
                mixin[prop] = arguments[arg][prop];
            } else if (isObj(mixin[prop]) && isObj(arguments[arg][prop])) {
                supplement(mixin[prop], arguments[arg][prop])
            }
        }
    }
    return mixin;
}

const before = function(obj, fun, patch) {
    var orig = obj[fun]
    if (!orig) {
        obj[fun] = patch
    } else if (!isFun(orig)) {
        throw new Error("Can't chain before [" + fun + " which is " + (typeof orig))
    } else {
        obj[fun] = function() {
            patch.apply(this, arguments)
            orig.apply(this, arguments)
        }
        obj[fun].first = patch
        obj[fun].after = orig
    }
}

const after = function(obj, fun, patch) {
    var orig = obj[fun]
    if (!orig) {
        obj[fun] = patch
    } else if (!isFun(orig)) {
        throw new Error("Can't chain after [" + fun + " which is " + (typeof orig))
    } else {
        obj[fun] = function() {
            orig.apply(this, arguments)
            patch.apply(this, arguments)
        }
        obj[fun].first = orig 
        obj[fun].after = patch
    }
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
    return path.replace(/[^\/]+$/, '') // remove extension
}


// =======================================================
// system definitions
// =======================================================
const touchFun = function(nodeConstructor) {
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
                return this.attach(new nodeConstructor(nextName)).touch(nextPath)
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
            if (this._locked) throw new Error("can't touch - node is locked")
            return this.attach(new nodeConstructor(path))
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
Frame.prototype.type = "frame"
Frame.prototype.path = function() {
    if (this.__) return addPath(this.__.path(), this.name)
    return this.name
}
Frame.prototype.touch = touchFun(Frame)

Frame.prototype.attach = function(node, name) {
    if (node === undefined) return
    if (this._locked) throw { src: this, msg: "can't attach - node is locked" }
    if (isObj(node) || isFun(node)) {
        // inject mod, parent and name
        node._ = this._
        node.__ = this
        if (name && isObj(node)) node.name = name
        if (!name && node.name) name = node.name
	}

    if (name) {
        this[name] = node
        this._dir[name] = node
    }
    this._ls.push(node)
    if (isFun(node.init)) node.init() // initialize node
    this.onAttached(node, name, this)
    return node
};

Frame.prototype.onAttached = function(node, name, parent) {
    this.__.onAttached(node, name, parent)
};

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
};

Frame.prototype.detachAll = function() {
    while(this._ls.length){
        let node = this._ls[0];
        this.detach(node)
    }
};

Frame.prototype.detachByName = function(name) {
    var obj = this[name];
    if (obj === undefined){
        throw new Error("No node with name:" + name);
    }
    //
    //  FINISH called when element detached
    //
    if (this[name].finish) this[name].finish();
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
};

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
};

Frame.prototype.select = function(predicate) {
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
				if (o && nextName === '*' || k.includes(nextName) || (o.tag && o.tag.includes(nextName))) {
					if (isFrame(o)) {
						res = res.concat(o.select(nextPath))
					} else if (isArray(o)) {
						if (nextPath === '' || nextPath === '*') res = res.concat(o)
						// TODO maybe handle index identifiers?
					} else if (isObj(o)) {
						for (let j in o) {
							if (nextPath === '*' || j.includes(nextPath)) {
								res.push(o[j])
							}
						}
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
				if (k.includes(predicate) || (o.tag && o.tag.includes(predicate))) res.push(o)
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
        return this._ls.filter(predicate)
	} else return []
}

Frame.prototype.selectOne = function(predicate) {
	let list = this.select(predicate)
	if (list.length > 0) return list[0]
	return undefined
};

Frame.prototype.selectOneNumber = function(predicate) {
    let list = this.select(predicate)
    if (list.length > 0) {
        if (isNaN(list[0])){
            throw new Error("Error parsing number:" + list[0])
        }
        return parseFloat(list[0]);
    }
    return 0;
}

Frame.prototype.kill = function() {
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
LabFrame.prototype = new Frame()

LabFrame.prototype.touch = touchFun(LabFrame)

// TODO processing of attached node and event on attachment probably should be different functions
LabFrame.prototype.onAttached = function(node, name, parent) {
    if (!node) {
        // current lab frame is attached
        if (isFun(this.__.onAttached)) this.__.onAttached(this, this.name, this.__)
        return
    }
    //this._.log.sys('spawned ' + node.name)
    // normalize and augment the node
    if (!isFun(node.draw)) node.draw = false // ghost
    if (!isFun(node.evo)) node.evo = false   // prop

    // TODO probably shouldn't be called here
    //if (isFun(node.spawn)) node.spawn() // spawn handler
    if (isNumber(node.x) && isNumber(node.y)) node._positional = true
    else node._positional = false
    if (node._positional
            && isNumber(node.w)
            && isNumber(node.h)) {
        node._sizable = true
    } else {
        node.sizable = false
    }

    // TODO make arbitrary augmentation and dependency injection possible
    //this._.aug._ls.forEach( function(aug) {
    //    aug(node)
    //})

    if (isNumber(node.Z)) {
        // sort by Z
        this._ls.sort((a, b) => {
            if (!isNumber(a.Z) && !isNumber(b.Z)) return 0;
            if (!isNumber(a.Z) && isNumber(b.Z)) return 1;
            if (isNumber(a.Z) && !isNumber(b.Z)) return -1;
            if (a.Z > b.Z) return 1;
            if (a.Z < b.Z) return -1;
            return 0;
        })
    }
},

LabFrame.prototype.evo = function(dt) {
    this._ls.forEach( e => {
        if (e.evo && !e.dead && !e.paused) e.evo(dt)
    });
}

LabFrame.prototype.draw = function() {
    for (let i = 0; i < this._ls.length; i++) {
        let e = this._ls[i]
        if (e.draw && !e.dead && !e.hidden) {
            e.draw()
        }
    }
}


// =============================================================
//                          LOADER 
// =============================================================
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

    // provide lexical scope for mod context and scope object for this. definitions
    let code = '(function ' + name + '(_, ctx, module, require, sys, lib, res, dna, env, lab, mod, log, trap) {'
        + " /* path: " + script.path + "*/ "
        + script.src
    + '}).call(scope, __, __.ctx, module, require, __.sys, __.lib, __.res, __.dna, __.env, __.lab, __.mod, __.log, __.trap)'
    + '\n//# sourceURL=' + script.origin

    /*
    // TODO is there a better way to handle evaluation errors?
    try{
        val = eval(code)
    } catch (e) {
        console.error(`Error executing file: ${script.origin}`)
        console.log(code)
        throw (e);
    }
    */

    // TODO parse the source for require('')
    //      and try to resolve those before the execution
    //      if not resolved - postpone the evaluation until later in the batch
    const val = eval(code)

    if (val !== undefined) return val
    else if (module.exports !== undefined) return module.exports
    else {
        _.log.sys('no value, exports or declarations from ' + script.path)
        return "NO VALUE"
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

function parseCSV(src, _) {
    const lines = src.match(/[^\r\n]+/g);
    // naming array
    const names = lines[0].split(',').map(e => e.trim())
    // parse objects
    const objects = []
    for (let i = 1; i < lines.length; i++) {
        const l = lines[i].trim()
        if (l.length > 0 && !l.startsWith('--')) {
            // TODO more intellectual parsing, so escaped string can be included (e.g. 'one,two')
            const ol = l.split(',').map(e => e.trim()).map(e => {
                return matchType(e)
            })
            const obj = {}
            ol.forEach((e, j) => {
                if (j < names.length) {
                    obj[names[j]] = e
                } else {
                    _.log.warn('eval-'+batch, '=> '
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
    const lines = src.match(/[^\r\n]+/g);
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
}

function evalLoadedContent(script, _) {
    //try {
    switch(script.ext) {
        case 'js':
            _.patch(script.base, script.path, evalJS(script, _))
            // TODO apply definitions?
            //let declarationsFound = _.scan(scope)
            break;
        case 'json': _.patch(script.base, script.path, JSON.parse(script.src)); break;
        case 'txt': _.patch(script.base, script.path, script.src); break;
        case 'lines': _.patch(script.base, script.path, parseLines(script.src)); break;
        case 'csv': _.patch(script.base, script.path, parseCSV(script.src, _)); break;
        case 'prop': _.patch(script.base, script.path, parseProp(script.src)); break;
        case 'fun': script.fun(); break;
    }
    //} catch (e) {
    //    _scene.log.err('jam-loader', 'error in [' + script.path + ']' + e)
    //    throw e
    //}
}

const checkScriptDependencies = function(script, batch) {
    if (script.ext !== 'js') return []

    let depends = []

    let extendRegExp = new RegExp('@depends\\((.*?)\\)', 'g')

    let match
    while(match = extendRegExp.exec(script.src)) {
        let key = match[1]
        let dependency
        batch.forEach(s => {
            if (s.path === key) dependency = s
        })
        if (dependency) depends.push(dependency)
        else {
            console.dir(batch)
            throw 'dependency ' + key + ' is not found'
        }
    }
    return depends
}

const sortLoadedBatch = function(batch) {
    //this._execList[batch].sort((a, b) => a.path.localeCompare(b.path))
    let res = []

    var workBatch = batch.slice(); 
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

// Mod context container
const Mod = function(dat) {
    this._$ = _scene
    this.ctx = false
    this.focus = true
    this.paused = false
    this.hidden = false

    Frame.call(this, dat)

    // resources container
    this.attach(new Frame({
        name: 'res',
        _included: 0,
        _loaded: 0,
        _execList: [],

        _exec: function() {

            for (let batch = 0; batch < this._execList.length; batch++) {
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
            if (this._.env.started) return

            if (this._included <= this._loaded) {
                // OK - everything is loaded, call setup functions
                // TODO how to deal with mods with no res? how start would be triggered?
                this._.log.sys('loader', 'Total ' + this._loaded + ' resources are loaded in ' + this._.name)
                this._exec()

                this._.start()
            }
        },

        _onLoaded: function() {
            this._loaded ++
            this._startTrigger()
        },

        onAttached: function(node, name, parent) {
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
    this.attach(new Frame("sys"))
    // library functions
    //this.attach(new Frame("lib"))
    // log functions
    this.attach(new Frame("log"))

    // prototypes/constructors
    //this.attach(new Frame(), 'dna')

    // augment functions
    // TODO remove in favor of .aug
    //this.attach(new Frame(), 'aug')

    // static environment data entities
    this.attach(new Frame({
        name: "env",
        started: false,
    }))
    // container for acting entities - actors, ghosts, props
    this.attach(new LabFrame(), 'lab')

    // container for mods
    var mod = function mod(path, name) {
        if (!name) {
            let i = path.lastIndexOf('/')
            if (i >= 0) name = path.substring(i+1)
            else name = path
        }
        let nmod = this.mod.touch(name)
        nmod.fix(nmod, path, 'fix')
    }
    augment(mod, new Frame())

    mod.touch = touchFun(Mod)
    this.attach(mod)

    // container for traps
    var trap = function trap(key, data, chain) {
        return trap.echo(key, data, chain)
    }

    trap.echo = function(key, data, chain) {
        var fn = trap[key]
        if (isFun(fn)) {
            if (fn(data) === false) return false
        }

        if (chain) {
            // propagate event
            this._.mod._ls.forEach( m => {
                m.trap(key, data, chain)
            })
        }
        return true
    }

    augment(trap, new Frame())
    this.attach(trap)
}

Mod.prototype = new Frame()

Mod.prototype.init = function() {
    this.___ = this._ // save node context as parent mod
    this._ = this // must be in init, since it is assigned during the regular node.attach()
    if (!this.ctx) this.ctx = this.___.ctx // clone draw context from parent mod if not set explicitly
    this.inherit()
} 

Mod.prototype.start = function() {
    if (this.env.started) return
    this.inherit()

    if (isFun(this.setup)) {
        this.setup()
    } if (isFrame(this.setup)) {
        this.setup._ls.forEach( f => f() )
    }

    if (isFrame(this.mod)) this.mod._ls.forEach( mod => mod.start() )

    _scene.log.sys('starting evolution of [' + this.path() + ']')
    this.env.started = true
    this.status = 'started'
}

Mod.prototype.inherit = function() {
    supplement(this.sys, this.___.sys)
    supplement(this.log, this.___.log)
}

Mod.prototype.onAttached = function(node, name, parent) {
    if (this.__) this.__.onAttached(node, name, parent)
}

Mod.prototype.evo = function(dt) {
    // boot logic
    if (!this.env.started) {
        // try to find and evolve boot node or mod
        if (this.boot && isFun(this.boot.evo)) {
            this.boot.evo()
        }
        return
    }
    if (this.paused) return

    // evolve all entities in the lab
    this.lab._ls.forEach( e => {
        if (e.evo && !e.dead && !e.paused) e.evo(dt)
    });

    // evolve all mods
    this.mod._ls.map( function(m) {
        if (m.evo && !m.paused) m.evo(dt)
    });
}

Mod.prototype.draw = function() {
    if (!this.ctx || this.hidden) return

    // boot logic
    if (!this.env.started) {
        // try to find and draw boot node or mod
        if (isFun(this.boot)) {
            this.boot()
        } else if (this.boot && isFun(this.boot.draw)) {
            this.boot.draw()
        }
        return
    }

    // draw entities in the lab
    // we might integrate this mod display as a link in the mod list
    this.lab.draw()

    // draw mods
    for (let i = 0; i < this.mod._ls.length; i++) {
        let m = this.mod._ls[i]
        if (m.draw && !m.hidden) {
            m.draw()
        }
    }
}
/*
Mod.prototype.scan = function(target) {
    // normalize target
    if (!target) target = window

    let found = 0
    // search for declarations
    for (var key in target) {
        if (key.startsWith('_boot$')) {
            let node = target[key]
            if (isFun(node)) {
                found++
                _scene.log.sys('executing: ' + key)
                node(_scene)
                target[key] = false
            }

        } else if (key.startsWith('_patch$')) {
            let node = target[key]
            if (node) {
                found++
                let path = ''
                if (node._$patchAt) {
                    path = node._$patchAt
                    if (!path.endsWith('/')) path += '/'
                }
                for (var pkey in node) {
                    if (!pkey.startsWith('_')) {
                        let fullPath = path + pkey
                        let val = node[pkey]
                        if (val) {
                            _scene.log.sys('~~ ' + fullPath + ' << ' + (val._info? val._info : (val.name? val.name : '')))
                            _scene.patch(_scene, fullPath, val)
                        }
                    }
                }
                target[key] = false
            }
            
        } else if (key.indexOf('@') >= 0) {
            let node = target[key]
            if (node) {
                found++
                let path = key.substring(key.indexOf('@') + 1)
                _scene.log.sys('~~ ' + path + ' << ' + (node._info? node._info : (node.name? node.name : '')))
                _scene.patch(_scene, path, target[key])
                target[key] = false
            }
        } else if (key.startsWith('_$') && node && isString(node._$patchAt)) {
            found++
            let path = node._$patchAt
            _scene.log.sys('~~ ' + path + ' << ' + (val._info? val._info : (val.name? val.name : '')))
            _scene.patch(_scene, fullPath, val)
        }
        
        } else if (key.startsWith('_lib$')) {
            var node = target[key]
            var name = key.substring(4, key.length)
            if (node.name !== undefined) {
                name = node.name
            }
            _scene.patch('lib', name, node)
            target[key] = "loaded"

        } else if (key.startsWith('_env$')) {
            var node = target[key]
            var name = key.substring(4, key.length)
            if (node.name !== undefined) {
                name = node.name
            }
            _scene.patch('env', name, node)
            target[key] = "loaded"

        } else if (key.startsWith('_lab$')) {
            var node = target[key]
            var name = key.substring(4, key.length)
            if (node.name !== undefined) {
                name = node.name
            }
            _scene.patch('lab', name, node)
            target[key] = "loaded"
        }
    }
    return found
}
*/
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

    if (node !== undefined) {
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
                    target[path] = node
                    target._dir[path] = node
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

        // load resources if applicable
        if (isFun(node.onLoad)) {
            node.onLoad(this)
            node.onLoad = true // replace function with true, so we'd not call it second time
        }
    }
}

function getExtention(url) {
    return url.slice((Math.max(0, url.lastIndexOf(".")) || Infinity) + 1).toLowerCase();
}

function getNodeName(url) {
    const name = url.replace(/^.*[\\\/]/, '') // remove path
    return name.replace(/\.[^/.]+$/, '') // remove extension
}

function removeExtention(url) {
    return url.replace(/\.[^/.]+$/, '') // remove extension
}

function attachTTF(name, url) {
    const fontStyle = document.createElement('style');
    fontStyle.appendChild(document.createTextNode("\n\
    @font-face {\n\
        font-family: '" + name + "';\n\
        src: url('" + url + "'); \n\
    }\
    "));
    return document.head.appendChild(fontStyle)
}

function attachWAV(url) {
    // TODO autoplay wav -> .auto.wav (with auto classifier)
    const node = new Audio(url);
    node.preload = true;
    node.loop = false;
    node.autoplay = false;
    return node
}

function patchImg(_, batch, url, base, path, classifier, onLoad) {
    _.res._included ++

    var img = new Image()
    img.src = url
    img.onload = onLoad

    if (classifier && classifier.startsWith('map')) {
        let mx = classifier.substring(3)
        let wh = mx.split('x', 2)
        if (wh.length === 2) {
            let w = parseInt(wh[0])
            let h = parseInt(wh[1])
            _.res._execList[batch].push({
                origin: url,
                base: base,
                path: path,
                ext: 'fun',
                fun: function() {
                    let tileSet = new _scene.lib.img.TileSet(img, 0, 0, w, h)
                    _.patch(base, path, tileSet)
                }
            })
        }
    } else {
        _.patch(base, path, img)
    }
}

function scheduleLoad(_, batch, url, base, path, ext) {
    _.res._included ++
    // TODO randomize only in debug/develop mode
    // for production/static deployment it doesn't make sense
    const usrc = url + "?" + Math.random() // fix possible cache issue

    var ajax = new XMLHttpRequest()
    ajax.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                // json is loaded
                // store it in the exec list
                _.res._execList[batch].push({
                    origin: url,
                    path: path,
                    base: base,
                    ext: ext,
                    src: this.responseText,
                })
                _.res._onLoaded()
            } else {
                _.log.sys('loader-' + batch, 'unable to load ' + url)
            }
        }
    }
    ajax.open("GET", url, true);
    ajax.send();
}

Mod.prototype.batchLoad = function(batch, url, base, path) {
    const _ = this
    //_.log.sys('batch-#' + batch, 'url: ' + url + ' base: ' + base.name + ' path: ' + path)

    if (!_.res._execList[batch]) {
        _.res._execList[batch] = []
    }

    // TODO do we need this function at all?
    function onLoad() {
        _.res._onLoaded()
        /*
        // TODO on --debug-slow-network enable slow network loading simulation
        let max_wait = 10
        let delay = Math.floor(Math.random() * max_wait) * 1000
        setTimeout(function() {
            _.res._onLoaded()
        }, delay)
        */
    }

    const ext = getExtention(url)
    const nodeName = getNodeName(url)
    let name = nodeName
    let classifier = false // classifies additional actions, like .map12x12 etc...

    let i = nodeName.indexOf('.')
    if (i > 0) {
        name = nodeName.substring(0, i)
        classifier = nodeName.substring(i+1)
    }

    let pathName
    if (path) {
        pathName = path.replace(/^.*[\\\/]/, '') // remove path
        name = pathName
    }

    _.log.sys('loader-' + batch, ext + ': ' + url + ' -> ' + addPath(base.name, path))

    switch (ext) {
        case 'png': case 'jpge': case 'jpg':
            patchImg(_, batch, url, base, path, classifier, onLoad)
            break;

        case 'ttf':
            attachTTF(name, url)
            break;

        case 'wav':
            if (base) _.patch(base, path, attachWAV(url))
            break;

        case 'js': case 'json': case 'yaml':
        case 'txt': case 'prop': case 'lines': case 'csv':
            scheduleLoad(_, batch, url, base, path, ext)
            break;

        default:
            _.log.error('loader-' + batch, 'ignoring resource: [' + target + ']')

    }
}

// DEPRECATED
Mod.prototype.fixRes = function(target, base, ignore, batch, src, path) {
    if (path.startsWith(base)) {
        // refix without base
        path = path.substring(base.length)
        this.fixRes(target, base, ignore, batch, src, path)
    } else {
        //_scene.log.sys('fixer-'+batch+'!'+this.name, ': [' + src + '] -> ' + path)
        if (ignore && path.startsWith(ignore)) {
            _scene.log.sys('loader-'+batch, 'ignoring: [' + src + ']')
        } else {
            path = path.replace(/\..+$/, '');

            // determine target mod
            if (path.startsWith('mod')) {
                let i = path.indexOf('/', 4)
                if (i > 0) {
                    let modPath = path.substring(0, i)
                    let modName = path.substring(4, i)
                    // TODO fix mod loading
                    //path = path.substring(i+1)
                    let mod = this.mod._dir[modName]
                    if (!isFrame(mod)) {
                        mod = this.mod.touch(modName)
                    }
                    // load in other mod's context in the next batch
                    this.batchLoad(batch+1, mod, base + src, target, path)
                } else {
                    _scene.log.sys('loader-'+batch, 'ignoring: [' + src + ']')
                }
            } else if (path.startsWith('boot')) {
                let i = path.indexOf('/', 4)
                if (i > 0) {
                    let modPath = path.substring(0, i)
                    let modName = path.substring(4, i)
                    path = path.substring(i+1)
                    let boot = this._dir['boot']
                    if (!isFrame(boot)) {
                        boot = this.touch('boot')
                    }
                    // load in other mod's context in the previous batch
                    boot.batchLoad(batch-1, boot, base + src, boot, path)
                } else {
                    _scene.log.sys('loader-'+batch, 'ignoring: [' + src + ']')
                }

            } else {
                this.batchLoad(batch, this, base + src, target, path)
            }
        }
    }
}

// TODO provide topology path, so we can have just couple of topologies (sys and base)
//      topology must be failproof - if we got one, use it
//      don't overload many times
var modBatch = 0
// DEPRECATED
Mod.prototype.fix = function(target, base, ignore, forceBatch, onLoaded) {
    let batch
    if (forceBatch) {
        batch = forceBatch
    } else {
        batch = modBatch++ // load the next batch
    }

    // normalize base
    if (base.length > 0 && !base.endsWith('/')) {
        base = base + '/'
    }

    // get and process new topology for the given base at the target node
    this.log.sys('fix', target.name + ' <= ' + base)

    let currentMod = this

    // load collider.units definition
    let url = base + UNITS_JSON + "?" + Math.random() // fix possible cache issue
    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json()
            } else {
                _scene.log.err('loader', 'unable to load unit definitions from [' + url + ']')
            }
        })
        .then(json => {
            if (!json) return
            console.dir(json)
            //json.forEach(src => currentMod.fixRes(target, base, ignore, batch, src, src))
            //if (isFun(onLoaded)) onLoaded(
        })
        .catch(err => {
            _scene.log.err('loader', 'unable to load unit definitions from [' + url + ']')
        })
}

/*
Mod.prototype.loadRes = function(path, url) {
    //this.log.debug('loading [' + path + '] <= ' + url)
    this.batchLoad(1, url, this, path)
}
*/

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
    return url + '?' + Math.random()
}

function fixUnitMountPoint(unit) {
    unit.name = (unit.id
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
function queueUnit(unitsToLoad, loadingQueue) {
    if (unitsToLoad.length === 0) return

    let nexti = -1
    let nextUnit = null
    for (let i = 0; i < unitsToLoad.length; i++) {
        if (validateUnitRequirements(unitsToLoad[i], loadingQueue)) {
            nexti = i
            nextUnit = unitsToLoad[i]
            break;
        }
    }

    if (nexti >= 0) {
        unitsToLoad.splice(nexti, 1)
        loadingQueue.push(nextUnit)
        queueUnit(unitsToLoad, loadingQueue)
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
function prioritizeUnits(units) {
}

Mod.prototype.loadUnits = function(baseMod, target) {
    target = normalizeDirPath(target)
    this.log.sys('loader', '[' + this.name + '] loading: [' + baseMod.name + '] <= [' + target + ']') 
    // TODO check that baseMod is actually a mod?
    let currentMod = baseMod
    let loaderMod = this

    // load collider.units definition
    let url = randomizeUrl(addPath(target, UNITS_JSON))
    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json()
            } else {
                this.log.err('loader', 'unable to load unit definitions from [' + url + ']')
            }
        })
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
            queueUnit(unitsToLoad, loadQueue)
            loaderMod.log.sys('units loading order: ' + loadQueue.map(u => u.id).join(', '))

            // schedule the loading
            let batch = 0
            loadQueue.forEach(unit => {
                const ls = unit.ls
                ls.forEach(resLocalUrl => {
                    const targetPath = addPath(unit.mount, removeExtention(resLocalUrl))
                    const url = addPath(unit.id, resLocalUrl)
                    loaderMod.batchLoad(batch, url, currentMod, targetPath)
                })
                batch++
            })
        })
        .catch(err => {
            console.log(err)
            _scene.log.err('loader', 'errors on units loading')
        })
}

// ***********************
// collider scene construction
var _scene = new Mod()
_scene.name = '/'
_scene._ = _scene // set the context
_scene._$ = _scene // root context
_scene.__ = false // don't have any parents
_scene.___ = _scene// parent context
_scene.inherit = function() {}

/*
_scene.path = function() {
    return '/'
}
*/

// augment with env from the global scope
// TODO need to move for later - once everything is loaded and populated
// TODO disable for now - need to figure out if we need that at all
//augment(_scene.env, window['_env$'])

// ***
// log
_scene.attach(new Frame({
    name: 'log',
    err: function(msg, post) {
        post? console.log('! [' + msg + '] ' + post) : console.log('! ' + msg) 
    },
    warn: function(msg, post) {
        post? console.log('? [' + msg + '] ' + post) : console.log('? ' + msg) 
    },
    out: function(msg, post) {
        post? console.log('> [' + msg + '] ' + post) : console.log('> ' + msg) 
    },
    debug: function(msg, post) {
        post? console.log('# [' + msg + '] ' + post) : console.log('# ' + msg) 
    },
    sys: function(msg, post) {
        post? console.log('$ [' + msg + '] ' + post) : console.log('$ ' + msg) 
    },
    dump: function(obj) {
        console.dir(obj)
    },
}))

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
_scene.attach(new Frame({
    name: "sys",
}))
_scene.sys.attach(mix)
_scene.sys.attach(augment)
_scene.sys.attach(supplement)
_scene.sys.attach(before)
_scene.sys.attach(after)

_scene.sys.attach(Frame)
_scene.sys.attach(LabFrame)

_scene.sys.attach(isObj)
_scene.sys.attach(isFun)
_scene.sys.attach(isNumber)
_scene.sys.attach(isString)
_scene.sys.attach(isArray)
_scene.sys.attach(isMutable)
_scene.sys.attach(isFrame)

_scene.env.TARGET_FPS = 60
_scene.env.MAX_EVO_STEP = 0.01
_scene.env.MAX_EVO_PER_CYCLE = 0.3
_scene.env.lastFrame = Date.now()
_scene.env.mouseX = 0
_scene.env.mouseY = 0
_scene.env.mouseLX = 0
_scene.env.mouseLY = 0
_scene.env.keys = {}  // down key set

// *****************************************************
// LIFECYCLE
// main scene lifecycle - bootstrap, cycle[evo, draw]
//
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

        // style body
        document.body.style.margin = "0"
        document.body.style.padding = "0"
        document.body.style.overflow = "hiddenq";
        document.body.setAttribute("scroll", "no");
    }
    _scene.ctx = canvas.getContext("2d")

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

    /*
    // TODO turn for --full-screen startup tag
    // TODO add isFun checks
    canvas.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT); //Chrome
    canvas.mozRequestFullScreen(); //Firefox
    canvas.msRequestFullscreen();
    canvas.requestFullscreen();
    */
    startCycle()
}

function startCycle() {
    expandCanvas(canvasName)
    focus()
    setInterval(focus, 100)

    // initiate the game loop
    console.log('*** [jam] starting main cycle ***')
    window.requestAnimFrame(cycle)
    /*
    // old-fasioned way to setup animation
    if (!_scene.env.TARGET_FPS) {
        setInterval(cycle, 1)
    } else {
        setInterval(cycle, 1000/_scene.env.TARGET_FPS)
    }
    */
}

// > implement 'keepOriginalAspectRatio'&'aspectRatio' option
function expandCanvas(name) {
    if (_scene.env.canvasStyle === 'preserve') {
        var canvas = document.getElementById(name)
        _scene.env.width = _scene.ctx.width = canvas.width
        _scene.env.height = _scene.ctx.height = canvas.height
        _scene.draw() // it doesn't work without forced redraw
    } else {
        // default full-screen canvas
        var canvas = document.getElementById(name)
        var newWidth = window.innerWidth
        var newHeight = window.innerHeight
        _scene.env.width = _scene.ctx.width = canvas.width = newWidth
        _scene.env.height = _scene.ctx.height = canvas.height = newHeight
        canvas.style.width = newWidth + 'px'
        canvas.style.height = newHeight + 'px'
        _scene.draw() // it doesn't work without forced redraw
    }
}

function expandView() {
    // TODO modify to support multiple canvases and custom resize
    expandCanvas(canvasName)
}


// ******************************************************
function cycle() {
    var now = Date.now()
    var dt = (now - _scene.env.lastFrame)/1000

    // show, react and update cycle
    _scene.draw()

    // max evolution threshold
    if (dt > _scene.env.MAX_EVO_PER_CYCLE) {
        dt = _scene.env.MAX_EVO_PER_CYCLE
    }

    // evolve multiple times in small quants
    // to compensate possible lag due to rendering delays
    while(dt > 0) {
        if (dt > _scene.env.MAX_EVO_STEP) {
            _scene.evo(_scene.env.MAX_EVO_STEP);
        } else {
            _scene.evo(dt);
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

    _scene.env.mouseLX = _scene.env.mouseX
    _scene.env.mouseLY = _scene.env.mouseY
    _scene.env.mouseX = e.pageX
    _scene.env.mouseY = e.pageY

    _scene.trap('mouseMove', e, true)
    e.preventDefault()
    e.stopPropagation()
    return false;
}

function handleMouseWheel(e) {
    _scene.trap('mouseWheel', e, true)
    return false;
}

function handleMouseDown(e) {
    _scene.trap('mouseDown', e, true)
    e.preventDefault()
    e.stopPropagation()
    return false;
}

function handleMouseUp(e) {
    _scene.trap('mouseUp', e, true)
    e.preventDefault()
    e.stopPropagation()
    return false;
}

function handleMouseClick(e) {
    _scene.trap('click', e, true)
    e.preventDefault()
    e.stopPropagation()
    return false;
}

function handleMouseDoubleClick(e) {
    _scene.trap('dblClick', e, true)
    e.preventDefault()
    e.stopPropagation()
    return false;
}

function handleMouseOut(e) {
    for (var k in _scene.env.keys) {
        delete _scene.env.keys[k]
    }
    _scene.trap('mouseOut', e, true)
}

function handleContextMenu(e) {
    _scene.trap('mouseContext', e, true)
    e.preventDefault()
    e.stopPropagation()
    return false;
}

function handleKeyDown(e) {
    var code = e.which || e.keyCode

    _scene.env.keys[code] = 1
    let ename = e.code.toLowerCase() + 'Down'

    let chain = _scene.trap(ename, e, true)
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
    var code = e.which || e.keyCode
    delete _scene.env.keys[code]

    let ename = e.code.toLowerCase() + 'Up'

    let chain = _scene.trap(ename, e, true)
    if (chain) {
        chain = _scene.trap('keyUp', e, true)
    }

    if (!chain)  {
        e.preventDefault()
        e.stopPropagation()
        return false;
    }
    return true
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

        _scene.log.sys('=== Environment ===')
        _scene.log.sys('BASENAME: ' + _scene.env.basename)
        _scene.log.sys('SYSPATH: ' + _scene.env.syspath)
        _scene.log.sys('BASEPATH: ' + _scene.env.basepath)
        _scene.log.sys('TITLE: ' + _scene.env.title)
        break;
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
    target.onload = bootstrap
    target.onmousedown = handleMouseDown
    target.onmouseup = handleMouseUp
    target.onclick = handleMouseClick
    target.onmouseout = handleMouseOut
    target.ondblclick = handleMouseDoubleClick
    target.oncontextmenu = handleContextMenu
    target.onmousemove = handleMouseMove
    target.onkeydown = handleKeyDown
    target.onkeyup = handleKeyUp
    target.addEventListener('wheel', handleMouseWheel)
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
            window.setTimeout(callback, 1000/_scene.env.TARGET_FPS);
         };
})();

return _scene;

}(window))
