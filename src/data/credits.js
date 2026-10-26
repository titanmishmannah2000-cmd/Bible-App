// Who made Verbum, and where every part that someone else made comes from,
// with the license each part comes under. The Credits sheet shows this list;
// LICENSE and NOTICE.md at the project root say the same in legal form.

// The copyright holder. Use your full legal name.
export const OWNER = 'Titan'
export const FIRST_YEAR = 2026

const CC_BY_SA = { license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }
const OFL = { license: 'SIL Open Font License 1.1', licenseUrl: 'https://openfontlicense.org/' }
const PD = { license: 'Public domain' }
const LINK_ONLY = { license: 'Cited and linked only; no wording copied' }

export const CREDIT_GROUPS = [
  {
    id: 'bible',
    title: 'The Bible text',
    plain: 'Every verse you read is the World English Bible, exactly as published. Anyone may use this text freely.',
    items: [
      { name: 'World English Bible', by: 'eBible.org', url: 'https://ebible.org/web/', ...PD, licenseUrl: 'https://ebible.org/web/copyright.htm',
        note: '“World English Bible” is a trademark of eBible.org. Verbum shows the text unchanged, so it keeps the name.' },
      { name: 'Hebrew and Greek words in the glossary', by: 'The original languages of the Bible', ...PD },
    ],
  },
  {
    id: 'notes',
    title: 'Notes, summaries and book cards',
    plain: 'The chapter summaries, notes, book cards, glossary, stories, reading paths and painting guides were written for Verbum. Each fact in them points to the source below that it comes from. Open study notes are free to use under their license; the other works are only cited and linked, never copied.',
    items: [
      { name: 'Tyndale Open Study Notes', by: 'Tyndale House Publishers, via BibleAquifer', url: 'https://github.com/BibleAquifer/AquiferOpenStudyNotes', ...CC_BY_SA },
      { name: 'Tyndale Open Bible Dictionary', by: 'Tyndale House Publishers, via BibleAquifer', url: 'https://github.com/BibleAquifer/AquiferOpenBibleDictionary', ...CC_BY_SA },
      { name: 'Biblica Study Notes', by: 'Biblica, via BibleAquifer', url: 'https://github.com/BibleAquifer/BiblicaStudyNotes', ...CC_BY_SA },
      { name: 'New American Bible, Revised Edition: introductions and footnotes', by: 'US Conference of Catholic Bishops', url: 'https://bible.usccb.org/bible', ...LINK_ONLY },
      { name: 'Reformation Study Bible', by: 'Ligonier Ministries, on Bible Gateway', url: 'https://www.biblegateway.com/resources/reformation-study-bible/', ...LINK_ONLY },
      { name: 'Encyclopedia of the Bible', by: 'Zondervan, on Bible Gateway', url: 'https://www.biblegateway.com/resources/encyclopedia-of-the-bible/', ...LINK_ONLY },
      { name: 'Easton’s Bible Dictionary (1897)', by: 'M. G. Easton, on Bible Gateway', url: 'https://www.biblegateway.com/resources/eastons-bible-dictionary/', ...PD },
      { name: 'Encyclopaedia Britannica (world history on the Timeline)', by: 'Encyclopædia Britannica, Inc.', url: 'https://www.britannica.com/', ...LINK_ONLY },
      { name: 'Bible.org articles', by: 'Tom Hawkins; David Malick', url: 'https://bible.org/', ...LINK_ONLY },
      { name: 'Other articles', by: 'Crossway (ESV Study Bible); Cornelis van Dam (Clarion); James Akin (EWTN)', ...LINK_ONLY },
    ],
  },
  {
    id: 'threads',
    title: 'Threads (cross-references)',
    plain: 'The links between verses come from OpenBible.info, which gathered them from the Treasury of Scripture Knowledge and ranks them by readers’ votes. Verbum keeps the strongest links for each verse.',
    items: [
      { name: 'Bible cross-references', by: 'OpenBible.info', url: 'https://www.openbible.info/labs/cross-references/',
        license: 'Creative Commons Attribution (CC BY)', licenseUrl: 'https://www.openbible.info/labs/cross-references/' },
      { name: 'Treasury of Scripture Knowledge', by: 'A 19th-century reference work', ...PD },
    ],
  },
  {
    id: 'maps',
    title: 'Maps',
    plain: 'The Engraved map and the small maps in the Timeline are drawn by Verbum from free public map data. The other map views show map pictures from Esri, which are credited under the map whenever you use them. The journeys and their stop notes were written for Verbum.',
    items: [
      { name: 'Natural Earth coastlines, lakes and rivers', by: 'Natural Earth', url: 'https://www.naturalearthdata.com/', ...PD, licenseUrl: 'https://www.naturalearthdata.com/about/terms-of-use/' },
      { name: 'World outline for the Timeline’s event maps', by: 'world-atlas, © 2013–2019 Michael Bostock, from Natural Earth', url: 'https://github.com/topojson/world-atlas',
        license: 'ISC', licenseUrl: 'https://github.com/topojson/world-atlas/blob/master/LICENSE.md' },
      { name: 'Terrain, Satellite, Street and Antique map pictures', by: 'Esri and its data partners (Maxar, HERE, Garmin, US National Park Service, OpenStreetMap contributors and others)',
        url: 'https://www.esri.com/', license: 'Esri terms of use and attribution rules', licenseUrl: 'https://developers.arcgis.com/documentation/esri-and-data-attribution/' },
      { name: 'OpenStreetMap data inside the Street view', by: 'OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright',
        license: 'ODbL 1.0', licenseUrl: 'https://opendatacommons.org/licenses/odbl/' },
    ],
  },
  {
    id: 'fonts',
    title: 'Lettering',
    plain: 'The typefaces are free fonts. Their license lets any app use them.',
    items: [
      { name: 'Cormorant Garamond', by: 'Christian Thalmann (Catharsis Fonts)', url: 'https://fonts.google.com/specimen/Cormorant+Garamond', ...OFL },
      { name: 'Inter', by: 'Rasmus Andersson', url: 'https://rsms.me/inter/', ...OFL },
      { name: 'Frank Ruhl Libre (Hebrew)', by: 'Yanek Iontef, after Rafael Frank', url: 'https://fonts.google.com/specimen/Frank+Ruhl+Libre', ...OFL },
    ],
  },
  {
    id: 'software',
    title: 'Software Verbum is built with',
    plain: 'Verbum uses free open-source building blocks. Their licenses allow this as long as their notices travel with the app; the full text of every one is in the notices file linked below.',
    items: [
      { name: 'React and React Router', by: 'Meta and contributors; Remix Software', url: 'https://react.dev/', license: 'MIT' },
      { name: 'Motion (framer-motion)', by: 'Matt Perry', url: 'https://motion.dev/', license: 'MIT' },
      { name: 'MapLibre GL JS', by: 'MapLibre contributors', url: 'https://maplibre.org/', license: 'BSD 3-Clause' },
      { name: 'OpenSeadragon (painting zoom)', by: 'OpenSeadragon contributors', url: 'https://openseadragon.github.io/', license: 'BSD 3-Clause' },
      { name: 'ts-fsrs (By heart practice timing)', by: 'Open Spaced Repetition', url: 'https://github.com/open-spaced-repetition/ts-fsrs', license: 'MIT' },
      { name: 'Turf (route distances)', by: 'Turf authors', url: 'https://turfjs.org/', license: 'MIT' },
      { name: 'Rough Notation (hand-drawn marks)', by: 'Preet Shihn', url: 'https://roughnotation.com/', license: 'MIT' },
    ],
  },
  {
    id: 'sound',
    title: 'Sound',
    plain: 'The ambient soundscapes are not recordings. Verbum makes them in your browser as you listen.',
    items: [],
  },
]

export const COMMONS_PAGE = (file) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`
