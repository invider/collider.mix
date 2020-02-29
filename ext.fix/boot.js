'use strict'

let base = '#151208'
let content = '#a05020'
let contentLow = '#402010'
let fadeBase = '#000000'

let hold = 1
let fade = 1
let wait = 0.5

let time = 0
let state = 'loading'

module.exports = {

    init: function() {
        if (env.config.boot) {
            const bt = env.config.boot
            hold = bt.hold || hold
            fade = bt.fade || fade
            wait = bt.wait || wait
            base = bt.base || base
            content = bt.content || content
            contentLow = bt.contentLow || contentLow
            fadeBase = bt.fadeBase || fadeBase
        }
    },

    evo: function(dt) {
        time += dt

        switch (state) {
        case 'loading':
            if (env._started) {
                state = 'holding'
            }
            break;

        case 'holding':
            if (time >= hold) {
                time = 0
                state = 'fade'
            }
            break;

        case 'fade':
            if (time >= fade) {
                time = 0
                state = 'wait'
            }
            break;

        case 'wait':
            if (time >= wait) {
                state = 'self-destruct'
            }
            break;

        case 'self-destruct':
            kill(this)
            break;
        }
    },

    draw: function() {

        if (state === 'wait' || state === 'self-destruct') {
            background(fadeBase)
            return
        }

        ctx.save()
        background(base)

        let loaded = this._.___.res._loaded
        let included = this._.___.res._included
        let percent = Math.round((loaded/included) * 100)

        ctx.textBaseline = 'center'
        ctx.textAlign = 'center'
        ctx.font = '24px moon'
        ctx.fillStyle = content

        // text status
        //let progress = '' + loaded + '/' + included + ' '
        //ctx.fillText(progress, ctx.width/2, ctx.height/2)

        // percent status
        ctx.fillText(percent + '%', ctx.width/2, ctx.height/2)

        // bar status
        let w = ctx.width*0.8
        let h = 10
        ctx.fillStyle = contentLow
        ctx.fillRect((ctx.width-w)/2, ctx.height/2 + 20, w, h)
        ctx.fillStyle = content
        ctx.fillRect((ctx.width-w)/2, ctx.height/2 + 20, w*(percent/100), h)

        ctx.textBaseline = 'center'
        ctx.textAlign = 'center'
        ctx.font = '24px moon'
        ctx.fillStyle = content
        ctx.fillText('Powered by Collider.JAM', ctx.width/2, ctx.height - 50)

        if (state === 'fade') {
            ctx.globalAlpha = time/fade
            background(fadeBase)
        }

        ctx.restore()
    }

}
