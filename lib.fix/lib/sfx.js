// play sound effect with optional volume and panorama settings
// TODO take from mod scope functions?
module.exports = function(src, vol, pan) {
    if (!pan) pan = 0
    if (!vol) vol = 1
    if (sys.isNumber(env.sfxVolume)) {
        vol *= env.sfxVolume
    }

    if (isString(src)) {
        // find by path in resources
        src = _.res.selectOne(src)
    }

    if (src && (src instanceof Audio
                || src instanceof HTMLAudioElement)
            && src.readyState >= 2) {
        src.volume = vol
        src.play()
    }
}
