import { bookIndex, chaptersOf, pad2 } from '../data/canon'

export default function Rail({ book, chapter, onChapter }) {
  const count = chaptersOf(book)
  const label = book === 'Psalms' ? 'Psalm' : 'Chapter'
  return (
    <aside className="rail" aria-label={`${label} ${chapter} of ${count}`}>
      <div className="eyebrow">{label}</div>
      <div className={`numeral${chapter >= 100 ? ' is-long' : ''}`} aria-hidden="true">{pad2(chapter)}</div>
      <div className="numeral-of">of {count} · Book {pad2(bookIndex(book) + 1)} of 66</div>
      <div className="leaf-rule" aria-hidden="true" />
      {count > 1 && (
        <>
          <div className="eyebrow chapters-label">{book === 'Psalms' ? 'Psalms' : 'Chapters'}</div>
          <nav className="chapter-grid" aria-label={`Chapters of ${book}`}>
            {Array.from({ length: count }, (_, i) => i + 1).map(c => (
              <button key={c} type="button" onClick={() => onChapter(c)} aria-current={c === chapter ? 'page' : undefined}
                aria-label={`${label} ${c}`}>{c}</button>
            ))}
          </nav>
        </>
      )}
    </aside>
  )
}
