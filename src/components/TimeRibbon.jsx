import { useMemo } from 'react'
import { TIMELINE } from '../data/timeline'
import { eraFor, stripAt, SPLIT } from '../lib/when'
import { cite } from '../lib/sources'
import { SourceList } from './Cited'

// A thin strip of history under the map. A marker glides to the date of the
// journey's current stop, so the reader sees when, as well as where, the pointer
// has reached.
export default function TimeRibbon({ book, chapter, onOpen, onVerse }) {
  const era = eraFor(book, chapter)
  const { sources } = useMemo(() => cite([era?.note || '']), [era])
  if (!era || era.y0 === null) return null
  const x = stripAt((era.y0 + era.y1) / 2) * 100

  return (
    <section className="ribbon" aria-label="When this stop happened">
      <div className="rb-head">
        <span className="eyebrow">When this stop happened</span>
        <button type="button" className="link-btn" onClick={onOpen}>More in the timeline →</button>
      </div>
      <div className="rb-track" aria-hidden="true">
        <span className="rb-line" />
        <span className="rb-split" style={{ left: `${SPLIT * 100}%` }} />
        {TIMELINE.map(t => <span key={t.title} className={`rb-tick ${t.lane}`} style={{ left: `${stripAt(t.y) * 100}%` }} />)}
        <span className="rb-marker" style={{ left: `${x}%` }}><i /></span>
      </div>
      <div className="rb-scale" aria-hidden="true">
        <span style={{ width: `${SPLIT * 100}%` }}>Before Jesus</span><span style={{ width: `${(1 - SPLIT) * 100}%` }}>After Jesus</span>
      </div>
      <p className="rb-now" key={era.title}>
        <b>{era.when}</b>{era.disputed && <em className="tl-disputed"> Scholars disagree</em>}
        <span>{era.title}</span>
      </p>
      <SourceList sources={sources} idPrefix="rb-src" onVerse={onVerse} title="Sources for this date" />
    </section>
  )
}
