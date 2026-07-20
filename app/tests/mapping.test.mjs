import assert from 'node:assert/strict';
import test from 'node:test';

import { NOTE_BY_MIDI, NOTES } from '../src/data.js';
import {
  DEGREE_OFFSET,
  OCTAVE_BASE,
  SHARPABLE,
  midiFor,
  noteFor,
  poseKey,
  valvesForNote,
} from '../src/mapping.js';

const OCTAVES = ['low', 'mid', 'high'];
const DEGREES = Array.from({ length: 8 }, (_, index) => index + 1);

test('mapping constants are frozen and equal to the design contract', () => {
  assert.deepEqual(DEGREE_OFFSET, [0, 2, 4, 5, 7, 9, 11, 12]);
  assert.deepEqual(OCTAVE_BASE, { low: 48, mid: 60, high: 72 });
  assert.deepEqual(SHARPABLE, [true, true, false, true, true, true, false, true]);
  assert.ok(Object.isFrozen(DEGREE_OFFSET));
  assert.ok(Object.isFrozen(OCTAVE_BASE));
  assert.ok(Object.isFrozen(SHARPABLE));
});

test('all 48 octave/degree/sharp contexts resolve to 35 valid, 13 inactive, 31 unique notes', () => {
  const contexts = OCTAVES.flatMap((octave) => (
    [false, true].flatMap((sharpOn) => (
      DEGREES.map((degree) => ({ degree, octave, sharpOn }))
    ))
  ));
  const resolved = contexts.map((context) => noteFor(
    context.degree,
    context.octave,
    context.sharpOn,
  ));
  const valid = resolved.filter(Boolean);

  assert.equal(contexts.length, 48);
  assert.equal(valid.length, 35);
  assert.equal(resolved.filter((note) => note === null).length, 13);
  assert.equal(new Set(valid.map(({ midi }) => midi)).size, 31);
  assert.deepEqual(
    [...new Set(valid.map(({ midi }) => midi))].sort((a, b) => a - b),
    NOTES.map(({ midi }) => midi),
  );

  for (const note of valid) {
    assert.strictEqual(note, NOTE_BY_MIDI.get(note.midi));
  }
});

test('24 shortcut contexts resolve to 22 valid, 2 inactive, 21 unique notes', () => {
  const shortcutContexts = [
    ...DEGREES.map((degree) => ({ modifier: 'Ctrl', degree, octave: 'mid', sharpOn: false })),
    ...DEGREES.map((degree) => ({ modifier: 'Shift', degree, octave: 'high', sharpOn: false })),
    ...DEGREES.map((degree) => ({ modifier: 'Alt', degree, octave: 'mid', sharpOn: true })),
  ];
  const resolved = shortcutContexts.map(({ degree, octave, sharpOn }) => (
    noteFor(degree, octave, sharpOn)
  ));
  const valid = resolved.filter(Boolean);

  assert.equal(shortcutContexts.length, 24);
  assert.equal(valid.length, 22);
  assert.equal(resolved.filter((note) => note === null).length, 2);
  assert.equal(new Set(valid.map(({ midi }) => midi)).size, 21);

  for (const [index, note] of resolved.entries()) {
    const { modifier, degree } = shortcutContexts[index];
    if (note === null) {
      assert.equal(modifier, 'Alt');
      assert.ok(degree === 3 || degree === 7);
    }
  }
});

test('Ctrl+8 and Shift+1 return the identical canonical C5 object', () => {
  const ctrl8 = noteFor(8, 'mid', false);
  const shift1 = noteFor(1, 'high', false);

  assert.strictEqual(ctrl8, shift1);
  assert.strictEqual(ctrl8, NOTE_BY_MIDI.get(72));
  assert.equal(ctrl8.name, 'C5');
});

test('midiFor rejects unsupported or out-of-range contexts without coercing degrees', () => {
  assert.equal(midiFor(4, 'low', true), 54);
  assert.equal(midiFor(8, 'high', false), 84);
  assert.equal(midiFor(8, 'high', true), null);
  assert.equal(midiFor(3, 'mid', true), null);
  assert.equal(midiFor(7, 'mid', true), null);
  assert.equal(midiFor(1, 'low', false), null);
  assert.equal(midiFor(0, 'mid', false), null);
  assert.equal(midiFor(9, 'mid', false), null);
  assert.equal(midiFor(1.5, 'mid', false), null);
  assert.equal(midiFor('1', 'mid', false), null);
  assert.equal(midiFor(1, 'unknown', false), null);
});

test('poseKey covers all eight valve poses and never mutates its input', () => {
  const cases = new Map([
    [[], '000'],
    [[1], '100'],
    [[2], '010'],
    [[3], '001'],
    [[1, 2], '110'],
    [[1, 3], '101'],
    [[2, 3], '011'],
    [[1, 2, 3], '111'],
  ]);

  for (const [valves, expected] of cases) {
    const before = [...valves];
    assert.equal(poseKey(valves), expected);
    assert.deepEqual(valves, before);
  }

  assert.equal(poseKey(null), '000');
});

test('valvesForNote resolves primary and alternate sets by canonical identity', () => {
  const e5 = NOTE_BY_MIDI.get(76);

  assert.strictEqual(valvesForNote(e5), e5.valves);
  assert.strictEqual(valvesForNote(e5, null), e5.valves);
  assert.strictEqual(valvesForNote(e5, 0), e5.alts[0]);
  assert.strictEqual(valvesForNote(e5, 1), e5.alts[1]);
  assert.strictEqual(valvesForNote(e5, 2), e5.valves);
  assert.deepEqual(valvesForNote(null), []);
  assert.equal(poseKey(valvesForNote(e5, 1)), '001');
});
