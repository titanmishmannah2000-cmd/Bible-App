import { useMemo, useState } from 'react'
import Sheet from './Sheet'
import useBible from '../hooks/useBible'
import { useMemory, sortedMemory, memoryLabel, addMemory, removeMemory, preview, review, whenText, RATINGS } from '../lib/memory'
import { chaptersOf } from '../data/canon'

// Learn a verse by heart: a list of the verses being learned, and a five-step
// practice for one of them. Every step says plainly what to do and has one
// big button to go on.
const STEPS = [
  ['Read', 'Read the verse out loud, slowly, two times.'],
  ['First letters', 'Only the first letter of each word is left. Say the whole verse. Stuck? Tap a word to see it.'],
  ['Fill the gaps', 'Tap the missing words in order, starting from the first gap.'],
  ['From memory', 'Now say or type the verse without looking. Then press “Check”.'],
  ['How did it go?', 'Pick the answer that fits best. Verbum uses it to choose when to remind you.'],
]

export default function MemorizeSheet({ open, onClose, start, onRead }) {
  const all = useMemory()
  // Opened from a verse (start is its key, already added): go straight to practice.
  const [active, setActive] = useState(open ? start : null)
  const [seen, setSeen] = useState([open, start])
  if (seen[0] !== open || seen[1] !== start) {
    setSeen([open, start])
    setActive(open ? start : null)
  }

  const item = active && all[active]
  return (
    <Sheet open={open} onClose={onClose} variant="wide" label="Learn by heart"
      head={<div style={{ flex: '1 1 auto' }}>
        <h2 className="sheet-title">{item ? `Learn ${memoryLabel(item)}` : 'Learn by heart'}</h2>
        <div className="sheet-sub">{item ? 'Five short steps' : 'Verses you are learning, and when to practise them'}</div>
      </div>}>
      <div className="mem-body">
        {item
          ? <Practice key={active} id={active} item={item} onDone={() => setActive(null)} onNext={(k) => setActive(k)} onRead={onRead} />
          : <MemoryList all={all} onPractise={setActive} onRead={onRead} />}
      </div>
    </Sheet>
  )
}

function MemoryList({ all, onPractise, onRead }) {
  const { due, later } = sortedMemory(all)
  if (!due.length && !later.length) {
    return (
      <div className="mem-empty">
        <p className="mem-do">You have not started learning a verse yet.</p>
        <ol className="mem-how">
          <li>Tap any verse while you read.</li>
          <li>Press <b>Learn by heart</b>.</li>
          <li>Follow the five short steps. Verbum reminds you when it is time to practise again.</li>
        </ol>
      </div>
    )
  }
  const row = (m, isDue) => (
    <li key={m.key} className="mem-row">
      <div>
        <b>{memoryLabel(m)}</b>
        <span className="muted">{isDue ? 'Ready to practise now' : `Next practice ${whenText(m.card.due)}`} · practised {m.history.length} time{m.history.length === 1 ? '' : 's'}</span>
      </div>
      <div className="mem-row-btns">
        <button type="button" className="link-btn" onClick={() => onRead(m.book, m.chapter, m.from)}>Read</button>
        <button type="button" className={`chip${isDue ? ' solid' : ''}`} onClick={() => onPractise(m.key)}>Practise</button>
        <button type="button" className="link-btn muted-btn" onClick={() => removeMemory(m.key)} aria-label={`Stop learning ${memoryLabel(m)}`}>Remove</button>
      </div>
    </li>
  )
  return (
    <div className="mem-lists">
      <section>
        <h3 className="mem-h">Practise now <span>{due.length}</span></h3>
        {due.length ? <ul>{due.map(m => row(m, true))}</ul> : <p className="muted small">Nothing to practise right now. Well done.</p>}
      </section>
      {later.length > 0 && (
        <section>
          <h3 className="mem-h">Coming up <span>{later.length}</span></h3>
          <ul>{later.map(m => row(m, false))}</ul>
        </section>
      )}
      <p className="muted small">To add a verse, tap it while you read and press <b>Learn by heart</b>. Your progress stays on this device.</p>
    </div>
  )
}

const strip = (w) => w.replace(/[“”‘(),.;:!?]/g, '').replace(/’$/, '')
const norm = (w) => strip(w).toLowerCase().replace(/’/g, "'")

function Practice({ id, item, onDone, onNext, onRead }) {
  const { verses } = useBible(item.book, item.chapter)
  const text = verses.filter(v => v.verse >= item.from && v.verse <= item.to).map(v => v.text).join(' ')
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text])
  // About one word in five, choosing longer words, up to ten gaps.
  const blanks = useMemo(() => {
    const picks = []
    words.forEach((w, i) => { if (strip(w).length > 3 && (picks.length === 0 || i - picks[picks.length - 1] >= 4)) picks.push(i) })
    return picks.slice(0, 10)
  }, [words])
  const bank = useMemo(() => blanks.map((i, k) => ({ k, w: strip(words[i]) })).sort((a, b) => (a.k * 7) % 11 - (b.k * 7) % 11), [blanks, words])
  const [step, setStep] = useState(0)
  const [peeked, setPeeked] = useState(() => new Set())
  const [gap, setGap] = useState(0)
  const [used, setUsed] = useState(() => new Set())
  const [miss, setMiss] = useState(null)
  const [typed, setTyped] = useState('')
  const [checked, setChecked] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [doneAt, setDoneAt] = useState(null)
  const times = useMemo(() => (step === 4 ? preview(id) : null), [step, id])
  const nextVerse = item.to < (verses.length || 0) ? item.to + 1 : null

  if (!text) return <p className="empty-pane">Opening the verse…</p>

  if (doneAt) {
    return (
      <div className="mem-done">
        <span className="seal" aria-hidden="true">✓</span>
        <h3>Saved</h3>
        <p>Verbum will remind you to practise {memoryLabel(item)} <b>{whenText(doneAt)}</b>.</p>
        <p className="muted small">Each time you remember it, the reminders spread further apart.</p>
        <div className="mem-foot center">
          <button type="button" className="chip" onClick={onDone}>Back to my verses</button>
          {nextVerse && <button type="button" className="chip" onClick={() => onNext(addMemory(item.book, item.chapter, item.from, nextVerse))}>Learn {item.from}–{nextVerse} together</button>}
          {nextVerse && <button type="button" className="btn-primary" onClick={() => onNext(addMemory(item.book, item.chapter, nextVerse))}>Next verse: {item.chapter}:{nextVerse}</button>}
          {!nextVerse && item.chapter < chaptersOf(item.book) && <button type="button" className="btn-primary" onClick={() => onRead(item.book, item.chapter + 1)}>Go on to chapter {item.chapter + 1}</button>}
        </div>
      </div>
    )
  }

  const speak = () => {
    try { const u = new SpeechSynthesisUtterance(text.replace(/[“”]/g, '')); u.rate = 0.88; speechSynthesis.cancel(); speechSynthesis.speak(u) } catch { /* no speech */ }
  }
  const go = (label, disabled) => <div className="mem-foot"><button type="button" className="btn-primary" disabled={disabled} onClick={() => setStep(s => s + 1)}>{label}</button></div>

  let body
  if (step === 0) {
    body = (
      <>
        <p className="mem-verse">{text}</p>
        <div className="mem-foot">
          {'speechSynthesis' in window && <button type="button" className="chip" onClick={speak}>Hear it read aloud</button>}
          <button type="button" className="btn-primary" onClick={() => setStep(1)}>I have read it twice</button>
        </div>
      </>
    )
  } else if (step === 1) {
    body = (
      <>
        <p className="mem-verse letters">
          {words.map((w, i) => {
            const m = w.match(/^([“‘(]?)([A-Za-z0-9])(.*?)([.,;:!?”’)]*)$/)
            if (!m) return <span key={i}>{w} </span>
            const open = peeked.has(i)
            return <span key={i}><button type="button" className={`w${open ? ' open' : ''}`} aria-label={open ? strip(w) : 'Show this word'}
              onClick={() => setPeeked(p => new Set(p).add(i))}>{open ? w : m[1] + m[2] + m[4]}</button> </span>
          })}
        </p>
        {go('I can say it')}
      </>
    )
  } else if (step === 2) {
    const finished = gap >= blanks.length
    body = (
      <>
        <p className="mem-verse">
          {words.map((w, i) => {
            const k = blanks.indexOf(i)
            if (k < 0) return <span key={i}>{w} </span>
            if (k < gap) return <span key={i}><span className="blank filled">{w}</span> </span>
            return <span key={i}><span className={`blank${k === gap ? ' next' : ''}`} aria-label={k === gap ? 'Next gap' : 'Gap'}>&nbsp;</span> </span>
          })}
        </p>
        <div className="bank" role="group" aria-label="Words to choose from">
          {bank.map(({ k, w }) => (
            <button key={k} type="button" className={`word-pick${miss === k ? ' nope' : ''}`} disabled={used.has(k)}
              onClick={() => {
                if (norm(w) === norm(words[blanks[gap]])) { setUsed(u => new Set(u).add(k)); setGap(g => g + 1); setMiss(null) }
                else setMiss(k)
              }}>{w}</button>
          ))}
        </div>
        <p className="small" aria-live="polite">
          {finished ? <span className="ok">Every gap is filled. Well done.</span> : miss != null ? `Not that one. Try another word for gap ${gap + 1}.` : `Gap ${gap + 1} of ${blanks.length}.`}
        </p>
        {go(finished ? 'Next step' : 'Fill every gap first', !finished)}
      </>
    )
  } else if (step === 3) {
    const check = () => {
      const said = typed.split(/\s+/).map(norm).filter(Boolean)
      let j = 0
      const marks = words.map(w => { const k = said.indexOf(norm(w), j); if (k >= 0 && k - j < 3) { j = k + 1; return true } return false })
      setChecked(marks)
    }
    const got = checked ? checked.filter(Boolean).length : 0, all = words.length
    body = (
      <>
        <textarea className="mem-type" value={typed} onChange={(e) => { setTyped(e.target.value); setChecked(null) }}
          aria-label="Type the verse from memory" placeholder={`Start typing: ${words.slice(0, 3).join(' ')}…`} />
        <div className="mem-foot">
          {!showAll && <button type="button" className="chip" onClick={() => setShowAll(true)}>Show me the verse</button>}
          <button type="button" className={checked ? 'chip' : 'btn-primary'} onClick={check}>Check</button>
          {checked && <button type="button" className="btn-primary" onClick={() => setStep(4)}>Next step</button>}
          {!checked && <button type="button" className="link-btn" onClick={() => setStep(4)}>I said it out loud instead</button>}
        </div>
        {showAll && !checked && <p className="mem-verse small-verse">{text}</p>}
        {checked && (
          <div aria-live="polite">
            <p className="mem-result">{got === all ? 'Perfect. Every word is right.' : got >= all * 0.7 ? `Very good. You remembered ${got} of ${all} words.` : got > 0 ? `A good start. You remembered ${got} of ${all} words.` : 'Nothing matched yet. Type what you remember, then press Check.'}</p>
            {got > 0 && <><p className="mem-verse small-verse">{words.map((w, i) => <span key={i} className={checked[i] ? 'ok' : 'miss'}>{w} </span>)}</p>
              <p className="muted small">Green words are right. Underlined words were missed.</p></>}
          </div>
        )}
      </>
    )
  } else {
    body = (
      <div className="rate">
        {RATINGS.map(r => (
          <button key={r.id} type="button" onClick={() => setDoneAt(review(id, r.id))}>
            <b>{r.label}</b><span>Remind me {whenText(times[r.id])}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="practice">
      <div className="mem-prog" aria-live="polite">
        <div className="mem-prog-top"><b>Step {step + 1} of 5</b><span>{STEPS[step][0]}</span></div>
        <ol>
          {STEPS.map(([s], i) => (
            <li key={s} className={i < step ? 'done' : i === step ? 'now' : ''}>
              <button type="button" onClick={() => setStep(i)} aria-label={`Go to step ${i + 1}, ${s}`} /><span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mem-do">{STEPS[step][1]}</p>
      {body}
    </div>
  )
}
