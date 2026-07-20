import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addHeldCode,
  ariaKeyShortcutsForDegree,
  clearHeldCodes,
  releaseHeldCode,
  resolveShortcut,
  shortcutContextFromEvent,
} from '../src/shortcuts.js';
import { createInitialState } from '../src/store.js';

function node(tagName = 'DIV', attributes = {}) {
  return {
    tagName,
    dataset: attributes.dataset ?? {},
    isContentEditable: Boolean(attributes.isContentEditable),
    getAttribute(name) {
      return attributes[name] ?? null;
    },
  };
}

function key(code, overrides = {}) {
  const target = overrides.target ?? node();
  const path = overrides.path ?? [target];
  return {
    code,
    key: overrides.key ?? '',
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    repeat: false,
    defaultPrevented: false,
    isComposing: false,
    keyCode: 0,
    cancelable: true,
    target,
    composedPath: () => path,
    getModifierState: (name) => name === 'AltGraph' && Boolean(overrides.altGraph),
    ...overrides,
  };
}

test('exact-one modifier contexts are resolved from event.code', () => {
  assert.deepEqual(shortcutContextFromEvent(key('Digit1')), {
    kind: 'current', modifier: 'none',
  });
  assert.deepEqual(shortcutContextFromEvent(key('Digit1', { ctrlKey: true })), {
    kind: 'middleNatural', modifier: 'control', octave: 'mid', sharpOn: false,
  });
  assert.deepEqual(shortcutContextFromEvent(key('Digit1', { shiftKey: true, key: '!' })), {
    kind: 'highNatural', modifier: 'shift', octave: 'high', sharpOn: false,
  });
  assert.deepEqual(shortcutContextFromEvent(key('Digit1', { altKey: true })), {
    kind: 'middleChromatic', modifier: 'alt', octave: 'mid', sharpOn: true,
  });
  assert.equal(shortcutContextFromEvent(key('Digit1', {
    ctrlKey: true, shiftKey: true,
  })), null);
});

test('24 modified digit contexts yield 22 commands, 2 disabled keys and 21 unique MIDI notes', () => {
  const state = createInitialState();
  const modifierSets = [
    { ctrlKey: true },
    { shiftKey: true },
    { altKey: true },
  ];
  const results = [];
  for (const modifiers of modifierSets) {
    for (let degree = 1; degree <= 8; degree += 1) {
      results.push(resolveShortcut(key(`Digit${degree}`, modifiers), state));
    }
  }

  const commands = results.filter((result) => result.status === 'command');
  const unavailable = results.filter((result) => result.status === 'unavailable');
  assert.equal(commands.length, 22);
  assert.equal(unavailable.length, 2);
  assert.equal(new Set(commands.map((result) => result.command.midi)).size, 21);
  assert.ok(unavailable.every((result) => result.reason === 'enharmonic-duplicate'));
  assert.ok(results.every((result) => result.preventDefault));
});

test('plain, Ctrl, Shift and Alt digits select the fixed intended contexts', () => {
  const state = createInitialState({ octave: 'high', sharpOn: false });
  assert.equal(resolveShortcut(key('Digit1'), state).command.midi, 72);
  assert.equal(resolveShortcut(key('Digit1', { ctrlKey: true }), state).command.midi, 60);
  assert.equal(resolveShortcut(key('Digit1', { shiftKey: true }), state).command.midi, 72);
  assert.equal(resolveShortcut(key('Digit1', { altKey: true }), state).command.midi, 61);
});

test('Meta, AltGraph, combined modifiers and Numpad are ignored without prevention', () => {
  const state = createInitialState();
  for (const event of [
    key('Digit1', { metaKey: true }),
    key('Digit1', { altGraph: true, ctrlKey: true, altKey: true }),
    key('Digit1', { ctrlKey: true, shiftKey: true }),
    key('Numpad1'),
  ]) {
    const result = resolveShortcut(event, state);
    assert.equal(result.status, 'ignored');
    assert.equal(result.recognized, false);
    assert.equal(result.preventDefault, false);
  }
});

test('editable, global-off, dialog, IME, hidden and default-prevented contexts are excluded', () => {
  const state = createInitialState();
  const cases = [
    [key('Digit1', { target: node('INPUT'), path: [node('INPUT')] }), {}],
    [key('Digit1', { path: [node('DIV', { role: 'textbox' })] }), {}],
    [key('Digit1', { path: [node('DIV', { 'data-global-shortcuts': 'off' })] }), {}],
    [key('Digit1'), { dialogOpen: true }],
    [key('Digit1', { isComposing: true }), {}],
    [key('Digit1'), { documentHidden: true }],
    [key('Digit1', { defaultPrevented: true }), {}],
  ];

  for (const [event, options] of cases) {
    const result = resolveShortcut(event, state, options);
    assert.equal(result.status, 'ignored');
    assert.equal(result.preventDefault, false);
  }
});

test('Space preserves native activation on interactive controls', () => {
  const state = createInitialState();
  const button = node('BUTTON');
  const result = resolveShortcut(key('Space', { target: button, path: [button] }), state);
  assert.equal(result.status, 'ignored');
  assert.equal(result.reason, 'native-space-activation');
  assert.equal(result.preventDefault, false);

  const pageResult = resolveShortcut(key('Space'), state);
  assert.equal(pageResult.status, 'command');
  assert.equal(pageResult.command.type, 'replay-audio');
});

test('Arrow, S, Space and R generate quiet or replay commands only without modifiers', () => {
  const state = createInitialState();
  const up = resolveShortcut(key('ArrowUp'), state);
  assert.deepEqual(up.command, {
    type: 'set-context',
    octave: 'high',
    sharpOn: false,
    source: 'keyboard',
    play: false,
  });
  assert.equal(resolveShortcut(key('ArrowDown'), state).command.octave, 'low');
  assert.equal(resolveShortcut(key('KeyS'), state).command.sharpOn, true);
  assert.equal(resolveShortcut(key('KeyR'), state).command.type, 'replay-motion');
  assert.equal(resolveShortcut(key('KeyR', { ctrlKey: true }), state).status, 'ignored');
});

test('number and valve quiz shortcut locks preserve answer-only inputs', () => {
  const numberState = createInitialState({
    mode: 'quiz-number',
    quiz: {
      targetDegree: 2,
      targetOctave: 'high',
      targetSharpOn: false,
    },
  });
  const answer = resolveShortcut(key('Digit2'), numberState);
  assert.equal(answer.status, 'command');
  assert.deepEqual(answer.command, {
    type: 'answer-degree', degree: 2, source: 'keyboard',
  });
  assert.equal(resolveShortcut(key('Digit2', { ctrlKey: true }), numberState).status, 'locked');
  assert.equal(resolveShortcut(key('ArrowUp'), numberState).status, 'locked');
  assert.equal(resolveShortcut(key('KeyR'), numberState).status, 'locked');

  const numberAtRangeEnd = createInitialState({
    mode: 'quiz-number',
    octave: 'high',
    quiz: { targetDegree: 1, targetOctave: 'high', targetSharpOn: false },
  });
  assert.equal(resolveShortcut(key('ArrowUp'), numberAtRangeEnd).status, 'locked');

  const valveState = createInitialState({ mode: 'quiz-valves' });
  assert.equal(resolveShortcut(key('Digit1'), valveState).status, 'locked');
  assert.equal(resolveShortcut(key('KeyS'), valveState).status, 'locked');
});

test('shortcuts-off, repeat and held-key policies have no side effects or prevention', () => {
  const off = createInitialState({ shortcutsOn: false });
  const disabled = resolveShortcut(key('Digit1'), off);
  assert.equal(disabled.status, 'ignored');
  assert.equal(disabled.reason, 'shortcuts-off');
  assert.equal(disabled.preventDefault, false);

  const state = createInitialState();
  const first = resolveShortcut(key('Digit1'), state);
  let held = addHeldCode(new Set(), first);
  assert.deepEqual([...held], ['Digit1']);
  assert.equal(resolveShortcut(key('Digit1'), state, { heldCodes: held }).reason,
    'repeat-or-held');
  assert.equal(resolveShortcut(key('Digit2', { repeat: true }), state).reason,
    'repeat-or-held');
  held = releaseHeldCode(held, 'Digit1');
  assert.equal(held.size, 0);
  assert.equal(clearHeldCodes().size, 0);
});

test('aria-keyshortcuts reflects only the active valid category', () => {
  assert.equal(ariaKeyShortcutsForDegree(1, createInitialState()), '1 Control+1');
  assert.equal(ariaKeyShortcutsForDegree(1, createInitialState({ octave: 'high' })),
    '1 Shift+1');
  assert.equal(ariaKeyShortcutsForDegree(3, createInitialState({ sharpOn: true })), null);
  assert.equal(ariaKeyShortcutsForDegree(1, createInitialState({ shortcutsOn: false })), null);
});
