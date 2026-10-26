import { ERAS } from '../data/eras'
import { WORLD as ALL, REGIONS } from '../data/world'

// The dated entry for a chapter: every chapter of the Bible has exactly one.
export function eraFor(book, chapter) {
  return ERAS.find(e => e.book === book && chapter >= e.from && chapter <= e.to) || null
}

const REGION_ORDER = Object.keys(REGIONS)
const overlaps = (w, y0, y1) => w.y0 <= y1 && w.y1 >= y0
export const eraKey = (era) => `${era.book}-${era.from}`

// Which part of the Bible each world event was first shown beside, so it counts
// as news only there and folds away everywhere else. Kept for the visit, so
// going back to an earlier chapter shows the same thing as before.
const SEEN_KEY = 'verbum-world-seen'
let firstSeen = null
function seenIn(id, key) {
  if (!firstSeen) {
    try { firstSeen = JSON.parse(sessionStorage.getItem(SEEN_KEY)) || {} } catch { firstSeen = {} }
  }
  if (!firstSeen[id]) {
    firstSeen[id] = key
    try { sessionStorage.setItem(SEEN_KEY, JSON.stringify(firstSeen)) } catch { /* not kept; fine */ }
  }
  return firstSeen[id]
}

// What else was going on in the world while this part of the Bible happened:
//   rulers      the kingdoms, empires and cultures of the time, for one slim line
//               (newRulers: those not shown beside an earlier chapter)
//   highlights  events the Bible itself meets in this chapter
//   fresh       events new to the reader here, closest in time first, taking
//               turns between regions so one land does not fill the list
//   seen        events of the same years already shown beside earlier chapters
export function worldFor(era, chapter) {
  const none = { rulers: [], newRulers: new Set(), highlights: [], fresh: [], seen: [] }
  if (!era || era.y0 === null) return none
  const key = eraKey(era)
  const pad = Math.min(40, Math.max(5, (era.y1 - era.y0) * 0.15))
  const mid = (era.y0 + era.y1) / 2
  const gap = (w) => (w.y1 < era.y0 ? era.y0 - w.y1 : w.y0 > era.y1 ? w.y0 - era.y1 : 0)
  const rank = (p, q) => gap(p) - gap(q) || Math.abs((p.y0 + p.y1) / 2 - mid) - Math.abs((q.y0 + q.y1) / 2 - mid)

  const highlights = ALL.filter(w => w.touches?.some(([b, a, z]) => b === era.book && chapter >= a && chapter <= z))
  for (const w of highlights) seenIn(w.id, key)
  const rulers = ALL.filter(w => w.rule && overlaps(w, era.y0, era.y1) && !highlights.includes(w))
    .sort((p, q) => REGION_ORDER.indexOf(p.region) - REGION_ORDER.indexOf(q.region) || p.y0 - q.y0)
  const newRulers = new Set(rulers.filter(w => seenIn(w.id, key) === key).map(w => w.id))

  const others = ALL.filter(w => !w.rule && !highlights.includes(w))
  let near = others.filter(w => gap(w) <= pad)
  if (!near.length) near = others.filter(w => gap(w) <= 200)
  near.sort(rank)

  const fresh = [], seen = []
  for (const w of near) (seenIn(w.id, key) === key ? fresh : seen).push(w)
  return { rulers, newRulers, highlights, fresh: takeTurns(fresh), seen: seen.sort((p, q) => p.y0 - q.y0) }
}

// Interleaves a ranked list by region: the closest event of each region, then
// the next closest of each, and so on.
function takeTurns(list) {
  const by = new Map()
  for (const w of list) by.set(w.region, [...(by.get(w.region) || []), w])
  const out = []
  for (let round = 0; out.length < list.length; round++) for (const g of by.values()) if (g[round]) out.push(g[round])
  return out
}

// The parts of the Bible that happened while a world event was going on, in
// order of time, for "Meanwhile in the Bible". A short event that falls between
// dated passages gets the nearest ones instead.
export function erasFor(w) {
  const dated = ERAS.filter(e => e.y0 !== null)
  let hits = dated.filter(e => overlaps(e, w.y0, w.y1))
  if (!hits.length) {
    const gap = (e) => (e.y1 < w.y0 ? w.y0 - e.y1 : e.y0 - w.y1)
    const best = Math.min(...dated.map(gap))
    if (best <= 150) hits = dated.filter(e => gap(e) === best)
  }
  // Passages dated only loosely, across many centuries, go last.
  const loose = (e) => (e.y1 - e.y0 > 400 ? 1 : 0)
  return hits.sort((p, q) => loose(p) - loose(q) || p.y0 - q.y0 || ERAS.indexOf(p) - ERAS.indexOf(q))
}

export const worldById = (id) => ALL.find(w => w.id === id) || null

// Where a year sits on a strip from about 2200 BC to AD 100. The long years
// before Jesus take most of the strip and the short span after him the rest, so
// both can be read; the strip marks where the scale changes.
const FIRST = -2200, LAST = 100
export const SPLIT = 0.72
export function stripAt(y) {
  const v = y < 0 ? ((y - FIRST) / -FIRST) * SPLIT : SPLIT + (y / LAST) * (1 - SPLIT)
  return Math.min(1, Math.max(0, v))
}
