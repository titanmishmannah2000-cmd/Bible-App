import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { BOOK_THEMES, DEFAULT_THEME } from './data/books'
import { BOOK_PAINTINGS, DEFAULT_PAINTING } from './data/paintings'
import { parseReadingPath, readingPath } from './lib/routes'
import { playScene, stopSound } from './lib/soundscape'
import { useBookThreads, threadsFor } from './lib/threads'
import { storage, useToast, setDepth } from './lib/prefs'
import { startPath, setStep, stepOf } from './lib/paths'
import { addMemory } from './lib/memory'
import { PATHS_BY_ID } from './data/paths'
import TopBar from './components/TopBar'
import Rail from './components/Rail'
import Reader from './components/Reader'
import Atlas from './components/Atlas'
import Canon from './components/Canon'
import BooksSheet from './components/BooksSheet'
import SearchSheet from './components/SearchSheet'
import SavedSheet from './components/SavedSheet'
import Welcome from './components/Welcome'
import PathsSheet from './components/PathsSheet'
import AboutSheet from './components/AboutSheet'
import Ambience from './components/Ambience'
import Sheet from './components/Sheet'
import MemorizeSheet from './components/MemorizeSheet'
import CreditsSheet from './components/CreditsSheet'
import StoryView from './components/StoryView'

// The zoom library is only needed once a painting is opened.
const PlateViewer = lazy(() => import('./components/PlateViewer'))

const LAST_READ_KEY = 'verbum-last-read'
const SOUND_KEY = 'verbum-sound'
const ATLAS_KEY = 'verbum-map-open'
const TAB_KEY = 'verbum-atlas-tab'
const narrow = () => window.matchMedia('(max-width: 900px)').matches

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const fromUrl = parseReadingPath(location.pathname)
  const [lastRead] = useState(() => storage.get(LAST_READ_KEY))
  const { book, chapter, verse: focusVerse } = fromUrl || { book: 'Genesis', chapter: 1, verse: null }

  // A shared link opens straight into the reader; otherwise greet with the verse of the day.
  const [entered, setEntered] = useState(() => !!fromUrl)
  const [openVerse, setOpenVerse] = useState(() => fromUrl?.verse || null)
  const [sheet, setSheet] = useState(null)
  const [learn, setLearn] = useState(null)
  const [atlasOpen, setAtlasOpen] = useState(() => storage.get(ATLAS_KEY) ?? true)
  const [atlasTab, setAtlasTab] = useState(() => (['threads', 'timeline'].includes(storage.get(TAB_KEY)) ? storage.get(TAB_KEY) : 'journey'))
  const [expanded, setExpanded] = useState(false)
  const [soundOn, setSoundOn] = useState(() => storage.get(SOUND_KEY) === true)
  const toastState = useToast()

  const theme = BOOK_THEMES[book] || DEFAULT_THEME
  const painting = BOOK_PAINTINGS[book] || DEFAULT_PAINTING
  const threads = useBookThreads(book)

  const goTo = useCallback((nextBook, nextChapter, verse = null) => {
    setOpenVerse(verse)
    setEntered(true)
    navigate(readingPath(nextBook, nextChapter, verse))
  }, [navigate])

  useEffect(() => {
    if (fromUrl) storage.set(LAST_READ_KEY, { book: fromUrl.book, chapter: fromUrl.chapter })
  }, [fromUrl?.book, fromUrl?.chapter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = entered ? `${book === 'Psalms' ? 'Psalm' : book} ${chapter} · Verbum` : 'Verbum'
  }, [entered, book, chapter])

  // Ambient sound follows the book. Browsers only allow audio after a tap or
  // key press, so a remembered "on" waits for the first interaction.
  useEffect(() => {
    if (!soundOn || !entered) { stopSound(); return }
    const start = () => { try { playScene(theme.sound) } catch { /* no Web Audio */ } }
    start()
    window.addEventListener('pointerdown', start, { once: true })
    window.addEventListener('keydown', start, { once: true })
    return () => {
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('keydown', start)
    }
  }, [soundOn, entered, theme.sound])

  // Ctrl/⌘ K or "/" opens search.
  useEffect(() => {
    const onKey = (e) => {
      if (!entered) return
      const typing = e.target.closest?.('input, textarea, [contenteditable]')
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setSheet('search') }
      else if (e.key === '/' && !typing && !document.querySelector('dialog[open]')) { e.preventDefault(); setSheet('search') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [entered])

  const showAtlas = (open) => {
    setAtlasOpen(open)
    storage.set(ATLAS_KEY, open)
    if (!open) setExpanded(false)
  }
  const chooseTab = (tab) => {
    setAtlasTab(tab)
    storage.set(TAB_KEY, tab)
  }
  const followThreads = (verse) => {
    setOpenVerse(verse)
    chooseTab('threads')
    showAtlas(true)
    if (narrow()) setTimeout(() => document.getElementById('atlas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }
  const toggleExpanded = useCallback(() => setExpanded(x => !x), [])

  const targets = useMemo(() => (
    atlasOpen && atlasTab === 'threads' && openVerse
      ? new Set(threadsFor(threads, chapter, openVerse).map(t => t.bookIndex))
      : null
  ), [atlasOpen, atlasTab, openVerse, threads, chapter])

  // Start (or restart) a Start here path and open its current step.
  const choosePath = (id, restart = false) => {
    const path = PATHS_BY_ID[id]
    if (restart) setStep(id, 0)
    else startPath(id)
    setDepth(path.depth)
    if (path.threads) { chooseTab('threads'); if (!narrow()) showAtlas(true) }
    const at = restart ? 0 : Math.min(stepOf(id), path.steps.length - 1)
    const [b, c] = path.steps[at]
    setSheet(null)
    goTo(b, c)
  }

  const toggleSound = () => setSoundOn(on => { storage.set(SOUND_KEY, !on); return !on })
  const enter = () => {
    const start = lastRead?.book ? lastRead : { book: 'Genesis', chapter: 1 }
    goTo(start.book, start.chapter)
  }

  return (
    <div className="app-shell">
      <Ambience />
      <AnimatePresence>
        {!entered && (
          <Welcome
            key="welcome"
            onEnter={enter}
            onChoosePath={choosePath}
            onOpenVerse={(r) => goTo(r.book, r.chapter, r.verse || null)}
            resume={lastRead?.book ? lastRead : null}
          />
        )}
      </AnimatePresence>

      {entered && (
        <>
          <TopBar
            book={book} chapter={chapter}
            onHome={() => setEntered(false)}
            onBooks={() => setSheet('books')}
            onStart={() => setSheet('paths')}
            onSearch={() => setSheet('search')}
            onSaved={() => setSheet('saved')}
            onMemorize={() => { setLearn(null); setSheet('memorize') }}
            atlasOpen={atlasOpen}
            onToggleAtlas={() => showAtlas(!atlasOpen)}
            soundOn={soundOn}
            onToggleSound={toggleSound}
          />

          <div className={`cols${atlasOpen && expanded ? ' is-expanded' : ''}`}>
            <Rail book={book} chapter={chapter} onChapter={(c) => goTo(book, c)} />
            <Reader
              book={book} chapter={chapter} focusVerse={focusVerse}
              openVerse={openVerse} onOpenVerse={setOpenVerse}
              onNavigate={goTo}
              threads={threads}
              onFollowThreads={followThreads}
              onLearn={(v) => { setLearn(addMemory(book, chapter, v)); setSheet('memorize') }}
              painting={painting}
              onOpenPaths={() => setSheet('paths')}
              onOpenAbout={() => setSheet('about')}
              onOpenPlate={() => setSheet('plate')}
              onOpenStory={() => setSheet('story')}
              onOpenCredits={() => setSheet('credits')}
            />
            <AnimatePresence>
              {atlasOpen && (
                <Atlas
                  key="atlas"
                  tab={atlasTab} onTab={chooseTab}
                  book={book} chapter={chapter} verse={openVerse}
                  threads={threads}
                  onChapterChange={(c) => goTo(book, c)}
                  onNavigate={goTo}
                  expanded={expanded} onToggleExpand={toggleExpanded}
                  onClose={() => showAtlas(false)}
                />
              )}
            </AnimatePresence>
          </div>

          <Canon book={book} targets={targets} onSelectBook={(b) => goTo(b, 1)} />

          <BooksSheet open={sheet === 'books'} onClose={() => setSheet(null)} book={book} chapter={chapter}
            onSelect={(b, c) => { setSheet(null); goTo(b, c) }} />
          <SearchSheet open={sheet === 'search'} onClose={() => setSheet(null)} onSelect={goTo} />
          <PathsSheet open={sheet === 'paths'} onClose={() => setSheet(null)} onChoose={choosePath} />
          <AboutSheet open={sheet === 'about'} onClose={() => setSheet(null)} book={book} chapter={chapter}
            onSelect={(b, c) => { setSheet(null); goTo(b, c) }} />
          <Sheet open={sheet === 'plate'} onClose={() => setSheet(null)} variant="full" title={painting.title} label={`Painting: ${painting.title}`}>
            {sheet === 'plate' && (
              <Suspense fallback={<div className="empty-pane">Bringing in the painting…</div>}>
                <PlateViewer painting={painting} onNavigate={(b, c, v) => { setSheet(null); goTo(b, c, v || null) }} />
              </Suspense>
            )}
          </Sheet>
          <Sheet open={sheet === 'story'} onClose={() => setSheet(null)} variant="full" title={`${book} ${chapter} as a story`} label="Chapter story">
            {sheet === 'story' && <StoryView key={`${book}-${chapter}`} book={book} chapter={chapter}
              onStory={(c) => goTo(book, c)}
              onRead={(b, c, v) => { setSheet(null); goTo(b, c, v || null) }} />}
          </Sheet>
          <MemorizeSheet open={sheet === 'memorize'} start={learn} onClose={() => { setSheet(null); setLearn(null) }}
            onRead={(b, c, v) => { setSheet(null); setLearn(null); goTo(b, c, v || null) }} />
          <SavedSheet open={sheet === 'saved'} onClose={() => setSheet(null)} onSelect={goTo} />
          <CreditsSheet open={sheet === 'credits'} onClose={() => setSheet(null)} />
        </>
      )}

      <div className={`toast${toastState.text ? ' is-on' : ''}`} role="status">{toastState.text}</div>
    </div>
  )
}
