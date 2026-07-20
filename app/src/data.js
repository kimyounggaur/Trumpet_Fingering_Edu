/**
 * Canonical written-pitch trumpet fingering data.
 *
 * Source of truth: ../../output/trumpet-fingering-chart-hand.html
 * Keep every field and spelling byte-for-byte equivalent to the source data.
 */

function deepFreeze(value) {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  for (const child of Object.values(value)) {
    deepFreeze(child);
  }

  return Object.freeze(value);
}

export const NOTES = deepFreeze([
  { midi: 54, name: 'F♯3', enh: 'G♭3', solfege: '파♯ / 솔♭', valves: [1, 2, 3], alts: [], concert: 'E3' },
  { midi: 55, name: 'G3', enh: null, solfege: '솔', valves: [1, 3], alts: [], concert: 'F3' },
  { midi: 56, name: 'G♯3', enh: 'A♭3', solfege: '솔♯ / 라♭', valves: [2, 3], alts: [], concert: 'G♭3' },
  { midi: 57, name: 'A3', enh: null, solfege: '라', valves: [1, 2], alts: [[3]], concert: 'G3' },
  { midi: 58, name: 'A♯3', enh: 'B♭3', solfege: '라♯ / 시♭', valves: [1], alts: [], concert: 'A♭3' },
  { midi: 59, name: 'B3', enh: null, solfege: '시', valves: [2], alts: [], concert: 'A3' },
  { midi: 60, name: 'C4', enh: null, solfege: '도', valves: [], alts: [], concert: 'B♭3' },
  { midi: 61, name: 'C♯4', enh: 'D♭4', solfege: '도♯ / 레♭', valves: [1, 2, 3], alts: [], concert: 'B3' },
  { midi: 62, name: 'D4', enh: null, solfege: '레', valves: [1, 3], alts: [], concert: 'C4' },
  { midi: 63, name: 'D♯4', enh: 'E♭4', solfege: '레♯ / 미♭', valves: [2, 3], alts: [], concert: 'D♭4' },
  { midi: 64, name: 'E4', enh: null, solfege: '미', valves: [1, 2], alts: [[3]], concert: 'D4' },
  { midi: 65, name: 'F4', enh: null, solfege: '파', valves: [1], alts: [], concert: 'E♭4' },
  { midi: 66, name: 'F♯4', enh: 'G♭4', solfege: '파♯ / 솔♭', valves: [2], alts: [], concert: 'E4' },
  { midi: 67, name: 'G4', enh: null, solfege: '솔', valves: [], alts: [[1, 3]], concert: 'F4' },
  { midi: 68, name: 'G♯4', enh: 'A♭4', solfege: '솔♯ / 라♭', valves: [2, 3], alts: [], concert: 'G♭4' },
  { midi: 69, name: 'A4', enh: null, solfege: '라', valves: [1, 2], alts: [[3]], concert: 'G4' },
  { midi: 70, name: 'A♯4', enh: 'B♭4', solfege: '라♯ / 시♭', valves: [1], alts: [], concert: 'A♭4' },
  { midi: 71, name: 'B4', enh: null, solfege: '시', valves: [2], alts: [], concert: 'A4' },
  { midi: 72, name: 'C5', enh: null, solfege: '도', valves: [], alts: [[2, 3]], concert: 'B♭4' },
  { midi: 73, name: 'C♯5', enh: 'D♭5', solfege: '도♯ / 레♭', valves: [1, 2], alts: [], concert: 'B4' },
  { midi: 74, name: 'D5', enh: null, solfege: '레', valves: [1], alts: [[1, 3]], concert: 'C5' },
  { midi: 75, name: 'D♯5', enh: 'E♭5', solfege: '레♯ / 미♭', valves: [2], alts: [[2, 3]], concert: 'D♭5' },
  { midi: 76, name: 'E5', enh: null, solfege: '미', valves: [], alts: [[1, 2], [3]], concert: 'D5' },
  { midi: 77, name: 'F5', enh: null, solfege: '파', valves: [1], alts: [], concert: 'E♭5' },
  { midi: 78, name: 'F♯5', enh: 'G♭5', solfege: '파♯ / 솔♭', valves: [2], alts: [], concert: 'E5' },
  { midi: 79, name: 'G5', enh: null, solfege: '솔', valves: [], alts: [[1, 3]], concert: 'F5' },
  { midi: 80, name: 'G♯5', enh: 'A♭5', solfege: '솔♯ / 라♭', valves: [2, 3], alts: [], concert: 'G♭5' },
  { midi: 81, name: 'A5', enh: null, solfege: '라', valves: [1, 2], alts: [[3]], concert: 'G5' },
  { midi: 82, name: 'A♯5', enh: 'B♭5', solfege: '라♯ / 시♭', valves: [1], alts: [], concert: 'A♭5' },
  { midi: 83, name: 'B5', enh: null, solfege: '시', valves: [2], alts: [], concert: 'A5' },
  { midi: 84, name: 'C6', enh: null, solfege: '도', valves: [], alts: [], concert: 'B♭5' },
]);

/**
 * MIDI lookup whose values are the exact frozen objects held by NOTES.
 * Consumers must treat the map itself as read-only.
 */
export const NOTE_BY_MIDI = new Map(NOTES.map((note) => [note.midi, note]));

export const EXPECTED_PRIMARY_POSE_BY_MIDI = Object.freeze({
  54: '111', 55: '101', 56: '011', 57: '110', 58: '100', 59: '010',
  60: '000', 61: '111', 62: '101', 63: '011', 64: '110', 65: '100',
  66: '010', 67: '000', 68: '011', 69: '110', 70: '100', 71: '010',
  72: '000', 73: '110', 74: '100', 75: '010', 76: '000', 77: '100',
  78: '010', 79: '000', 80: '011', 81: '110', 82: '100', 83: '010',
  84: '000',
});
