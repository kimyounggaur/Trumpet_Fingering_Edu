import { NOTE_BY_MIDI } from './data.js';

export const DEGREE_OFFSET = Object.freeze([0, 2, 4, 5, 7, 9, 11, 12]);

export const OCTAVE_BASE = Object.freeze({
  low: 48,
  mid: 60,
  high: 72,
});

export const SHARPABLE = Object.freeze([
  true,
  true,
  false,
  true,
  true,
  true,
  false,
  true,
]);

const EMPTY_VALVES = Object.freeze([]);

/**
 * Resolve a scale degree in one of the three absolute octave contexts.
 * Returns null for invalid degrees, unsupported sharps, or pitches outside F♯3–C6.
 */
export function midiFor(degree, octave, sharpOn) {
  if (!Number.isInteger(degree) || degree < 1 || degree > 8) return null;
  if (!Object.hasOwn(OCTAVE_BASE, octave)) return null;
  if (sharpOn && !SHARPABLE[degree - 1]) return null;

  const midi = OCTAVE_BASE[octave]
    + DEGREE_OFFSET[degree - 1]
    + Number(sharpOn);

  return midi >= 54 && midi <= 84 ? midi : null;
}

/** Return the canonical Note object for a scale context, preserving object identity. */
export function noteFor(degree, octave, sharpOn) {
  const midi = midiFor(degree, octave, sharpOn);
  return midi === null ? null : NOTE_BY_MIDI.get(midi) ?? null;
}

/** Convert a valve set into the fixed valve-1/2/3 pose key used by the SVG rig. */
export function poseKey(valves) {
  if (!Array.isArray(valves)) return '000';

  return [1, 2, 3]
    .map((number) => (valves.includes(number) ? '1' : '0'))
    .join('');
}

/**
 * Resolve primary or alternate fingering without copying or mutating canonical data.
 * null means primary; an invalid alternate index safely falls back to primary.
 */
export function valvesForNote(note, selectedAlt = null) {
  if (!note) return EMPTY_VALVES;
  if (selectedAlt === null) return note.valves;
  return note.alts[selectedAlt] ?? note.valves;
}
