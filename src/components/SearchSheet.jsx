import { useState, useEffect, useRef, useMemo } from 'react'
import Sheet from './Sheet'
import { parseReference, formatReference, searchBible, searchTerms, getVerse } from '../lib/bible'
import { IconSearch } from './Icons'

const MIN_KEYWORD = 3

function Highlighted({ text, terms }) {
  if (!terms.length) return text
  const pattern = new RegExp(`\\b(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  return text.split(pattern).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))
}

export default function SearchSheet({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('')
  const [testament, setTestament] = useState('all')
  const [search, setSearch] = useState({ key: '', results: [], total: 0, error: null })
  const [refPreview, setRefPreview] = useState(null)
  const inputRef = useRef(null)

  const reference = useMemo(() => parseReference(query), [query])
  const terms = useMemo(() => searchTerms(query), [query])
  const keywordQuery = !(reference && reference.chapter) && query.trim().length >= MIN_KEYWORD
  const searchKey = keywordQuery ? `${testament}|${query.trim().toLowerCase()}` : ''
  const searching = keywordQuery && search.key !== searchKey

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30) }, [open])

  // Keyword search across the whole Bible, debounced.
  useEffect(() => {
    if (!searchKey) return
    let cancelled = false
    const t = setTimeout(() => {
      searchBible(query, { testament })
        .then(({ results, total }) => { if (!cancelled) setSearch({ key: searchKey, results, total, error: null }) })
        .catch(() => { if (!cancelled) setSearch({ key: searchKey, results: [], total: 0, error: 'Search is unavailable right now' }) })
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
  }, [searchKey, query, testament])

  // Show the verse text when the query is a single-verse reference.
  useEffect(() => {
    if (!reference?.verse) return
    let cancelled = false
    getVerse(reference.book, reference.chapter, reference.verse)
      .then(v => { if (!cancelled) setRefPreview(v ? { ...v, key: formatReference(reference) } : null) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [reference])

  const close = () => { setQuery(''); onClose() }
  const go = (book, chapter, verse) => { onSelect(book, chapter, verse); close() }
  const goToReference = () => go(reference.book, reference.chapter || 1, reference.verse)
  const onSubmit = (e) => {
    e.preventDefault()
    if (reference) goToReference()
    else if (search.key === searchKey && search.results[0]) {
      const v = search.results[0]
      go(v.book_name, v.chapter, v.verse)
    }
  }

  const keywordResults = keywordQuery && search.key === searchKey ? search : null
  const preview = reference?.verse && refPreview?.key === formatReference(reference) ? refPreview : null

  return (
    <Sheet open={open} onClose={close} variant="top" label="Search"
      head={
        <form onSubmit={onSubmit} style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <IconSearch />
          <input ref={inputRef} className="search-input" type="search" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="A word, a phrase, or John 3:16" aria-label="Search the Bible" autoComplete="off"
            onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); close() } }} />
        </form>
      }>
      <div className="sheet-body">
        <div className="filters" role="group" aria-label="Where to search">
          {[['all', 'Whole Bible'], ['old', 'Old Testament'], ['new', 'New Testament']].map(([t, name]) => (
            <button key={t} type="button" className="chip" aria-pressed={testament === t} onClick={() => setTestament(t)}>{name}</button>
          ))}
        </div>
        {reference && (
          <button type="button" className="hit go-ref" onClick={goToReference}>
            <span>
              <span className="ref" style={{ display: 'block' }}>GO TO {formatReference(reference).toUpperCase()} →</span>
              {preview && <span className="txt">{preview.text}</span>}
            </span>
          </button>
        )}
        {searching && <p className="hint">Searching all 66 books…</p>}
        {keywordResults?.error && <p className="hint">{keywordResults.error}</p>}
        {keywordResults && !keywordResults.error && (
          <p className="hint">
            {keywordResults.total === 0
              ? 'No verses found.'
              : `${keywordResults.total.toLocaleString()} verse${keywordResults.total === 1 ? '' : 's'}${keywordResults.total > keywordResults.results.length ? `, showing the first ${keywordResults.results.length}` : ''}.`}
          </p>
        )}
        {!reference && !keywordQuery && (
          <p className="hint">Search for a word or phrase, or jump to a reference such as Psalm 23 or Rom 8:28. Open search anytime with <kbd>Ctrl</kbd> <kbd>K</kbd> or <kbd>/</kbd>.</p>
        )}
        {keywordResults?.results.map(v => (
          <button type="button" className="hit" key={`${v.book_name}-${v.chapter}-${v.verse}`} onClick={() => go(v.book_name, v.chapter, v.verse)}>
            <span className="ref">{(v.book_name === 'Psalms' ? 'Psalm' : v.book_name).toUpperCase()} {v.chapter}:{v.verse}</span>
            <span className="txt"><Highlighted text={v.text} terms={terms} /></span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
