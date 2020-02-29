'use strict'

function selectStyle(source, loc, name, ext, fullName) {

    // style from local directory
    let val = source[fullName]
    if (val === undefined) val = source[name]

    // check substyle
    if (loc.length > 0) {
        const nextSource = source[loc[0]]
        if (sys.isObj(nextSource)) {
            let nextVal = selectStyle(nextSource, loc.splice(1), name, ext, fullName)
            if (nextVal !== undefined) val = nextVal
        }
    }

    return val
}

module.exports = {

    style: function(path, source) {
        // extract namd and extension from path
        const fullName = path.replace(/^.*[\\\/]/, '') // remove path
        let ext = fullName.match(/\.[^/.]+$/)
        if (ext) ext = ext[0].substring(1)
        const name = ext? fullName.substring(0, fullName.length - ext.length - 1) : fullName

        const loc = path.substring(0, path.length - fullName.length - 1).split('/')

        source = source? source : env.hud
        let val = selectStyle(env.hud, loc, name, ext, fullName)

        if (val === undefined) {
            log.out('picking defaults for ' + path)
            switch(name) {
            case 'base': val = '#002b36'; break;
            case 'content': val = '#657b83'; break;
            case 'font': val = '16px sans serif'; break;
            case 'line': val = 2; break;
            }
        }

        return val
    },

    line: function(x1, y1, x2, y2) {
    },

    rect: function(x, y, w, h) {
    },

    panel: function(x, y, w, h) {
    },

    button: function(x, y, w, h) {
    },

}
