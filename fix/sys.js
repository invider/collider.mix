/**
 * @alias sys
 */
module.exports = {
    _info: 'system functions',
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

    // select from arbitrary object
    select: function(target, path) {
        // TODO select from any object recursively
    },

    attach: function(target, element) {
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

    spawn: function(source, spawnData, target, sbase, tbase) {
        if (!sbase) sbase = 'dna/'
        if (!tbase) tbase = 'lab/'

        let cons = source
        if (this._.sys.isString(source)) {
            cons = this._.selectOne(sbase + source)
            if (!isFun(cons) && !isObj(cons)) {
                // look up in the root mod
                cons = this._._$.selectOne(sbase + source)
            }
            if (!isFun(cons) && !isObj(cons)) throw "can't find the spawn dna: "
                + this._.name + '/' + sbase + source
        }

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

        //if (!sys.isFrame(dest)) return false
        /*
        this._.log.debug('~~~ spawning @'
            + this._.name + ':' + sbase + source + ' -> '
            + tbase + target)
        */

        if (sys.isFun(cons)) {
            // source is function - constructor or factory
            if (/[A-Z]/.test(cons.name[0])) {
                // uppercase means constructor
                let res = new cons(spawnData)
                sys.attach(dest, res)
                return res
            } else {
                // lowercase means factory
                let res = cons(spawnData)
                return sys.attach(dest, res)
            }
        } else if (sys.isObj(cons)) {
            if (isFun(cons.spawn)) {
                // spawn() factory function
                return sys.attach(dest, cons.spawn(spawnData))
            } else {
                return sys.attach(dest, this.clone(cons))
            }
        } else {
            return false
        }
    },

    // TODO maybe work on tree instead of generic?
    clone: function(obj, meta) {
        if (!this.isObj(obj)) return
        if (this.isFun(obj.clone)) return obj.clone(meta)

        // buffer and replace mod and parent links
        // to avoid circular links
        let _ = obj._
        let __ = obj.__
        obj._ = null
        obj.__ = null

        const clone = Object.create(Object.getPrototypeOf(obj))
        let data = JSON.parse(JSON.stringify(obj))
        this.augment(clone, data)
        Object.keys(obj).forEach(k => {
            if (isFun(obj[k])) clone[k] = obj[k]
        })

        this.augment(clone, meta)

        // restore links on original object
        obj._ = _
        obj.__ = __

        return clone
    },

    extend: function(child, parent){
        child.prototype = Object.create(parent.prototype);
        child.prototype.constructor = child;
        child.prototype.__super__ = parent
        child.prototype.__superProto__ = parent.prototype
    },

    path: function(node) {
        if (!node || !this.isObj(node) || !this.isObj(node.__)) return ''
        if (node.__.name === '/') return this.getName(node)
        return this.path(node.__) + '/' + this.getName(node)
    },

    getName: function(node) {
        if (!node || !this.isObj(node)) return '?'
        if (this.isString(node.name)) return node.name
        if (this.isObj(node.__)) return '#' + node.__._ls.indexOf(node)
        return '?'
    }
}

