import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { annotate } from 'rough-notation'
import { AnimatePresence, motion } from 'framer-motion'
import useBible from '../hooks/useBible'
import { useHighlights, highlightKey, toggleHighlight } from '../lib/highlights'
import { ALL_BOOKS, TRANSLATION } from '../lib/bible'
import { verseUrl } from '../lib/routes'
import { threadsFor, threadText } from '../lib/threads'
import { toast, useDarkTheme, useDepth } from '../lib/prefs'
import { glossChapter, glossVerse, splitMarked } from '../lib/glossary'
import { sectionOf, chaptersOf, displayBook } from '../data/canon'
import { Lozenge } from './Icons'
import ChapterBrief, { Term } from './ChapterBrief'
import { useFade, useUnfold } from '../lib/motion'
import { storyFor } from '../data/stories'

const WIDE = '(min-width: 1181px)'
const subscribeWide = (cb) => { const m = window.matchMedia(WIDE); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) }
const useWide = () => useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches)
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches
const GLOSSARY_TITLE = 'Tap the verse to see what this word means'
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

// The previous and next chapter, crossing into neighbouring books at the ends.
function neighbours(book, chapter) {
  const i = ALL_BOOKS.indexOf(book)
  const prev = chapter > 1
    ? { book, chapter: chapter - 1 }
    : i > 0 ? { book: ALL_BOOKS[i - 1], chapter: chaptersOf(ALL_BOOKS[i - 1]) } : null
  const next = chapter < chaptersOf(book)
    ? { book, chapter: chapter + 1 }
    : i < ALL_BOOKS.length - 1 ? { book: ALL_BOOKS[i + 1], chapter: 1 } : null
  return { prev, next }
}
const navLabel = (to, book) => (to.book === book ? `${to.book === 'Psalms' ? 'Psalm' : 'Chapter'} ${to.chapter}` : `${displayBook(to.book, 1)} ${to.chapter}`)

function pickVoice() {
  const english = window.speechSynthesis.getVoices().filter(v => v.lang?.startsWith('en'))
  return english.find(v => v.localService) || english[0] || null
}

export default function Reader({
  book, chapter, focusVerse, openVerse, onOpenVerse, onNavigate, threads, onFollowThreads, painting, onOpenPaths, onOpenAbout, onOpenPlate, onLearn, onOpenStory,
}) {
  const { verses, heading, loading, error } = useBible(book, chapter)
  const highlights = useHighlights()
  const wide = useWide()
  const dark = useDarkTheme()
  const scrollRef = useRef(null)
  const versesRef = useRef(null)
  const [glossTop, setGlossTop] = useState(0)
  const { prev, next } = neighbours(book, chapter)
  const section = sectionOf(book)
  const glossary = useMemo(() => glossChapter(verses), [verses])
  const marginFade = useFade({ x: 10, y: 0 })
  const unfold = useUnfold()
  const page = `${book}-${chapter}`

  // New chapter: back to the top, or to the verse we were sent to.
  useEffect(() => {
    if (loading) return
    const el = focusVerse && document.getElementById(`verse-${focusVerse}`)
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' })
      el.classList.remove('flash')
      void el.offsetWidth
      el.classList.add('flash')
    } else {
      scrollRef.current?.scrollTo({ top: 0 })
      if (!window.matchMedia(WIDE).matches && window.scrollY > 0) window.scrollTo({ top: 0 })
    }
  }, [loading, book, chapter, focusVerse])

  // Illuminated verses get a hand-laid gold wash.
  useEffect(() => {
    if (loading || !versesRef.current) return
    const color = cssVar('--mark')
    const marks = []
    versesRef.current.querySelectorAll('.v.is-lit .words').forEach(words => {
      const a = annotate(words, { type: 'highlight', color, multiline: true, iterations: 1, animationDuration: reducedMotion() ? 0 : 700 })
      a.show()
      marks.push(a)
    })
    return () => marks.forEach(a => a.remove())
  }, [loading, highlights, book, chapter, dark, wide])

  // The gloss sits in the margin beside its verse.
  useLayoutEffect(() => {
    if (!openVerse || !wide || !versesRef.current) return
    const el = document.getElementById(`verse-${openVerse}`)
    // Measured on screen, so the chapter's entrance (a small slide) cannot skew it.
    if (el) setGlossTop(el.getBoundingClientRect().top - versesRef.current.getBoundingClientRect().top)
  }, [openVerse, wide, verses])

  // Arrow keys turn the page.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return
      if (document.querySelector('dialog[open]')) return
      if (e.key === 'ArrowLeft' && prev) onNavigate(prev.book, prev.chapter)
      if (e.key === 'ArrowRight' && next) onNavigate(next.book, next.chapter)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onNavigate])

  const underline = useRef(new Map())
  useEffect(() => {
    const map = underline.current
    return () => { map.forEach(a => a.remove()); map.clear() }
  }, [book, chapter, dark, wide])
  const hover = (el, on) => {
    if (!finePointer()) return
    const words = el.querySelector('.words')
    let a = underline.current.get(words)
    if (!a && on) {
      a = annotate(words, { type: 'underline', color: cssVar('--lapis'), strokeWidth: 1.3, padding: 1, multiline: true, iterations: 1, animationDuration: 420 })
      underline.current.set(words, a)
    }
    if (a) on ? a.show() : a.hide()
  }

  const toggle = (n) => onOpenVerse(openVerse === n ? null : n)
  const open = verses.find(v => v.verse === openVerse)
  const gloss = open && (
    <VerseGloss
      key={`${book}-${chapter}-${open.verse}`}
      book={book} chapter={chapter} verse={open}
      threads={threadsFor(threads, chapter, open.verse)}
      lit={!!highlights[highlightKey(book, chapter, open.verse)]}
      onFollow={() => onFollowThreads(open.verse)}
      onLearn={() => onLearn(open.verse)}
      inline={!wide}
    />
  )

  return (
    <main className="reader" ref={scrollRef} id="reader">
      <div className="reader-inner">
        <div className="title-block page-in" key={`t-${page}`}>
          <div className="eyebrow">{section?.name} · {book === 'Psalms' ? `Psalm ${chapter}` : `Chapter ${chapter}`}</div>
          <h1 className="title">{book === 'Psalms' ? 'Psalms' : book}</h1>
          <div className="title-actions">
            {storyFor(book, chapter) && <button type="button" className="chip solid" onClick={onOpenStory}>Read this chapter as a story</button>}
            {!wide && painting && <button type="button" className="chip" onClick={onOpenPlate}>See this book’s painting</button>}
          </div>
        </div>
        <div className="hair" aria-hidden="true" />
        <ChapterBrief key={`b-${page}`} book={book} chapter={chapter} termIds={loading ? [] : glossary.ids}
          onNavigate={onNavigate} onOpenPaths={onOpenPaths} onOpenAbout={onOpenAbout} />
        {heading && !loading && <div className="superscription">{heading}</div>}
        {loading && <div className="status" role="status">Opening the page…</div>}
        {error && <div className="status" role="alert">{error}. Check that the app’s files are all in place.</div>}

        {!loading && !error && (
          <div className="verses page-in" key={`v-${page}`} ref={versesRef}>
            {verses.map((v, i) => {
              const lit = !!highlights[highlightKey(book, chapter, v.verse)]
              const initial = i === 0 && /^[A-Za-z]/.test(v.text) ? v.text[0] : null
              return (
                <div key={v.verse}>
                  <div
                    id={`verse-${v.verse}`}
                    className={`v${lit ? ' is-lit has-notation' : ''}${openVerse === v.verse ? ' is-open' : ''}`}
                    role="button" tabIndex={0}
                    aria-expanded={openVerse === v.verse}
                    aria-label={`${displayBook(book, chapter)} ${chapter}:${v.verse}${lit ? ', illuminated' : ''}`}
                    onClick={() => toggle(v.verse)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(v.verse) } }}
                    onMouseEnter={(e) => hover(e.currentTarget, true)}
                    onMouseLeave={(e) => hover(e.currentTarget, false)}
                  >
                    <span className="n">{v.verse}</span>
                    <span className="t">
                      {initial && <span className="initial" aria-hidden="true"><span>{initial}</span></span>}
                      <span className="words">
                        {splitMarked(initial ? v.text.slice(1) : v.text, glossary.marks[v.verse], initial ? 1 : 0)
                          .map((part, k) => (typeof part === 'string' ? part : <span key={k} className="term" title={GLOSSARY_TITLE}>{part.text}</span>))}
                      </span>
                    </span>
                  </div>
                  {!wide && (
                    <AnimatePresence initial={false}>
                      {openVerse === v.verse && gloss && (
                        <motion.div key="gloss" className="gloss-fold" {...unfold}>{gloss}</motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {wide && !loading && !error && (
          <div className="gloss-col">
            <AnimatePresence mode="wait" initial={false}>
              {gloss
                ? <motion.div key={`g-${page}-${open.verse}`} className="gloss-slot" style={{ top: glossTop }} {...marginFade}>{gloss}</motion.div>
                : <motion.div key={`p-${book}`} className="plate-slot" {...marginFade}><MarginPlate painting={painting} onOpen={onOpenPlate} /></motion.div>}
            </AnimatePresence>
          </div>
        )}

        {!loading && !error && verses.length > 0 && (
          <>
            <div className="colophon page-in">
              <Lozenge size={22} />
              Here ends {book === 'Psalms' ? `Psalm ${chapter}` : `chapter ${chapter} of ${book}`}
            </div>
            <div className="chapter-end">
              {prev ? <button className="link-btn" type="button" onClick={() => onNavigate(prev.book, prev.chapter)}>← {navLabel(prev, book)}</button> : <span />}
              <span className="line" aria-hidden="true" />
              {next && <button className="link-btn" type="button" onClick={() => onNavigate(next.book, next.chapter)}>{navLabel(next, book)} →</button>}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function MarginPlate({ painting, onOpen }) {
  const [src, setSrc] = useState(0)
  const [loaded, setLoaded] = useState(false)
  if (!painting || src >= painting.urls.length) {
    return <div className="margin-hint">Tap a verse to see what it means and where the Bible echoes it.</div>
  }
  return (
    <figure className="plate">
      <button type="button" className={`frame${loaded ? ' is-loaded' : ''}`} onClick={onOpen} aria-label={`Look closer at ${painting.title}`}>
        <img className="art" onLoad={() => setLoaded(true)} src={painting.urls[src]} alt={`${painting.title}, ${painting.artist}`} loading="lazy" onError={() => setSrc(s => s + 1)} />
        <span className="frame-hint" aria-hidden="true">Tap to look closer</span>
      </button>
      <figcaption><i>{painting.title}</i>{painting.artist}</figcaption>
    </figure>
  )
}

function VerseGloss({ book, chapter, verse, threads, lit, onFollow, onLearn, inline }) {
  const [teaser, setTeaser] = useState(null)
  const deeper = useDepth() === 'deeper'
  const terms = useMemo(() => glossVerse(verse.text), [verse.text])
  const [speaking, setSpeaking] = useState(false)
  const name = displayBook(book, chapter)
  const reference = `${name} ${chapter}:${verse.verse}`
  const fromNt = ALL_BOOKS.indexOf(book) >= 39
  const across = threads.filter(t => t.nt !== fromNt)
  const best = across[0] || threads[0] || null

  useEffect(() => {
    if (!best) return
    let cancelled = false
    threadText(best).then(text => { if (!cancelled) setTeaser({ ref: best.ref, text }) }).catch(() => {})
    return () => { cancelled = true }
  }, [best?.ref]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel() }, [])

  const quote = `“${verse.text}” ${reference} (${TRANSLATION})`
  const copy = async () => {
    try { await navigator.clipboard.writeText(quote); toast('Verse copied') } catch { toast('Copying is blocked in this browser') }
  }
  const share = async () => {
    const url = verseUrl(book, chapter, verse.verse)
    if (navigator.share) {
      try { await navigator.share({ title: reference, text: quote, url }) } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(`${quote}\n${url}`); toast('Link copied') } catch { toast('Copying is blocked in this browser') }
    }
  }
  const listen = () => {
    const synth = window.speechSynthesis
    synth.cancel()
    if (speaking) { setSpeaking(false); return }
    const u = new SpeechSynthesisUtterance(`${verse.text}. ${name} ${chapter}, verse ${verse.verse}.`)
    u.rate = 0.88
    const voice = pickVoice()
    if (voice) u.voice = voice
    u.onend = u.onerror = () => setSpeaking(false)
    synth.speak(u)
    setSpeaking(true)
  }
  const illuminate = () => {
    const on = toggleHighlight(book, chapter, verse.verse, verse.text)
    toast(on ? `${reference} illuminated` : `${reference} removed from Saved`)
  }

  return (
    <div className={`gloss${inline ? ' inline' : ''}`} onClick={(e) => e.stopPropagation()}>
      <h3>{reference}</h3>
      {threads.length > 0 ? (
        <>
          <p className="threads-line">
            <b>{threads.length} echo{threads.length > 1 ? 'es' : ''}</b>
            {across.length
              ? ` · ${across.length} ${fromNt ? 'reach back to the Old Testament' : 'into the New Testament'}`
              : ` · all within the ${fromNt ? 'New' : 'Old'} Testament`}
          </p>
          {teaser && <p className="teaser"><b>{teaser.ref}</b>{teaser.text}</p>}
        </>
      ) : (
        <p>No echoes are recorded for this verse.</p>
      )}
      {terms.length > 0 && (
        <div className="gloss-terms">
          <div className="eyebrow">Words in this verse</div>
          {terms.slice(0, 4).map(id => <Term key={id} id={id} deeper={deeper} />)}
        </div>
      )}
      <div className="actions">
        <button type="button" className="chip" aria-pressed={lit} onClick={illuminate}>{lit ? 'Illuminated' : 'Illuminate'}</button>
        {threads.length > 0 && <button type="button" className="chip" onClick={onFollow}>See where the Bible echoes this</button>}
        <button type="button" className="chip" onClick={onLearn}>Learn by heart</button>
        <button type="button" className="chip" onClick={copy}>Copy</button>
        <button type="button" className="chip" onClick={share}>Share</button>
        {'speechSynthesis' in window && <button type="button" className="chip" aria-pressed={speaking} onClick={listen}>{speaking ? 'Stop' : 'Listen'}</button>}
      </div>
    </div>
  )
}
