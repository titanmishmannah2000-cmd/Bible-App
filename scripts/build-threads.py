"""Build public/threads/<book>.json from OpenBible.info cross-references (CC BY).

Input: xref/openbible.json, a JSON copy of OpenBible's cross_references data
(e.g. https://raw.githubusercontent.com/lggcs/crossrefviz/main/openbible.json).
Run from a folder containing xref/: python3 build-threads.py, then copy
xref/threads/*.json into public/threads/.

Per verse it keeps the 6 strongest Old Testament and 6 strongest New Testament
links (by votes), merging consecutive verses with equal votes into ranges:
{"chapter:verse": [[book index, chapter, first verse, last verse, votes], ...]}
"""
import json, re, os
X = 'xref/'
d = json.load(open(X + 'openbible.json'))
order = d['metadata']['book_order']
bidx = {b: i for i, b in enumerate(order)}
out_dir = X + 'threads/'; os.makedirs(out_dir, exist_ok=True)
def parse(r):
    m = re.match(r'^(.+) (\d+):(\d+)$', r); return m.group(1), int(m.group(2)), int(m.group(3))
per_book = {b: {} for b in order}
for src, refs in d['cross_references'].items():
    b0, c0, v0 = parse(src)
    refs = [(parse(r['to']), r['votes']) for r in refs if r['votes'] > 0]
    refs.sort(key=lambda x: (bidx[x[0][0]], x[0][1], x[0][2]))
    groups = []
    for (b, c, vv), votes in refs:
        g = groups[-1] if groups else None
        if g and g[0] == b and g[1] == c and g[3] == vv - 1 and g[4] == votes: g[3] = vv
        else: groups.append([b, c, vv, vv, votes])
    groups = [g for g in groups if not (g[0] == b0 and g[1] == c0 and g[2] <= v0 <= g[3])]
    ot = sorted([g for g in groups if bidx[g[0]] < 39], key=lambda g: -g[4])[:6]
    nt = sorted([g for g in groups if bidx[g[0]] >= 39], key=lambda g: -g[4])[:6]
    if ot or nt:
        per_book[b0][f'{c0}:{v0}'] = [[bidx[g[0]], g[1], g[2], g[3], g[4]] for g in sorted(ot + nt, key=lambda g: -g[4])]
total = 0
for b, m in per_book.items():
    name = 'psalms' if b == 'Psalm' else b.lower().replace(' ', '')
    s = json.dumps(m, separators=(',', ':'))
    open(out_dir + name + '.json', 'w').write(s); total += len(s)
print('books', len(per_book), 'bytes', total)
print(sorted(os.listdir(out_dir))[:5], len(os.listdir(out_dir)))
