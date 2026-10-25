import { useReducedMotion } from 'framer-motion'

// One motion language for the whole app: things arrive with a long, soft
// ease-out and leave a little faster with an ease-in, like a page settling
// and lifting. The same curves are in index.css as --ease-out and --ease-in.
export const EASE_OUT = [0.22, 1, 0.36, 1]
export const EASE_IN = [0.55, 0, 0.75, 0.25]
export const EASE_IN_OUT = [0.65, 0, 0.35, 1]

export const narrowScreen = () => window.matchMedia('(max-width: 900px)').matches

// Transitions for an element that fades and drifts in, then out. With reduced
// motion it simply appears and disappears.
export function useFade({ y = 6, x = 0, enter = 0.38, leave = 0.2 } = {}) {
  const reduced = useReducedMotion()
  if (reduced) return { initial: false, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0 } } }
  return {
    initial: { opacity: 0, x, y },
    animate: { opacity: 1, x: 0, y: 0, transition: { duration: enter, ease: EASE_OUT } },
    exit: { opacity: 0, x: x / 2, y: y / 2, transition: { duration: leave, ease: EASE_IN } },
  }
}

// Opens like a drawer: height from nothing, then the content fades in.
export function useUnfold({ enter = 0.42, leave = 0.26 } = {}) {
  const reduced = useReducedMotion()
  if (reduced) return { initial: false, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0, transition: { duration: 0 } } }
  return {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto', transition: { height: { duration: enter, ease: EASE_OUT }, opacity: { duration: enter * 0.8, delay: enter * 0.25, ease: EASE_OUT } } },
    exit: { opacity: 0, height: 0, transition: { height: { duration: leave, ease: EASE_IN_OUT }, opacity: { duration: leave * 0.6, ease: EASE_IN } } },
  }
}
