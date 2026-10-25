import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TIMELINE, ERA_HELP } from '../data/timeline'
import { parseReference } from '../lib/bible'
import { cite } from '../lib/sources'
import { CitedText, SourceList } from './Cited'
import { useFade } from '../lib/motion'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// History from the oldest event to the newest. Events the Bible tells sit in one
// lane, what was happening in the world in the other (side by side when there is
// room, one list with labels when there is not). The book being read is marked
// and the list opens at it.
export default function Timeline({ book, onNavigate }) {
  const { parts, sources } = useMemo(() => cite(TIMELINE.map(e => e.note)), [])
  const mine = TIMELINE.filter(e => e.books.includes(book))
  const [open, setOpen] = useState(() => (mine.length ? TIMELINE.indexOf(mine[0]) : null))
  const list = useRef(null)

  // Open at the book being read.
  useEffect(() => {
    // Only the panel scrolls, never the page (on phones the panel sits below the text).
    const first = list.current?.querySelector('.tl-item.is-mine')
    const pane = list.current
    if (first && pane && pane.scrollHeight > pane.clientHeight) {
      const top = first.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop - pane.clientHeight / 3
      pane.scrollTo({ top: Math.max(0, top), behavior: reduced() ? 'auto' : 'smooth' })
    }
  }, [book])

  const firstAD = TIMELINE.findIndex(e => e.y > 0)
  return (
    <div className="timeline" ref={list}>
      <p className="echo-how">
        History from the oldest event at the top to the newest at the bottom.
        {' '}<b className="tl-key-bible">Blue</b> events are told in the Bible; <b className="tl-key-world">grey</b> ones happened in the world around it.
        {mine.length > 0 && <> Events in <b>{book}</b> are marked in gold.</>} Tap any event to read more.
      </p>
      <p className="tl-era-help">{ERA_HELP}</p>
      {!mine.length && <p className="echo-none">{book} has no dated event on this timeline yet. Scroll to explore the rest.</p>}

      <div className="tl-lanes" aria-hidden="true"><span>In the Bible</span><span>In the world</span></div>
      <ol className="tl-list">
        {TIMELINE.map((e, i) => (
          <li key={e.title} className="tl-row">
            {i === 0 && <Era label="Before Jesus" sub="BC" />}
            {i === firstAD && <Era label="After Jesus was born" sub="AD" />}
            <Entry e={e} parts={parts[i]} mine={e.books.includes(book)} book={book} open={open === i}
              onToggle={() => setOpen(open === i ? null : i)} onNavigate={onNavigate} />
          </li>
        ))}
      </ol>
      <p className="threads-src">
        Every date comes from the Tyndale Open Bible Dictionary. Where scholars disagree, both dates are shown.
      </p>
      <SourceList sources={sources} idPrefix="tl-src" onVerse={onNavigate} />
    </div>
  )
}

function Era({ label, sub }) {
  return <div className="tl-era"><span>{label}</span><em>{sub}</em></div>
}

function Entry({ e, parts, mine, book, open, onToggle, onNavigate }) {
  const reveal = useFade({ y: -4, enter: 0.3, leave: 0.16 })
  const r = e.ref ? parseReference(e.ref) : null
  return (
    <div className={`tl-item ${e.lane}${mine ? ' is-mine' : ''}${open ? ' is-open' : ''}`}>
      <span className="tl-dot" aria-hidden="true" />
      <button type="button" className="tl-card" aria-expanded={open} onClick={onToggle}>
        <span className="tl-when">{e.when}{e.disputed && <em className="tl-disputed">Scholars disagree</em>}</span>
        <span className="tl-title">{e.title}</span>
        <span className="tl-tags">
          <span className="tl-lane">{e.lane === 'bible' ? 'In the Bible' : 'In the world'}</span>
          {mine && <span className="tl-mine">In {book}</span>}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="more" className="tl-more" {...reveal}>
            <p><CitedText parts={parts} idPrefix="tl-src" /></p>
            {r && <button type="button" className="chip solid" onClick={() => onNavigate(r.book, r.chapter, r.verse)}>Read {e.ref.replace('-', '–')} →</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
