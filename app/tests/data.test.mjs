import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  EXPECTED_PRIMARY_POSE_BY_MIDI,
  NOTE_BY_MIDI,
  NOTES,
} from '../src/data.js';
import { poseKey } from '../src/mapping.js';

const NOTE_FIELDS = ['midi', 'name', 'enh', 'solfege', 'valves', 'alts', 'concert'];
const CANONICAL_HTML = new URL('../../output/trumpet-fingering-chart-hand.html', import.meta.url);

async function canonicalNotes() {
  const html = await readFile(CANONICAL_HTML, 'utf8');
  const match = html.match(/const NOTES=(\[[\s\S]*?\]);/);
  assert.ok(match, 'canonical HTML must contain a JSON-compatible const NOTES array');
  return JSON.parse(match[1]);
}

function projectFields(notes) {
  return notes.map((note) => Object.fromEntries(
    NOTE_FIELDS.map((key) => [key, note[key]]),
  ));
}

function assertValveSet(valves) {
  assert.ok(Array.isArray(valves));
  assert.deepEqual(valves, [...new Set(valves)].sort((a, b) => a - b));
  assert.ok(valves.every((valve) => [1, 2, 3].includes(valve)));
}

test('NOTES is exactly equal to all canonical fields and spellings', async () => {
  const canonical = await canonicalNotes();

  assert.deepEqual(projectFields(NOTES), projectFields(canonical));
  assert.ok(NOTES.every((note) => (
    Object.keys(note).length === NOTE_FIELDS.length
      && NOTE_FIELDS.every((key) => Object.hasOwn(note, key))
  )));
});

test('NOTES covers 31 unique consecutive MIDI pitches from 54 through 84', () => {
  const expectedMidi = Array.from({ length: 31 }, (_, index) => 54 + index);

  assert.equal(NOTES.length, 31);
  assert.deepEqual(NOTES.map(({ midi }) => midi), expectedMidi);
  assert.equal(new Set(NOTES.map(({ midi }) => midi)).size, 31);
  assert.equal(NOTE_BY_MIDI.size, 31);

  for (const note of NOTES) {
    assert.strictEqual(NOTE_BY_MIDI.get(note.midi), note);
  }
});

test('alternate fingerings are the corrected 10 notes and 11 combinations', () => {
  assert.equal(NOTES.filter(({ alts }) => alts.length > 0).length, 10);
  assert.equal(NOTES.reduce((count, { alts }) => count + alts.length, 0), 11);
  assert.deepEqual(NOTE_BY_MIDI.get(62).alts, [], 'D4 must not regain alternate valve 3');
  assert.deepEqual(NOTE_BY_MIDI.get(78).alts, [], 'F♯5 must not regain alternate valves 1-3');
});

test('all primary and alternate valve sets are sorted, unique, and in range', () => {
  for (const note of NOTES) {
    assertValveSet(note.valves);
    for (const alternate of note.alts) assertValveSet(alternate);
  }
});

test('all 31 primary fingerings match the fixed pose regression oracle', () => {
  assert.equal(Object.keys(EXPECTED_PRIMARY_POSE_BY_MIDI).length, 31);

  for (const note of NOTES) {
    assert.equal(
      poseKey(note.valves),
      EXPECTED_PRIMARY_POSE_BY_MIDI[note.midi],
      `unexpected primary pose for ${note.name}`,
    );
  }
});

test('NOTES and every nested canonical value are deeply frozen', () => {
  assert.ok(Object.isFrozen(NOTES));

  for (const note of NOTES) {
    assert.ok(Object.isFrozen(note));
    assert.ok(Object.isFrozen(note.valves));
    assert.ok(Object.isFrozen(note.alts));
    assert.ok(note.alts.every(Object.isFrozen));
  }

  const before = JSON.stringify(NOTES);
  assert.throws(() => NOTES.push({}), TypeError);
  assert.throws(() => NOTES[0].valves.push(1), TypeError);
  assert.throws(() => {
    NOTES[0].name = 'mutated';
  }, TypeError);
  assert.equal(JSON.stringify(NOTES), before);
});
