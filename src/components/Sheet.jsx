import { useEffect, useRef } from 'react'
import { IconClose } from './Icons'

// A modal sheet on the native <dialog>, so focus, Escape and the backdrop behave
// the same everywhere. `variant` is "" (centred), "top" or "drawer".
export default function Sheet({ open, onClose, title, label, variant = '', head, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} className={`sheet ${variant}`} aria-label={label || title}
      onClose={onClose} onCancel={(e) => { e.preventDefault(); onClose() }}
      onClick={(e) => { if (e.target === ref.current) onClose() }}>
      {open && (
        <>
          <div className="sheet-head">
            {head || <h2 className="sheet-title">{title}</h2>}
            <button className="close" type="button" onClick={onClose} aria-label={`Close ${label || title}`}><IconClose /></button>
          </div>
          {children}
        </>
      )}
    </dialog>
  )
}
