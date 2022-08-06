function sinFadeOut(t) {
        // detect next step
        const m = floor(t)
        if (m > this.mark) this.step()
        this.mark = m

        const oscillations = this.oscillations || 4
        if (t > 1) t = 1
        const fac = 1 - t
        return sin(t * PI2 * oscillations) * fac
}
