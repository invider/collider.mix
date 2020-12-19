// select the next element from the array
// @param {array} ls - the source array
// @param {object} cur - current element
// @param {function} predicate - an optional filter
// @returns {object} - the selected element, undefined if nothing found
function next(ls, cur, predicate) {
    let i = 0
    if (cur) i = ls.indexOf(cur) + 1
    const start = i

    let next
    do {
        const e = ls[i++]
        if (e) {
            if (isFun(predicate)) {
                if (predicate(e)) next = e
            } else {
                next = e
            }
        }
    } while (!next && i < ls.length)

    if (!next) {
        // haven't found after cur, try from the beginning
        i = 0
        do {
            const e = ls[i++]
            if (e) {
                if (isFun(predicate)) {
                    if (predicate(e)) next = e
                } else {
                    next = e
                }
            }
        } while (!next && i < start)
    }
    return next
}

// select the previous element from the array
// @param {array} ls - the source array
// @param {object} cur - current element
// @param {function} predicate - an optional filter
// @returns {object} - the selected element, undefined if nothing found
function prev(ls, cur, predicate) {
    let i = ls.length - 1
    if (cur) i = ls.indexOf(cur) - 1
    if (i < 0) i = ls.length - 1
    const start = i

    let next
    do {
        const e = ls[i--]
        if (e) {
            if (isFun(predicate)) {
                if (predicate(e)) next = e
            } else {
                next = e
            }
        }
    } while (!next && i >= 0)

    if (!next) {
        // haven't found before cur, try from the end
        i = ls.length - 1
        do {
            const e = ls[i--]
            if (e) {
                if (isFun(predicate)) {
                    if (predicate(e)) next = e
                } else {
                    next = e
                }
            }
        } while (!next && i > start)
    }
    return next
}
