import maplibregl from 'maplibre-gl'

// The Engraved view: the lands of the Bible drawn like an old survey map on
// the page's own paper. Coastlines, lakes and rivers come from Natural Earth
// (public/engraved.json, built by scripts/build-engraved.py); everything is
// vector, so it stays sharp at every zoom and needs no map tiles.

const EMPTY = { type: 'FeatureCollection', features: [] }
const DATA_URL = `${import.meta.env.BASE_URL}engraved.json`
const GRID_STEP = 2

// Theme colors come from the page, so the map follows light and night mode.
function colors() {
  const css = getComputedStyle(document.documentElement)
  const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback
  return {
    land: v('--map-ground', '#ECE3CF'),
    sea: v('--map-sea', '#E2DAC4'),
    grid: v('--map-line', '#D9CCB0'),
    river: v('--map-river', '#7D93B9'),
    ink: v('--ink', '#1C1915'),
    soft: v('--ink-soft', '#5F574C'),
  }
}

function graticule() {
  const features = []
  for (let lng = -12; lng <= 76; lng += 1) {
    features.push({ type: 'Feature', properties: { major: lng % GRID_STEP === 0 }, geometry: { type: 'LineString', coordinates: [[lng, 0], [lng, 55]] } })
  }
  for (let lat = 0; lat <= 55; lat += 1) {
    features.push({ type: 'Feature', properties: { major: lat % GRID_STEP === 0 }, geometry: { type: 'LineString', coordinates: [[-12, lat], [76, lat]] } })
  }
  return { type: 'FeatureCollection', features }
}

export const ENGRAVED_SOURCES = {
  'eng-land': { type: 'geojson', data: EMPTY },
  'eng-lakes': { type: 'geojson', data: EMPTY },
  'eng-rivers': { type: 'geojson', data: EMPTY },
  'eng-peaks': { type: 'geojson', data: EMPTY },
  'eng-grid': { type: 'geojson', data: graticule() },
}

const hidden = { visibility: 'none' }
const zoomed = (...stops) => ['interpolate', ['linear'], ['zoom'], ...stops]

// Bottom to top. Water lines are drawn around the coast before the land is
// laid over them, so only their seaward half shows, as on engraved charts.
export const ENGRAVED_LAYER_DEFS = [
  { id: 'eng-sea', type: 'background', layout: hidden, paint: {} },
  { id: 'eng-water-3', type: 'line', source: 'eng-land', layout: hidden, paint: { 'line-width': 0.5, 'line-gap-width': zoomed(3, 10, 8, 22), 'line-opacity': 0.12 } },
  { id: 'eng-water-2', type: 'line', source: 'eng-land', layout: hidden, paint: { 'line-width': 0.55, 'line-gap-width': zoomed(3, 6, 8, 13), 'line-opacity': 0.22 } },
  { id: 'eng-water-1', type: 'line', source: 'eng-land', layout: hidden, paint: { 'line-width': 0.6, 'line-gap-width': zoomed(3, 2.5, 8, 5), 'line-opacity': 0.4 } },
  { id: 'eng-land', type: 'fill', source: 'eng-land', layout: hidden, paint: {} },
  { id: 'eng-grid-minor', type: 'line', source: 'eng-grid', minzoom: 6.5, filter: ['!', ['get', 'major']], layout: hidden, paint: { 'line-width': 0.6, 'line-opacity': 0.7 } },
  { id: 'eng-grid', type: 'line', source: 'eng-grid', filter: ['get', 'major'], layout: hidden, paint: { 'line-width': 1 } },
  { id: 'eng-coast', type: 'line', source: 'eng-land', layout: { ...hidden, 'line-join': 'round' }, paint: { 'line-width': zoomed(3, 0.7, 8, 1.2), 'line-opacity': 0.75 } },
  { id: 'eng-lakes', type: 'fill', source: 'eng-lakes', layout: hidden, paint: { 'fill-pattern': 'eng-hatch' } },
  { id: 'eng-lakes-edge', type: 'line', source: 'eng-lakes', layout: hidden, paint: { 'line-width': 0.9 } },
  { id: 'eng-rivers-minor', type: 'line', source: 'eng-rivers', minzoom: 6, filter: ['>', ['get', 'rank'], 6], layout: { ...hidden, 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-width': zoomed(6, 0.5, 10, 1.1), 'line-opacity': 0.75 } },
  { id: 'eng-rivers-echo', type: 'line', source: 'eng-rivers', filter: ['<=', ['get', 'rank'], 6], layout: { ...hidden, 'line-join': 'round' }, paint: { 'line-width': 0.6, 'line-offset': zoomed(3, 1.2, 9, 2), 'line-opacity': 0.45 } },
  { id: 'eng-rivers', type: 'line', source: 'eng-rivers', filter: ['<=', ['get', 'rank'], 6], layout: { ...hidden, 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-width': zoomed(3, 0.8, 6, 1.3, 10, 2.2) } },
  {
    id: 'eng-peaks', type: 'symbol', source: 'eng-peaks',
    layout: { ...hidden, 'icon-image': 'eng-peak', 'icon-size': zoomed(3, ['*', ['get', 's'], 0.45], 6, ['*', ['get', 's'], 0.68], 9, ['*', ['get', 's'], 0.95]), 'icon-padding': 0 },
    paint: { 'icon-opacity': 0.85 },
  },
]
export const ENGRAVED_LAYERS = ENGRAVED_LAYER_DEFS.map(l => l.id)

function paintFor(c) {
  return {
    'eng-sea': { 'background-color': c.sea },
    'eng-water-1': { 'line-color': c.river },
    'eng-water-2': { 'line-color': c.river },
    'eng-water-3': { 'line-color': c.river },
    'eng-land': { 'fill-color': c.land },
    'eng-grid': { 'line-color': c.grid },
    'eng-grid-minor': { 'line-color': c.grid },
    'eng-coast': { 'line-color': c.soft },
    'eng-lakes-edge': { 'line-color': c.river },
    'eng-rivers': { 'line-color': c.river },
    'eng-rivers-minor': { 'line-color': c.river },
    'eng-rivers-echo': { 'line-color': c.river },
  }
}

// Pattern and peak images are drawn on a canvas in the theme's colors.
function canvasImage(w, h, draw) {
  const ratio = 2
  const cv = document.createElement('canvas')
  cv.width = w * ratio; cv.height = h * ratio
  const g = cv.getContext('2d')
  g.scale(ratio, ratio)
  draw(g)
  return { image: g.getImageData(0, 0, cv.width, cv.height), ratio }
}

function hatch(c) {
  return canvasImage(6, 6, g => {
    g.strokeStyle = c.river; g.globalAlpha = 0.75; g.lineWidth = 0.7
    g.beginPath(); g.moveTo(-1, 7); g.lineTo(7, -1); g.moveTo(-1, 1); g.lineTo(1, -1); g.moveTo(5, 7); g.lineTo(7, 5); g.stroke()
  })
}

// A little engraved peak: a pen stroke up and down, with shading on the far side.
function peak(c) {
  return canvasImage(36, 26, g => {
    g.lineCap = 'round'; g.lineJoin = 'round'
    g.strokeStyle = c.soft; g.lineWidth = 1.7
    g.beginPath(); g.moveTo(3, 23); g.quadraticCurveTo(12, 12, 18, 3); g.quadraticCurveTo(24, 13, 33, 23); g.stroke()
    g.lineWidth = 0.9; g.globalAlpha = 0.6
    g.beginPath()
    for (let i = 0; i < 4; i++) { const x = 21 + i * 3; g.moveTo(x, 8 + i * 3.3); g.lineTo(x - 2.5, 22) }
    g.stroke()
  })
}

const IMAGES = { 'eng-hatch': hatch, 'eng-peak': peak }

export function engravedImage(map, id) {
  const make = IMAGES[id]
  if (!make || map.hasImage(id)) return
  const { image, ratio } = make(colors())
  map.addImage(id, image, { pixelRatio: ratio })
}

export function applyEngravedTheme(map) {
  const c = colors()
  Object.entries(paintFor(c)).forEach(([layer, paint]) => {
    if (!map.getLayer(layer)) return
    Object.entries(paint).forEach(([k, v]) => map.setPaintProperty(layer, k, v))
  })
  Object.entries(IMAGES).forEach(([id, make]) => {
    if (!map.hasImage(id)) return
    const { image } = make(c)
    map.updateImage(id, image)
  })
}

export function addEngraved(map) {
  Object.entries(ENGRAVED_SOURCES).forEach(([id, src]) => { if (!map.getSource(id)) map.addSource(id, src) })
  // The engraving sits under the raster views, which cover it when shown.
  const firstRaster = map.getStyle().layers[0]?.id
  ENGRAVED_LAYER_DEFS.forEach(def => { if (!map.getLayer(def.id)) map.addLayer(def, firstRaster) })
  applyEngravedTheme(map)
  fetch(DATA_URL)
    .then(r => { if (!r.ok) throw new Error(DATA_URL); return r.json() })
    .then(d => {
      if (!map.getSource('eng-land')) return
      map.getSource('eng-land').setData(d.land)
      map.getSource('eng-lakes').setData(d.lakes)
      map.getSource('eng-rivers').setData(d.rivers)
      map.getSource('eng-peaks').setData(d.peaks)
    })
    .catch(err => console.warn('Engraved map data failed to load', err))
}

// Names written on the map like an engraver's lettering: [text, lat, lng, kind, rotate, minZoom, maxZoom]
const PLACES = [
  ['The Great Sea', 34.0, 19.0, 'sea', 0, 0, 6.5],
  ['The Great Sea', 33.6, 31.5, 'sea', 0, 6.5, 9],
  ['Red Sea', 21.2, 38.3, 'sea', 56, 0, 9],
  ['Persian Gulf', 27.1, 51.4, 'sea', 32, 0, 9],
  ['Black Sea', 43.2, 34.5, 'sea', 0, 0, 9],
  ['Caspian Sea', 42.2, 50.6, 'sea', -70, 3.5, 9],
  ['Aegean Sea', 38.9, 25.0, 'sea', 0, 4.5, 9],
  ['Adriatic Sea', 42.9, 15.5, 'sea', 38, 4.5, 9],
  ['Dead Sea', 31.48, 35.75, 'sea-sm', 0, 7, 22],
  ['Sea of Galilee', 32.82, 35.82, 'sea-sm', 0, 7.5, 22],
  ['Nile', 26.4, 32.1, 'river', -80, 3.5, 9],
  ['Euphrates', 35.1, 39.95, 'river', 42, 4, 9],
  ['Tigris', 35.3, 43.6, 'river', 70, 4.5, 9],
  ['Jordan', 32.35, 35.66, 'river', 86, 6.5, 22],
  ['Taurus', 37.95, 33.6, 'range', 0, 4, 9],
  ['Zagros', 33.9, 47.6, 'range', 48, 4, 9],
  ['Lebanon', 34.15, 36.55, 'range', -62, 6.5, 22],
  ['Caucasus', 43.65, 43.2, 'range', 14, 4, 9],
  ['Egypt', 26.0, 29.6, 'region', 0, 3.5, 7.5],
  ['Arabia', 24.0, 44.0, 'region', 0, 3, 7.5],
  ['Mesopotamia', 34.3, 42.0, 'region', 0, 3.5, 6.5],
  ['Anatolia', 39.3, 33.0, 'region', 0, 3.5, 7],
  ['Persia', 31.8, 54.5, 'region', 0, 3, 7.5],
  ['Greece', 39.4, 21.7, 'region', 0, 4.5, 8],
  ['Italy', 42.2, 12.9, 'region', 36, 3.5, 7.5],
  ['Libya', 29.0, 18.0, 'region', 0, 3, 7.5],
  ['Sinai', 29.5, 33.7, 'region-sm', 0, 5.5, 9],
]

// Lettering and the degree scale along the edges, kept as page text so they
// use the book's own typefaces.
export class EngravedOverlay {
  constructor(map, container) {
    this.map = map
    this.on = false
    this.places = PLACES.map(([text, lat, lng, kind, rotate, minZoom, maxZoom]) => {
      const el = document.createElement('div')
      el.className = 'eng-place'
      const inner = document.createElement('span')
      inner.className = `eng-${kind}`
      inner.textContent = text
      if (rotate) inner.style.transform = `rotate(${rotate}deg)`
      el.appendChild(inner)
      el.style.display = 'none'
      const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map)
      return { el, marker, minZoom, maxZoom }
    })
    this.scale = document.createElement('div')
    this.scale.className = 'eng-scale'
    this.scale.hidden = true
    container.appendChild(this.scale)
    this.update = this.update.bind(this)
    map.on('move', this.update)
  }

  show(on) {
    this.on = on
    this.scale.hidden = !on
    this.update()
  }

  update() {
    const z = this.map.getZoom()
    this.places.forEach(p => { p.el.style.display = this.on && z >= p.minZoom && z < p.maxZoom ? 'block' : 'none' })
    if (!this.on) return
    const b = this.map.getBounds()
    const step = z >= 6.5 ? 1 : GRID_STEP
    const { clientWidth: w, clientHeight: h } = this.map.getContainer()
    const marks = []
    for (let lat = Math.ceil(b.getSouth() / step) * step; lat <= b.getNorth(); lat += step) {
      const y = this.map.project([b.getCenter().lng, lat]).y
      if (y > 14 && y < h - 20) marks.push(`<span style="left:6px;top:${(y - 15).toFixed(0)}px">${lat}°N</span>`)
    }
    for (let lng = Math.ceil(b.getWest() / step) * step; lng <= b.getEast(); lng += step) {
      const x = this.map.project([lng, b.getCenter().lat]).x
      if (x > 40 && x < w - 30) marks.push(`<span style="left:${(x + 4).toFixed(0)}px;bottom:4px">${Math.abs(lng)}°${lng < 0 ? 'W' : 'E'}</span>`)
    }
    this.scale.innerHTML = marks.join('')
  }

  remove() {
    this.map.off('move', this.update)
    this.places.forEach(p => p.marker.remove())
    this.scale.remove()
  }
}
