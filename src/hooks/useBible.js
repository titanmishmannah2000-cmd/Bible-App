import { useState, useEffect } from 'react'
import { getChapter } from '../lib/bible'

export default function useBible(book, chapter) {
  const [state, setState] = useState({ key: null, verses: [], heading: null, error: null })
  const key = `${book}-${chapter}`

  useEffect(() => {
    if (!book || !chapter) return
    let cancelled = false
    getChapter(book, chapter)
      .then(({ verses, heading }) => {
        if (!cancelled) setState({ key, verses, heading, error: null })
      })
      .catch(() => {
        if (!cancelled) setState({ key, verses: [], heading: null, error: 'Could not load this chapter' })
      })
    return () => { cancelled = true }
  }, [book, chapter, key])

  const ready = state.key === key
  return {
    verses: ready ? state.verses : [],
    heading: ready ? state.heading : null,
    loading: !ready,
    error: ready ? state.error : null,
  }
}
