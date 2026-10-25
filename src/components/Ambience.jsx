import { useEffect, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

// The page's two quiet living touches from the Codex design: a fine paper grain
// over everything, and a soft lamp glow that drifts after the pointer.
export default function Ambience() {
  const reduced = useReducedMotion()
  const [lit, setLit] = useState(false)
  const x = useMotionValue(-1000)
  const y = useMotionValue(-1000)
  const sx = useSpring(x, { stiffness: 60, damping: 18, mass: 0.9 })
  const sy = useSpring(y, { stiffness: 60, damping: 18, mass: 0.9 })

  useEffect(() => {
    try {
      const c = document.createElement('canvas')
      c.width = c.height = 160
      const ctx = c.getContext('2d')
      const img = ctx.createImageData(160, 160)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 110 + Math.random() * 145
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v
        img.data[i + 3] = 255
      }
      ctx.putImageData(img, 0, 0)
      document.documentElement.style.setProperty('--grain', `url(${c.toDataURL()})`)
    } catch { /* no canvas: plain paper */ }
  }, [])

  useEffect(() => {
    if (reduced || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const move = (e) => {
      if (!lit) { x.jump(e.clientX); y.jump(e.clientY); sx.jump(e.clientX); sy.jump(e.clientY); setLit(true) }
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const leave = () => setLit(false)
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [reduced, lit, x, y, sx, sy])

  if (reduced) return null
  return <motion.div className={`lamp${lit ? ' is-lit' : ''}`} aria-hidden="true" style={{ x: sx, y: sy }} />
}
