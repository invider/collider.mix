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
