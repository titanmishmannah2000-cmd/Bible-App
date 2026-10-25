import { useSyncExternalStore } from 'react'
import { fsrs, createEmptyCard, generatorParameters, Rating } from 'ts-fsrs'
import { storage } from './prefs'
import { ALL_BOOKS } from './bible'
import { displayBook } from '../data/canon'

// Memorizing the Word: the verses (or runs of verses) a reader is learning by
// heart, each with its review schedule. The schedule comes from FSRS, the open
// spaced-repetition method: every honest answer moves the next reminder, so a
// verse returns just before it would be forgotten. Kept on this device only.
const KEY = 'verbum-memory'
const scheduler = fsrs(generatorParameters({ enable_fuzz: true }))
export const RATINGS = [
  { id: 'Again', label: 'I forgot it' },
  { id: 'Hard', label: 'It was hard' },
  { id: 'Good', label: 'I knew it' },
  { id: 'Easy', label: 'It was easy' },
]

const revive = (c) => ({ ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined })
let items = (() => {
  const raw = storage.get(KEY) || {}
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, { ...v, card: revive(v.card) }]))
})()
const listeners = new Set()
const save = () => { storage.set(KEY, items); listeners.forEach(l => l()) }

export const memoryKey = (book, chapter, from, to = from) => `${book} ${chapter}:${from}${to > from ? `–${to}` : ''}`
export const memoryLabel = (m) => `${displayBook(m.book, m.chapter)} ${m.chapter}:${m.from}${m.to > m.from ? `–${m.to}` : ''}`

export function useMemory() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => items)
}

export function addMemory(book, chapter, from, to = from) {
  const key = memoryKey(book, chapter, from, to)
  if (!items[key]) {
    items = { ...items, [key]: { book, chapter, from, to, added: Date.now(), card: createEmptyCard(new Date()), history: [] } }
    save()
  }
  return key
}

export function removeMemory(key) {
  const { [key]: _gone, ...rest } = items // eslint-disable-line no-unused-vars
  items = rest
  save()
}

// What each answer would mean for the next reminder, for the four buttons.
export function preview(key, now = new Date()) {
  const r = scheduler.repeat(items[key].card, now)
  return Object.fromEntries(RATINGS.map(({ id }) => [id, r[Rating[id]].card.due]))
}

export function review(key, id, now = new Date()) {
  const next = scheduler.next(items[key].card, now, Rating[id]).card
  const m = items[key]
  items = { ...items, [key]: { ...m, card: next, history: [...m.history, { at: now.getTime(), rating: id }].slice(-50) } }
  save()
  return next.due
}

export const isDue = (m, now = Date.now()) => m.card.due.getTime() <= now
const canon = (a, b) => ALL_BOOKS.indexOf(a.book) - ALL_BOOKS.indexOf(b.book) || a.chapter - b.chapter || a.from - b.from
export function sortedMemory(all) {
  const list = Object.entries(all).map(([key, m]) => ({ key, ...m }))
  return {
    due: list.filter(m => isDue(m)).sort((a, b) => a.card.due - b.card.due),
    later: list.filter(m => !isDue(m)).sort((a, b) => a.card.due - b.card.due),
    all: list.sort(canon),
  }
}

// "in 10 minutes", "tomorrow", "in 6 days", "in 2 months", in plain words.
export function whenText(due, now = new Date()) {
  const ms = due - now
  if (ms <= 60000) return 'now'
  const min = Math.round(ms / 60000)
  if (min < 60) return `in ${min} minute${min === 1 ? '' : 's'}`
  const hrs = Math.round(ms / 3600000)
  if (hrs < 20) return `in ${hrs} hour${hrs === 1 ? '' : 's'}`
  const days = Math.round(ms / 86400000)
  if (days <= 1) return 'tomorrow'
  if (days < 45) return `in ${days} days`
  const months = Math.round(days / 30)
  return `in ${months} month${months === 1 ? '' : 's'}`
}
