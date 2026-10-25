import { useEffect, useState } from 'react'
import { ALL_BOOKS, bookFileSlug, loadBook } from './bible'

// Threads are cross-references from OpenBible.info (CC BY), ranked by reader
// votes. public/threads/<book>.json maps "chapter:verse" to the strongest
// links: [book index, chapter, first verse, last verse, votes].
// Built by scripts/build-threads.py.

const cache = {}

export function loadThreads(book) {
  if (!cache[book]) {
    cache[book] = fetch(`${import.meta.env.BASE_URL}threads/${bookFileSlug(book)}.json`)
      .then(res => {
        if (!res.ok) throw new Error(`Could not load threads for ${book}`)
        return res.json()
      })
      .catch(err => {
        delete cache[book]
        throw err
      })
  }
  return cache[book]
}

export function toThread([bi, chapter, v1, v2, votes]) {
  const book = ALL_BOOKS[bi]
  const name = book === 'Psalms' ? 'Psalm' : book
  return {
    book, bookIndex: bi, chapter, v1, v2, votes,
    ref: `${name} ${chapter}:${v1}${v2 > v1 ? `–${v2}` : ''}`,
    nt: bi >= 39,
  }
}

// The threads of one book, keyed by "chapter:verse".
export function useBookThreads(book) {
  const [state, setState] = useState({ book: null, data: null })
  useEffect(() => {
    let cancelled = false
    loadThreads(book)
      .then(data => { if (!cancelled) setState({ book, data }) })
      .catch(() => { if (!cancelled) setState({ book, data: {} }) })
    return () => { cancelled = true }
  }, [book])
  return state.book === book ? state.data : null
}

export function threadsFor(data, chapter, verse) {
  return (data?.[`${chapter}:${verse}`] || []).map(toThread)
}

// The words of a linked passage, joined when it spans several verses.
export async function threadText(t) {
  const data = await loadBook(t.book)
  const verses = data.chapters[t.chapter - 1] || []
  return verses.filter(([n]) => n >= t.v1 && n <= t.v2).map(([, text]) => text).join(' ')
}

// How strong an echo is, from how many readers agreed on the link at OpenBible.info.
export const echoStrength = (votes) => (votes >= 20 ? [3, 'Strong echo'] : votes >= 8 ? [2, 'Clear echo'] : [1, 'Light echo'])

// Echoes grouped by the book they land in, strongest book first.
export function groupEchoes(list) {
  const by = new Map()
  list.forEach(t => {
    const g = by.get(t.bookIndex) || { bookIndex: t.bookIndex, nt: t.nt, book: t.book, refs: [], s: 0, votes: 0 }
    g.refs.push(t.ref); g.s = Math.max(g.s, echoStrength(t.votes)[0]); g.votes = Math.max(g.votes, t.votes)
    by.set(t.bookIndex, g)
  })
  return [...by.values()].sort((a, b) => b.votes - a.votes)
}
