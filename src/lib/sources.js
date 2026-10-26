import { parseReference, formatReference, findBook, ALL_BOOKS } from './bible'

// Every fact in the notes and book cards carries a source marker such as
// [[nabre:genesis/6]] or [[bible:Romans 5:12-19]]. The marker kinds below say
// what each one points to; the reader sees a small number and a Sources list.

const BG = 'https://www.biblegateway.com/resources'
const AQUIFER = 'https://github.com/BibleAquifer'
const bookFile = (ref) => {
  const r = parseReference(ref)
  const book = r?.book || findBook(ref.replace(/\s+[\d:.–-]+$/, ''))
  return { r, file: String(ALL_BOOKS.indexOf(book) + 1).padStart(2, '0') }
}

const KINDS = {
  // Notes of the New American Bible, Revised Edition (US Conference of Catholic Bishops).
  nabre: (path) => {
    const [book, ch] = path.split('/')
    const intro = !ch || ch === '0'
    return {
      title: intro ? 'NABRE introduction' : 'NABRE footnotes',
      detail: intro ? titleCase(book.replace(/^the/, 'the ')) : `${titleCase(book)} ${ch}`,
      by: 'New American Bible, Revised Edition · US Conference of Catholic Bishops',
      url: `https://bible.usccb.org/bible/${book}/${ch || 0}`,
    }
  },
  // Study notes of the Reformation Study Bible (Ligonier Ministries), keyed like Gen.6.2.
  rsb: (ref) => ({
    title: 'Reformation Study Bible, study note',
    detail: ref.replace(/^(\w+)\.(\d+)\.(\d+)$/, '$1 $2:$3'),
    by: 'Ligonier Ministries · on Bible Gateway',
    url: `${BG}/reformation-study-bible/${ref}`,
  }),
  // Articles of the Zondervan Encyclopedia of the Bible, keyed by their page name.
  eob: (page) => ({
    title: 'Encyclopedia of the Bible',
    detail: page.replace(/-/g, ' '),
    by: 'Zondervan · on Bible Gateway',
    url: `${BG}/encyclopedia-of-the-bible/${page}`,
  }),
  // Bible.org articles, keyed by node number; their titles are listed below.
  bo: (node) => ({
    title: BIBLE_ORG[node]?.title || 'Bible.org article',
    detail: BIBLE_ORG[node]?.author,
    by: 'Bible.org',
    url: `https://bible.org/node/${node}`,
  }),
  // Tyndale Open Study Notes (Tyndale House Publishers), as adapted in the open
  // Aquifer Open Study Notes. Keyed by passage, such as Deuteronomy 6:4.
  tosn: (ref) => {
    const { r, file } = bookFile(ref)
    return {
      title: 'Tyndale Open Study Notes',
      detail: r ? formatReference(r) : ref,
      by: 'Tyndale House Publishers · CC BY-SA 4.0',
      url: `${AQUIFER}/AquiferOpenStudyNotes/blob/main/eng/md/${file}.content.md`,
    }
  },
  // Biblica Study Notes (Biblica, publisher of the NIV), keyed by passage.
  bsn: (ref) => {
    const { r, file } = bookFile(ref)
    return {
      title: 'Biblica Study Notes',
      detail: r ? formatReference(r) : ref,
      by: 'Biblica · CC BY-SA 4.0',
      url: `${AQUIFER}/BiblicaStudyNotes/blob/main/eng/md/${file}.content.md`,
    }
  },
  // Tyndale Open Bible Dictionary, keyed by file and article, such as 004:Deuteronomy, Book of.
  tbd: (key) => {
    const [file, ...title] = key.split(':')
    return {
      title: 'Tyndale Open Bible Dictionary',
      detail: title.join(':'),
      by: 'Tyndale House Publishers · CC BY-SA 4.0',
      url: `${AQUIFER}/AquiferOpenBibleDictionary/blob/main/eng/md/${file}.content.md`,
    }
  },
  // Easton's Bible Dictionary (M. G. Easton, 1897), keyed by its page name on Bible Gateway.
  easton: (page) => ({
    title: "Easton’s Bible Dictionary",
    detail: page.replace(/-/g, ' '),
    by: 'Bible Gateway',
    url: `${BG}/eastons-bible-dictionary/${page}`,
  }),
  // Encyclopaedia Britannica, for world history outside the Bible, keyed by its
  // page path and the article's name, such as biography/Confucius:Confucius.
  brit: (key) => {
    const [path, ...title] = key.split(':')
    return { title: 'Encyclopaedia Britannica', detail: title.join(':') || path, by: 'Britannica', url: `https://www.britannica.com/${path}` }
  },
  // Other published articles, keyed by a short name; they are listed below.
  ref: (key) => ({ ...(REFS[key] || { title: key }) }),
  // The Bible text itself (World English Bible), which opens in the reader.
  bible: (ref) => {
    const r = parseReference(ref)
    return { title: r ? formatReference(r) : ref, by: 'The Bible (World English Bible)', verse: r }
  },
}

// Bible.org pages used as sources, with the author named on each page.
const BIBLE_ORG = {
  18623: { title: 'Introduction to Genesis', author: 'Tom Hawkins (Th.M., Ph.D., Dallas Theological Seminary)' },
  885: { title: 'An Introduction to Deuteronomy', author: 'David Malick (Th.M., Dallas Theological Seminary)' },
}

// Other articles used as sources, with their author or publisher.
const REFS = {
  'esv-exodus-date': {
    title: 'The Date of the Exodus',
    detail: 'ESV Study Bible article',
    by: 'Crossway · on Bible Study Tools',
    url: 'https://biblestudytools.com/commentaries/esv-study-bible/the-date-of-the-exodus.html',
  },
  'vandam-amulets': {
    title: 'A Silver Priestly Blessing',
    detail: 'Cornelis van Dam',
    by: 'Clarion · on Christian Library',
    url: 'https://www.christianstudylibrary.org/node/1238',
  },
  'ewtn-decalogue': {
    title: 'The Division of the Ten Commandments',
    detail: 'James Akin',
    by: 'EWTN Library',
    url: 'https://www.ewtn.com/catholicism/library/division-of-the-ten-commandments-1099',
  },
}

function titleCase(slug) {
  return slug.replace(/^(\d)/, '$1 ').replace(/\b\w/g, c => c.toUpperCase())
}

export function describe(code) {
  const i = code.indexOf(':')
  const kind = KINDS[code.slice(0, i)]
  return kind ? { code, ...kind(code.slice(i + 1)) } : { code, title: code }
}

const MARKER = /\s*\[\[([a-z]+:[^\]]+)\]\]/g

// Splits texts that share one numbered Sources list. Returns, for each text,
// pieces of plain text and { n } citation numbers, plus the list itself.
export function cite(texts) {
  const order = []
  const parts = texts.map(text => {
    if (!text) return []
    const out = []
    let last = 0
    let pending = []
    const flush = () => { if (pending.length) { out.push({ n: pending }); pending = [] } }
    for (const m of text.matchAll(MARKER)) {
      const before = text.slice(last, m.index)
      if (before) { flush(); out.push(before) }
      let n = order.indexOf(m[1])
      if (n < 0) { order.push(m[1]); n = order.length - 1 }
      if (!pending.includes(n + 1)) pending.push(n + 1)
      last = m.index + m[0].length
    }
    flush()
    if (last < text.length) out.push(text.slice(last))
    return out
  })
  return { parts, sources: order.map(describe) }
}

export const hasMarkers = (text) => /\[\[[a-z]+:/.test(text || '')
