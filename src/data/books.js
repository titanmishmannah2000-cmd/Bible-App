    export const CHAPTER_COUNTS = {
  'Genesis':50,'Exodus':40,'Leviticus':27,'Numbers':36,'Deuteronomy':34,
  'Joshua':24,'Judges':21,'Ruth':4,'1 Samuel':31,'2 Samuel':24,
  '1 Kings':22,'2 Kings':25,'1 Chronicles':29,'2 Chronicles':36,
  'Ezra':10,'Nehemiah':13,'Esther':10,'Job':42,'Psalms':150,
  'Proverbs':31,'Ecclesiastes':12,'Song of Solomon':8,'Isaiah':66,
  'Jeremiah':52,'Lamentations':5,'Ezekiel':48,'Daniel':12,'Hosea':14,
  'Joel':3,'Amos':9,'Obadiah':1,'Jonah':4,'Micah':7,'Nahum':3,
  'Habakkuk':3,'Zephaniah':3,'Haggai':2,'Zechariah':14,'Malachi':4,
  'Matthew':28,'Mark':16,'Luke':24,'John':21,'Acts':28,'Romans':16,
  '1 Corinthians':16,'2 Corinthians':13,'Galatians':6,'Ephesians':6,
  'Philippians':4,'Colossians':4,'1 Thessalonians':5,'2 Thessalonians':3,
  '1 Timothy':6,'2 Timothy':4,'Titus':3,'Philemon':1,'Hebrews':13,
  'James':5,'1 Peter':5,'2 Peter':3,'1 John':5,'2 John':1,
  '3 John':1,'Jude':1,'Revelation':22,
}

export const BOOKS = {
  old: [
    'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
    '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra',
    'Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon',
    'Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos',
    'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi'
  ],
  new: [
    'Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians',
    'Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians',
    '1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter',
    '1 John','2 John','3 John','Jude','Revelation'
  ],
}

export const BOOK_THEMES = {
  // ── PENTATEUCH ──────────────────────────────────────────────
  'Genesis':        { bg: 'light',    sound: 'wind',    era: 'Creation & Patriarchs' },
  'Exodus':         { bg: 'fire',      sound: 'desert',  era: 'The Exodus' },
  'Leviticus':      { bg: 'temple',    sound: 'ambient', era: 'The Law' },
  'Numbers':        { bg: 'desert',    sound: 'wind',    era: 'The Wilderness' },
  'Deuteronomy':    { bg: 'sandstorm', sound: 'wind',    era: 'The Law Renewed' },

  // ── HISTORY ─────────────────────────────────────────────────
  'Joshua':         { bg: 'dawn',      sound: 'wind',    era: 'Conquest of Canaan' },
  'Judges':         { bg: 'storm',     sound: 'storm',   era: 'The Judges' },
  'Ruth':           { bg: 'harvest',   sound: 'ambient', era: 'The Time of Judges' },
  '1 Samuel':       { bg: 'battlefield', sound: 'wind',  era: 'United Kingdom' },
  '2 Samuel':       { bg: 'royalnight', sound: 'ambient', era: 'Reign of David' },
  '1 Kings':        { bg: 'temple',    sound: 'ambient', era: 'The Kingdom' },
  '2 Kings':        { bg: 'storm',     sound: 'storm',   era: 'Fall of the Kingdom' },
  '1 Chronicles':   { bg: 'royalnight', sound: 'ambient', era: 'The Chronicles' },
  '2 Chronicles':   { bg: 'temple',    sound: 'ambient', era: 'The Chronicles' },
  'Ezra':           { bg: 'dawn',      sound: 'ambient', era: 'The Return' },
  'Nehemiah':       { bg: 'dawn',      sound: 'ambient', era: 'Rebuilding Jerusalem' },
  'Esther':         { bg: 'persian',   sound: 'ambient', era: 'Persian Empire' },

  // ── POETRY & WISDOM ─────────────────────────────────────────
  'Job':            { bg: 'storm',     sound: 'storm',   era: 'Wisdom Literature' },
  'Psalms':         { bg: 'cosmos',    sound: 'ambient', era: 'The Psalms' },
  'Proverbs':       { bg: 'dawn',      sound: 'ambient', era: 'Wisdom Literature' },
  'Ecclesiastes':   { bg: 'fog',       sound: 'ambient', era: 'Wisdom Literature' },
  'Song of Solomon':{ bg: 'garden',    sound: 'ambient', era: 'Wisdom Literature' },

  // ── MAJOR PROPHETS ──────────────────────────────────────────
  'Isaiah':         { bg: 'fire',      sound: 'wind',    era: 'Major Prophets' },
  'Jeremiah':       { bg: 'weeping',   sound: 'rain',    era: 'Major Prophets' },
  'Lamentations':   { bg: 'ash',       sound: 'ambient', era: 'Major Prophets' },
  'Ezekiel':        { bg: 'vortex',    sound: 'storm',   era: 'Major Prophets' },
  'Daniel':         { bg: 'cosmos',    sound: 'ambient', era: 'Major Prophets' },

  // ── MINOR PROPHETS ──────────────────────────────────────────
  'Hosea':          { bg: 'rain',      sound: 'rain',    era: 'Minor Prophets' },
  'Joel':           { bg: 'fire',      sound: 'wind',    era: 'Minor Prophets' },
  'Amos':           { bg: 'desert',    sound: 'wind',    era: 'Minor Prophets' },
  'Obadiah':        { bg: 'storm',     sound: 'storm',   era: 'Minor Prophets' },
  'Jonah':          { bg: 'ocean',     sound: 'storm',   era: 'Minor Prophets' },
  'Micah':          { bg: 'dawn',      sound: 'ambient', era: 'Minor Prophets' },
  'Nahum':          { bg: 'storm',     sound: 'storm',   era: 'Minor Prophets' },
  'Habakkuk':       { bg: 'watchtower', sound: 'wind',   era: 'Minor Prophets' },
  'Zephaniah':      { bg: 'ash',       sound: 'ambient', era: 'Minor Prophets' },
  'Haggai':         { bg: 'temple',    sound: 'ambient', era: 'Minor Prophets' },
  'Zechariah':      { bg: 'visions',   sound: 'ambient', era: 'Minor Prophets' },
  'Malachi':        { bg: 'fire',      sound: 'wind',    era: 'Minor Prophets' },

  // ── GOSPELS ─────────────────────────────────────────────────
  'Matthew':        { bg: 'dawn',      sound: 'rain',    era: 'The Gospels' },
  'Mark':           { bg: 'urgency',   sound: 'wind',    era: 'The Gospels' },
  'Luke':           { bg: 'golden',    sound: 'ambient', era: 'The Gospels' },
  'John':           { bg: 'light',     sound: 'ambient', era: 'The Gospels' },

  // ── NEW TESTAMENT ───────────────────────────────────────────
  'Acts':           { bg: 'fire',      sound: 'wind',    era: 'Early Church' },
  'Romans':         { bg: 'temple',    sound: 'ambient', era: 'Pauline Epistles' },
  '1 Corinthians':  { bg: 'golden',    sound: 'ambient', era: 'Pauline Epistles' },
  '2 Corinthians':  { bg: 'dawn',      sound: 'ambient', era: 'Pauline Epistles' },
  'Galatians':      { bg: 'desert',    sound: 'wind',    era: 'Pauline Epistles' },
  'Ephesians':      { bg: 'light',     sound: 'ambient', era: 'Pauline Epistles' },
  'Philippians':    { bg: 'golden',    sound: 'ambient', era: 'Pauline Epistles' },
  'Colossians':     { bg: 'light',     sound: 'ambient', era: 'Pauline Epistles' },
  '1 Thessalonians':{ bg: 'cosmos',    sound: 'ambient', era: 'Pauline Epistles' },
  '2 Thessalonians':{ bg: 'cosmos',    sound: 'ambient', era: 'Pauline Epistles' },
  '1 Timothy':      { bg: 'temple',    sound: 'ambient', era: 'Pastoral Epistles' },
  '2 Timothy':      { bg: 'torch',     sound: 'ambient', era: 'Pastoral Epistles' },
  'Titus':          { bg: 'dawn',      sound: 'ambient', era: 'Pastoral Epistles' },
  'Philemon':       { bg: 'golden',    sound: 'ambient', era: 'Pastoral Epistles' },
  'Hebrews':        { bg: 'temple',    sound: 'ambient', era: 'General Epistles' },
  'James':          { bg: 'harvest',   sound: 'ambient', era: 'General Epistles' },
  '1 Peter':        { bg: 'ocean',     sound: 'ambient', era: 'General Epistles' },
  '2 Peter':        { bg: 'storm',     sound: 'storm',   era: 'General Epistles' },
  '1 John':         { bg: 'light',     sound: 'ambient', era: 'General Epistles' },
  '2 John':         { bg: 'golden',    sound: 'ambient', era: 'General Epistles' },
  '3 John':         { bg: 'golden',    sound: 'ambient', era: 'General Epistles' },
  'Jude':           { bg: 'storm',     sound: 'storm',   era: 'General Epistles' },
  'Revelation':     { bg: 'apocalypse', sound: 'storm',  era: 'Apocalyptic' },
}

export const DEFAULT_THEME = { bg: 'cosmos', sound: 'ambient', era: 'Journey of Scripture' }