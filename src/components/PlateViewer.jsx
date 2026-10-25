import { useEffect, useRef, useState } from 'react'
import OpenSeadragon from 'openseadragon'
import { PLATE_SPOTS } from '../data/plateSpots'
import { useDepth } from '../lib/prefs'
import { cite } from '../lib/sources'
import { parseReference } from '../lib/bible'
import { CitedText, SourceList } from './Cited'
import { DepthSwitch } from './ChapterBrief'
import useBible from '../hooks/useBible'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The book's painting, full size, to explore: pinch or scroll to zoom, drag to
// move. Numbered spots (where they have been placed) zoom to a detail and show
// the verse it pictures. Loaded only when a plate is opened, since the zoom
// library is the heaviest part of it.
export default function PlateViewer({ painting, onNavigate }) {
  const box = useRef(null)
  const viewer = useRef(null)
  const [state, setState] = useState('loading')
  const spots = PLATE_SPOTS[painting.file] || []
  const [current, setCurrent] = useState(null)

  useEffect(() => {
    let tried = 0
    const v = OpenSeadragon({
      element: box.current,
      tileSources: { type: 'image', url: painting.urls[painting.urls.length - 1], crossOriginPolicy: 'Anonymous' },
      drawer: 'canvas',
      showNavigationControl: false,
      showNavigator: true, navigatorPosition: 'BOTTOM_RIGHT', navigatorSizeRatio: 0.16, navigatorAutoFade: false,
      animationTime: reduced() ? 0 : 1.0, springStiffness: 8,
      visibilityRatio: 0.85, maxZoomPixelRatio: 3, minZoomImageRatio: 0.8,
      gestureSettingsMouse: { clickToZoom: false, dblClickToZoom: true },
      gestureSettingsTouch: { pinchRotate: false },
    })
    viewer.current = v
    v.addHandler('open', () => {
      setState('ready')
      spots.forEach((s, i) => {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'plate-spot'
        el.textContent = String(i + 1)
        el.setAttribute('aria-label', `${i + 1}. ${s.title}`)
        new OpenSeadragon.MouseTracker({ element: el, clickHandler: () => setCurrent(i) })
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrent(i) } })
        const size = v.world.getItemAt(0).getContentSize()
        v.addOverlay({ element: el, location: v.viewport.imageToViewportCoordinates(s.x * size.x, s.y * size.y), placement: OpenSeadragon.Placement.CENTER })
      })
    })
    // The full file can be very large; fall back to the smaller copy, then give up.
    v.addHandler('open-failed', () => {
      tried += 1
      const url = painting.urls[painting.urls.length - 1 - tried]
      if (url) v.open({ type: 'image', url, crossOriginPolicy: 'Anonymous' })
      else setState('failed')
    })
    return () => { v.destroy(); viewer.current = null }
  }, [painting]) // eslint-disable-line react-hooks/exhaustive-deps

  // Choosing a spot glides to its detail.
  useEffect(() => {
    const v = viewer.current
    if (current == null || !v || !v.world.getItemCount()) return
    const s = spots[current], size = v.world.getItemAt(0).getContentSize()
    const w = (s.w || 0.25) * size.x, h = (s.h || 0.25) * size.y
    v.viewport.fitBounds(v.viewport.imageToViewportRectangle(s.x * size.x - w / 2, s.y * size.y - h / 2, w, h), reduced())
    box.current?.querySelectorAll('.plate-spot').forEach((el, i) => el.setAttribute('aria-current', i === current))
  }, [current]) // eslint-disable-line react-hooks/exhaustive-deps

  const zoom = (f) => viewer.current?.viewport.zoomBy(f)
  const home = () => { setCurrent(null); viewer.current?.viewport.goHome(reduced()) }

  return (
    <div className="plate-view">
      <div className="plate-stage">
        <div className="plate-osd" ref={box} aria-label={`${painting.title}, ${painting.artist}. Zoomable.`} />
        {state === 'loading' && <div className="plate-msg">Bringing in the painting…</div>}
        {state === 'failed' && <div className="plate-msg">The painting could not be loaded. Check your internet connection and try again.</div>}
        <div className="plate-tools" role="group" aria-label="Zoom">
          <button type="button" className="chip" onClick={() => zoom(1.6)}>＋ Zoom in</button>
          <button type="button" className="chip" onClick={() => zoom(1 / 1.6)}>－ Zoom out</button>
          <button type="button" className="chip" onClick={home}>Whole painting</button>
        </div>
      </div>
      <aside className="plate-side">
        <div>
          <h3 className="plate-title">{painting.title}</h3>
          <p className="plate-artist">{painting.artist}</p>
        </div>
        <p className="plate-how">
          {spots.length
            ? <>Tap a <b>red number</b> on the painting, or a line below, to see the verse it shows. Pinch or scroll to zoom, drag to move around.</>
            : <>Pinch or scroll to zoom in. Drag to move around. Press <b>Whole painting</b> to see all of it again.</>}
        </p>
        {spots.length > 0 && (
          <>
            <ol className="spot-list">
              {spots.map((s, i) => (
                <li key={i}>
                  <button type="button" aria-current={current === i} onClick={() => setCurrent(i)}>
                    <span className="spot-n">{i + 1}</span><span><b>{s.title}</b><span className="muted">{s.ref}</span></span>
                  </button>
                </li>
              ))}
            </ol>
            {current != null && <SpotDetail spot={spots[current]} onNavigate={onNavigate} />}
          </>
        )}
        <p className="plate-src small muted">
          Public domain, from <a href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(painting.file)}`} target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>.
        </p>
      </aside>
    </div>
  )
}

function SpotDetail({ spot, onNavigate }) {
  const deeper = useDepth() === 'deeper'
  const r = parseReference(spot.ref)
  const { verses } = useBible(r.book, r.chapter)
  const text = verses.filter(v => v.verse >= r.verse && v.verse <= (r.verseEnd || r.verse)).map(v => v.text).join(' ')
  const { parts: [deep], sources } = cite([deeper ? spot.deeper : ''])
  return (
    <div className="spot-detail">
      <div className="brief-top"><span className="eyebrow">{spot.ref}</span><DepthSwitch /></div>
      <p className="spot-verse">{text || '…'}</p>
      <p className="small">{deeper && spot.deeper ? <CitedText parts={deep} idPrefix="spot-src" /> : spot.simple}</p>
      {deeper && spot.deeper && <SourceList sources={sources} idPrefix="spot-src" onVerse={onNavigate} />}
      <button type="button" className="link-btn" onClick={() => onNavigate(r.book, r.chapter, r.verse)}>Read {spot.ref} in the Bible →</button>
    </div>
  )
}
