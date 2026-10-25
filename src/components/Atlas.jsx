import { lazy, Suspense, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Threads from './Threads'
import Timeline from './Timeline'
import { IconClose, IconExpand } from './Icons'
import { threadsFor } from '../lib/threads'
import { EASE_IN, EASE_IN_OUT, narrowScreen } from '../lib/motion'

// The map library is large, so it loads in parallel with the first chapter.
const WorldMap = lazy(() => import('./WorldMap'))

export default function Atlas({
  tab, onTab, book, chapter, verse, threads, onChapterChange, onNavigate, expanded, onToggleExpand, onClose,
}) {
  const count = verse ? threadsFor(threads, chapter, verse).length : 0
  const reduced = useReducedMotion()

  // The panel opens with a CSS entrance (it widens from the right edge while the
  // verses make room). Closing runs here: the column narrows to nothing, so the
  // verses ease back across instead of jumping. On phones it folds up instead.
  const exit = reduced
    ? { opacity: 0, transition: { duration: 0 } }
    : narrowScreen()
      ? { opacity: 0, height: 0, paddingBottom: 0, transition: { duration: 0.34, ease: EASE_IN_OUT } }
      : { flexBasis: 0, paddingRight: 0, opacity: 0, transition: { flexBasis: { duration: 0.42, ease: EASE_IN_OUT }, paddingRight: { duration: 0.42, ease: EASE_IN_OUT }, opacity: { duration: 0.38, ease: EASE_IN } } }

  // Escape leaves the expanded view.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) onToggleExpand() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded, onToggleExpand])

  const onTabKey = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const tabs = ['journey', 'threads', 'timeline']
    const next = tabs[(tabs.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
    onTab(next)
    document.getElementById(`tab-${next}`)?.focus()
  }

  return (
    <motion.aside className="atlas" id="atlas" aria-label="Atlas" exit={exit}>
      <div className="atlas-card">
        <div className="atlas-head">
          <div role="tablist" aria-label="Atlas" onKeyDown={onTabKey} style={{ display: 'flex', gap: 4 }}>
            <button className="atlas-tab" type="button" role="tab" id="tab-journey" aria-controls="pane-journey"
              aria-selected={tab === 'journey'} tabIndex={tab === 'journey' ? 0 : -1} onClick={() => onTab('journey')}>
              {tab === 'journey' && <TabInk />}<span>Journey</span>
            </button>
            <button className="atlas-tab" type="button" role="tab" id="tab-threads" aria-controls="pane-threads"
              aria-selected={tab === 'threads'} tabIndex={tab === 'threads' ? 0 : -1} onClick={() => onTab('threads')}>
              {tab === 'threads' && <TabInk />}<span>Echoes</span> {count > 0 && <span className="n">{count}</span>}
            </button>
            <button className="atlas-tab" type="button" role="tab" id="tab-timeline" aria-controls="pane-timeline"
              aria-selected={tab === 'timeline'} tabIndex={tab === 'timeline' ? 0 : -1} onClick={() => onTab('timeline')}>
              {tab === 'timeline' && <TabInk />}<span>Timeline</span>
            </button>
          </div>
          <div className="atlas-tools">
            <button className="icon-btn" type="button" onClick={onToggleExpand} aria-pressed={expanded}
              aria-label={expanded ? 'Show the verses again' : 'Expand the atlas over the verses'} title={expanded ? 'Back to the verses (Esc)' : 'Expand'}>
              <IconExpand on={expanded} />
            </button>
            <button className="icon-btn" type="button" onClick={onClose} aria-label="Hide the atlas" title="Hide"><IconClose /></button>
          </div>
        </div>
        <div className="pane" id="pane-journey" role="tabpanel" aria-labelledby="tab-journey" hidden={tab !== 'journey'}>
          <Suspense fallback={<div className="empty-pane">Unrolling the map…</div>}>
            <WorldMap book={book} chapter={chapter} onChapterChange={onChapterChange} expanded={expanded} onToggleExpand={onToggleExpand} />
          </Suspense>
        </div>
        <div className="pane" id="pane-threads" role="tabpanel" aria-labelledby="tab-threads" hidden={tab !== 'threads'}>
          {tab === 'threads' && <Threads key={`${book}-${chapter}-${verse}`} book={book} chapter={chapter} verse={verse} data={threads} onNavigate={onNavigate} />}
        </div>
        <div className="pane" id="pane-timeline" role="tabpanel" aria-labelledby="tab-timeline" hidden={tab !== 'timeline'}>
          {tab === 'timeline' && <Timeline key={book} book={book} onNavigate={onNavigate} />}
        </div>
      </div>
    </motion.aside>
  )
}

// The dark pill behind the chosen tab slides across to the other tab.
function TabInk() {
  return <motion.span className="tab-ink" layoutId="atlas-tab-ink" aria-hidden="true" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />
}
