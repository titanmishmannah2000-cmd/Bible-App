import { useSyncExternalStore } from 'react'
import { storage } from './prefs'
import { PATHS_BY_ID } from '../data/paths'

// The reader's Start here path: which one is active and how far along each is.
const KEY = 'verbum-paths'
let state = storage.get(KEY) || { active: null, step: {} }
const listeners = new Set()
const write = (next) => { state = next; storage.set(KEY, next); listeners.forEach(l => l()) }

export function usePaths() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => state)
}
export const activePath = () => (state.active ? PATHS_BY_ID[state.active] : null)
export const stepOf = (id) => state.step[id] || 0

export function startPath(id) { write({ ...state, active: id, step: { ...state.step, [id]: state.step[id] || 0 } }) }
export function setStep(id, i) { write({ ...state, active: id, step: { ...state.step, [id]: i } }) }
export function leavePath() { write({ ...state, active: null }) }
