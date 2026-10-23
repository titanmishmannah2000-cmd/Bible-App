import { useEffect, useState } from 'react'
import { bookFileSlug } from './bible'

// Chapter notes (public/notes/<book>.json: { "1": { s: plain summary, d: deeper note } })
// and the book context cards (public/context.json), fetched once and cached.
const cache = new Map()
function load(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(`${import.meta.env.BASE_URL}${path}`)
      .then(r => { if (!r.ok) throw new Error(path); return r.json() })
      .catch(err => { cache.delete(path); throw err }))
  }
  return cache.get(path)
}

function useJson(path) {
  const [state, setState] = useState({ path: null, data: null })
  useEffect(() => {
    let live = true
    load(path).then(data => { if (live) setState({ path, data }) }).catch(() => { if (live) setState({ path, data: null }) })
    return () => { live = false }
  }, [path])
  return state.path === path ? state.data : null
}

export const useChapterNotes = (book) => useJson(`notes/${bookFileSlug(book)}.json`)
export const useBookContext = (book) => useJson('context.json')?.[book] || null

// Which part of the book's outline a chapter falls in.
export function partOf(context, chapter) {
  return context?.structure?.find(([, from, to]) => chapter >= from && chapter <= to) || null
}
