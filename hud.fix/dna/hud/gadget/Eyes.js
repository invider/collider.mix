'use strict'

const Eyes = function(dat) {
    this.x = ctx.width/2 - 40
    this.y = ctx.height/2 - 25
    this.w = 80 
    this.h = 50
    this.pad = 5
    this.pupilR = 6 
    this.pupilS = 8 
    sys.augment(this, dat)
}

Eyes.prototype.draw = function() {
    ctx.fillStyle = '#202020'
    ctx.fillRect(this.x, this.y, this.w, this.h)

    // calculate base points and dimensions
    const hr = this.w/4 - this.pad
    const vr = this.h/2 - this.pad
    const cx1 = this.x + (this.w/2 - hr - this.pad)
    const cx2 = this.x + (this.w/2 + hr + this.pad)
    const cy = this.y + (this.h/2)

    // eyeballs
    ctx.fillStyle = '#ffffff'

    ctx.beginPath();
    ctx.ellipse(cx1, cy, hr, vr, 0, 0, 2*Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx2, cy, hr, vr, 0, 0, 2*Math.PI);
    ctx.fill();

    // pupils
    ctx.fillStyle = '#000000'

    const a1 = bearing(cx1, cy, mouse.x, mouse.y)
    ctx.beginPath();
    ctx.arc(cx1 + Math.sin(a1)*this.pupilS, cy + Math.cos(a1)*this.pupilS, this.pupilR, 0, 2*Math.PI);
    ctx.fill();

    const a2 = bearing(cx2, cy, mouse.x, mouse.y)
    ctx.beginPath();
    ctx.arc(cx2 + Math.sin(a2)*this.pupilS, cy + Math.cos(a2)*this.pupilS, this.pupilR, 0, 2*Math.PI);
    ctx.fill();
}

module.exports = Eyes
