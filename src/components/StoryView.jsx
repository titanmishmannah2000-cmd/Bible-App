import { useEffect, useMemo, useRef, useState } from 'react'
import { annotate } from 'rough-notation'
import useBible from '../hooks/useBible'
import { cite } from '../lib/sources'
import { CitedText, SourceList } from './Cited'
import { displayBook, chaptersOf } from '../data/canon'
import { storyFor } from '../data/stories'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

// A narrative chapter as a story: scroll the scenes on the right, the map on
// the left follows along and the key words are marked as each scene arrives.
export default function StoryView({ book, chapter, onRead, onStory }) {
  const story = storyFor(book, chapter)
  const { verses } = useBible(book, chapter)
  const [at, setAt] = useState(0)
  const scroller = useRef(null)
  const { parts, sources } = useMemo(() => cite(story.scenes.map(s => s.note)), [story])
  const hasNext = storyFor(book, chapter + 1)

  // The scene in the middle of the column is the current one; its phrase is marked once.
  useEffect(() => {
    const root = scroller.current
    if (!root || !verses.length) return
    const marked = new Set(), notes = []
    const io = new IntersectionObserver((entries) => entries.forEach(e => {
      if (!e.isIntersecting) return
      const i = Number(e.target.dataset.i)
      setAt(i)
      const mk = e.target.querySelector('.story-mark')
      if (mk && !marked.has(i)) {
        marked.add(i)
        const a = annotate(mk, { type: story.scenes[i].circle ? 'circle' : 'underline', color: cssVar('--rubric'), strokeWidth: 1.6, padding: story.scenes[i].circle ? 5 : 2, multiline: true, iterations: 1, animate: !reduced(), animationDuration: 900 })
        a.show()
        notes.push(a)
      }
    }), { root, rootMargin: '-40% 0px -40% 0px' })
    root.querySelectorAll('.story-scene').forEach(el => io.observe(el))
    return () => { io.disconnect(); notes.forEach(a => a.remove()) }
  }, [verses, story])

  const scene = story.scenes[at]
  const name = displayBook(book, chapter)
  return (
    <div className="story-view">
      <div className="story-map-col">
        <StoryMap map={story.map} at={scene.at} />
        <div className="story-place"><span className="eyebrow">Now</span>{scene.place || (scene.at === 'road' ? 'On the road home' : story.map.places[scene.at]?.name)}</div>
      </div>
      <div className="story-scenes" ref={scroller} tabIndex={0} aria-label={`${name} ${chapter} as a story. Scroll to continue.`}>
        <ol className="story-dots" aria-hidden="true">{story.scenes.map((s, i) => <li key={i} className={i === at ? 'on' : i < at ? 'done' : ''} />)}</ol>
        {story.scenes.map((s, i) => (
          <section key={i} className={`story-scene${i === at ? ' on' : ''}`} data-i={i}>
            <span className="eyebrow">Scene {i + 1} of {story.scenes.length} · {name} {chapter}:{s.from}{s.to > s.from ? `–${s.to}` : ''}</span>
            <h3>{s.title}</h3>
            <p className="story-text">
              {verses.filter(v => v.verse >= s.from && v.verse <= s.to).map(v => (
                <span key={v.verse}><sup>{v.verse}</sup><Marked text={v.text} mark={s.mark} /> </span>
              ))}
            </p>
            <p className="story-note"><CitedText parts={parts[i]} idPrefix="story-src" /></p>
            {i === 0 && <p className="story-hint">Scroll down to continue ↓</p>}
          </section>
        ))}
        <section className="story-end">
          <p>That is the end of {name} {chapter}.</p>
          <div className="story-end-btns">
            {hasNext && <button type="button" className="btn-primary" onClick={() => onStory(chapter + 1)}>Go on to chapter {chapter + 1} as a story</button>}
            {!hasNext && chapter < chaptersOf(book) && <button type="button" className="btn-primary" onClick={() => onRead(book, chapter + 1)}>Read chapter {chapter + 1}</button>}
            <button type="button" className="chip" onClick={() => onRead(book, chapter)}>Back to the page</button>
          </div>
          <SourceList sources={sources} idPrefix="story-src" onVerse={onRead} />
        </section>
      </div>
    </div>
  )
}

// The marked phrase inside a verse, if it is there.
function Marked({ text, mark }) {
  const i = mark ? text.indexOf(mark) : -1
  if (i < 0) return text
  return <>{text.slice(0, i)}<span className="story-mark">{mark}</span>{text.slice(i + mark.length)}</>
}

// A small engraved map drawn from the same Natural Earth data as the Engraved view.
let engraved = null
const loadEngraved = () => (engraved ||= fetch(`${import.meta.env.BASE_URL}engraved.json`).then(r => r.json()).catch(() => { engraved = null; return null }))

function StoryMap({ map: base, at }) {
  const [data, setData] = useState(null)
  const [size, setSize] = useState([400, 500])
  const ref = useRef(null)
  useEffect(() => { let live = true; loadEngraved().then(d => { if (live) setData(d) }); return () => { live = false } }, [])
  useEffect(() => {
    const el = ref.current?.parentElement
    if (!el) return
    const ro = new ResizeObserver(([e]) => { const { width, height } = e.contentRect; if (width && height) setSize([width, height]) })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Fit the map to its box: keep the whole area in view and widen the other way.
  const [W, H] = size
  const k = Math.cos(((base.south + base.north) / 2) * Math.PI / 180)
  const cx = (base.west + base.east) / 2, cy = (base.south + base.north) / 2
  const scale = Math.min(W / ((base.east - base.west) * k), H / (base.north - base.south))
  const map = { ...base, west: cx - W / scale / k / 2, east: cx + W / scale / k / 2, south: cy - H / scale / 2, north: cy + H / scale / 2 }
  const P = (lng, lat) => [((lng - map.west) / (map.east - map.west)) * W, ((map.north - lat) / (map.north - map.south)) * H]
  const near = (c) => c[0] > map.west - 1 && c[0] < map.east + 1 && c[1] > map.south - 1 && c[1] < map.north + 1
  const path = (rings) => rings.map(r => r.map((c, i) => `${i ? 'L' : 'M'}${P(c[0], c[1]).map(n => n.toFixed(1)).join(' ')}`).join('') + 'Z').join('')
  const line = (coords) => coords.map((c, i) => `${i ? 'L' : 'M'}${P(c[0], c[1]).map(n => n.toFixed(1)).join(' ')}`).join('')
  const shapes = useMemo(() => {
    if (!data) return null
    const polys = (fc) => fc.features.flatMap(f => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates))
      .filter(p => p[0].some(near)).map(path)
    const rivers = data.rivers.features.flatMap(f => (f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates))
      .filter(l => l.some(near)).map(line)
    const peaks = data.peaks.features.map(f => f.geometry.coordinates).filter(c => c[0] > map.west && c[0] < map.east && c[1] > map.south && c[1] < map.north).map(c => P(c[0], c[1]))
    return { land: polys(data.land), lakes: polys(data.lakes), rivers, peaks }
  }, [data, W, H]) // eslint-disable-line react-hooks/exhaustive-deps

  const places = map.places
  const [a, b] = map.route.map(id => P(places[id].lng, places[id].lat))
  const via = P(...map.via)
  const pos = at === 'road' ? via : P(places[at].lng, places[at].lat)
  const grid = []
  for (let lng = Math.ceil(map.west * 2) / 2; lng <= map.east; lng += 0.5) grid.push(['v', lng])
  for (let lat = Math.ceil(map.south * 2) / 2; lat <= map.north; lat += 0.5) grid.push(['h', lat])

  return (
    <svg ref={ref} className="story-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Map of the places in this chapter">
      <defs>
        <pattern id="story-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="var(--map-river)" strokeWidth="1" /></pattern>
      </defs>
      <rect width={W} height={H} fill="var(--map-sea)" />
      {shapes?.land.map((d, i) => <path key={i} d={d} fill="var(--map-ground)" stroke="var(--ink-soft)" strokeWidth="0.8" />)}
      {grid.map(([t, v]) => {
        if (t === 'v') { const [x] = P(v, map.north); return <g key={`v${v}`}><line x1={x} x2={x} y1="0" y2={H} stroke="var(--map-line)" strokeWidth="0.8" /><text x={x + 3} y={H - 6} className="story-deg">{v.toFixed(1)}°E</text></g> }
        const [, y] = P(map.west, v); return <g key={`h${v}`}><line x1="0" x2={W} y1={y} y2={y} stroke="var(--map-line)" strokeWidth="0.8" /><text x="4" y={y - 3} className="story-deg">{v.toFixed(1)}°N</text></g>
      })}
      {shapes?.rivers.map((d, i) => <path key={i} d={d} fill="none" stroke="var(--map-river)" strokeWidth="1.4" />)}
      {shapes?.lakes.map((d, i) => <path key={i} d={d} fill="url(#story-hatch)" stroke="var(--map-river)" strokeWidth="1" />)}
      {shapes?.peaks.map(([x, y], i) => <path key={i} d={`M${x - 4} ${y + 3}L${x} ${y - 4}L${x + 4} ${y + 3}`} fill="none" stroke="var(--ink-soft)" strokeWidth="0.8" />)}
      <path d={`M${a[0]} ${a[1]} Q${via[0]} ${via[1] - 30} ${via[0]} ${via[1]} Q${via[0]} ${via[1] + 30} ${b[0]} ${b[1]}`} fill="none" stroke="var(--gold)" strokeWidth="1.8" strokeDasharray="5 6" />
      <text x={via[0]} y={via[1] - 18} textAnchor="middle" className="story-route">the road is not named in Ruth</text>
      {Object.entries(places).map(([id, p]) => {
        const [x, y] = P(p.lng, p.lat)
        return <g key={id}><circle cx={x} cy={y} r="4.5" fill="var(--ink)" /><text x={x + (x > W / 2 ? 8 : -8)} y={y + 18} textAnchor={x > W / 2 ? 'start' : 'end'} className="story-label">{p.name}</text></g>
      })}
      <g className="story-pin" style={{ transform: `translate(${pos[0]}px, ${pos[1]}px)` }}>
        <circle r="13" fill="var(--lapis)" fillOpacity="0.18" /><circle r="6.5" fill="var(--lapis)" stroke="var(--leaf)" strokeWidth="2" />
      </g>
    </svg>
  )
}
