import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { displayBook } from '../data/canon'
import { LAND, LAND_W, LAND_H, landXY } from '../data/land'
import { cite } from '../lib/sources'
import { erasFor, worldById } from '../lib/when'
import { useFade, narrowScreen } from '../lib/motion'
import { CitedText, SourceList } from './Cited'
import { IconPrev, IconNext } from './Icons'
import Sheet from './Sheet'

const BIBLE_SHOWN = 6

// One world event in full: where it was, what happened, how it meets the Bible,
// which parts of the Bible were happening at the same time, and its sources.
// On a phone it rises up over the whole screen and can be swiped down to close;
// on a computer it is a large panel that Esc or ✕ closes. Previous and Next walk
// through the events of the card it was opened from.
export default function WorldEvent({ event, list, onStep, onClose, onRead }) {
  // Keep showing the last event while the view eases away.
  const [last, setLast] = useState({ event, list })
  if (event && (event !== last.event || list !== last.list)) setLast({ event, list })
  const w = event || last.event
  const shownList = event ? list : last.list
  const ids = shownList.length ? shownList : (w ? [w.id] : [])
  const at = w ? ids.indexOf(w.id) : -1
  const prev = at > 0 ? worldById(ids[at - 1]) : null
  const next = at >= 0 && at < ids.length - 1 ? worldById(ids[at + 1]) : null

  // Arrow keys step through the events on a computer.
  useEffect(() => {
    if (!event) return
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      if (e.key === 'ArrowLeft' && prev) onStep(prev.id)
      if (e.key === 'ArrowRight' && next) onStep(next.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [event, prev, next, onStep])

  const bodyRef = useRef(null)
  const swipe = useSwipeDown(onClose, !!event, bodyRef)

  return (
    <Sheet open={!!event} onClose={onClose} variant="event" label={w ? `World event: ${w.title}` : 'World event'}
      head={
        <div className="ev-head" {...swipe.handle}>
          <span className="ev-grab" aria-hidden="true" />
          <span className="eyebrow">{w ? `${w.regionName} · ${w.where}` : ''}</span>
        </div>
      }>
      <div className="sheet-body ev-body" ref={bodyRef} {...swipe.area}>
        <AnimatePresence mode="wait" initial={false}>
          {w && <EventBody key={w.id} w={w} onRead={onRead} />}
        </AnimatePresence>
      </div>
      {ids.length > 1 && (
        <nav className="ev-nav" aria-label="Other events">
          <button type="button" className="ev-step" disabled={!prev} onClick={() => prev && onStep(prev.id)}>
            <IconPrev /><span><small>Previous</small><b>{prev?.title || 'None'}</b></span>
          </button>
          <span className="ev-count">{at + 1} of {ids.length}</span>
          <button type="button" className="ev-step is-next" disabled={!next} onClick={() => next && onStep(next.id)}>
            <span><small>Next</small><b>{next?.title || 'None'}</b></span><IconNext />
          </button>
        </nav>
      )}
    </Sheet>
  )
}

function EventBody({ w, onRead }) {
  const fade = useFade({ y: 8, enter: 0.36, leave: 0.16 })
  const { parts, sources } = useMemo(() => cite([...w.detail, w.meets || '']), [w])
  const eras = useMemo(() => erasFor(w), [w])
  const [all, setAll] = useState(false)
  const shownEras = all ? eras : eras.slice(0, BIBLE_SHOWN)

  return (
    <motion.div className="ev" {...fade}>
      <h2 className="ev-title">{w.title}</h2>
      <p className="ev-when">{w.when}</p>
      <MapPin at={w.at} where={w.where} />
      <p className="ev-hint"><span className="on-touch">Swipe down or tap ✕ to close.</span><span className="on-desk">Press Esc or ✕ to close, and the arrow keys for the previous or next event.</span></p>

      <section className="ev-sec">
        <h3 className="eyebrow">What happened</h3>
        {w.detail.map((_, i) => <p key={i} className="ev-p"><CitedText parts={parts[i]} idPrefix="ev-src" /></p>)}
      </section>

      {(w.meets || w.touches) && (
        <section className="ev-sec ev-meets">
          <h3 className="eyebrow">Where it meets the Bible</h3>
          {w.meets && <p className="ev-p"><CitedText parts={parts[w.detail.length]} idPrefix="ev-src" /></p>}
          {w.touches && (
            <div className="ev-reads">
              {w.touches.map(([b, a, z]) => (
                <button key={`${b}${a}`} type="button" className="chip" onClick={() => onRead(b, a)}>
                  Read {displayBook(b, a)} {a === z ? a : `${a}–${z}`}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {eras.length > 0 && (
        <section className="ev-sec">
          <h3 className="eyebrow">Meanwhile in the Bible</h3>
          <p className="ev-lede">Parts of the Bible that happened or were written {eras.some(e => e.y1 >= w.y0 && e.y0 <= w.y1) ? 'in the same years' : 'nearest in time'}. Tap one to read it.</p>
          <ul className="ev-bible">
            {shownEras.map(e => (
              <li key={`${e.book}-${e.from}`}>
                <button type="button" onClick={() => onRead(e.book, e.from)}>
                  <b>{e.from === e.to ? `${displayBook(e.book, e.from)} ${e.from}` : `${e.book} ${e.from}–${e.to}`}</b>
                  <span>{e.title}</span>
                  <small>{e.when}</small>
                </button>
              </li>
            ))}
          </ul>
          {eras.length > shownEras.length && (
            <button type="button" className="link-btn" onClick={() => setAll(true)}>Show all {eras.length}</button>
          )}
        </section>
      )}

      <SourceList sources={sources} idPrefix="ev-src" />
    </motion.div>
  )
}

// A small map of the region with a pin where the event happened.
function MapPin({ at, where }) {
  const [x, y] = landXY(at)
  const vw = 150, vh = 62
  const x0 = Math.min(Math.max(x - vw / 2, 0), LAND_W - vw)
  const y0 = Math.min(Math.max(y - vh / 2, 0), LAND_H - vh)
  return (
    <figure className="ev-map">
      <svg viewBox={`${x0} ${y0} ${vw} ${vh}`} role="img" aria-label={`Map: ${where}`} preserveAspectRatio="xMidYMid slice">
        <rect x="0" y="0" width={LAND_W} height={LAND_H} className="ev-sea" />
        <path d={LAND} className="ev-land" />
        <circle cx={x} cy={y} r="4" className="ev-pulse" />
        <circle cx={x} cy={y} r="1.6" className="ev-pin" />
      </svg>
      <figcaption>{where}</figcaption>
    </figure>
  )
}

// Drag the view down to close it, on a phone. The drag starts on the handle at
// the top, or anywhere on the content when it is scrolled to the top.
function useSwipeDown(onClose, open, body) {
  const drag = useRef(null)
  const dialogOf = (el) => el?.closest('dialog')

  useEffect(() => {
    if (open) return
    const d = dialogOf(body.current)
    const t = setTimeout(() => { if (d) { d.style.transform = ''; d.style.transition = '' } }, 500)
    return () => clearTimeout(t)
  }, [open, body])

  const start = (e, fromHandle) => {
    if (!narrowScreen() || e.touches.length !== 1) return
    if (!fromHandle && body.current && body.current.scrollTop > 0) return
    drag.current = { y: e.touches[0].clientY, dy: 0, d: dialogOf(e.currentTarget) }
  }
  const move = (e) => {
    const g = drag.current
    if (!g) return
    g.dy = Math.max(0, e.touches[0].clientY - g.y)
    if (body.current && body.current.scrollTop > 0 && g.dy < 8) { drag.current = null; return }
    g.d.style.transition = 'none'
    g.d.style.transform = g.dy ? `translateY(${g.dy}px)` : ''
  }
  const end = () => {
    const g = drag.current
    drag.current = null
    if (!g) return
    if (g.dy > 110) { onClose(); return }
    g.d.style.transition = 'transform 0.32s var(--ease-out)'
    g.d.style.transform = ''
  }
  return {
    handle: { onTouchStart: (e) => start(e, true), onTouchMove: move, onTouchEnd: end, onTouchCancel: end },
    area: { onTouchStart: (e) => start(e, false), onTouchMove: move, onTouchEnd: end, onTouchCancel: end },
  }
}
