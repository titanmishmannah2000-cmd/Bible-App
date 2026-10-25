import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GLOSSARY_BY_ID } from '../data/glossary'
import { PATHS_BY_ID } from '../data/paths'
import { useDepth, setDepth } from '../lib/prefs'
import { usePaths, setStep, leavePath } from '../lib/paths'
import { useChapterNotes, useBookContext, partOf } from '../lib/notes'
import { displayBook } from '../data/canon'
import { cite } from '../lib/sources'
import { CitedText, SourceList, Unchecked } from './Cited'
import { useUnfold } from '../lib/motion'

const refLabel = (book, chapter) => `${displayBook(book, chapter)} ${chapter}`

export function DepthSwitch() {
  const depth = useDepth()
  return (
    <div className="depth" role="radiogroup" aria-label="Reading depth">
      {['simple', 'deeper'].map(d => (
        <button key={d} type="button" role="radio" aria-checked={depth === d} onClick={() => setDepth(d)}>
          {d === 'simple' ? 'Simple' : 'Deeper'}
        </button>
      ))}
    </div>
  )
}

// One glossary entry: the plain sentence, and in Deeper the original word and its story.
export function Term({ id, deeper }) {
  const g = GLOSSARY_BY_ID[id]
  if (!g) return null
  const [lang, word, translit] = g.root
  return (
    <div className="term-def">
      <b>{g.term}</b> {g.simple}
      {deeper && (
        <span className="term-root">
          <span className="root-word" lang={lang === 'Hebrew' || lang === 'Aramaic' ? 'he' : lang === 'Greek' ? 'el' : undefined}>{word}</span>
          {' '}<i>{translit}</i> · {lang}. {g.grew}
        </span>
      )}
    </div>
  )
}

// Where a Start here path meets this chapter.
function PathStep({ book, chapter, onNavigate, onOpenPaths }) {
  const { active, step } = usePaths()
  const path = active && PATHS_BY_ID[active]
  if (!path) return null
  const at = step[active] || 0
  const here = path.steps.findIndex(([b, c]) => b === book && c === chapter)
  const total = path.steps.length

  if (here < 0) {
    const [b, c] = path.steps[Math.min(at, total - 1)]
    return (
      <div className="path-chip">
        <span><b>{path.title}</b> · step {Math.min(at, total - 1) + 1} of {total}</span>
        <button type="button" className="link-btn" onClick={() => onNavigate(b, c)}>Back to {refLabel(b, c)} →</button>
      </div>
    )
  }

  const [, , note] = path.steps[here]
  const next = path.steps[here + 1]
  const done = () => {
    if (next) { setStep(active, here + 1); onNavigate(next[0], next[1]) }
    else { setStep(active, total); leavePath() }
  }
  return (
    <section className="path-step" aria-label={`${path.title}, step ${here + 1} of ${total}`}>
      <div className="path-top">
        <span className="eyebrow">{path.title} · Step {here + 1} of {total}</span>
        <button type="button" className="link-btn" onClick={onOpenPaths}>Change path</button>
      </div>
      <div className="path-bar" aria-hidden="true"><b style={{ width: `${(100 * (here + 1)) / total}%` }} /></div>
      <p>{note}</p>
      <button type="button" className="chip solid" onClick={done}>
        {next ? `Done · next, ${refLabel(next[0], next[1])} →` : 'Finish this path'}
      </button>
    </section>
  )
}

// The card above the text: path step, a plain summary or deeper note, the
// part of the book, and the chapter's key words.
export default function ChapterBrief({ book, chapter, termIds, onNavigate, onOpenPaths, onOpenAbout }) {
  const depth = useDepth()
  const deeper = depth === 'deeper'
  const notes = useChapterNotes(book)
  const context = useBookContext(book)
  const [openTerm, setOpenTerm] = useState(null)
  const note = notes?.[chapter]
  const part = partOf(context, chapter)
  const words = termIds.slice(0, deeper ? 14 : 8)
  const bookLine = chapter === 1 && context ? context.why : ''
  const { parts: [whyParts, deepParts], sources } = cite([bookLine, deeper ? note?.d : ''])
  const sourced = notes?._sourced && (chapter !== 1 || context?.sourced)
  const toVerse = (b, c, v) => onNavigate(b, c, v)
  const unfold = useUnfold()

  return (
    <div className="brief-wrap">
      <PathStep book={book} chapter={chapter} onNavigate={onNavigate} onOpenPaths={onOpenPaths} />
      <section className={`brief${deeper ? ' is-deeper' : ''}`} aria-label="About this chapter">
        <div className="brief-top">
          <span className="eyebrow">{deeper ? 'Deeper' : 'In brief'}</span>
          <DepthSwitch />
        </div>
        {chapter === 1 && context && (
          <p className="brief-book">
            <b>{book}</b> <CitedText parts={whyParts} idPrefix="brief-src" /> <button type="button" className="link-btn" onClick={onOpenAbout}>About this book →</button>
          </p>
        )}
        {note ? <p className="brief-sum">{note.s}</p> : <p className="brief-sum muted">{notes ? '' : '…'}</p>}
        {deeper && note?.d && <p className="brief-deep"><CitedText parts={deepParts} idPrefix="brief-src" /></p>}
        {deeper && part && (
          <p className="brief-part">
            <span className="eyebrow">In the book</span> {part[0]} <span className="muted nowrap">({book === 'Psalms' ? 'Psalms' : part[2] > part[1] ? 'chapters' : 'chapter'} {part[1]}{part[2] > part[1] ? `–${part[2]}` : ''})</span>
            {chapter !== 1 && <button type="button" className="link-btn" onClick={onOpenAbout}>Outline →</button>}
          </p>
        )}
        {note && (deeper || bookLine) && (
          sourced
            ? <SourceList sources={sources} idPrefix="brief-src" onVerse={toVerse} />
            : <Unchecked />
        )}
        {note && !deeper && !bookLine && sourced && <p className="muted small">Summarised from the chapter itself. Switch to Deeper for notes with sources.</p>}
        {words.length > 0 && (
          <div className="brief-words">
            <span className="eyebrow">Key words</span>
            <div className="word-chips">
              {words.map(id => (
                <button key={id} type="button" className="word-chip" aria-expanded={openTerm === id}
                  onClick={() => setOpenTerm(openTerm === id ? null : id)}>{GLOSSARY_BY_ID[id].term}</button>
              ))}
            </div>
            <AnimatePresence initial={false} mode="wait">
              {openTerm && (
                <motion.div key={openTerm} className="fold" {...unfold}><Term id={openTerm} deeper={deeper} /></motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  )
}
