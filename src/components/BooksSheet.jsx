import { useState } from 'react'
import Sheet from './Sheet'
import { SECTIONS, chaptersOf } from '../data/canon'

// Pick a book, then a chapter.
export default function BooksSheet({ open, onClose, book, chapter, onSelect }) {
  const [picked, setPicked] = useState(null)
  const close = () => { setPicked(null); onClose() }
  const go = (b, c) => { setPicked(null); onSelect(b, c) }

  const pick = (b) => (chaptersOf(b) === 1 ? go(b, 1) : setPicked(b))

  return (
    <Sheet open={open} onClose={close} label="The books"
      head={picked
        ? <div style={{ flex: '1 1 auto', minWidth: 0 }}><button className="link-btn" type="button" onClick={() => setPicked(null)}>← All books</button><h2 className="sheet-title">{picked}</h2></div>
        : <h2 className="sheet-title">The books</h2>}>
      <div className="sheet-body">
        {picked ? (
          <div className="chapters-pick page-in" role="list" aria-label={`Chapters of ${picked}`}>
            {Array.from({ length: chaptersOf(picked) }, (_, i) => i + 1).map(c => (
              <button key={c} type="button" role="listitem" onClick={() => go(picked, c)}
                aria-current={picked === book && c === chapter ? 'page' : undefined}
                aria-label={`${picked} ${c}`}>{c}</button>
            ))}
          </div>
        ) : (
          <div className="books-grid page-in">
            {SECTIONS.map(s => (
              <section className="book-sec" key={s.name}>
                <h3>{s.name}</h3>
                {s.books.map(b => (
                  <button key={b} type="button" className="book" onClick={() => pick(b)} aria-current={b === book ? 'true' : undefined}>
                    {b}<small>{chaptersOf(b)}</small>
                  </button>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  )
}
