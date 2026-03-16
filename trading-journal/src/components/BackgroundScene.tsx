import { useEffect, useRef } from 'react'
import './BackgroundScene.css'

export default function BackgroundScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current!
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const dpr = Math.max(1, window.devicePixelRatio || 1)

    function resize() {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    // create particles
    const particles: {
      x: number
      y: number
      vx: number
      vy: number
      r: number
      hue: number
    }[] = []

    const count = Math.max(28, Math.floor((window.innerWidth * window.innerHeight) / 90000))
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: 14 + Math.random() * 36,
        hue: 140 + Math.random() * 60,
      })
    }

    let mx = window.innerWidth / 2
    let my = window.innerHeight / 2

    function onMove(e: MouseEvent) {
      mx = e.clientX
      my = e.clientY
    }

    window.addEventListener('mousemove', onMove)

    function draw() {
      rafRef.current = requestAnimationFrame(draw)
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      ctx.clearRect(0, 0, w, h)

      // subtle vignette
      const grad = ctx.createLinearGradient(0, 0, w, h)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(1, 'rgba(0,0,0,0.06)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // mouse-influence vector
      const cx = mx
      const cy = my

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // influence: attract/repel depending on distance
        const dx = cx - p.x
        const dy = cy - p.y
        const dist = Math.max(20, Math.hypot(dx, dy))
        const force = (1 / dist) * 28

        p.vx += (dx / dist) * force * 0.002
        p.vy += (dy / dist) * force * 0.002

        // friction
        p.vx *= 0.985
        p.vy *= 0.985

        p.x += p.vx
        p.y += p.vy

        // wrap edges
        if (p.x < -p.r) p.x = w + p.r
        if (p.x > w + p.r) p.x = -p.r
        if (p.y < -p.r) p.y = h + p.r
        if (p.y > h + p.r) p.y = -p.r

        // draw soft blob
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
        const hue = p.hue
        g.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.14)`)
        g.addColorStop(0.4, `hsla(${hue}, 60%, 45%, 0.08)`)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2)
      }
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="background-scene" aria-hidden>
      <div className="background-layer bg-gradient-1" style={{ zIndex: 0 }} />
      <div className="background-layer bg-gradient-2" style={{ zIndex: 1 }} />
      <canvas className="bg-canvas" ref={canvasRef} />
    </div>
  )
}
