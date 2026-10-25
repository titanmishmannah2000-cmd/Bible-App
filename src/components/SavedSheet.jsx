import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Sheet from './Sheet'
import { useHighlights, removeHighlight } from '../lib/highlights'
import { ALL_BOOKS } from '../lib/bible'
import { IconClose } from './Icons'
import { EASE_IN_OUT } from '../lib/motion'

// Canonical order: book, then chapter, then verse.
const order = (a, b) => ALL_BOOKS.indexOf(a.book) - ALL_BOOKS.indexOf(b.book) || a.chapter - b.chapter || a.verse - b.verse

export default function SavedSheet({ open, onClose, onSelect }) {
  const entries = Object.entries(useHighlights()).sort(([, a], [, b]) => order(a, b))
  const reduced = useReducedMotion()
  // A removed verse folds away rather than leaving a sudden gap.
  const leave = reduced
    ? { opacity: 0, transition: { duration: 0 } }
    : { opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.32, ease: EASE_IN_OUT, opacity: { duration: 0.14 } } }
  return (
    <Sheet open={open} onClose={onClose} variant="drawer" label="Illuminated verses"
      head={<div style={{ flex: '1 1 auto' }}><h2 className="sheet-title">Illuminated</h2><div className="sheet-sub">{entries.length} saved verse{entries.length === 1 ? '' : 's'}</div></div>}>
      <div className="sheet-body">
        {entries.length === 0 && <div className="empty">Nothing illuminated yet. Tap any verse while reading and choose Illuminate to keep it here.</div>}
        <AnimatePresence initial={false}>
          {entries.map(([key, h]) => (
            <motion.div className="saved-item" key={key} exit={leave}>
              <button type="button" className="go" onClick={() => { onSelect(h.book, h.chapter, h.verse); onClose() }}>
                <b>{(h.book === 'Psalms' ? 'Psalm' : h.book).toUpperCase()} {h.chapter}:{h.verse}</b>{h.text}
              </button>
              <button type="button" className="close" onClick={() => removeHighlight(key)} aria-label={`Remove ${h.book} ${h.chapter}:${h.verse}`}><IconClose /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Sheet>
  )
}
