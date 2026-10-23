"""Build public/engraved.json, the vector data behind the Engraved map view.

Usage: python3 scripts/build-engraved.py <folder with Natural Earth GeoJSON>

Needs (public domain, github.com/nvkelso/natural-earth-vector/tree/master/geojson):
  ne_10m_land.geojson, ne_10m_lakes.geojson, ne_10m_rivers_lake_centerlines.geojson
Needs the shapely package (pip install shapely).

Coastlines, lakes and rivers are clipped to the lands of the Bible, from Spain
to the Indus, and simplified. Mountain peaks are scattered along hand-traced
ranges, the way an engraver would draw them.
"""
import json
import math
import pathlib
import random
import sys

from shapely.geometry import box, mapping, shape, Point

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = pathlib.Path(sys.argv[1])
CLIP = box(-12, 4, 76, 50)
TOLERANCE = 0.008


def features(name, keep=lambda p: True, tolerance=TOLERANCE, props=lambda p: {}):
    out = []
    for f in json.loads((SRC / name).read_text())['features']:
        if not keep(f['properties']):
            continue
        g = shape(f['geometry'])
        if not g.intersects(CLIP):
            continue
        g = g.intersection(CLIP).simplify(tolerance, preserve_topology=True)
        if g.is_empty:
            continue
        out.append({'type': 'Feature', 'properties': props(f['properties']), 'geometry': rounded(mapping(g))})
    return {'type': 'FeatureCollection', 'features': out}


def rounded(geom):
    def r(c):
        if isinstance(c, (list, tuple)) and c and isinstance(c[0], (int, float)):
            return [round(c[0], 3), round(c[1], 3)]
        return [r(x) for x in c]
    if geom['type'] == 'GeometryCollection':
        return {'type': 'GeometryCollection', 'geometries': [rounded(g) for g in geom['geometries']]}
    return {'type': geom['type'], 'coordinates': r(geom['coordinates'])}


land = features('ne_10m_land.geojson')
lakes = features('ne_10m_lakes.geojson', keep=lambda p: (p.get('scalerank') or 0) <= 9, props=lambda p: {'name': p.get('name')})
rivers = features(
    'ne_10m_rivers_lake_centerlines.geojson',
    keep=lambda p: p.get('featurecla') != 'Lake Centerline' or p.get('name') in ('Jordan', 'Nile'),
    tolerance=0.004,
    props=lambda p: {'name': p.get('name'), 'rank': p.get('scalerank')},
)

# Mountain ranges as (lat, lng) lines. Peaks are dropped along them every
# `step` degrees with a little seeded jitter, larger in the middle of a range.
RANGES = {
    'taurus': [(36.6, 30.4), (37.0, 32.5), (37.3, 34.5), (37.9, 36.5), (38.2, 38.6), (38.3, 40.1), (38.4, 41.5), (38.3, 43.0)],
    'pontic': [(41.1, 33.0), (40.8, 36.0), (40.6, 39.0), (40.9, 41.5)],
    'ararat': [(39.9, 41.6), (39.4, 42.8), (39.7, 44.3)],
    'zagros': [(37.5, 44.4), (36.6, 45.2), (35.6, 45.9), (34.6, 46.6), (33.6, 47.3), (32.5, 48.4), (31.3, 49.8), (30.2, 51.5), (29.2, 53.0), (28.0, 55.0), (27.3, 57.0)],
    'caucasus': [(43.3, 40.2), (42.9, 43.0), (42.5, 45.2), (41.6, 47.6)],
    'elburz': [(36.5, 49.2), (35.9, 51.5), (36.3, 53.5), (36.9, 55.5)],
    'hindukush': [(34.6, 66.5), (35.2, 68.5), (35.8, 70.5), (36.3, 72.0)],
    'lebanon': [(34.5, 36.25), (33.9, 35.9), (33.4, 35.85)],
    'judea': [(32.6, 35.2), (32.2, 35.25), (31.8, 35.2), (31.4, 35.1)],
    'sinai': [(29.0, 33.8), (28.55, 33.97), (28.4, 34.2)],
    'seir': [(30.9, 35.6), (30.3, 35.5), (29.6, 35.4)],
    'hejaz': [(28.4, 35.4), (27.0, 36.6), (25.0, 38.0), (22.5, 39.6), (20.0, 41.3), (17.0, 43.3), (14.5, 44.0)],
    'redsea': [(27.6, 32.8), (26.0, 33.7), (24.0, 34.8), (22.0, 35.8)],
    'ethiopia': [(15.0, 38.6), (13.2, 38.2), (11.2, 39.5), (9.2, 38.7)],
    'pindus': [(40.9, 20.8), (39.8, 21.3), (38.7, 21.9), (37.6, 22.4)],
    'olympus': [(40.08, 22.35)],
    'haemus': [(42.8, 23.3), (42.7, 25.3), (42.7, 26.8)],
    'apennines': [(44.2, 10.2), (43.4, 12.4), (42.4, 13.4), (41.5, 14.5), (40.5, 15.8), (39.2, 16.4)],
    'alps': [(44.4, 6.9), (45.9, 7.3), (46.4, 9.0), (46.8, 11.0), (46.5, 13.2)],
    'atlas': [(31.0, -7.6), (32.5, -4.6), (34.0, 0.0), (35.4, 4.0), (36.3, 7.0)],
    'islands': [(34.93, 32.86), (35.2, 24.8), (37.75, 15.0)],
}

rand = random.Random(7)
peaks = []
for name, line in RANGES.items():
    pts = []
    if len(line) == 1:
        pts = [line[0]]
    else:
        for (a1, o1), (a2, o2) in zip(line, line[1:]):
            n = max(1, round(math.hypot(a2 - a1, o2 - o1) / 0.55))
            pts += [(a1 + (a2 - a1) * k / n, o1 + (o2 - o1) * k / n) for k in range(n)]
        pts.append(line[-1])
    for i, (lat, lng) in enumerate(pts):
        mid = 1 - abs(i / max(1, len(pts) - 1) - 0.5) * 2 if len(pts) > 1 else 1
        for _ in range(1 if rand.random() < 0.6 else 2):
            peaks.append({'type': 'Feature', 'properties': {'s': round(0.55 + 0.45 * mid + rand.random() * 0.25, 2)},
                          'geometry': {'type': 'Point', 'coordinates': [round(lng + rand.uniform(-0.25, 0.25), 3), round(lat + rand.uniform(-0.22, 0.22), 3)]}})

out = {
    'land': land,
    'lakes': lakes,
    'rivers': rivers,
    'peaks': {'type': 'FeatureCollection', 'features': peaks},
}
path = ROOT / 'public/engraved.json'
path.write_text(json.dumps(out, separators=(',', ':')))
print(f'{path}: {path.stat().st_size // 1024} KB, {len(land["features"])} land, {len(lakes["features"])} lakes, {len(rivers["features"])} rivers, {len(peaks)} peaks')
