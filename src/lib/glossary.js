import { GLOSSARY } from '../data/glossary'

const PATTERNS = GLOSSARY.map(g => ({ id: g.id, re: new RegExp(`\\b(?:${g.match})\\b`, g.cs ? 'g' : 'gi') }))

// The glossary words to mark in a chapter: the first place each one appears,
// as { [verse]: [{ start, end, id }] }, plus the ids in reading order.
// Earlier entries win where two would overlap ("Holy Spirit" over "holy").
export function glossChapter(verses) {
  const marks = {}
  const order = []
  const taken = (verse, start, end) => (marks[verse] || []).some(m => start < m.end && end > m.start)
  for (const { id, re } of PATTERNS) {
    for (const v of verses) {
      re.lastIndex = 0
      let m, found = false
      while ((m = re.exec(v.text))) {
        const start = m.index, end = start + m[0].length
        if (taken(v.verse, start, end)) continue
        ;(marks[v.verse] ||= []).push({ start, end, id })
        order.push({ id, verse: v.verse, start })
        found = true
        break
      }
      if (found) break
    }
  }
  Object.values(marks).forEach(list => list.sort((a, b) => a.start - b.start))
  order.sort((a, b) => a.verse - b.verse || a.start - b.start)
  return { marks, ids: order.map(o => o.id) }
}

// Every glossary word in one verse (not only first appearances), for its gloss.
export function glossVerse(text) {
  const spans = []
  for (const { id, re } of PATTERNS) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text))) {
      const start = m.index, end = start + m[0].length
      if (spans.some(s => start < s.end && end > s.start)) continue
      spans.push({ start, end, id })
    }
  }
  spans.sort((x, y) => x.start - y.start)
  return [...new Set(spans.map(s => s.id))]
}

// Split text into plain strings and marked pieces.
export function splitMarked(text, marks = [], offset = 0) {
  const out = []
  let at = 0
  for (const m of marks) {
    const s = m.start - offset, e = m.end - offset
    if (e <= 0 || s >= text.length) continue
    if (s > at) out.push(text.slice(at, Math.max(s, 0)))
    out.push({ id: m.id, text: text.slice(Math.max(s, 0), e) })
    at = e
  }
  if (at < text.length) out.push(text.slice(at))
  return out
}
