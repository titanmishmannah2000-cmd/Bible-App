// Converts the World English Bible (public domain) from the `world-english-bible`
// package into one compact JSON file per book under public/bible/.
// Run with: npm run build:bible
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { BOOKS } from '../src/data/books.js'

const require = createRequire(import.meta.url)
const srcDir = join(dirname(require.resolve('world-english-bible/package.json')), 'json')
const outDir = new URL('../public/bible/', import.meta.url)
mkdirSync(outDir, { recursive: true })

export const slug = (book) => book.toLowerCase().replace(/ /g, '')

let total = 0
for (const book of [...BOOKS.old, ...BOOKS.new]) {
  const raw = JSON.parse(readFileSync(join(srcDir, `${slug(book)}.json`), 'utf8'))
  const chapters = []
  const headings = {}
  let pendingHeading = null

  for (const item of raw) {
    if (item.type === 'header') { pendingHeading = item.value.trim(); continue }
    if (!item.value || !item.chapterNumber) continue
    const c = item.chapterNumber
    const v = item.verseNumber
    if (!chapters[c - 1]) {
      chapters[c - 1] = []
      if (pendingHeading) { headings[c] = pendingHeading; pendingHeading = null }
    }
    const verses = chapters[c - 1]
    const last = verses[verses.length - 1]
    const text = item.value.replace(/ /g, ' ')
    if (last && last[0] === v) last[1] += ' ' + text
    else verses.push([v, text])
  }

  for (const verses of chapters) {
    for (const verse of verses) verse[1] = verse[1].replace(/\s+/g, ' ').trim()
    total += verses.length
  }

  writeFileSync(new URL(`${slug(book)}.json`, outDir), JSON.stringify({ book, chapters, headings }))
}
console.log(`Wrote 66 books, ${total} verses`)
