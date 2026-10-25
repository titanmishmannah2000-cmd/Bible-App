import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { echoStrength } from '../lib/threads'

// The echo constellation: the verse being read sits at the centre, and every
// passage that echoes it is a star around it. Stronger echoes sit on the inner
// ring, lighter ones further out. The Old Testament fills one half and the New
// the other, each in Bible order. Every place is worked out ahead of time so no
// name ever sits on another; a star can still be pulled, and it eases back.
const DOT = [0, 3, 4, 5.5]
const LINE = [0, 0.8, 1.15, 1.6]
const GAP = 7 // between a star and its name
const SHORT = ['Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth', '1 Sam', '2 Sam', '1 Kgs', '2 Kgs', '1 Chr', '2 Chr',
  'Ezra', 'Neh', 'Esth', 'Job', 'Ps', 'Prov', 'Eccl', 'Song', 'Isa', 'Jer', 'Lam', 'Ezek', 'Dan', 'Hos', 'Joel', 'Amos', 'Obad',
  'Jonah', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal', 'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1 Cor', '2 Cor',
  'Gal', 'Eph', 'Phil', 'Col', '1 Thess', '2 Thess', '1 Tim', '2 Tim', 'Titus', 'Phlm', 'Heb', 'Jas', '1 Pet', '2 Pet',
  '1 John', '2 John', '3 John', 'Jude', 'Rev']
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const deg = (d) => (d * Math.PI) / 180

let ctx
function measure(text, size, weight, family) {
  ctx ||= document.createElement('canvas').getContext('2d')
  ctx.font = `${weight} ${size}px ${family}`
  return ctx.measureText(text).width
}

// Where a star's name goes: beside it when the star is off to one side, above or
// below it when the star is near the top or bottom.
function labelBox(x, y, a, r, w) {
  const c = Math.cos(a), s = Math.sin(a)
  if (Math.abs(c) > 0.42) {
    const x0 = c > 0 ? x + r + GAP : x - r - GAP - w
    return { x0, x1: x0 + w, y0: y - 8, y1: y + 8, anchor: c > 0 ? 'start' : 'end', tx: c > 0 ? x + r + GAP : x - r - GAP, ty: y + 4 }
  }
  const up = s < 0
  const y0 = up ? y - r - GAP - 15 : y + r + GAP - 1
  return { x0: x - w / 2, x1: x + w / 2, y0, y1: y0 + 16, anchor: 'middle', tx: x, ty: y0 + 12 }
}
const hit = (p, q, pad = 3) => p.x0 < q.x1 + pad && q.x0 < p.x1 + pad && p.y0 < q.y1 + pad && q.y0 < p.y1 + pad

function layout(items, W, H, narrow, fonts) {
  const cx = W / 2, cy = H / 2 + (narrow ? 0 : 10)
  // The two halves: left and right on a wide screen, top and bottom on a phone.
  // A band either side of the dividing line is kept free for the ring names.
  const halves = narrow ? { ot: [deg(-162), deg(-18)], nt: [deg(18), deg(162)] } : { ot: [deg(248), deg(112)], nt: [deg(-68), deg(68)] }
  const nodes = []
  for (const side of ['ot', 'nt']) {
    const mine = items.filter(t => (side === 'nt') === !!t.nt).sort((p, q) => p.bookIndex - q.bookIndex || p.chapter - q.chapter || p.v1 - q.v1)
    const [a0, a1] = halves[side]
    mine.forEach((t, i) => {
      const s = echoStrength(t.votes)[0]
      const [book, verse] = [t.ref.slice(0, t.ref.lastIndexOf(' ')), t.ref.slice(t.ref.lastIndexOf(' ') + 1)]
      const name = narrow ? SHORT[t.bookIndex] : book
      const w = measure(name + ' ', 11, 600, fonts.ui) + measure(verse, 11, 400, fonts.ui)
      nodes.push({ key: t.key, t, s, side, name, verse, w, r: DOT[s], a: a0 + ((i + 0.5) / mine.length) * (a1 - a0), lo: Math.min(a0, a1), hi: Math.max(a0, a1) })
    })
  }

  // The centre medallion fits the name of the book.
  // A long name is set on two lines so the medallion stays small.
  const words = fonts.line1.split(' ')
  let lines = [fonts.line1]
  if (words.length > 1 && measure(fonts.line1, 15, 500, fonts.display) > 76) {
    let best = null
    for (let i = 1; i < words.length; i++) {
      const pair = [words.slice(0, i).join(' '), words.slice(i).join(' ')]
      const w = Math.max(...pair.map(l => measure(l, 15, 500, fonts.display)))
      if (!best || w < best.w) best = { pair, w }
    }
    lines = best.pair
  }
  const wide = Math.max(...lines.map(l => measure(l, 15, 500, fonts.display)), measure(fonts.line2.toUpperCase(), 8.5, 600, fonts.ui) * 1.2)
  const rc = Math.max(32, wide / 2 + 12, lines.length * 9 + 16)
  // On a phone the rings stretch into ovals, to use the height of the screen.
  let tall = 1
  // Three rings, evenly spaced out from the medallion.
  const ringAt = (R) => [0, R, rc + (R - rc) * 0.68, rc + (R - rc) * 0.36]
  const place = (R) => {
    const rings = ringAt(R)
    nodes.forEach(n => {
      n.x = cx + Math.cos(n.a) * rings[n.s]; n.y = cy + Math.sin(n.a) * rings[n.s] * tall
      n.box = labelBox(n.x, n.y, n.a, n.r, n.w)
      n.dot = { x0: n.x - n.r - 2, x1: n.x + n.r + 2, y0: n.y - n.r - 2, y1: n.y + n.r + 2 }
    })
    return rings
  }
  const fits = (R) => {
    place(R)
    return nodes.every(n => n.box.x0 >= 4 && n.box.x1 <= W - 4 && n.box.y0 >= 24 && n.box.y1 <= H - 4 && n.dot.y0 >= 22 && n.dot.y1 <= H - 4) && (narrow || cy - R >= 30)
  }
  // The largest rings that still leave room for every name.
  const fit = () => {
    let lo = rc + 40, hi = Math.max(W, H) / 2
    for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (fits(m)) lo = m; else hi = m }
    return lo
  }
  let R = fit()
  // Ease neighbours apart along their ring until no name touches another star or name.
  // The names of the rings, at the top, are kept clear too.
  // On a phone the ovals then stretch to fill the height.
  if (narrow) { tall = Math.min(2.2, Math.max(1, (H / 2 - 30) / R)); R = Math.min(R, fit()) }
  const tags = () => narrow
    ? [{ x0: 0, x1: 92, y0: cy - 18, y1: cy - 3 }, { x0: 0, x1: 92, y0: cy + 4, y1: cy + 19 }]
    : [1, 2, 3].map(s => { const y = cy - ringAt(R)[s]; return { x0: cx - 38, x1: cx + 38, y0: y - 8, y1: y + 6 } })
  for (let pass = 0; pass < 2; pass++) {
    for (let it = 0; it < 240; it++) {
      let moved = false
      for (let i = 0; i < nodes.length; i++) {
        const p = nodes[i]
        if (tags().some(g => hit(p.box, g, 2) || hit(p.dot, g, 2))) { p.a = Math.min(p.hi, Math.max(p.lo, p.a + ((p.side === 'nt') !== narrow ? 1 : -1) * 0.01)); moved = true }
        for (let j = i + 1; j < nodes.length; j++) {
          const q = nodes[j]
          if (p.side !== q.side) continue
          if (hit(p.box, q.box, 8) || hit(p.box, q.dot) || hit(q.box, p.dot)) {
            const dir = p.a < q.a ? -1 : 1
            p.a = Math.min(p.hi, Math.max(p.lo, p.a + dir * 0.01)); q.a = Math.min(q.hi, Math.max(q.lo, q.a - dir * 0.01))
            moved = true
          }
        }
      }
      place(R)
      if (!moved) break
    }
    R = Math.min(R, fit())
  }
  const rings = place(R)
  return { nodes, rings, cx, cy, rc, tall, lines }
}

// A gentle curve from the centre out to a star, bowing the same way every time.
function curve(cx, cy, rc, x, y, r) {
  const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d
  const sx = cx + ux * (rc + 3), sy = cy + uy * (rc + 3), ex = x - ux * (r + 2), ey = y - uy * (r + 2)
  const bow = (d - rc) * 0.12
  const mx = (sx + ex) / 2 - uy * bow, my = (sy + ey) / 2 + ux * bow
  return `M${sx.toFixed(1)} ${sy.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`
}

export default function EchoMap({ center, items, focus, onFocus, onPick, label }) {
  const box = useRef(null)
  const [W, setW] = useState(0)
  const [pull, setPull] = useState(null) // { key, dx, dy } while a star is pulled
  const drag = useRef(null)
  const [line1, line2] = center
  const [fonts, setFonts] = useState(null)

  useLayoutEffect(() => {
    const css = getComputedStyle(document.documentElement)
    const read = () => setFonts({ ui: css.getPropertyValue('--ui') || 'sans-serif', display: css.getPropertyValue('--display') || 'serif' })
    read()
    document.fonts?.ready.then(read)
    const ro = new ResizeObserver(([e]) => { if (e.contentRect.width) setW(Math.round(e.contentRect.width)) })
    ro.observe(box.current)
    return () => ro.disconnect()
  }, [])

  const narrow = W < 520
  const H = Math.round(narrow ? Math.max(430, W * 1.3) : Math.min(560, Math.max(420, W * 0.74)))
  const map = useMemo(() => (W && fonts ? layout(items, W, H, narrow, { ...fonts, line1, line2 }) : null), [items, W, H, narrow, fonts, line1, line2])

  // A pulled star follows the finger, then eases home when let go.
  useEffect(() => () => cancelAnimationFrame(drag.current?.raf), [])
  const down = (e, key) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    cancelAnimationFrame(drag.current?.raf)
    drag.current = { key, x0: e.clientX, y0: e.clientY, moved: false }
  }
  const move = (e) => {
    const d = drag.current
    if (!d || d.home) return
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0
    if (!d.moved && Math.hypot(dx, dy) > 4) d.moved = true
    if (d.moved) setPull({ key: d.key, dx, dy })
  }
  const up = () => {
    const d = drag.current
    if (!d || d.home) return
    if (!d.moved) { drag.current = null; onPick(d.key); return }
    d.home = true
    const from = pull || { dx: 0, dy: 0 }, t0 = performance.now(), dur = reduced() ? 1 : 520
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3)
      setPull(k < 1 ? { key: d.key, dx: from.dx * (1 - e), dy: from.dy * (1 - e) } : null)
      if (k < 1) d.raf = requestAnimationFrame(step); else drag.current = null
    }
    d.raf = requestAnimationFrame(step)
  }

  const on = focus && map?.nodes.some(n => n.key === focus) ? focus : null
  const ringName = (s) => echoStrength(s === 3 ? 20 : s === 2 ? 8 : 1)[1]

  return (
    <figure className={`echo-map${on ? ' has-focus' : ''}${narrow ? ' is-narrow' : ''}`}>
      <div ref={box} className="em-box" onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {map && (
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
            <defs>
              <radialGradient id="em-glow"><stop offset="0" stopColor="var(--gold)" stopOpacity="0.18" /><stop offset="1" stopColor="var(--gold)" stopOpacity="0" /></radialGradient>
            </defs>
            <ellipse cx={map.cx} cy={map.cy} rx={map.rings[1] + 30} ry={(map.rings[1] + 30) * map.tall} fill="url(#em-glow)" />

            {/* The rings of strength, and the line between the testaments. */}
            {[1, 2, 3].map(s => <ellipse key={s} cx={map.cx} cy={map.cy} rx={map.rings[s]} ry={map.rings[s] * map.tall} className={`em-ring s${s}`} />)}
            {narrow
              ? <line x1="8" x2={W - 8} y1={map.cy} y2={map.cy} className="em-divide" />
              : <line x1={map.cx} x2={map.cx} y1="30" y2={H - 8} className="em-divide" />}
            {!narrow && [3, 2, 1].map(s => <text key={s} x={map.cx} y={map.cy - map.rings[s] + 3} className="em-ring-lbl">{ringName(s)}</text>)}
            {narrow ? (
              <>
                <text x="8" y={map.cy - 7} className="em-side ot">BEFORE JESUS ↑</text>
                <text x="8" y={map.cy + 15} className="em-side nt">AFTER JESUS ↓</text>
              </>
            ) : (
              <>
                <text x="4" y="14" className="em-side ot">BEFORE JESUS</text>
                <text x={W - 4} y="14" className="em-side nt end">AFTER JESUS</text>
              </>
            )}

            {map.nodes.map((n, k) => {
              const p = pull?.key === n.key ? pull : null, x = n.x + (p?.dx || 0), y = n.y + (p?.dy || 0)
              return <path key={`l${n.key}`} d={curve(map.cx, map.cy, map.rc, x, y, n.r)} pathLength="1" strokeWidth={LINE[n.s]}
                className={`em-line ${n.side}${on === n.key ? ' on' : ''}`} style={{ '--k': k }} />
            })}

            <g className="em-centre">
              <circle cx={map.cx} cy={map.cy} r={map.rc + 6} className="em-centre-halo" />
              <circle cx={map.cx} cy={map.cy} r={map.rc} className="em-centre-disc" />
              {map.lines.map((l, i) => <text key={l} x={map.cx} y={map.cy + 3 - (map.lines.length - 1 - i) * 16} className="em-centre-t">{l}</text>)}
              <text x={map.cx} y={map.cy + 17} className="em-centre-sub">{line2}</text>
            </g>

            {map.nodes.map((n, k) => {
              const p = pull?.key === n.key ? pull : null, dx = p?.dx || 0, dy = p?.dy || 0
              return (
                <g key={n.key} className={`em-star ${n.side} s${n.s}${on === n.key ? ' on' : ''}${p ? ' pulled' : ''}`} style={{ '--k': k }}
                  onPointerDown={(e) => down(e, n.key)} onPointerEnter={() => onFocus(n.key)}>
                  <g transform={`translate(${(n.x + dx).toFixed(1)} ${(n.y + dy).toFixed(1)})`}>
                    <circle r={n.r + 12} className="em-hit" />
                    {n.s === 3 && <circle r={n.r + 3.5} className="em-halo" />}
                    <circle r={n.r} className="em-dot" />
                  </g>
                  <text x={n.box.tx + dx} y={n.box.ty + dy} textAnchor={n.box.anchor} className="em-name">
                    {n.name} <tspan className="em-verse">{n.verse}</tspan>
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </div>
      <figcaption className="em-key">
        <span><i className="ot" />Before Jesus</span>
        <span><i className="nt" />After Jesus</span>
        <span><i className="ring" />Nearer the centre, stronger echo</span>
        <span className="em-tip">Tap a star to read it</span>
      </figcaption>
    </figure>
  )
}
