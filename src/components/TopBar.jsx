import { useHighlights } from '../lib/highlights'
import { useDarkTheme, toggleTheme } from '../lib/prefs'
import { sectionOf, displayBook } from '../data/canon'
import { IconStart, IconBooks, IconSearch, IconSpark, IconMap, IconSound, IconTheme, Lozenge } from './Icons'

export default function TopBar({
  book, chapter, onHome, onBooks, onStart, onSearch, onSaved, atlasOpen, onToggleAtlas, soundOn, onToggleSound,
}) {
  const savedCount = Object.keys(useHighlights()).length
  const dark = useDarkTheme()

  return (
    <header className="bar">
      <button className="mark-word" type="button" onClick={onHome} aria-label="Verbum, verse of the day">
        <Lozenge /><span>VERBUM</span>
      </button>
      <div className="bar-main">
        <div className="crumb">{sectionOf(book)?.name} <span aria-hidden="true">&nbsp;/&nbsp;</span> <b>{displayBook(book, chapter)} {chapter}</b></div>
        <nav className="nav" aria-label="Tools">
          <button className="pill" type="button" onClick={onStart} title="Start here: reading paths"><IconStart /><span className="label">Start here</span></button>
          <button className="pill" type="button" onClick={onBooks} title="Books"><IconBooks /><span className="label">Books</span></button>
          <button className="pill" type="button" onClick={onSearch} title="Search (Ctrl K)"><IconSearch /><span className="label">Search</span></button>
          <button className="pill" type="button" onClick={onSaved} title="Illuminated verses">
            <IconSpark /><span className="label">Saved</span>
            {savedCount > 0 && <span className="count" aria-label={`${savedCount} saved`}>{savedCount}</span>}
          </button>
          <button className="pill icon-only" type="button" onClick={onToggleSound} aria-pressed={soundOn}
            aria-label={soundOn ? 'Turn ambient sound off' : 'Turn ambient sound on'} title={soundOn ? 'Ambient sound on' : 'Ambient sound off'}>
            <IconSound on={soundOn} />
          </button>
          <button className="pill icon-only" type="button" onClick={toggleTheme}
            aria-label={dark ? 'Switch to light pages' : 'Switch to dark pages'} title={dark ? 'Light pages' : 'Dark pages'}>
            <IconTheme dark={!dark} />
          </button>
          <button className={`pill${atlasOpen ? ' solid' : ''}`} type="button" onClick={onToggleAtlas} aria-pressed={atlasOpen} title="Map and threads">
            <IconMap /><span className="label">Atlas</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
