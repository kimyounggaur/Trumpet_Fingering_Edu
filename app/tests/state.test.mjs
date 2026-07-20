import test from 'node:test';
import assert from 'node:assert/strict';

import {
  activeValves,
  createInitialState,
  createStore,
  currentNote,
  deriveCategory,
  derivePresentation,
  deriveState,
  reducer,
  resolveSelection,
} from '../src/store.js';
import { AudioController, midiToHz, playbackMidi } from '../src/audio.js';

test('initial state is silent-ready written C4 with the open pose', () => {
  const state = createInitialState();
  assert.equal(state.mode, 'learn');
  assert.equal(state.octave, 'mid');
  assert.equal(state.sharpOn, false);
  assert.equal(state.selectedDegree, 1);
  assert.equal(state.currentMidi, 60);
  assert.equal(state.selectedAlt, null);
  assert.equal(currentNote(state).name, 'C4');
  assert.deepEqual(activeValves(state), []);
  assert.deepEqual(deriveState(state), {
    category: 'middleNatural',
    categoryLabel: '낮은 계이름 C4–C5',
    currentNote: currentNote(state),
    activeValves: [],
    poseKey: '000',
  });
});

test('selection resolution validates before one atomic store commit', () => {
  const store = createStore();
  const notifications = [];
  store.subscribe((next, previous, action) => notifications.push({ next, previous, action }));

  const resolved = resolveSelection({
    degree: 2,
    octave: 'mid',
    sharpOn: false,
    source: 'pointer',
  });
  assert.equal(resolved.ok, true);
  assert.equal(resolved.note.name, 'D4');
  store.dispatch(resolved.action);

  const state = store.getState();
  assert.equal(notifications.length, 1);
  assert.equal(state.selectedDegree, 2);
  assert.equal(state.currentMidi, 62);
  assert.equal(state.selectedAlt, null);
  assert.equal(state.lastInputSource, 'pointer');
  assert.deepEqual(state.learnSnapshot, {
    degree: 2,
    octave: 'mid',
    sharpOn: false,
  });

  const invalid = resolveSelection({ degree: 3, octave: 'mid', sharpOn: true });
  assert.deepEqual(invalid, { ok: false, reason: 'unavailable' });
  assert.equal(notifications.length, 1);
});

test('context changes reinterpret quietly and invalid contexts clear selection', () => {
  const initial = createInitialState();
  const high = reducer(initial, {
    type: 'SET_CONTEXT',
    payload: { octave: 'high', sharpOn: false, source: 'keyboard' },
  });
  assert.equal(high.currentMidi, 72);
  assert.equal(high.selectedDegree, 1);
  assert.equal(high.selectedAlt, null);
  assert.equal(deriveCategory(high), 'highNatural');

  const low = reducer(initial, {
    type: 'SET_CONTEXT',
    payload: { octave: 'low', sharpOn: false, source: 'keyboard' },
  });
  assert.equal(low.currentMidi, null);
  assert.equal(low.selectedDegree, 1);
  assert.equal(low.selectedAlt, null);
  assert.equal(deriveState(low).poseKey, '000');
});

test('alternate fingering changes only valves and every pitch change resets it', () => {
  let state = reducer(createInitialState(), {
    type: 'COMMIT_SELECTION',
    payload: {
      degree: 3,
      octave: 'mid',
      sharpOn: false,
      source: 'screen',
    },
  });
  assert.equal(currentNote(state).name, 'E4');
  assert.deepEqual(activeValves(state), [1, 2]);

  state = reducer(state, { type: 'SELECT_ALTERNATE', payload: { index: 0 } });
  assert.equal(state.selectedAlt, 0);
  assert.deepEqual(activeValves(state), [3]);

  state = reducer(state, {
    type: 'COMMIT_SELECTION',
    payload: {
      degree: 4,
      octave: 'mid',
      sharpOn: false,
      source: 'screen',
    },
  });
  assert.equal(currentNote(state).name, 'F4');
  assert.equal(state.selectedAlt, null);
  assert.deepEqual(activeValves(state), [1]);
});

test('returning to learn restores the last valid manual learn snapshot', () => {
  let state = reducer(createInitialState(), {
    type: 'COMMIT_SELECTION',
    payload: {
      degree: 2,
      octave: 'mid',
      sharpOn: false,
      source: 'keyboard',
    },
  });
  state = reducer(state, {
    type: 'SET_MODE',
    payload: { mode: 'scale', sessionOctave: 'high' },
  });
  state = reducer(state, {
    type: 'COMMIT_SELECTION',
    payload: {
      degree: 5,
      octave: 'high',
      sharpOn: false,
      source: 'keyboard',
    },
  });
  assert.equal(state.currentMidi, 79);

  state = reducer(state, { type: 'SET_MODE', payload: { mode: 'learn' } });
  assert.equal(state.currentMidi, 62);
  assert.equal(state.selectedDegree, 2);
  assert.deepEqual(state.learnSnapshot, {
    degree: 2,
    octave: 'mid',
    sharpOn: false,
  });
});

test('number quiz presentation omits answer degree, solfege, fingering and pose until reveal', () => {
  let state = reducer(createInitialState(), {
    type: 'START_QUIZ_SESSION',
    payload: {
      mode: 'quiz-number',
      questionType: 'staff',
      targetDegree: 2,
      targetOctave: 'mid',
      targetSharpOn: false,
    },
  });
  assert.equal(state.currentMidi, null);

  let presentation = derivePresentation(state);
  assert.equal(presentation.phase, 'answering');
  assert.equal(presentation.showDegree, false);
  assert.equal(presentation.showSolfege, false);
  assert.equal(presentation.showFingering, false);
  assert.equal(presentation.showTargetPose, false);
  assert.equal(Object.hasOwn(presentation, 'degree'), false);
  assert.equal(Object.hasOwn(presentation, 'solfege'), false);
  assert.equal(Object.hasOwn(presentation, 'fingering'), false);
  assert.equal(Object.hasOwn(presentation, 'pose'), false);
  assert.equal(JSON.stringify(presentation).includes('1,3'), false);

  state = reducer(state, { type: 'ANSWER_NUMBER', payload: { degree: 1 } });
  assert.equal(state.quiz.feedbackPhase, 'answering');
  presentation = derivePresentation(state);
  assert.equal(Object.hasOwn(presentation, 'degree'), false);

  state = reducer(state, { type: 'ANSWER_NUMBER', payload: { degree: 2 } });
  presentation = derivePresentation(state);
  assert.equal(state.quiz.feedbackPhase, 'revealed');
  assert.equal(presentation.degree, 2);
  assert.equal(presentation.solfege, '레');
  assert.deepEqual(presentation.fingering, [1, 3]);
  assert.equal(presentation.pose, '101');
  assert.equal(state.quiz.answeredCount, 1);
  assert.equal(state.quiz.firstTryCorrectCount, 0);
});

test('valve quiz renders only candidate valves while answering', () => {
  let state = reducer(createInitialState(), {
    type: 'START_QUIZ_SESSION',
    payload: {
      mode: 'quiz-valves',
      targetDegree: 3,
      targetOctave: 'mid',
      targetSharpOn: false,
    },
  });
  state = reducer(state, { type: 'TOGGLE_QUIZ_VALVE', payload: { valve: 3 } });

  let presentation = derivePresentation(state);
  assert.deepEqual(presentation.candidateValves, [3]);
  assert.equal(presentation.showFingering, false);
  assert.equal(presentation.showTargetPose, false);
  assert.equal(Object.hasOwn(presentation, 'fingering'), false);
  assert.equal(Object.hasOwn(presentation, 'pose'), false);

  state = reducer(state, { type: 'SUBMIT_VALVE_ANSWER' });
  assert.equal(state.quiz.feedbackPhase, 'answering');
  assert.deepEqual(state.quiz.inputValves, [3]);

  state = reducer(state, { type: 'TOGGLE_QUIZ_VALVE', payload: { valve: 3 } });
  state = reducer(state, { type: 'TOGGLE_QUIZ_VALVE', payload: { valve: 1 } });
  state = reducer(state, { type: 'TOGGLE_QUIZ_VALVE', payload: { valve: 2 } });
  state = reducer(state, { type: 'SUBMIT_VALVE_ANSWER' });
  presentation = derivePresentation(state);
  assert.equal(state.quiz.feedbackPhase, 'revealed');
  assert.deepEqual(presentation.fingering, [1, 2]);
});

test('store suppresses notifications for reducer no-ops', () => {
  const store = createStore();
  let calls = 0;
  store.subscribe(() => { calls += 1; });
  store.dispatch({ type: 'UNKNOWN' });
  store.dispatch({
    type: 'COMMIT_SELECTION',
    payload: { degree: 3, octave: 'mid', sharpOn: true, source: 'keyboard' },
  });
  assert.equal(calls, 0);
});

test('audio pitch helpers preserve written pitch and lower concert playback by two semitones', () => {
  assert.equal(playbackMidi(60, 'written'), 60);
  assert.equal(playbackMidi(60, 'concert'), 58);
  assert.equal(midiToHz(69), 440);
  assert.ok(Math.abs(midiToHz(60) - 261.625565) < 0.00001);
});

test('AudioController is lazy and reuses one two-oscillator voice', async () => {
  const audioParam = (initial = 0) => ({
    value: initial,
    cancelScheduledValues() {},
    setValueAtTime(value) { this.value = value; },
    linearRampToValueAtTime(value) { this.value = value; },
  });
  const node = () => ({ connect() {}, disconnect() {} });
  let oscillatorCount = 0;
  let contextCreations = 0;
  const context = {
    state: 'running',
    currentTime: 0,
    destination: {},
    createOscillator() {
      oscillatorCount += 1;
      return {
        ...node(),
        frequency: audioParam(440),
        start() {},
        stop() {},
      };
    },
    createGain() { return { ...node(), gain: audioParam(0) }; },
    createBiquadFilter() {
      return { ...node(), frequency: audioParam(0), Q: audioParam(0) };
    },
    async close() { this.state = 'closed'; },
  };
  const controller = new AudioController({
    contextFactory() {
      contextCreations += 1;
      return context;
    },
    setTimer: () => 1,
    clearTimer: () => {},
  });

  assert.equal(contextCreations, 0);
  assert.equal(controller.playWrittenMidi(60).reason, 'not-unlocked');
  await controller.unlock();
  assert.equal(contextCreations, 1);

  const first = controller.playWrittenMidi(60);
  const second = controller.playWrittenMidi(62, { pitchMode: 'concert' });
  assert.equal(first.ok, true);
  assert.equal(second.playbackMidi, 60);
  assert.equal(oscillatorCount, 2);
  assert.equal(controller.activeOscillatorCount, 2);

  controller.stopImmediately();
  assert.equal(controller.activeOscillatorCount, 0);
  await controller.dispose();
});
