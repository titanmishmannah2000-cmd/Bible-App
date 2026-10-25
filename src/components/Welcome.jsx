import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getVerse } from '../lib/bible'
import { Lozenge } from './Icons'
import { PathList } from './PathsSheet'
import { usePaths } from '../lib/paths'
import { PATHS_BY_ID } from '../data/paths'
import { EASE_IN_OUT, EASE_OUT } from '../lib/motion'

const DAILY_VERSES = [
  ['John', 3, 16], ['Psalms', 23, 1], ['Romans', 8, 28], ['Philippians', 4, 13],
  ['Isaiah', 40, 31], ['Jeremiah', 29, 11], ['Proverbs', 3, 5], ['Matthew', 11, 28],
  ['Psalms', 46, 1], ['John', 1, 1], ['Romans', 5, 8], ['Psalms', 119, 105],
  ['Lamentations', 3, 22], ['Joshua', 1, 9], ['Micah', 6, 8], ['2 Corinthians', 5, 17],
  ['Hebrews', 11, 1], ['1 John', 4, 19], ['Psalms', 27, 1], ['Isaiah', 41, 10],
  ['Matthew', 5, 9], ['Galatians', 5, 22], ['Ephesians', 2, 8], ['Psalms', 139, 14],
  ['Zephaniah', 3, 17], ['John', 14, 27], ['Revelation', 21, 4], ['Deuteronomy', 31, 8],
  ['1 Corinthians', 13, 13], ['Psalms', 37, 4], ['Genesis', 1, 1],
]

function todaysReference() {
  const now = new Date()
  const day = Math.floor((now - now.getTimezoneOffset() * 60000) / 86400000)
  const [book, chapter, verse] = DAILY_VERSES[day % DAILY_VERSES.length]
  return { book, chapter, verse }
}

const rise = (delay) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.8, ease: EASE_OUT } })

// The opening page: the verse of the day, then into the book.
export default function Welcome({ onEnter, onOpenVerse, onChoosePath, resume }) {
  const [ref] = useState(todaysReference)
  const [text, setText] = useState(null)
  const { active, step } = usePaths()
  const path = active && PATHS_BY_ID[active]

  useEffect(() => {
    getVerse(ref.book, ref.chapter, ref.verse).then(v => setText(v?.text || '')).catch(() => setText(''))
  }, [ref])

  return (
    <motion.div className="welcome" role="dialog" aria-label="Welcome to Verbum"
      initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.5, ease: EASE_OUT } }}
      exit={{ opacity: 0, transition: { duration: 0.55, ease: EASE_IN_OUT } }}>
      <div className="welcome-inner">
        <motion.div className="welcome-mark" {...rise(0.1)}><Lozenge size={22} />VERBUM</motion.div>
        <motion.div className="leaf-rule" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.4, duration: 0.8, ease: EASE_OUT }} />
        <motion.div className="eyebrow" {...rise(0.5)}>Verse of the day</motion.div>
        <motion.button type="button" className="welcome-verse" {...rise(0.7)} onClick={() => onOpenVerse(ref)} title="Read this verse in its chapter">
          {text
            ? <motion.span key="verse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, ease: EASE_OUT }}>{`“${text}”`}</motion.span>
            : ' '}
        </motion.button>
        <motion.div className="welcome-ref" {...rise(0.9)}>{ref.book === 'Psalms' ? 'Psalm' : ref.book} {ref.chapter}:{ref.verse}</motion.div>
        <motion.div className="welcome-actions" {...rise(1.1)}>
          {path && (
            <button type="button" className="btn-primary" onClick={() => onChoosePath(active)}>
              Continue {path.title} · step {Math.min((step[active] || 0) + 1, path.steps.length)}
            </button>
          )}
          <button type="button" className={path ? 'link-btn' : 'btn-primary'} onClick={onEnter}>
            {resume ? `Continue in ${resume.book === 'Psalms' ? 'Psalm' : resume.book} ${resume.chapter}` : 'Begin at Genesis'}
          </button>
          {resume && <button type="button" className="link-btn" onClick={() => onOpenVerse({ book: 'Genesis', chapter: 1 })}>Start at the beginning</button>}
        </motion.div>
        <motion.section className="welcome-paths" {...rise(1.3)} aria-labelledby="start-here">
          <h2 id="start-here" className="eyebrow">Start here · where are you starting from?</h2>
          <PathList onChoose={onChoosePath} />
        </motion.section>
      </div>
    </motion.div>
  )
}
