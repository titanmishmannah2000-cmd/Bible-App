import { useSyncExternalStore } from 'react'

// Illuminated (highlighted) verses, kept in localStorage.
const KEY = 'verbum-highlights'
const listeners = new Set()

function read() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (stored) return stored
    // Migrate the one-key-per-verse format used by earlier versions.
    const migrated = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      const m = k && k.match(/^highlight-(.+)-(\d+)-(\d+)$/)
      if (m) {
        migrated[`${m[1]}|${m[2]}|${m[3]}`] = {
          book: m[1], chapter: +m[2], verse: +m[3],
          text: localStorage.getItem(k), savedAt: Date.now(),
        }
      }
    }
    return migrated
  } catch {
    return {}
  }
}

let state = read()

function write(next) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  listeners.forEach(l => l())
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
const snapshot = () => state

export const highlightKey = (book, chapter, verse) => `${book}|${chapter}|${verse}`

export function toggleHighlight(book, chapter, verse, text) {
  const key = highlightKey(book, chapter, verse)
  const next = { ...state }
  if (next[key]) delete next[key]
  else next[key] = { book, chapter, verse, text: text.trim(), savedAt: Date.now() }
  write(next)
  return !!next[key]
}

export function removeHighlight(key) {
  const next = { ...state }
  delete next[key]
  write(next)
}

export function useHighlights() {
  return useSyncExternalStore(subscribe, snapshot)
}
