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

    // grid spacing and parameters
    const spacing = Math.max(22, Math.min(40, Math.round(window.innerWidth / 40)))
    const baseRadius = 1.25
    const maxOffset = 12
    const influence = 120

    let mx = -9999
    let my = -9999

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

      ctx.fillStyle = 'rgba(230,238,234,0.06)'
      ctx.beginPath()

      // iterate grid
      const startX = spacing / 2
      const startY = spacing / 2

      for (let x = startX; x < w; x += spacing) {
        for (let y = startY; y < h; y += spacing) {
          const dx = x - mx
          const dy = y - my
          const dist = Math.hypot(dx, dy)
          let ox = 0
          let oy = 0
          let r = baseRadius
          let alpha = 0.06

          if (dist < influence) {
            const t = 1 - dist / influence
            const force = t * t // ease
            const push = maxOffset * force
            // repel away from cursor
            const inv = dist === 0 ? 0 : push / dist
            ox = -dx * inv
            oy = -dy * inv
            r = baseRadius + 2 * force
            alpha = 0.08 + 0.22 * force
          }

          ctx.moveTo(x + ox + r, y + oy)
          ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(230,238,234,${alpha})`
          ctx.fill()
        }
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
      <canvas className="bg-canvas" ref={canvasRef} />
    </div>
  )
}
