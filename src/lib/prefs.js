import { useSyncExternalStore } from 'react'

// Small remembered preferences. Storage can be unavailable (private windows),
// so every read and write is guarded and the app works without it.
export const storage = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)) } catch { return null } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable */ } },
}

// Light or dark: follows the system until the reader picks one.
const THEME_KEY = 'verbum-theme'
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null
let chosen = storage.get(THEME_KEY)
if (chosen) document.documentElement.dataset.theme = chosen
const themeListeners = new Set()
media?.addEventListener?.('change', () => themeListeners.forEach(l => l()))

const isDark = () => (chosen ? chosen === 'dark' : !!media?.matches)
export function useDarkTheme() {
  return useSyncExternalStore((l) => { themeListeners.add(l); return () => themeListeners.delete(l) }, isDark)
}
export function toggleTheme() {
  chosen = isDark() ? 'light' : 'dark'
  document.documentElement.dataset.theme = chosen
  storage.set(THEME_KEY, chosen)
  themeListeners.forEach(l => l())
}

// A short message at the bottom of the screen.
let toastState = { text: '', id: 0 }
const toastListeners = new Set()
let toastTimer
export function toast(text) {
  toastState = { text, id: toastState.id + 1 }
  toastListeners.forEach(l => l())
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastState = { ...toastState, text: '' }; toastListeners.forEach(l => l()) }, 2600)
}
export function useToast() {
  return useSyncExternalStore((l) => { toastListeners.add(l); return () => toastListeners.delete(l) }, () => toastState)
}

// Reading depth: "simple" (plain summary, key words) or "deeper" (notes, roots, outline).
const DEPTH_KEY = 'verbum-depth'
let depth = storage.get(DEPTH_KEY) === 'deeper' ? 'deeper' : 'simple'
const depthListeners = new Set()
export function useDepth() {
  return useSyncExternalStore((l) => { depthListeners.add(l); return () => depthListeners.delete(l) }, () => depth)
}
export function setDepth(next) {
  depth = next
  storage.set(DEPTH_KEY, next)
  depthListeners.forEach(l => l())
}
