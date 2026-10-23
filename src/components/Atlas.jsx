import { lazy, Suspense, useEffect } from 'react'
import Threads from './Threads'
import { IconClose, IconExpand } from './Icons'
import { threadsFor } from '../lib/threads'

// The map library is large, so it loads in parallel with the first chapter.
const WorldMap = lazy(() => import('./WorldMap'))

export default function Atlas({
  tab, onTab, book, chapter, verse, threads, onChapterChange, onNavigate, expanded, onToggleExpand, onClose,
}) {
  const count = verse ? threadsFor(threads, chapter, verse).length : 0

  // Escape leaves the expanded view.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) onToggleExpand() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded, onToggleExpand])

  const onTabKey = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const next = tab === 'journey' ? 'threads' : 'journey'
    onTab(next)
    document.getElementById(`tab-${next}`)?.focus()
  }

  return (
    <aside className="atlas" id="atlas" aria-label="Atlas">
      <div className="atlas-card">
        <div className="atlas-head">
          <div role="tablist" aria-label="Atlas" onKeyDown={onTabKey} style={{ display: 'flex', gap: 4 }}>
            <button className="atlas-tab" type="button" role="tab" id="tab-journey" aria-controls="pane-journey"
              aria-selected={tab === 'journey'} tabIndex={tab === 'journey' ? 0 : -1} onClick={() => onTab('journey')}>Journey</button>
            <button className="atlas-tab" type="button" role="tab" id="tab-threads" aria-controls="pane-threads"
              aria-selected={tab === 'threads'} tabIndex={tab === 'threads' ? 0 : -1} onClick={() => onTab('threads')}>
              Threads {count > 0 && <span className="n">{count}</span>}
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
      </div>
    </aside>
  )
}
