// Writes public/third-party-notices.txt: the full license of every package that
// ships inside the built app (production dependencies only). Run: npm run build:notices
const fs = require('fs'), path = require('path'), cp = require('child_process')
const dirs = [...new Set(cp.execSync('npm ls --omit=dev --all --parseable', { encoding: 'utf8' }).trim().split('\n').slice(1))].sort()
// Packages that ship no license file: what their own metadata or upstream says.
const NOTES = {
  '@mapbox/jsonlint-lines-primitives': 'MIT (no license file in the package; it is a fork of zaach/jsonlint, which is MIT licensed: https://github.com/zaach/jsonlint)',
  'murmurhash-js': 'MIT, as declared in its package.json. Copyright Gary Court and Austin Appleby (https://github.com/garycourt/murmurhash-js).',
}
const out = [], summary = []
for (const d of dirs) {
  const pkg = JSON.parse(fs.readFileSync(path.join(d, 'package.json'), 'utf8'))
  let lic = typeof pkg.license === 'string' ? pkg.license : (pkg.license?.type || (pkg.licenses || []).map(l => l.type || l).join(' OR ') || 'see package')
  const f = fs.readdirSync(d).find(n => /^(licen[cs]e|copying)(\.|$|-)/i.test(n))
  if (NOTES[pkg.name] && !f) lic = lic === 'see package' ? 'MIT' : lic
  const text = f ? fs.readFileSync(path.join(d, f), 'utf8').trim() : (NOTES[pkg.name] || `(No license file in the package. Declared license: ${lic}.)`)
  const key = `${pkg.name}@${pkg.version}`
  if (summary.some(s => s.startsWith(key + ' '))) continue
  summary.push(`${key}  ${lic}`)
  out.push(`${'='.repeat(72)}\n${key}\nLicense: ${lic}\n${pkg.homepage ? 'Homepage: ' + pkg.homepage + '\n' : ''}${'-'.repeat(72)}\n${text}\n`)
}
const head = `THIRD-PARTY SOFTWARE NOTICES FOR VERBUM\n\nVerbum includes the open-source packages below. Each one remains under its\nown license, reproduced in full here as those licenses require. These\nlicenses cover only the packages themselves, not Verbum's own code or text.\n\nSummary (${summary.length} packages):\n  ${summary.join('\n  ')}\n\n`
fs.writeFileSync('public/third-party-notices.txt', head + out.join('\n'))
console.log(summary.join('\n'))
