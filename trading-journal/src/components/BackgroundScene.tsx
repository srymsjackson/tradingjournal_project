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
      try {
        // rebuild points to match new size (if buildPoints exists)
        // buildPoints is defined later in this scope
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (typeof buildPoints === 'function') buildPoints()
      } catch {
        /* ignore */
      }
    }

    resize()
    window.addEventListener('resize', resize)

    // grid spacing and parameters
    const spacing = Math.max(22, Math.min(40, Math.round(window.innerWidth / 40)))
    const baseRadius = 1.25
    const maxOffset = 12
    const influence = 120

    // precompute grid points for performance
    let points: { x: number; y: number }[] = []
    function buildPoints() {
      points = []
      const w = Math.ceil(window.innerWidth / spacing) * spacing
      const h = Math.ceil(window.innerHeight / spacing) * spacing
      const startX = spacing / 2
      const startY = spacing / 2
      for (let x = startX; x < w; x += spacing) {
        for (let y = startY; y < h; y += spacing) {
          points.push({ x, y })
        }
      }
    }

    buildPoints()

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

      // single base color; per-point alpha via globalAlpha
      ctx.fillStyle = 'rgb(230,238,234)'

      const infSq = influence * influence

      // draw each point using fast rect fills and globalAlpha
      for (let i = 0; i < points.length; i++) {
        const p = points[i]
        const dx = p.x - mx
        const dy = p.y - my
        const distSq = dx * dx + dy * dy

        let ox = 0
        let oy = 0
        let r = baseRadius
        let alpha = 0.06

        if (distSq < infSq) {
          const dist = Math.sqrt(distSq)
          const t = 1 - dist / influence
          const force = t * t
          const push = maxOffset * force
          const inv = dist === 0 ? 0 : push / dist
          ox = -dx * inv
          oy = -dy * inv
          r = baseRadius + 2 * force
          alpha = 0.08 + 0.22 * force
        }

        ctx.globalAlpha = alpha
        // fast draw: small square represents a dot; subpixel size OK
        const size = Math.max(1, Math.round(r * 2))
        ctx.fillRect(p.x + ox - size / 2, p.y + oy - size / 2, size, size)
      }

      // reset alpha
      ctx.globalAlpha = 1
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
