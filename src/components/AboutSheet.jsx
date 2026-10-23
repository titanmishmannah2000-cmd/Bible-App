import Sheet from './Sheet'
import { DepthSwitch } from './ChapterBrief'
import { useDepth } from '../lib/prefs'
import { useBookContext } from '../lib/notes'
import { sectionOf } from '../data/canon'
import { cite } from '../lib/sources'
import { CitedText, SourceList, Unchecked } from './Cited'

const FIELDS = ['author', 'date', 'to', 'why', 'story', 'genre', 'structureNote', 'debate']

// The context card for a book: who, when, to whom and why, and in Deeper the
// genre, the outline and what scholars debate.
export default function AboutSheet({ open, onClose, book, chapter, onSelect }) {
  const context = useBookContext(book)
  const deeper = useDepth() === 'deeper'
  const shown = FIELDS.filter(f => deeper || !['genre', 'structureNote', 'debate'].includes(f))
  const { parts, sources } = cite(shown.map(f => context?.[f] || ''))
  const t = (f) => <CitedText parts={parts[shown.indexOf(f)]} idPrefix="about-src" />
  return (
    <Sheet open={open} onClose={onClose} variant="drawer" label={`About ${book}`}
      head={<div className="about-head"><span className="eyebrow">{sectionOf(book)?.name}</span><h2 className="sheet-title">{book}</h2></div>}>
      <div className="sheet-body about">
        <DepthSwitch />
        {!context ? <p className="muted">Opening the card…</p> : (
          <>
            <dl className="facts">
              <dt>Who wrote it</dt><dd>{t('author')}</dd>
              <dt>When</dt><dd>{t('date')}</dd>
              <dt>For whom</dt><dd>{t('to')}</dd>
              <dt>Why</dt><dd>{t('why')}</dd>
            </dl>
            <h3>Where it fits in the big story</h3>
            <p>{t('story')}</p>
            {deeper && (
              <>
                <h3>What kind of writing</h3>
                <p>{t('genre')}</p>
                <h3>Outline</h3>
                {context.structureNote && <p className="small">{t('structureNote')}</p>}
                <ol className="outline">
                  {context.structure.map(([label, from, to]) => {
                    const here = chapter >= from && chapter <= to
                    return (
                      <li key={label} className={here ? 'is-here' : ''}>
                        <button type="button" onClick={() => onSelect(book, from)} aria-current={here ? 'true' : undefined}>
                          <span>{label}</span><small>{from === to ? from : `${from}–${to}`}</small>
                        </button>
                      </li>
                    )
                  })}
                </ol>
                <h3>Questions scholars discuss</h3>
                <p>{t('debate')}</p>
              </>
            )}
            {context.sourced ? <SourceList sources={sources} idPrefix="about-src" onVerse={onSelect} /> : <Unchecked />}
            {!deeper && <p className="muted small">Switch to Deeper for the book’s outline, its kind of writing and what scholars debate.</p>}
          </>
        )}
      </div>
    </Sheet>
  )
}
