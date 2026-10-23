import Sheet from './Sheet'
import { PATHS } from '../data/paths'
import { usePaths } from '../lib/paths'

// Start here: choose a way into the Bible.
export default function PathsSheet({ open, onClose, onChoose }) {
  return (
    <Sheet open={open} onClose={onClose} title="Start here" label="Start here">
      <div className="sheet-body">
        <p className="sheet-lede">Where are you starting from? Pick a path; you can change it any time.</p>
        <PathList onChoose={onChoose} />
      </div>
    </Sheet>
  )
}

export function PathList({ onChoose }) {
  const { active, step } = usePaths()
  return (
    <div className="path-list">
      {PATHS.map(p => {
        const at = step[p.id] || 0
        const total = p.steps.length
        const started = at > 0
        const finished = at >= total
        return (
          <button key={p.id} type="button" className={`path-card${active === p.id ? ' is-active' : ''}`} onClick={() => onChoose(p.id, finished)}>
            <span className="path-title">{p.title}</span>
            <span className="path-who">{p.who}</span>
            <span className="path-blurb">{p.blurb}</span>
            <span className="path-meta">
              {finished ? `Finished · start again` : started ? `Continue · step ${at + 1} of ${total}` : `${total} chapters · begin with ${p.steps[0][0] === 'Psalms' ? 'Psalm' : p.steps[0][0]} ${p.steps[0][1]}`}
            </span>
          </button>
        )
      })}
    </div>
  )
}
