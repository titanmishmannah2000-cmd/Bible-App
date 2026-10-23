import { useEffect, useMemo, useState } from 'react'
import { BOOKS, CHAPTER_COUNTS } from '../data/books'
import { ALL_BOOKS } from '../lib/bible'
import { toThread, threadsFor, threadText } from '../lib/threads'
import { displayBook } from '../data/canon'

// The arc map: the 66 books along a baseline, Old Testament on the left and
// New on the right. Each thread is an arc from the open book to the book it
// echoes; lapis for the Old Testament, gold for the New, thicker for stronger links.
const W = 400, BASE = 196, X0 = 18, X1 = 382, GAP = 12
const STEP = (X1 - X0 - GAP) / 65
const bookX = (i) => X0 + i * STEP + (i >= 39 ? GAP : 0)
const MID = (bookX(38) + bookX(39)) / 2

function arcPath(from, to) {
  const a = bookX(from), b = bookX(to)
  if (from === to) return `M${a - 3} ${BASE} C ${a - 6} ${BASE - 26}, ${a + 6} ${BASE - 26}, ${a + 3} ${BASE}`
  const l = Math.min(a, b), r = Math.max(a, b)
  const h = Math.min(BASE - 30, 18 + (r - l) * 0.5)
  return `M${l.toFixed(1)} ${BASE} C ${(l + (r - l) * 0.08).toFixed(1)} ${(BASE - h * 1.3).toFixed(1)}, ${(r - (r - l) * 0.08).toFixed(1)} ${(BASE - h * 1.3).toFixed(1)}, ${r.toFixed(1)} ${BASE}`
}

export default function Threads({ book, chapter, verse, data, onNavigate }) {
  const source = ALL_BOOKS.indexOf(book)
  const [focus, setFocus] = useState(null)
  const [openRef, setOpenRef] = useState(null)
  const [texts, setTexts] = useState({})
  const name = displayBook(book, chapter)

  // Every thread leaving this chapter, for the faint web and the overview list.
  const chapterThreads = useMemo(() => {
    if (!data) return []
    const out = []
    Object.entries(data).forEach(([key, list]) => {
      const [c, v] = key.split(':').map(Number)
      if (c === chapter) list.forEach(raw => out.push({ ...toThread(raw), from: v }))
    })
    return out
  }, [data, chapter])

  const verseThreads = useMemo(() => (verse ? threadsFor(data, chapter, verse) : []), [data, chapter, verse])
  const list = verse ? verseThreads : [...chapterThreads].sort((a, b) => b.votes - a.votes).slice(0, 10)

  useEffect(() => {
    let cancelled = false
    const missing = list.filter(t => !(t.ref in texts))
    if (!missing.length) return
    Promise.all(missing.map(t => threadText(t).then(text => [t.ref, text]).catch(() => [t.ref, ''])))
      .then(pairs => { if (!cancelled) setTexts(prev => ({ ...prev, ...Object.fromEntries(pairs) })) })
    return () => { cancelled = true }
  }, [list]) // eslint-disable-line react-hooks/exhaustive-deps

  const web = useMemo(() => {
    const counts = new Map()
    chapterThreads.forEach(t => counts.set(t.bookIndex, (counts.get(t.bookIndex) || 0) + 1))
    return [...counts.entries()]
  }, [chapterThreads])
  const maxVotes = Math.max(1, ...list.map(t => t.votes))
  const maxCount = Math.max(1, ...web.map(([, c]) => c))
  const across = verseThreads.filter(t => t.nt !== source >= 39).length

  if (!data) return <div className="empty-pane">Gathering the threads…</div>

  return (
    <>
      <div className="arcs-wrap">
        <svg viewBox={`0 0 ${W} 236`} role="img" className={focus ? 'has-focus' : ''}
          aria-label={verse ? `Arcs from ${name} ${chapter}:${verse} to the books it is linked with` : `Arcs from ${name} ${chapter} across the Bible`}>
          {/* The chapter's whole web, faint when one verse is open */}
          {web.map(([i, count]) => (
            <path key={`w${i}`} d={arcPath(source, i)} className="arc" fill="none"
              stroke={verse ? 'var(--map-line)' : i >= 39 ? 'var(--gold)' : 'var(--lapis)'}
              strokeOpacity={verse ? 1 : 0.35 + 0.5 * count / maxCount}
              strokeWidth={verse ? Math.min(2.2, 0.6 + count * 0.1) : 0.8 + 2.4 * count / maxCount} />
          ))}
          {/* The canon along the baseline: one tick per book, height by chapters */}
          {ALL_BOOKS.map((b, i) => (
            <line key={b} x1={bookX(i)} x2={bookX(i)} y1={BASE + 2} y2={BASE + 2 + Math.min(14, Math.max(4, Math.sqrt(CHAPTER_COUNTS[b]) * 1.2))}
              stroke={i === source ? 'var(--rubric)' : 'var(--rule)'} strokeWidth="2.2" strokeLinecap="round" />
          ))}
          <line x1={X0 - 6} x2={X1 + 6} y1={BASE} y2={BASE} stroke="var(--rule)" />
          <line x1={MID} x2={MID} y1={BASE - 6} y2={BASE + 20} stroke="var(--ink-soft)" strokeWidth="0.8" strokeDasharray="2 2" />
          <text x={(X0 + MID) / 2} y={BASE + 32} textAnchor="middle" fontSize="8.5" fontWeight="600" letterSpacing="1.6" fill="var(--ink-soft)">OLD TESTAMENT · {BOOKS.old.length}</text>
          <text x={(MID + X1) / 2} y={BASE + 32} textAnchor="middle" fontSize="8.5" fontWeight="600" letterSpacing="1.6" fill="var(--ink-soft)">NEW TESTAMENT · {BOOKS.new.length}</text>
          <text x="14" y="22" fontSize="9" fontWeight="600" letterSpacing="1.4" fill="var(--rubric)">{`${name} ${chapter}${verse ? `:${verse}` : ''}`.toUpperCase()}</text>
          <text x="386" y="22" textAnchor="end" fontSize="15" fontStyle="italic" fontFamily="var(--display)" fill="var(--ink)">{focus || ''}</text>
          {/* This verse's threads, drawn in */}
          {[...verseThreads].reverse().map((t, k) => (
            <path key={`${verse}-${t.ref}`} d={arcPath(source, t.bookIndex)} pathLength="1"
              className={`arc live arc-draw${focus === t.ref ? ' is-focus' : ''}`}
              style={{ animationDelay: `${0.05 * k}s` }}
              stroke={t.nt ? 'var(--gold)' : 'var(--lapis)'} strokeWidth={(1.1 + 2.4 * t.votes / maxVotes).toFixed(2)} />
          ))}
          {verseThreads.map(t => <circle key={`c${t.ref}`} cx={bookX(t.bookIndex)} cy={BASE} r="2.6" fill={t.nt ? 'var(--gold)' : 'var(--lapis)'} />)}
          <circle cx={bookX(source)} cy={BASE} r="4" fill="var(--leaf)" stroke="var(--rubric)" strokeWidth="2" />
        </svg>
      </div>

      <div className="threads-body">
        <div className="eyebrow">{verse ? `Threads from ${name} ${chapter}:${verse}` : `Threads from ${name} ${chapter}`}</div>
        {verse ? (
          <>
            <p className="threads-head">{verseThreads.length ? `${verseThreads.length} passages echo this verse` : 'No threads recorded'}</p>
            <p className="threads-sum">
              {verseThreads.length
                ? `${across} of them ${source >= 39 ? 'are in the Old Testament' : 'are in the New Testament'}. Tap one to read it.`
                : 'Scholars have not recorded cross-references for this verse. Try a neighbouring verse.'}
            </p>
          </>
        ) : (
          <>
            <p className="threads-head">{chapterThreads.length ? 'The strongest links in this chapter' : 'No threads recorded for this chapter'}</p>
            <p className="threads-sum">Tap any verse to follow its own threads. Below are the links readers rank highest.</p>
          </>
        )}
        {list.length > 0 && (
          <div className="legend">
            <span><i style={{ background: 'var(--lapis)' }} />Old Testament</span>
            <span><i style={{ background: 'var(--gold)' }} />New Testament</span>
            <span>Thicker line, stronger link</span>
          </div>
        )}
        {list.map(t => {
          const isOpen = openRef === t.ref
          return (
            <div key={`${t.from || ''}-${t.ref}`} className={`thread${t.nt ? ' nt' : ''}${isOpen ? ' is-open' : ''}`}
              onMouseEnter={() => setFocus(t.ref)} onMouseLeave={() => setFocus(openRef)}>
              <button type="button" aria-expanded={isOpen} onFocus={() => setFocus(t.ref)}
                onClick={() => { setOpenRef(isOpen ? null : t.ref); setFocus(isOpen ? null : t.ref) }}>
                <div className="thread-top">
                  <span className="thread-ref">{t.ref}</span>
                  <span className="thread-tag">{t.nt ? 'NEW TESTAMENT' : 'OLD TESTAMENT'}</span>
                  <span className="thread-meter" title={`${t.votes} reader votes`} aria-hidden="true"><b style={{ width: `${Math.round(100 * t.votes / maxVotes)}%` }} /></span>
                </div>
                {t.from && <div className="thread-from">FROM VERSE {t.from}</div>}
                <p className="thread-text">{texts[t.ref] ?? '…'}</p>
              </button>
              {isOpen && (
                <button type="button" className="link-btn" onClick={() => onNavigate(t.book, t.chapter, t.v1)}>Read {t.ref} in context →</button>
              )}
            </div>
          )
        })}
        <p className="threads-src">
          Cross-references from <a href="https://www.openbible.info/labs/cross-references/" target="_blank" rel="noopener noreferrer">OpenBible.info</a> (CC BY),
          drawn from the Treasury of Scripture Knowledge and ranked by reader votes.
        </p>
      </div>
    </>
  )
}
