// Text with small citation numbers, and the numbered Sources list they point to.
export function CitedText({ parts, idPrefix }) {
  return parts.map((p, i) => typeof p === 'string' ? p : (
    <sup key={i} className="cite">
      {p.n.map((n, k) => <a key={n} href={`#${idPrefix}-${n}`} onClick={(e) => { e.preventDefault(); document.getElementById(`${idPrefix}-${n}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }}>{k ? ',' : ''}{n}</a>)}
    </sup>
  ))
}

export function SourceList({ sources, idPrefix, onVerse, title = 'Sources' }) {
  if (!sources.length) return null
  return (
    <div className="sources">
      <span className="eyebrow">{title}</span>
      <ol>
        {sources.map((s, i) => (
          <li key={s.code} id={`${idPrefix}-${i + 1}`}>
            {s.verse ? (
              <button type="button" className="link-btn" onClick={() => onVerse?.(s.verse.book, s.verse.chapter, s.verse.verse)}>{s.title}</button>
            ) : (
              <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}{s.detail ? `, ${s.detail}` : ''}</a>
            )}
            <span className="muted"> · {s.by}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Unchecked() {
  return <p className="unchecked small">These notes have not yet been checked against published sources.</p>
}
