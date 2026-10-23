import { BOOKS, CHAPTER_COUNTS } from '../data/books'

// The full World English Bible ships with the app (public/bible/*.json),
// so reading and searching work offline and never hit an API rate limit.

export const ALL_BOOKS = [...BOOKS.old, ...BOOKS.new]
export const TRANSLATION = 'WEB'

const bookCache = {}

export const bookFileSlug = (book) => book.toLowerCase().replace(/ /g, '')

export function testamentOf(book) {
  return BOOKS.old.includes(book) ? 'old' : 'new'
}

export function loadBook(book) {
  if (!bookCache[book]) {
    bookCache[book] = fetch(`${import.meta.env.BASE_URL}bible/${bookFileSlug(book)}.json`)
      .then(res => {
        if (!res.ok) throw new Error(`Could not load ${book}`)
        return res.json()
      })
      .catch(err => {
        delete bookCache[book]
        throw err
      })
  }
  return bookCache[book]
}

export async function getChapter(book, chapter) {
  const data = await loadBook(book)
  const verses = data.chapters[chapter - 1]
  if (!verses) throw new Error('Chapter not found')
  return {
    heading: data.headings[chapter] || null,
    verses: verses.map(([verse, text]) => ({ book_name: book, chapter, verse, text })),
  }
}

export async function getVerse(book, chapter, verse) {
  const { verses } = await getChapter(book, chapter)
  return verses.find(v => v.verse === verse) || null
}

// ── Reference parsing ──────────────────────────────────────────

const ALIASES = {
  gen: 'Genesis', gn: 'Genesis', ex: 'Exodus', exod: 'Exodus', lev: 'Leviticus',
  num: 'Numbers', nm: 'Numbers', deut: 'Deuteronomy', dt: 'Deuteronomy',
  josh: 'Joshua', judg: 'Judges', jdg: 'Judges', ru: 'Ruth',
  '1sam': '1 Samuel', '1sa': '1 Samuel', '2sam': '2 Samuel', '2sa': '2 Samuel',
  '1kgs': '1 Kings', '1ki': '1 Kings', '2kgs': '2 Kings', '2ki': '2 Kings',
  '1chr': '1 Chronicles', '1ch': '1 Chronicles', '2chr': '2 Chronicles', '2ch': '2 Chronicles',
  neh: 'Nehemiah', est: 'Esther', esth: 'Esther',
  ps: 'Psalms', psa: 'Psalms', psalm: 'Psalms', pss: 'Psalms',
  prov: 'Proverbs', pr: 'Proverbs', prv: 'Proverbs',
  eccl: 'Ecclesiastes', ecc: 'Ecclesiastes', qoh: 'Ecclesiastes',
  song: 'Song of Solomon', sos: 'Song of Solomon', songofsongs: 'Song of Solomon',
  canticles: 'Song of Solomon', ss: 'Song of Solomon',
  isa: 'Isaiah', jer: 'Jeremiah', lam: 'Lamentations', ezek: 'Ezekiel', eze: 'Ezekiel',
  dan: 'Daniel', hos: 'Hosea', ob: 'Obadiah', obad: 'Obadiah', jon: 'Jonah',
  mic: 'Micah', nah: 'Nahum', hab: 'Habakkuk', zeph: 'Zephaniah', hag: 'Haggai',
  zech: 'Zechariah', zec: 'Zechariah', mal: 'Malachi',
  mt: 'Matthew', matt: 'Matthew', mk: 'Mark', mrk: 'Mark', lk: 'Luke', jn: 'John', jhn: 'John',
  ac: 'Acts', rom: 'Romans', ro: 'Romans',
  '1cor': '1 Corinthians', '1co': '1 Corinthians', '2cor': '2 Corinthians', '2co': '2 Corinthians',
  gal: 'Galatians', eph: 'Ephesians', phil: 'Philippians', php: 'Philippians',
  col: 'Colossians', '1thess': '1 Thessalonians', '1th': '1 Thessalonians',
  '2thess': '2 Thessalonians', '2th': '2 Thessalonians',
  '1tim': '1 Timothy', '1ti': '1 Timothy', '2tim': '2 Timothy', '2ti': '2 Timothy',
  tit: 'Titus', phlm: 'Philemon', philem: 'Philemon', phm: 'Philemon',
  heb: 'Hebrews', jas: 'James', jm: 'James',
  '1pet': '1 Peter', '1pe': '1 Peter', '1pt': '1 Peter', '2pet': '2 Peter', '2pe': '2 Peter', '2pt': '2 Peter',
  '1jn': '1 John', '1jo': '1 John', '2jn': '2 John', '2jo': '2 John', '3jn': '3 John', '3jo': '3 John',
  jud: 'Jude', rev: 'Revelation', re: 'Revelation', revelations: 'Revelation', apocalypse: 'Revelation',
}

const ORDINALS = { i: '1', ii: '2', iii: '3', first: '1', second: '2', third: '3', '1st': '1', '2nd': '2', '3rd': '3' }

export function findBook(name) {
  let key = name.toLowerCase().replace(/\./g, '').trim()
  key = key.replace(/^(iii|ii|i|first|second|third|1st|2nd|3rd)\s+/, (_, o) => ORDINALS[o])
  key = key.replace(/\s+/g, '')
  if (key.length < 2) return null
  if (ALIASES[key]) return ALIASES[key]
  const exact = ALL_BOOKS.find(b => bookFileSlug(b) === key)
  if (exact) return exact
  if (key.length < 3 && !/^\d/.test(key)) return null
  return ALL_BOOKS.find(b => bookFileSlug(b).startsWith(key)) || null
}

// "John 3:16", "1 cor 13", "ps 23:1-3", "Song of Songs 2". Returns null when
// the text does not look like a reference.
export function parseReference(input) {
  const m = input.trim().match(/^((?:[1-3]|i{1,3}|first|second|third)?\s*[a-z][a-z .]*?)\s*(\d+)?(?:\s*[:.]\s*(\d+)(?:\s*[-–]\s*(\d+))?)?$/i)
  if (!m) return null
  const book = findBook(m[1])
  if (!book) return null
  const chapter = m[2] ? parseInt(m[2], 10) : null
  if (chapter !== null && (chapter < 1 || chapter > CHAPTER_COUNTS[book])) return null
  return {
    book,
    chapter,
    verse: m[3] ? parseInt(m[3], 10) : null,
    verseEnd: m[4] ? parseInt(m[4], 10) : null,
  }
}

export function formatReference({ book, chapter, verse, verseEnd }) {
  if (!chapter) return book
  if (!verse) return `${book} ${chapter}`
  return `${book} ${chapter}:${verse}${verseEnd ? `–${verseEnd}` : ''}`
}

// ── Keyword search ─────────────────────────────────────────────

const normalize = (s) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"')

export function searchTerms(query) {
  return normalize(query).split(/\s+/).map(t => t.replace(/[^a-z0-9']/g, '')).filter(t => t.length > 1)
}

let allLoaded = null
export function loadAllBooks() {
  if (!allLoaded) {
    allLoaded = Promise.all(ALL_BOOKS.map(loadBook)).catch(err => {
      allLoaded = null
      throw err
    })
  }
  return allLoaded
}

// Every verse containing all of the query's words. Returns at most `limit`
// matches plus the full count.
export async function searchBible(query, { limit = 100, testament = 'all' } = {}) {
  const terms = searchTerms(query)
  if (!terms.length) return { results: [], total: 0 }
  const patterns = terms.map(t => new RegExp(`\\b${t}`, 'i'))
  const books = await loadAllBooks()
  const results = []
  let total = 0
  for (const data of books) {
    if (testament !== 'all' && testamentOf(data.book) !== testament) continue
    data.chapters.forEach((verses, ci) => {
      for (const [verse, text] of verses) {
        const n = normalize(text)
        if (patterns.every(p => p.test(n))) {
          total++
          if (results.length < limit) {
            results.push({ book_name: data.book, chapter: ci + 1, verse, text })
          }
        }
      }
    })
  }
  return { results, total }
}
