"""Build public/notes/<book>.json from plain-text chapter notes.

Usage: python3 scripts/build-notes.py <folder of .txt files>

Each .txt file is named after a book's slug (as in public/bible) and holds one
line per chapter:  <chapter> | <plain summary> || <deeper note>
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
counts = {b: int(n) for b, n in re.findall(r"'([^']+)':(\d+)", (ROOT / 'src/data/books.js').read_text())}
slugs = {b.lower().replace(' ', ''): b for b in counts}
out_dir = ROOT / 'public/notes'
out_dir.mkdir(exist_ok=True)

for path in sorted(pathlib.Path(sys.argv[1]).glob('*.txt')):
    book = slugs[path.stem]
    notes = {}
    lines = path.read_text().splitlines()
    # A file that begins "# sourced" has been checked fact by fact, with a
    # [[kind:ref]] marker after each claim (see src/lib/sources.js).
    if lines and lines[0].strip() == '# sourced':
        notes['_sourced'] = True
        lines = lines[1:]
    for line in lines:
        if not line.strip():
            continue
        for code in re.findall(r'\[\[([^\]]+)\]\]', line):
            if not re.fullmatch(r'(nabre|rsb|eob|bo|bible|ref|easton|tosn|bsn|tbd):\S.*', code):
                sys.exit(f'{path.name}: bad source marker [[{code}]]')
        num, rest = line.split('|', 1)
        simple, deeper = rest.split('||', 1)
        notes[str(int(num))] = {'s': simple.strip(), 'd': deeper.strip()}
    missing = [c for c in range(1, counts[book] + 1) if str(c) not in notes]
    if missing or len(notes) - ('_sourced' in notes) != counts[book]:
        sys.exit(f'{book}: missing chapters {missing}, found {len(notes)}')
    (out_dir / f'{path.stem}.json').write_text(json.dumps(notes, ensure_ascii=False, separators=(',', ':')))
    print(f'{book}: {counts[book]} chapters' + (' (sourced)' if '_sourced' in notes else ''))
