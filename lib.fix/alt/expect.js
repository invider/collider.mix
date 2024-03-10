function isTypedArray(val) {
    const TypedArray = Object.getPrototypeOf(Uint8Array)
    return (val instanceof TypedArray)
}

function expect(tar, title, up, upTitle) {
    const tag = title? `[${title} == ${tar}]` : `${tar}`
    const stag = title? `[${title}] ` : ``

    return {
        EPSILON: 0.001,
        toBe: function(val) {
            if (tar !== val) throw new Error(`${tag} is expected to be [${val}]`)
            return this
        },
        toBeNear: function(val, epsilon) {
            epsilon = epsilon || this.EPSILON
            if (Math.abs(tar - val) > epsilon)  throw new Error(`${tag} is expected to be near [${val}] (precision: ${epsilon})`)
            return this
        },
        isNull: function() {
            if (tar != null) throw new Error(`${tag} is expected to be null`)
            return this
        },
        isUndefined: function() {
            if (typeof tar !== 'undefined') throw new Error(`${tag} is expected to be undefined`)
            return this
        },
        isNumber: function() {
            if (typeof tar !== 'number' || isNaN(tar)) throw new Error(`${tag} is expected to be a number`)
            return this
        },
        isString: function() {
            if (typeof tar !== 'string') throw new Error(`${tag} is expected to be a string`)
            return this
        },
        isFunction: function() {
            if (typeof tar !== 'function') throw new Error(`${tag} is expected to be a function`)
            return this
        },
        isObject: function() {
            if (typeof tar !== 'object' || Array.isArray(tar) || tar === null) {
                throw new Error(`${tag} is expected to be an object`)
            }
            return this
        },
        isAnyObject: function() {
            if (typeof tar !== 'object' || tar === null) {
                throw new Error(`${tag} is expected to be any object or array`)
            }
            return this
        },
        isArray: function() {
            if (!Array.isArray(tar)) throw new Error(`${tag} is expected to be an array`)
            return this
        },
        isTypedArray: function() {
            const TypedArray = Object.getPrototypeOf(Uint8Array)
            if (!(tar instanceof TypedArray)) throw new Error(`${tag} is expected to be a typed array`)
            return this
        },
        isAnyArray: function() {
            const TypedArray = Object.getPrototypeOf(Uint8Array)
            if (!Array.isArray(tar) && !(tar instanceof TypedArray)) throw new Error(`${tag} is expected to be any array`)
            return this
        },

        notNull: function() {
            if (tar == null) throw new Error(`value is expected, but ${tag} found`)
            return this
        },
        eachNotNull: function() {
            if (tar == null) throw new Error(`value is expected, but ${tag} found`)
            if (!Array.isArray(tar)) throw new Error(`array value is expected`)

            for (let i = 0; i < tar.length; i++) {
                const e = tar[i]
                if (e == null) throw new Error(`value is expected, but [${e}] found at #${i}`)
            }
            return this
        },

        prop: function(name) {
            if (!tar || typeof tar !== 'object') {
                throw new Error(`${tag} is expected to be an object for prop access`)
            }
            return expect(tar[name], `${title}[${name}]`, tar, title)
        },

        element: function(index) {
            if (!tar || (!Array.isArray(tar) && !isTypedArray(tar))) {
                throw new Error(`${tag} is expected to be an array or a typed array to access elements by index`)
            }
            return expect(tar[index], `${title}[${index}]`, tar, title)
        },

        up: function() {
            if (!up) throw new Error(`can't move up from here!`)
            return expect(up, upTitle)
        },

        forEach: function(fn) {
            if (tar == null) throw new Error(`value is expected, but ${tag} found`)
            if (!Array.isArray(tar)) throw new Error(`${stag}array value is expected`)
            if (typeof fn !== 'function') throw new Error(`${stag}apply function is expected in forEach(fn)`)

            for (let i = 0; i < tar.length; i++) {
                const e = tar[i]
                fn(expect(e, title))
            }
            return this
        },
        value: function() {
            return tar
        },
    }
}

if (module) module.exports = expect
