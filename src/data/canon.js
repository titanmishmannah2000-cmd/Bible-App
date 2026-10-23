import { CHAPTER_COUNTS } from './books'
import { ALL_BOOKS } from '../lib/bible'

// The canon in its traditional sections, as the ribbon and the books sheet show it.
export const SECTIONS = [
  ['The Law', 5], ['History', 12], ['Wisdom', 5], ['Major Prophets', 5], ['Minor Prophets', 12],
  ['Gospels', 4], ['Acts', 1], ['Letters', 21], ['Revelation', 1],
].reduce((list, [name, count]) => {
  const start = list.length ? list[list.length - 1].end : 0
  list.push({ name, start, end: start + count, books: ALL_BOOKS.slice(start, start + count) })
  return list
}, [])

export const bookIndex = (book) => ALL_BOOKS.indexOf(book)
export const sectionOf = (book) => SECTIONS.find(s => s.books.includes(book))
export const isNewTestament = (index) => index >= 39
export const chaptersOf = (book) => CHAPTER_COUNTS[book] || 1
export const pad2 = (n) => String(n).padStart(2, '0')
export const displayBook = (book, chapter) => (book === 'Psalms' && chapter ? 'Psalm' : book)
