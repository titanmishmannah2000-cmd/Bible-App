# Verbum

Verbum is a Bible reader for everyone, set like an illuminated manuscript on a modern grid: vellum pages, a gold-leaf initial on each chapter, red rubric verse numbers, a gloss in the margin, an atlas of journeys and threads beside the text, and the whole canon as a ribbon along the bottom. It follows your system's light or dark setting, or you can choose.

## Features

- **The whole Bible, offline.** The World English Bible (public domain) ships with the app in `public/bible/`, one JSON file per book. Reading and searching need no API.
- **The gloss.** Tap a verse to open its note in the margin (under the verse on smaller screens): how many threads it has, the strongest link in the other Testament with its text, and Illuminate, Follow the threads, Copy, Share and Listen.
- **Threads.** Cross-references for every verse of all 66 books, linking the Old and New Testaments in both directions. The Threads tab draws arcs from the verse to every book it echoes (lapis for the Old Testament, gold for the New, thicker for stronger links) and lists each passage with its text and a link to read it in context. With no verse open it shows the chapter's strongest links. Data: [OpenBible.info](https://www.openbible.info/labs/cross-references/) (CC BY), from the Treasury of Scripture Knowledge, ranked by reader votes; the top 6 Old Testament and top 6 New Testament links per verse are kept in `public/threads/`.
- **A map for every book.** The Journey tab follows each book's journey chapter by chapter. The route draws itself in ink behind a moving pointer. Choose Terrain, Satellite, Street or Antique views, zoom in, or press Expand to give the atlas the whole screen.
- **The canon ribbon.** Every book as a tick, its height by chapters. Hover to see a book, click to open it; when Threads is open, the books a verse reaches turn gold.
- **Search.** A word or phrase across all 31,103 verses, or a reference such as `John 3:16`, `ps 23` or `1 cor 13:4-7`. Press Ctrl K (⌘ K) or / anywhere.
- **Saved verses.** Illuminated verses get a hand-laid gold wash and are listed in Bible order under Saved.
- **Ambient sound.** Optional soundscapes synthesized with the Web Audio API. Off by default; the choice is remembered.
- **Links to any verse.** Positions live in the URL, e.g. `#/Romans/8/28`. The app remembers where you stopped reading.

## Running it

```bash
npm install
npm run dev       # development server
npm run build     # production build in dist/
npm run preview   # serve the production build
npm run lint
```

`dist/` is a static site and can be hosted anywhere. Routing uses the URL hash, so no server rewrites are needed.

## Data

- `npm run build:bible` regenerates `public/bible/*.json` from the `world-english-bible` package.
- `scripts/build-threads.py` regenerates `public/threads/*.json` from OpenBible.info's cross-reference data (see the script for the input file).
- Map tiles come from Esri and paintings from Wikimedia Commons, so those need an internet connection. Everything else works offline.

## Project layout

```
src/
  App.jsx                 layout, routing, sound and atlas state
  components/
    TopBar.jsx            the header
    Rail.jsx              chapter numeral and chapter list
    Reader.jsx            the text, initials, gloss margin and colophon
    Atlas.jsx             the Journey and Threads card
    WorldMap.jsx          the journey map
    Threads.jsx           the arc map and linked passages
    Canon.jsx             the canon ribbon
    BooksSheet.jsx, SearchSheet.jsx, SavedSheet.jsx, Sheet.jsx
    Welcome.jsx           verse of the day
  data/                   books, canon sections, journeys, paintings
  lib/                    Bible loading and search, threads, routes, highlights, preferences, soundscape
```

## License

© 2026 Titan. All rights reserved. Verbum's code, design and its own writing are proprietary: see [`LICENSE`](LICENSE). No permission to copy, modify or redistribute them is granted.

Some parts belong to others and keep their own licenses: the Bible text, open study notes, cross-references, map data and tiles, paintings, fonts and open-source libraries. They are listed in [`NOTICE.md`](NOTICE.md), shown in the app under **Credits and licenses**, and the full software license texts are in `public/third-party-notices.txt` (regenerate with `npm run build:notices`).
