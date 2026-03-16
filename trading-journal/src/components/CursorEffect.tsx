import { useEffect, useRef } from 'react'
import './CursorEffect.css'

function hexToRgb(hex: string) {
  const h = hex.replace('#', '').trim()
  const bigint = parseInt(h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r, g, b }
}

export default function CursorEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current!
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const getAccent = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#3a86a8'
      return raw.trim() || '#3a86a8'
    }

    let accent = getAccent()

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

    let tx = window.innerWidth / 2
    let ty = window.innerHeight / 2
    let x = tx
    let y = ty

    const trails: { x: number; y: number }[] = []

    function onMove(e: MouseEvent) {
      tx = e.clientX
      ty = e.clientY
    }

    function draw() {
      rafRef.current = requestAnimationFrame(draw)

      const w = canvas.width / dpr
      const h = canvas.height / dpr

      x += (tx - x) * 0.18
      y += (ty - y) * 0.18

      trails.unshift({ x, y })
      if (trails.length > 16) trails.pop()

      ctx.clearRect(0, 0, w, h)

      const accentRgb = (() => {
        try {
          if (accent.startsWith('#')) return hexToRgb(accent)
          const m = accent.match(/(\d+),\s*(\d+),\s*(\d+)/)
          if (m) return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) }
        } catch {
          /* ignore */
        }
        return { r: 58, g: 134, b: 168 }
      })()

      for (let i = 0; i < trails.length; i++) {
        const t = trails[i]
        const k = 1 - i / trails.length
        const radius = 18 * k + 2
        const alpha = 0.18 * k
        ctx.beginPath()
        ctx.fillStyle = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${alpha})`
        ctx.shadowBlur = 18 * k
        ctx.shadowColor = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${alpha})`
        ctx.arc(t.x, t.y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.beginPath()
      ctx.fillStyle = 'rgba(255,255,255,0.95)'
      ctx.shadowBlur = 6
      ctx.shadowColor = 'rgba(255,255,255,0.6)'
      ctx.arc(x, y, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }

    window.addEventListener('mousemove', onMove)
    rafRef.current = requestAnimationFrame(draw)

    const mo = new MutationObserver(() => (accent = getAccent()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
      mo.disconnect()
    }
  }, [])

  return <canvas className="cursor-effect-canvas" ref={canvasRef} />
}
