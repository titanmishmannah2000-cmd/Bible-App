import { ALL_BOOKS } from './bible'
import { CHAPTER_COUNTS } from '../data/books'

// Reading positions live in the URL hash, e.g. #/1-Samuel/17/45,
// so any verse can be bookmarked or shared and the back button works.

export const bookSlug = (book) => book.replace(/ /g, '-')

export function readingPath(book, chapter, verse) {
  return `/${bookSlug(book)}/${chapter}${verse ? `/${verse}` : ''}`
}

export function parseReadingPath(pathname) {
  const [slug, c, v] = pathname.split('/').filter(Boolean)
  if (!slug) return null
  const book = ALL_BOOKS.find(b => bookSlug(b).toLowerCase() === decodeURIComponent(slug).toLowerCase())
  if (!book) return null
  const chapter = Math.min(Math.max(parseInt(c, 10) || 1, 1), CHAPTER_COUNTS[book])
  const verse = parseInt(v, 10) || null
  return { book, chapter, verse }
}

export function verseUrl(book, chapter, verse) {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#${readingPath(book, chapter, verse)}`
}
