import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toThread, threadsFor, threadText, echoStrength } from '../lib/threads'
import { displayBook } from '../data/canon'
import { useFade } from '../lib/motion'
import EchoMap from './EchoMap'

// Echoes: the other places in the Bible that say something like the open verse.
// The echo constellation shows each one as a star, and the list gives every echo,
// strongest first, split into before Jesus (Old Testament) and after (New).
// The map and the list point at each other: hover or tap either one.

const keyOf = (t) => `${t.from}-${t.ref}`

export default function Threads({ book, chapter, verse, data, onNavigate }) {
  const [openRef, setOpenRef] = useState(null)
  const [focus, setFocus] = useState(null)
  const [texts, setTexts] = useState({})
  const [verseText, setVerseText] = useState('')
  const name = displayBook(book, chapter)
  const here = verse ? `${name} ${chapter}:${verse}` : `${name} ${chapter}`

  // Without an open verse: the strongest links leaving this chapter.
  const chapterThreads = useMemo(() => {
    if (!data) return []
    const out = []
    Object.entries(data).forEach(([key, list]) => {
      const [c, v] = key.split(':').map(Number)
      if (c === chapter) list.forEach(raw => out.push({ ...toThread(raw), from: v }))
    })
    return out.sort((a, b) => b.votes - a.votes).slice(0, 10)
  }, [data, chapter])

  const list = useMemo(() => (verse ? threadsFor(data, chapter, verse).sort((a, b) => b.votes - a.votes) : chapterThreads), [data, chapter, verse, chapterThreads])

  useEffect(() => {
    if (!verse) return
    let live = true
    threadText({ book, chapter, v1: verse, v2: verse }).then(t => { if (live) setVerseText(t) }).catch(() => {})
    return () => { live = false }
  }, [book, chapter, verse])

  useEffect(() => {
    let cancelled = false
    const missing = list.filter(t => !(t.ref in texts))
    if (!missing.length) return
    Promise.all(missing.map(t => threadText(t).then(text => [t.ref, text]).catch(() => [t.ref, ''])))
      .then(pairs => { if (!cancelled) setTexts(prev => ({ ...prev, ...Object.fromEntries(pairs) })) })
    return () => { cancelled = true }
  }, [list]) // eslint-disable-line react-hooks/exhaustive-deps

  const stars = useMemo(() => list.map(t => ({ ...t, key: keyOf(t) })), [list])

  if (!data) return <div className="empty-pane">Finding the echoes…</div>

  const ot = list.filter(t => !t.nt), nt = list.filter(t => t.nt)
  // Tapping a star opens that echo in the list and brings it into view.
  const pick = (key) => {
    setFocus(key); setOpenRef(key)
    requestAnimationFrame(() => document.querySelector(`.echo[data-key="${CSS.escape(key)}"]`)?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }))
  }
  const item = (t, k) => (
    <Echo key={`${t.from || ''}-${t.ref}`} t={t} k={k} text={texts[t.ref]} open={openRef === `${t.from}-${t.ref}`}
      lit={focus === keyOf(t)} onHover={() => setFocus(keyOf(t))}
      onToggle={() => { setOpenRef(openRef === keyOf(t) ? null : keyOf(t)); setFocus(keyOf(t)) }} onNavigate={onNavigate} showFrom={!verse} />
  )

  return (
    <div className="echoes">
      <div className="echo-side">
      {verse ? (
        <>
          <p className="echo-how">This verse is in the middle. Each star is another place in the Bible that says something like it. <b>Tap a star</b>, or any passage in the list, to read it.</p>
          <div className="echo-verse">
            <span className="eyebrow">{here}</span>
            <p>{verseText || '…'}</p>
          </div>
        </>
      ) : (
        <>
          <p className="echo-how"><b>Tap any verse in the text</b> to see where else the Bible says something like it.</p>
          {chapterThreads.length > 0 && <p className="echo-sub">Meanwhile, here are the strongest echoes from {here}.</p>}
        </>
      )}

      {list.length > 0 && (
          <EchoMap key={here} center={[name, verse ? `${chapter}:${verse}` : `Chapter ${chapter}`]} items={stars} focus={focus} onFocus={setFocus} onPick={pick}
            label={`${here} at the centre, with the ${stars.length} passages that echo it around it`} />
      )}
      </div>
      <div className="echo-main">
      {list.length > 0 ? (
        <>
          <div className="echo-cols">
            <section>
              <h3 className="echo-h">Before Jesus <span>Old Testament</span></h3>
              {ot.length ? ot.map(item) : <p className="echo-none">No Old Testament echoes are recorded for this {verse ? 'verse' : 'chapter'}.</p>}
            </section>
            <section>
              <h3 className="echo-h">After Jesus <span>New Testament</span></h3>
              {nt.length ? nt.map(item) : <p className="echo-none">No New Testament echoes are recorded for this {verse ? 'verse' : 'chapter'}.</p>}
            </section>
          </div>
        </>
      ) : (
        <p className="echo-none">{verse ? 'No echoes are recorded for this verse. Try the verse before or after it.' : 'No echoes are recorded for this chapter.'}</p>
      )}

      <p className="threads-src">
        Echoes come from <a href="https://www.openbible.info/labs/cross-references/" target="_blank" rel="noopener noreferrer">OpenBible.info</a> (CC BY),
        drawn from the Treasury of Scripture Knowledge. “Strong” means many readers agreed the verses belong together.
      </p>
      </div>
    </div>
  )
}

function Echo({ t, k, text, open, lit, onHover, onToggle, onNavigate, showFrom }) {
  const [n, label] = echoStrength(t.votes)
  const reveal = useFade({ y: -4, enter: 0.3, leave: 0.16 })
  return (
    <div className={`echo${t.nt ? ' nt' : ' ot'}${open ? ' is-open' : ''}${lit ? ' is-lit' : ''}`} data-key={`${t.from}-${t.ref}`} style={{ '--i': Math.min(k, 12) }} onMouseEnter={onHover}>
      <button type="button" aria-expanded={open} onClick={onToggle}>
        <span className="echo-top">
          <span className="echo-ref">{t.ref}</span>
          <span className={`echo-str s${n}`}><i /><i /><i /><em>{label}</em></span>
        </span>
        {showFrom && <span className="echo-from">From verse {t.from}</span>}
        <span className="echo-text">{text ?? '…'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.button key="read" type="button" className="chip solid echo-go" {...reveal} onClick={() => onNavigate(t.book, t.chapter, t.v1)}>
            Read {t.ref} in the Bible →
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
