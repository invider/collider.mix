// transform an entity to data object
// Useful for persistence.
// @param {object} entity - source entity object
// @param {array/string} exclude - list of entities to exclude
// @returns {object} - data object without functions and excluded keys
function toData(entity, exclude) {
    const out = {}
    Object.keys(entity).forEach(k => {
        if (exclude && exclude.indexOf(k) >= 0) return // skipping
        const o = entity[k]
        if (isFun(o)) return
        out[k] = o
    })
    return out
}

// transfer object to a json data url
function toJsonURL(obj) {
    return "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, 4))
}

// transfer a string to a text data url
function toPlainTextURL(txt) {
    return "data:text/plain;charset=utf-8," + encodeURIComponent(txt)
}

// download a data url by creating a hyperlink and clicking it
function downloadDataURL(dataURL, name, ext) {
    name = name || 'data'
    if (!ext) ext = ''
    else ext = '.' + ext
    let a  = document.createElement('a');
    a.href = dataURL;
    a.download = name + ext
    a.click()
}

