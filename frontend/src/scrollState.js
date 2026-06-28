// ═══════════════════════════════════════════════════════════════
// SCROLL STATE — shared singleton (no React re-renders)
// Reads: progress (0..1), velocity (smoothed, can be negative),
// and the active section index. Updated by the Lenis raf loop.
// ═══════════════════════════════════════════════════════════════

export const scrollState = {
  progress: 0,      // 0..1 across whole document
  velocity: 0,      // smoothed px/frame (sign = direction)
  rawVelocity: 0,   // instantaneous for glitch trigger
  activeSection: 0, // index into SECTIONS
  sectionProgress: 0, // 0..1 within current section
  scrollY: 0,
}

// subscribers for active-section changes (used by MissionRail)
const sectionListeners = new Set()
export function onSectionChange(fn) {
  sectionListeners.add(fn)
  return () => sectionListeners.delete(fn)
}
export function emitSectionChange(i) {
  scrollState.activeSection = i
  sectionListeners.forEach(fn => fn(i))
}

// list of section ids, top-to-bottom — must match DOM order in App.jsx
export const SECTION_IDS = [
  'hero', 'experience', 'projects', 'skills', 'education', 'achievements',
]
