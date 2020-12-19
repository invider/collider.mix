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
