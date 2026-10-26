import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TIMELINE } from '../data/timeline'
import { REGIONS } from '../data/world'
import { displayBook } from '../data/canon'
import { cite } from '../lib/sources'
import { eraFor, eraKey, worldFor, worldById, stripAt, SPLIT } from '../lib/when'
import { useFade } from '../lib/motion'
import { CitedText, SourceList } from './Cited'
import WorldEvent from './WorldEvent'

const FIRST_SHOWN = 5

// When the passage being read happened: one card for the chapter, with its date,
// what it is about, where the date comes from, and what else was going on in the
// world at the time. Only events the reader has not met yet are listed in full;
// the rest fold into one line. Tapping an event opens it in full. As the reader
// moves on into a different part of the story, the card eases over to the next.
export default function Timeline({ book, chapter, verse, onNavigate }) {
  const era = eraFor(book, chapter)
  const key = era ? eraKey(era) : ''
  const world = useMemo(() => worldFor(era, chapter), [era, chapter])
  const { parts, sources } = useMemo(
    () => cite([era?.note || '', ...world.highlights.map(w => w.meets || '')]), [era, world])
  const fade = useFade({ y: 10, enter: 0.45, leave: 0.2 })

  // The filter and "show more" start afresh for each part of the Bible.
  const [view, setView] = useState({ key, region: 'all', more: false })
  if (view.key !== key) setView({ key, region: 'all', more: false })

  // The open event lives in the browser history, so the back button closes it.
  const location = useLocation()
  const navigate = useNavigate()
  const openId = location.state?.worldEvent || null
  const openList = location.state?.worldList || []
  const pending = useRef(null)
  useEffect(() => {
    if (!openId && pending.current) { const [b, c] = pending.current; pending.current = null; onNavigate(b, c) }
  }, [openId, onNavigate])
  const openEvent = (w, list) => navigate(location.pathname, { state: { worldEvent: w.id, worldList: list.map(x => x.id) } })
  const step = (id) => navigate(location.pathname, { replace: true, state: { ...location.state, worldEvent: id } })
  const close = () => navigate(-1)
  const read = (b, c) => { pending.current = [b, c]; navigate(-1) }

  const here = `${displayBook(book, chapter)} ${chapter}${verse ? `:${verse}` : ''}`
  if (!era) return <div className="empty-pane">No date is recorded for {here} yet.</div>
  const name = era.from === era.to ? displayBook(book, era.from) : book
  const span = era.from === era.to ? `${name} ${era.from}` : `${name} ${era.from}–${era.to}`

  const { rulers, newRulers, highlights, fresh, seen } = world
  const regions = REGION_KEYS.filter(r => fresh.some(w => w.region === r) || seen.some(w => w.region === r))
  const region = regions.includes(view.region) ? view.region : 'all'
  const inRegion = (w) => region === 'all' || w.region === region
  const freshHere = fresh.filter(inRegion)
  const seenHere = seen.filter(inRegion)
  const shown = (view.more ? freshHere : freshHere.slice(0, FIRST_SHOWN)).slice().sort((p, q) => p.y0 - q.y0)
  const hidden = freshHere.length - shown.length
  // Previous and next in the event view walk through the card in reading order.
  const order = [...highlights, ...shown, ...seenHere, ...rulers]

  return (
    <div className="when">
      <p className="echo-how">
        When is <b>{here}</b> from? Here is its date, where the date comes from, and what else was going on in the world at the time.
        It changes by itself as you read on. Tap any world event to read all about it.
      </p>

      <AnimatePresence mode="wait" initial={false}>
        <motion.article key={key} className="when-card" {...fade}>
          <span className="eyebrow">{span}</span>
          <h3 className="when-title">{era.title}</h3>
          <p className="when-date">
            {era.when}
            {era.disputed && <em className="tl-disputed">Scholars disagree</em>}
          </p>
          {era.y0 !== null && <Strip era={era} />}
          <p className="when-note"><CitedText parts={parts[0]} idPrefix="when-src" /></p>

          {highlights.length > 0 && (
            <section className="when-meets" aria-label="Where the world meets the Bible">
              <h4 className="eyebrow">Where the world meets the Bible</h4>
              {highlights.map((w, i) => (
                <button key={w.id} type="button" className="when-meet" onClick={() => openEvent(w, order)}>
                  <span className="when-mhead"><span className="when-where">{w.where}</span><b>{w.title}</b><span className="when-wdate">{w.when}</span></span>
                  <span className="when-mtext">{w.meets ? <CitedText parts={parts[i + 1]} idPrefix="when-src" /> : w.summary}</span>
                </button>
              ))}
            </section>
          )}

          {rulers.length > 0 && (
            <section className="when-rulers" aria-label="Ruling the world then">
              <h4 className="eyebrow">Ruling the world then</h4>
              <p>
                {rulers.map((w, i) => (
                  <span key={w.id}>
                    {i > 0 && <span className="when-dot" aria-hidden="true"> · </span>}
                    <button type="button" className="when-ruler" onClick={() => openEvent(w, order)}
                      title={newRulers.has(w.id) ? 'First time in your reading' : undefined}>
                      {w.rule}{newRulers.has(w.id) && <i className="when-new" aria-label="new" />}
                    </button>
                  </span>
                ))}
              </p>
              {newRulers.size > 0 && <span className="when-key"><i className="when-new" aria-hidden="true" />New to your reading here</span>}
            </section>
          )}

          {era.y0 !== null && (
            <section className="when-world" aria-label="Meanwhile in the world">
              <h4 className="eyebrow">Meanwhile in the world</h4>
              {regions.length > 1 && (
                <div className="when-filters" role="group" aria-label="Show events from">
                  {['all', ...regions].map(r => (
                    <button key={r} type="button" className="chip" aria-pressed={region === r}
                      onClick={() => setView(v => ({ ...v, region: r, more: false }))}>
                      {r === 'all' ? 'All' : REGIONS[r]}
                    </button>
                  ))}
                </div>
              )}

              {shown.length > 0 ? (
                <ol key={region}>
                  {shown.map((w, i) => (
                    <li key={w.id} style={{ '--i': i }}>
                      <button type="button" className="when-item" onClick={() => openEvent(w, order)}>
                        <span className="when-where">{w.where}</span>
                        <span className="when-wtitle">{w.title}</span>
                        <span className="when-wdate">{w.when}</span>
                        <span className="when-wnote">{w.summary}</span>
                        <span className="when-open" aria-hidden="true">›</span>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="when-none">
                  {seenHere.length ? 'Nothing new to add for these chapters. What was already going on is listed below.' : 'No events from here are recorded for these years.'}
                </p>
              )}
              {hidden > 0 && (
                <button type="button" className="link-btn when-more" onClick={() => setView(v => ({ ...v, more: true }))}>
                  Show {hidden} more from this time
                </button>
              )}

              {seenHere.length > 0 && (
                <p className="when-seen">
                  <span className="when-seen-label">Still going on, shown beside earlier chapters: </span>
                  {seenHere.map((w, i) => (
                    <span key={w.id}>
                      {i > 0 && ', '}
                      <button type="button" className="when-ruler" onClick={() => openEvent(w, order)}>{w.title}</button>
                    </span>
                  ))}
                </p>
              )}
            </section>
          )}
          {era.y0 === null && <p className="when-none">There is no date to set beside the rest of the world for these chapters.</p>}

          <SourceList sources={sources} idPrefix="when-src" onVerse={onNavigate} />
        </motion.article>
      </AnimatePresence>

      <WorldEvent event={worldById(openId)} list={openList} onStep={step} onClose={close} onRead={read} />
    </div>
  )
}

const REGION_KEYS = Object.keys(REGIONS)

// A strip of history from about 2200 BC to AD 100, with this passage marked.
function Strip({ era }) {
  const a = stripAt(era.y0) * 100, z = stripAt(era.y1) * 100
  return (
    <div className="when-strip" aria-hidden="true">
      <div className="when-track">
        <span className="when-split" style={{ left: `${SPLIT * 100}%` }} />
        {TIMELINE.map(e => <span key={e.title} className="when-tick" style={{ left: `${stripAt(e.y) * 100}%` }} />)}
        <span className="when-span" style={{ left: `calc(${a}% - ${z - a < 2 ? 7 : 0}px)`, width: `max(14px, ${z - a}%)` }} />
      </div>
      <div className="when-scale">
        <span style={{ width: `${SPLIT * 100}%` }}>Before Jesus</span><span style={{ width: `${(1 - SPLIT) * 100}%` }}>After Jesus</span>
      </div>
    </div>
  )
}
