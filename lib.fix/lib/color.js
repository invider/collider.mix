const black  = '#000000'
const white  = '#ffffff'
const gray   = '#808080'
const red    = '#ff0000'
const green  = '#00ff00'
const blue   = '#0000ff'
const yellow = '#ffff00'
const cyan   = '#00ffff'
const pink   = '#ff00ff'

function color2RGBA(c) {
    if (c.startsWith('#')) c = c.substring(1)
    const R = parseInt(c.substring(0, 2), 16)
    const G = parseInt(c.substring(2, 4), 16)
    const B = parseInt(c.substring(4, 6), 16)
    let A = 255
    if (c.length > 6) A = parseInt(c.substring(6, 8), 16)
    return [R, G, B, A]
}

function color2rgba(c) {
    if (c.startsWith('#')) c = c.substring(1)
    const R = parseInt(c.substring(0, 2), 16)
    const G = parseInt(c.substring(2, 4), 16)
    const B = parseInt(c.substring(4, 6), 16)
    let A = 255
    if (c.length > 6) A = parseInt(c.substring(6, 8), 16)
    return [R/255, G/255, B/255, A/255]
}

function rgb2hsl(r, g, b) {
    // find greatest and smallest channel values
    const cmin = Math.min(r,g,b)
    const cmax = Math.max(r,g,b)
    const delta = cmax - cmin
    let h = 0, s = 0, l = 0

    // hue
    if (delta == 0) h = 0;
    else if (cmax == r) h = ((g - b) / delta) % 6
    else if (cmax == g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4;
    //h = Math.round(h * 60);
    h = h / 6
    if (h < 0) h += 1

    // lightness
    l = (cmax + cmin) / 2

    // saturation
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

    // multiply l and s by 100
    s = Math.min(Math.abs(s), 1)
    l = Math.min(Math.abs(l), 1)

    //s = Math.min(+(s * 100).toFixed(1), 100)
    //l = Math.min(+(l * 100).toFixed(1), 100)

    //return "hsl(" + h + "," + s + "%," + l + "%)"
    return [h, s, l]
}

function RGB2HSL(r, g, b) {
    r /= 255
    g /= 255
    b /= 255

    // find greatest and smallest channel values
    const cmin = Math.min(r,g,b)
    const cmax = Math.max(r,g,b)
    const delta = cmax - cmin
    let h = 0, s = 0, l = 0

    // hue
    if (delta == 0) h = 0;
    else if (cmax == r) h = ((g - b) / delta) % 6
    else if (cmax == g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);

    // make negative hues positive behind 360°
    if (h < 0) h += 360

    // lightness
    l = (cmax + cmin) / 2

    // saturation
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

    // multiply l and s by 100
    s = Math.min(+(s * 100).toFixed(1), 100)
    l = Math.min(+(l * 100).toFixed(1), 100)

    //return "hsl(" + h + "," + s + "%," + l + "%)"
    return [h, s, l]
}


function lighten(c, factor) {
    const crgba = color2rgba(c)
    const chsl = rgb2hsl(crgba[0], crgba[1], crgba[2])
    chsl[2] = clamp(chsl[2] * factor, 0, 1)
    return hsl(chsl[0], chsl[1], chsl[2])
}

function saturate(c, factor) {
    const crgba = color2rgba(c)
    const chsl = rgb2hsl(crgba[0], crgba[1], crgba[2])
    chsl[1] = clamp(chsl[1] * factor, 0, 1)
    return hsl(chsl[0], chsl[1], chsl[2])
}

function shiftHue(c, shift) {
    const crgba = color2rgba(c)
    const chsl = rgb2hsl(crgba[0], crgba[1], crgba[2])
    chsl[0] = Math.abs((chsl[0] + shift) % 1)
    return hsl(chsl[0], chsl[1], chsl[2])
}
