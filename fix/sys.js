/**
 * core system functions
 * @alias sys
 */
module.exports = {

    // copy source nodes to the target destination
    cp: function(source, target) {
        _.log.sys('copying ' + source + ' -> ' + target)

        let list = this._.select(source)
        if (list.length === 0) return false
        let dest 
        if (this._.sys.isString(target)) {
            dest = this._.select(target)
            if (dest.length !== 1) return false // can't copy if no node or more than one found
            dest = dest[0]
        } else {
            dest = target
        }

        if (!this._.sys.isFrame(dest)) return false
        list.forEach( function(e) {
            dest.attach(e)
        })
        return list.length
    },

    /*
    // and what can we do with name shaddowing? select is already in Frame
    // select from arbitrary object
    select: function(target, path) {
        // TODO select from any object recursively
    },
    */

    // attach an element to the specified target
    attachNode: function(target, element) {
        if (isFrame(target)) {
            target.attach(element)
        } else if (isArray(target)) {
            target.push(element)
        } else if (isObj(target)) {
            let name = element.name
            if (!name) throw "can't attach unnamed element to object!"
            target[name] = element
            element.__ = target
        }
        return element
    },

    construct: function(source, spawnData, sbase) {
        if (sbase === undefined) sbase = 'dna/'

        let res

        let path
        let cons = source
        if (this._.sys.isString(source)) {
            path = this.addPath(sbase, source)
            cons = this._.selectOne(path)

            if (!isFun(cons) && !isObj(cons)) {
                // look up in the root mod
                cons = this._._$.selectOne(sbase + source)
            }
            if (!isFun(cons) && !isObj(cons)) throw "can't find the spawn dna: "
                + this._.name + '/' + sbase + source
        }
        if (!cons) throw `can't find the spawn dna: ${source}`

        if (sys.isFun(cons)) {
            // source is function - constructor or factory
            if (/[A-Z]/.test(cons.name[0])) {
                // uppercase means constructor
                res = new cons(spawnData)
                res._dna = cons.name
                //return sys.attachNode(dest, res)
            } else {
                // lowercase means factory
                res = cons(spawnData)
                res._dna = cons.name
                //return sys.attachNode(dest, res)
            }
        } else if (sys.isObj(cons)) {
            if (isFun(cons.spawn)) {
                // spawn() factory function
                //return sys.attachNode(dest, cons.spawn(spawnData))
                res = cons.spawn(spawnData)

            } else {
                //return sys.attachNode(dest, this.clone(cons, spawnData))
                res = this.clone(cons, spawnData)
            }
        }

        if (res && env.config && env.config.flow) {
            const descriptor = {
                source: path,
                cons: cons,
                entity: res,
            }
            this.spawnCache.push(descriptor)
        }

        return res
    },

    spawnCache: {
        cache: [],
        push: function(descr) {
            this.cache.push(descr)
        },
        lookupKids: function(cons) {
            const res = []
            const cache = this.cache
            for (let i = 0, l = cache.length; i < l; i++) {
                const d = cache[i]
                if (d.cons == cons) res.push(d)
            }
            return res
        },
    },

    // spawn an entity with provided constructor data
    spawn: function(source, spawnData, target, sbase, tbase) {
        if (tbase === undefined) tbase = 'lab/'

        let dest = target
        if (!target || target === '') {
            dest = this._.lab
        } else if (this._.sys.isString(target)) {
            dest = this._.select(tbase + target)
            if (dest.length === 0) throw "can't find the spawn target: "
                + this._.name + tbase + target
            if (dest.length > 1) throw "ambiguous target for the spawn: "
                + tbase + target
            dest = dest[0]
        }

        const entity = this.construct(source, spawnData, sbase)
        if (entity === undefined) return false

        return sys.attachNode(dest, entity)

        //if (!sys.isFrame(dest)) return false
        /*
        this._.log.debug('~~~ spawning @'
            + this._.name + ':' + sbase + source + ' -> '
            + tbase + target)
        */
    },

    //
    // clone the object and augment it with metadata
    //
    // TODO maybe work on tree instead of generic?
    clone: function(obj, meta) {
        if (!this.isObj(obj)) return
        if (this.isFun(obj.clone)) return obj.clone(meta)

        const clone = Object.create(Object.getPrototypeOf(obj))
        let data = JSON.parse(JSON.stringify(obj))
        this.augment(clone, data)
        Object.keys(obj).forEach(k => {
            if (isFun(obj[k])) clone[k] = obj[k]
        })

        if (isFun(clone.onSpawn)) {
            clone.onSpawn(meta)
        } else {
            this.augment(clone, meta)
        }

        return clone
    },

    // extend a child object from the parent prototype
    extend: function(child, parent){
        child.prototype = Object.create(parent.prototype);
        child.prototype.constructor = child;
        child.prototype.__super__ = parent
        child.prototype.__superProto__ = parent.prototype
    },

    // find absolute path of the node
    path: function(node) {
        if (!node || !this.isObj(node) || !this.isObj(node.__)) return ''
        if (node.__.name === '/') return this.getName(node)
        return this.path(node.__) + '/' + this.getName(node)
    },

    // determine node's name
    //
    // Node's own ['name'] property is considered as a priority.
    // Otherwise returns an index in the parent _ls (???)
    // TODO maybe try to locate in _dir first?
    //
    getName: function(node) {
        if (!node || !this.isObj(node)) return '?'
        if (this.isString(node.name)) return node.name
        if (this.isObj(node.__)) return '#' + node.__._ls.indexOf(node)
        return '?'
    },

    // trigger an event and call all handlers in lab/
    on: function(name, st) {
        name = 'on' + name.substring(0, 1).toUpperCase() + name.substring(1)
        lab.applyAll((node) => {
            if (isFun(node[name])) {
                node[name](st)
            }
        })
    },

    textSurface: false,

    createTextSurface: function() {
        const _ = this.__.getMod()

        const hud = _.lab.spawn(dna.hud.Hud, {
            name: 'textHud',
        })
        const con = hud.spawn(dna.hud.gadget.Console, {
            name: 'console',
            border: 40,
            adjust: function() {
                const br = this.border
                this.x = br
                this.y = br
                this.resize(rx(1) - 2*br, ry(1) - 2*br)
            },

            resolvers: [],

            onCommand: function(cmd) {
                if (this.resolvers.length === 0) return
                const resolve = this.resolvers.shift()
                resolve(cmd)
            },
        })
        this.textSurface = con
    },

    print: function(msg) {
        if (!this.textSurface) this.createTextSurface()
        this.textSurface.print(msg)
    },

    input: async function(msg) {
        if (!this.textSurface) this.createTextSurface()
        msg = msg || ''

        const textSurface = this.textSurface
        textSurface.__.captureFocus(textSurface)
        //textSurface.echo(msg)

        return new Promise(resolve => {
            textSurface.resolvers.push(resolve)
        })
    },

    ask: function(msg) {
        return this.input(msg)
    },

    say: function(msg) {
        return this.print(msg)
    },

    cls: function() {
        if (!this.textSurface) return
        this.textSurface.clear()
    },
}

