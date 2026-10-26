import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import TimeRibbon from './TimeRibbon'
import { motion, AnimatePresence } from 'framer-motion'
import { IconPrev, IconNext } from './Icons'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getJourney } from '../data/journeys'
import { ENGRAVED_LAYERS, addEngraved, engravedImage, applyEngravedTheme, EngravedOverlay } from '../lib/engraved'
import { EASE_IN, EASE_OUT } from '../lib/motion'

// The route is inked in lapis on every view, like the engraved maps in the margin.
const INK = '#2C4877'
const INK_EDGE = '#1C1915'
const PAPER = '#FBF8F1'

const HOME_VIEW = { center: [35.5, 31.5], zoom: 5 }

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services'
// A new key, so everyone starts on the Engraved view once.
const STYLE_KEY = 'verbum-map-view'

// Every view lives in one style and is switched by layer visibility, so the
// journey line and markers survive a change of view. Hidden layers load no tiles.
const MAP_VIEWS = [
  { id: 'engraved', label: 'Engraved', layers: ENGRAVED_LAYERS, maxZoom: 11 },
  { id: 'terrain', label: 'Terrain', layers: ['topo'], maxZoom: 17 },
  { id: 'satellite', label: 'Satellite', layers: ['imagery', 'imagery-labels'], maxZoom: 17 },
  { id: 'street', label: 'Street', layers: ['street'], maxZoom: 18 },
  // The relief map only exists down to zoom 8, so this view stops there
  // instead of stretching tiles until they blur.
  { id: 'antique', label: 'Antique', layers: ['relief'], maxZoom: 8 },
]
const ALL_VIEW_LAYERS = MAP_VIEWS.flatMap(v => v.layers)
const RASTER_LAYERS = MAP_VIEWS.slice(1).flatMap(v => v.layers)

const raster = (tiles, maxzoom, attribution) => ({ type: 'raster', tiles, tileSize: 256, maxzoom, attribution })

const MAP_STYLE = {
  version: 8,
  sources: {
    topo: raster([`${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`], 16, 'Esri and its data partners'),
    imagery: raster([`${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`], 17, 'Esri, Maxar'),
    'imagery-labels': raster([`${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`], 16, 'Esri'),
    street: raster([`${ESRI}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`], 18, 'Esri, HERE, Garmin, © OpenStreetMap contributors'),
    relief: raster([`${ESRI}/World_Physical_Map/MapServer/tile/{z}/{y}/{x}`], 8, 'Esri, US National Park Service'),
  },
  layers: RASTER_LAYERS.map(id => ({
    id, type: 'raster', source: id,
    layout: { visibility: 'none' },
    paint: id === 'relief' ? { 'raster-saturation': -0.25 } : {},
  })),
}

// The credit line under the map. Esri asks for "Powered by Esri" and the data
// providers to stay visible on the map; the Engraved view is drawn from
// public-domain Natural Earth data.
function mapCredit(viewId) {
  const view = MAP_VIEWS.find(v => v.id === viewId)
  if (!view || view.id === 'engraved') return 'Map drawn by Verbum from Natural Earth data (public domain)'
  return `Powered by Esri · ${MAP_STYLE.sources[view.layers[0]].attribution}`
}

function readView() {
  try {
    const v = localStorage.getItem(STYLE_KEY)
    return MAP_VIEWS.some(m => m.id === v) ? v : 'engraved'
  } catch { return 'engraved' }
}

function applyView(map, viewId) {
  const view = MAP_VIEWS.find(v => v.id === viewId) || MAP_VIEWS[0]
  ALL_VIEW_LAYERS.forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', view.layers.includes(id) ? 'visible' : 'none')
  })
  map.setMaxZoom(view.maxZoom)
}

const LINE_LAYERS = ['journey-line-glow', 'journey-line-edge', 'journey-line', 'journey-line-sketch']
const EMPTY_ROUTE = { type: 'FeatureCollection', features: [] }

// A small seeded random generator, so each journey always wobbles the same way.
function seeded(seedText) {
  let h = 2166136261
  for (const c of seedText) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

// The route is drawn as if by hand: each leg bows gently to one side and
// wavers a little, but always passes exactly through the stops. Positions are
// measured in Web Mercator units along this same path, so the pointer rides
// on the line it draws.
const POINTS_PER_LEG = 48

function buildRoute(journey) {
  const stops = journey.waypoints.map(w => maplibregl.MercatorCoordinate.fromLngLat([w.lng, w.lat]))
  const rand = seeded(journey.id)
  const path = [{ x: stops[0].x, y: stops[0].y }]
  const stopIndex = [0]
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1], b = stops[i]
    const dx = b.x - a.x, dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    const nx = len ? -dy / len : 0, ny = len ? dx / len : 0
    const bow = (rand() < 0.5 ? -1 : 1) * (0.05 + rand() * 0.06)
    const waves = [
      { amp: 0.012 + rand() * 0.01, freq: 2 + rand() * 2, phase: rand() * Math.PI * 2 },
      { amp: 0.0025 + rand() * 0.0025, freq: 5 + rand() * 3, phase: rand() * Math.PI * 2 },
    ]
    for (let k = 1; k <= POINTS_PER_LEG; k++) {
      const t = k / POINTS_PER_LEG
      const taper = Math.sin(Math.PI * t)
      let off = bow * taper
      for (const w of waves) off += w.amp * taper * Math.sin(w.freq * Math.PI * 2 * t + w.phase)
      path.push({ x: a.x + dx * t + nx * len * off, y: a.y + dy * t + ny * len * off })
    }
    stopIndex.push(path.length - 1)
  }
  const pathCum = [0]
  for (let i = 1; i < path.length; i++) {
    pathCum.push(pathCum[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y))
  }
  const toLngLat = (p) => {
    const ll = new maplibregl.MercatorCoordinate(p.x, p.y).toLngLat()
    return [ll.lng, ll.lat]
  }
  const pathLngLats = path.map(toLngLat)
  const cum = stopIndex.map(i => pathCum[i])

  const pointAt = (d) => {
    if (d <= 0) return pathLngLats[0]
    for (let i = 1; i < path.length; i++) {
      if (d <= pathCum[i]) {
        const seg = pathCum[i] - pathCum[i - 1]
        const t = seg ? (d - pathCum[i - 1]) / seg : 1
        return toLngLat({
          x: path[i - 1].x + (path[i].x - path[i - 1].x) * t,
          y: path[i - 1].y + (path[i].y - path[i - 1].y) * t,
        })
      }
    }
    return pathLngLats[pathLngLats.length - 1]
  }
  // The route travelled so far, ending at the pointer.
  const pathTo = (d) => {
    const coords = pathLngLats.filter((_, i) => pathCum[i] < d)
    coords.push(pointAt(d))
    return coords.length < 2 ? EMPTY_ROUTE : { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } }
  }
  return { cum, pointAt, pathTo }
}

function styleMarker(el, state) {
  const s = el.style
  s.display = state === 'ahead' ? 'none' : 'block'
  if (state === 'active') {
    Object.assign(s, {
      width: '20px', height: '20px', background: PAPER,
      border: `3px solid ${INK}`, boxShadow: `0 0 0 4px ${INK}26`, zIndex: '5',
    })
  } else {
    Object.assign(s, {
      width: '10px', height: '10px', background: INK,
      border: `2px solid ${PAPER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.3)', zIndex: '2',
    })
  }
}

export default function WorldMap({ book, chapter, onChapterChange, expanded, onToggleExpand, onOpenTimeline, onNavigate }) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const routeRef = useRef(null)
  const travelledRef = useRef(0)
  const animMarkerRef = useRef(null)
  const animFrameRef = useRef(null)
  const shownRef = useRef({ journeyId: null, index: null })
  const pickStopRef = useRef(() => {})
  const overlayRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [view, setView] = useState(readView)
  // A stop the reader picked directly. Several stops can share one chapter,
  // so the pick wins for as long as we stay on that journey and chapter.
  const [picked, setPicked] = useState(null)

  const journey = useMemo(() => getJourney(book, chapter), [book, chapter])

  const currentIndex = useMemo(() => {
    if (!journey) return 0
    if (picked && picked.journeyId === journey.id && picked.chapter === chapter) return picked.index
    let idx = 0
    journey.waypoints.forEach((w, i) => { if (w.chapter <= chapter) idx = i })
    return idx
  }, [journey, chapter, picked])

  const activeWaypoint = journey?.waypoints[currentIndex] || null

  // Draws the route up to distance d. Stops appear once the route reaches them,
  // and only `activeIdx` (when given) is shown as the current, labelled stop.
  const drawTravelled = useCallback((d, j, activeIdx = null) => {
    const map = mapRef.current
    const route = routeRef.current
    if (!map || !route) return
    travelledRef.current = d
    map.getSource('journey')?.setData(route.pathTo(d))
    markersRef.current.forEach(({ dot, label }, i) => {
      const reached = route.cum[i] <= d + 1e-12
      const state = i === activeIdx ? 'active' : reached ? 'visited' : 'ahead'
      styleMarker(dot.getElement(), state)
      // Only the current stop is labelled, so nearby names never pile up.
      label.getElement().style.visibility = i === activeIdx ? 'visible' : 'hidden'
    })
  }, [])

  const stopAnimation = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = null
    animMarkerRef.current?.remove()
    animMarkerRef.current = null
  }

  // Glides a glowing pointer from the current end of the route to stop
  // `toIdx`, drawing the line behind it. Going back rewinds the line.
  const travelTo = useCallback((toIdx, j) => {
    const map = mapRef.current
    const route = routeRef.current
    if (!map || !route) return
    stopAnimation()
    const from = travelledRef.current
    const to = route.cum[toIdx]
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (from === to || reduced) {
      drawTravelled(to, j, toIdx)
      return
    }

    const el = document.createElement('div')
    el.style.cssText = `
      width: 20px; height: 20px; border-radius: 50%; background: ${PAPER};
      border: 3px solid ${INK}; box-shadow: 0 0 0 4px ${INK}30;
      z-index: 10; pointer-events: none;
    `
    const ring = document.createElement('div')
    ring.style.cssText = `
      position: absolute; inset: -7px; border-radius: 50%;
      border: 2px solid ${INK}55; animation: verbumPulse 1.2s ease-out infinite;
    `
    el.appendChild(ring)
    animMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat(route.pointAt(from))
      .addTo(map)

    // Longer legs take a little longer, within reason.
    const stops = route.cum.filter(c => c > Math.min(from, to) && c <= Math.max(from, to)).length
    const duration = Math.min(2400 + (stops - 1) * 900, 6000)
    const startTime = performance.now()
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
      const d = from + (to - from) * eased
      animMarkerRef.current?.setLngLat(route.pointAt(d))
      if (progress < 1) {
        drawTravelled(d, j)
        animFrameRef.current = requestAnimationFrame(step)
      } else {
        stopAnimation()
        drawTravelled(to, j, toIdx)
      }
    }
    drawTravelled(from, j)
    animFrameRef.current = requestAnimationFrame(step)
  }, [drawTravelled])

  // ── Init map ──
  useEffect(() => {
    let map
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        ...HOME_VIEW,
        attributionControl: false,
        canvasContextAttributes: { antialias: true },
      })
    } catch (e) {
      console.error('WorldMap init failed', e)
      return
    }
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    // North stays up, so the survey grid and its degree marks stay square.
    map.dragRotate.disable()
    map.touchZoomRotate.disableRotation()
    map.on('styleimagemissing', (e) => engravedImage(map, e.id))
    map.on('load', () => {
      addEngraved(map)
      overlayRef.current = new EngravedOverlay(map, mapContainerRef.current.parentElement)
      setMapLoaded(true)
      map.resize()
    })
    // Follow the page between light and night mode.
    const retheme = () => { if (map.isStyleLoaded()) applyEngravedTheme(map) }
    const themeWatch = new MutationObserver(() => requestAnimationFrame(retheme))
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] })
    const scheme = window.matchMedia?.('(prefers-color-scheme: dark)')
    scheme?.addEventListener?.('change', retheme)
    map.on('error', (e) => console.warn('Map error:', e?.error?.message || e))
    mapRef.current = map

    // The panel resizes when it opens, closes or the window changes.
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(mapContainerRef.current)

    return () => {
      observer.disconnect()
      themeWatch.disconnect()
      scheme?.removeEventListener?.('change', retheme)
      overlayRef.current?.remove()
      overlayRef.current = null
      stopAnimation()
      markersRef.current.forEach(({ dot, label }) => { dot.remove(); label.remove() })
      markersRef.current = []
      map.remove()
      mapRef.current = null
      setMapLoaded(false)
    }
  }, [])

  // ── Set up (or clear) the route whenever the journey changes ──
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    stopAnimation()
    markersRef.current.forEach(({ dot, label }) => { dot.remove(); label.remove() })
    markersRef.current = []
    LINE_LAYERS.forEach(id => { if (map.getLayer(id)) map.removeLayer(id) })
    if (map.getSource('journey')) map.removeSource('journey')
    shownRef.current = { journeyId: journey?.id || null, index: null }
    routeRef.current = null
    travelledRef.current = 0

    if (!journey) {
      map.flyTo({ ...HOME_VIEW, duration: 2000, essential: true })
      return
    }

    routeRef.current = buildRoute(journey)
    map.addSource('journey', { type: 'geojson', data: EMPTY_ROUTE })
    // Ink-style layers: a soft glow, a dark edge, the colored stroke, and a
    // faint second pass beside it like a pen going over the line again.
    map.addLayer({
      id: 'journey-line-glow', type: 'line', source: 'journey',
      paint: { 'line-color': INK, 'line-width': 12, 'line-opacity': 0.1, 'line-blur': 8 },
    })
    map.addLayer({
      id: 'journey-line-edge', type: 'line', source: 'journey',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': PAPER, 'line-width': 5.5, 'line-opacity': 0.7, 'line-blur': 0.6 },
    })
    map.addLayer({
      id: 'journey-line', type: 'line', source: 'journey',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': INK, 'line-width': 2.6, 'line-opacity': 0.95, 'line-blur': 0.3 },
    })
    map.addLayer({
      id: 'journey-line-sketch', type: 'line', source: 'journey',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': INK_EDGE, 'line-width': 0.8, 'line-opacity': 0.45, 'line-offset': 2.2 },
    })

    journey.waypoints.forEach((wp, i) => {
      const el = document.createElement('div')
      el.setAttribute('role', 'button')
      el.tabIndex = 0
      el.title = wp.name
      el.setAttribute('aria-label', `Stop ${i + 1}: ${wp.name}`)
      el.style.cssText = `
        display: none; border-radius: 50%; cursor: pointer; transition: width 0.25s, height 0.25s, background 0.25s; padding: 0;
      `
      el.addEventListener('click', () => pickStopRef.current(i))
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') pickStopRef.current(i) })
      const dot = new maplibregl.Marker({ element: el }).setLngLat([wp.lng, wp.lat]).addTo(map)

      const labelEl = document.createElement('div')
      labelEl.className = 'map-label'
      labelEl.style.visibility = 'hidden'
      labelEl.append(document.createElement('b'), document.createElement('i'))
      labelEl.children[0].textContent = wp.name
      labelEl.children[1].textContent = wp.modern || ''
      const label = new maplibregl.Marker({ element: labelEl, anchor: 'bottom' }).setLngLat([wp.lng, wp.lat]).addTo(map)
      markersRef.current.push({ dot, label })
    })

    // Frame the whole journey, then follow the reader from stop to stop.
    const bounds = new maplibregl.LngLatBounds()
    journey.waypoints.forEach(w => bounds.extend([w.lng, w.lat]))
    map.fitBounds(bounds, { padding: 48, maxZoom: 7.5, duration: 1600 })
  }, [journey, mapLoaded])

  // ── Travel to the current stop ──
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded || !journey || !activeWaypoint || !routeRef.current) return
    const shown = shownRef.current
    if (shown.journeyId === journey.id && shown.index === currentIndex) return
    shownRef.current = { journeyId: journey.id, index: currentIndex }
    // Opening a journey traces it from the first stop to where the reader is.
    travelTo(currentIndex, journey)
    if (!map.getBounds().contains([activeWaypoint.lng, activeWaypoint.lat])) {
      map.easeTo({ center: [activeWaypoint.lng, activeWaypoint.lat], duration: 1800 })
    }
  }, [journey, currentIndex, activeWaypoint, mapLoaded, travelTo])

  // ── Switch the map view (engraved, terrain, satellite, street, antique) ──
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return
    applyView(map, view)
    overlayRef.current?.show(view === 'engraved')
    try { localStorage.setItem(STYLE_KEY, view) } catch { /* private mode */ }
  }, [view, mapLoaded])

  // Escape leaves the expanded view.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e) => { if (e.key === 'Escape') onToggleExpand?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded, onToggleExpand])

  const pickStop = (i) => {
    const w = journey.waypoints[i]
    setPicked({ journeyId: journey.id, chapter: w.chapter, index: i })
    if (w.chapter !== chapter) onChapterChange?.(w.chapter)
  }
  useEffect(() => { pickStopRef.current = pickStop })

  const total = journey?.waypoints.length || 0
  const pad = (n) => String(n).padStart(2, '0')

  return (
    <>
      <div className={`map-area has-credit view-${view}`}>
        <div ref={mapContainerRef} className="map-canvas" />
        <p key={view} className="map-credit" title={mapCredit(view)}>{mapCredit(view)}</p>
        <div className="map-views" role="radiogroup" aria-label="Map view">
          {MAP_VIEWS.map(v => (
            <button key={v.id} type="button" role="radio" aria-checked={view === v.id} onClick={() => setView(v.id)}>{v.label}</button>
          ))}
        </div>
      </div>

      {activeWaypoint && journey ? (
        <div className="stop" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={journey.id + currentIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE_OUT } }}
              exit={{ opacity: 0, y: -4, transition: { duration: 0.18, ease: EASE_IN } }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <div className="eyebrow">Stop {pad(currentIndex + 1)} / {pad(total)} · {journey.name}</div>
              <div className="stop-name">{activeWaypoint.name}</div>
              {activeWaypoint.modern && <div className="stop-modern">{activeWaypoint.modern} · chapter {activeWaypoint.chapter}</div>}
              <p className="stop-note">{activeWaypoint.note}</p>
            </motion.div>
          </AnimatePresence>
          <div className="stop-nav">
            <button className="round" type="button" onClick={() => pickStop(currentIndex - 1)} disabled={currentIndex === 0} aria-label="Previous stop"><IconPrev /></button>
            <div className="dots">
              {journey.waypoints.map((w, i) => (
                <button key={i} type="button" className="dot-hit" onClick={() => pickStop(i)}
                  aria-label={`Stop ${i + 1}: ${w.name}`} aria-current={i === currentIndex ? 'step' : undefined}><span className="dot" /></button>
              ))}
            </div>
            <button className="round" type="button" onClick={() => pickStop(currentIndex + 1)} disabled={currentIndex === total - 1} aria-label="Next stop"><IconNext /></button>
          </div>
          <TimeRibbon book={book} chapter={activeWaypoint.chapter} onOpen={onOpenTimeline} onVerse={onNavigate} />
          {activeWaypoint.theology && (
            <div className="stop-section page-in" key={`why-${journey.id}-${currentIndex}`}>
              <div className="eyebrow">Why it matters</div>
              <p>{activeWaypoint.theology}</p>
            </div>
          )}
          {activeWaypoint.scripture && <blockquote className="stop-quote page-in" key={`q-${journey.id}-${currentIndex}`}>{activeWaypoint.scripture}</blockquote>}
          {expanded && <section className="insights page-in" aria-label="Insights">More about {activeWaypoint.name} will appear here.</section>}
        </div>
      ) : (
        <div className="stop"><p className="empty-pane" style={{ padding: 0 }}>No journey is mapped for {book} {chapter}.</p></div>
      )}
    </>
  )
}
