import { useState } from 'react'
import { SECTIONS, bookIndex, chaptersOf } from '../data/canon'

// The canon ribbon: every book as a tick, its height by the number of chapters.
// Gold ticks are the books the open verse's threads reach.
export default function Canon({ book, targets, onSelectBook }) {
  const [peek, setPeek] = useState(null)
  const shown = peek || book
  const section = SECTIONS.find(s => s.books.includes(shown))
  const current = bookIndex(book)

  return (
    <footer className="canon" aria-label="The books of the Bible">
      <div className="canon-caption" aria-live="polite">
        <b>{shown}</b>{section?.name} · {chaptersOf(shown)} chapter{chaptersOf(shown) > 1 ? 's' : ''}
      </div>
      <div className="canon-scroll">
        <div className="canon-track">
          {SECTIONS.map(s => (
            <div className="section" key={s.name}>
              <div className="section-name" title={s.name}>{s.name}</div>
              <div className="ticks">
                {s.books.map((b, k) => {
                  const i = s.start + k
                  return (
                    <button key={b} type="button" className={`tick${targets?.has(i) ? ' is-thread' : ''}`}
                      style={{ height: `${Math.min(26, Math.max(7, Math.round(Math.sqrt(chaptersOf(b)) * 2.1)))}px` }}
                      aria-label={`${b}, ${chaptersOf(b)} chapters`} title={b}
                      aria-current={i === current ? 'page' : undefined}
                      onMouseEnter={() => setPeek(b)} onMouseLeave={() => setPeek(null)}
                      onFocus={() => setPeek(b)} onBlur={() => setPeek(null)}
                      onClick={() => onSelectBook(b)} />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
