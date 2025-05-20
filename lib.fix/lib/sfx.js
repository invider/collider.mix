// play sound effect with optional volume and panorama settings
module.exports = function sfx(src, vol, pan) {
    if (!_.___.env._touched) {
        _.log.sys(`[sfx:${isStr(src)? src : src.name}]`, `ignoring - no user interaction`)
        return
    }
    if (!pan) pan = 0
    if (!vol) vol = 1
    if (isNum(_.env.sfxVolume)) {
        vol *= _.env.sfxVolume
    }

    if (isStr(src)) {
        // find by path in resources
        src = _.res.selectOne(src)
    }

    if (src && (src instanceof Audio
                || src instanceof HTMLAudioElement)
            && src.readyState >= 2) {
    
        if (src.channels) {
            const next = src.channels.sfx[src.channels.cur++]
            if (src.channels.cur >= src.channels.sfx.length) {
                src.channels.cur = 0
            }
            src = next

        } else if (!src.ended || (src.currentTime > 0 && src.currentTime < src.duration)) {
            src.channels = {
                cur: 0,
                sfx: [],
            }
            for (let i = 0; i < 16; i++) {
                src.channels.sfx.push(new Audio(src.src))
            }
            src.currentTime = 0

        }
        src.volume = vol
        src.play()
    }
}
