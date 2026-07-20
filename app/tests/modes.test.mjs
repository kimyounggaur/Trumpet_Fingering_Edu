import test from 'node:test';
import assert from 'node:assert/strict';

import { noteFor } from '../src/mapping.js';
import {
  INTENT_RESULTS,
  advanceScale,
  chooseQuizQuestion,
  createScaleState,
  gradeValveAnswer,
  handleIntent,
  isExpectedScaleSelection,
  normalizeValves,
  quizCandidates,
  scaleSequence,
  valveSetsEqual,
} from '../src/modes.js';
import { createInitialState } from '../src/store.js';

test('learn mode allows valid selection and ordinary commands', () => {
  const state = createInitialState();
  assert.deepEqual(handleIntent(state, {
    type: 'selection', degree: 1, octave: 'mid', sharpOn: false,
  }), {
    kind: INTENT_RESULTS.ALLOW_SELECTION,
    advancesScale: false,
  });
  assert.deepEqual(handleIntent(state, { type: 'replay-motion' }), {
    kind: INTENT_RESULTS.ALLOW_COMMAND,
  });
});

test('scale advances only the expected degree in its fixed session context', () => {
  let scale = createScaleState({ sessionOctave: 'mid', direction: 'ascending' });
  assert.deepEqual(scaleSequence('ascending'), [1, 2, 3, 4, 5, 6, 7, 8]);

  const wrongContext = { degree: 1, octave: 'high', sharpOn: false };
  assert.equal(isExpectedScaleSelection(scale, wrongContext), false);
  assert.equal(advanceScale(scale, wrongContext), scale);

  const expected = { degree: 1, octave: 'mid', sharpOn: false };
  assert.equal(isExpectedScaleSelection(scale, expected), true);
  scale = advanceScale(scale, expected);
  assert.equal(scale.expectedDegree, 2);
  assert.equal(scale.stepIndex, 1);

  const state = createInitialState({ mode: 'scale', scale });
  assert.equal(handleIntent(state, {
    type: 'selection', degree: 1, octave: 'high', sharpOn: false,
  }).kind, INTENT_RESULTS.PREVIEW_ONLY);
  assert.equal(handleIntent(state, {
    type: 'selection', degree: 2, octave: 'mid', sharpOn: false,
  }).kind, INTENT_RESULTS.ALLOW_SELECTION);
});

test('descending scale completes after eight exact answers', () => {
  let scale = createScaleState({ direction: 'descending', sessionOctave: 'high' });
  assert.equal(scale.expectedDegree, 8);
  for (const degree of scaleSequence('descending')) {
    scale = advanceScale(scale, { degree, octave: 'high', sharpOn: false });
  }
  assert.equal(scale.completed, true);
  assert.equal(scale.expectedDegree, null);
  assert.equal(scale.stepIndex, 8);
});

test('number quiz accepts only screen/plain digit answers and protects replay', () => {
  const state = createInitialState({
    mode: 'quiz-number',
    quiz: {
      targetDegree: 2,
      targetOctave: 'mid',
      targetSharpOn: false,
      questionType: 'staff',
    },
  });

  assert.equal(handleIntent(state, {
    type: 'selection', degree: 2, input: 'shortcut', modifier: 'none',
  }).kind, INTENT_RESULTS.QUIZ_ANSWER);
  assert.equal(handleIntent(state, {
    type: 'selection', degree: 2, input: 'shortcut', modifier: 'control',
  }).kind, INTENT_RESULTS.DENY);
  assert.equal(handleIntent(state, { type: 'context' }).kind, INTENT_RESULTS.DENY);
  assert.equal(handleIntent(state, { type: 'replay-audio' }).kind, INTENT_RESULTS.DENY);

  const soundQuestion = createInitialState({
    mode: 'quiz-number',
    quiz: { questionType: 'sound' },
  });
  assert.equal(handleIntent(soundQuestion, { type: 'replay-audio' }).kind,
    INTENT_RESULTS.ALLOW_COMMAND);
});

test('valve quiz locks pitch selection but accepts valve candidate actions', () => {
  const state = createInitialState({ mode: 'quiz-valves' });
  assert.equal(handleIntent(state, { type: 'selection' }).kind, INTENT_RESULTS.DENY);
  assert.equal(handleIntent(state, { type: 'context' }).kind, INTENT_RESULTS.DENY);
  assert.equal(handleIntent(state, { type: 'toggle-valve' }).kind,
    INTENT_RESULTS.QUIZ_ANSWER);
  assert.equal(handleIntent(state, { type: 'submit-valves' }).kind,
    INTENT_RESULTS.QUIZ_ANSWER);
});

test('valve grading normalizes candidates and enables alternatives only explicitly', () => {
  const e4 = noteFor(3, 'mid', false);
  assert.deepEqual(normalizeValves([3, 1, 3, 2, 99]), [1, 2, 3]);
  assert.equal(valveSetsEqual([2, 1], [1, 2]), true);
  assert.equal(gradeValveAnswer(e4, [2, 1], false), true);
  assert.equal(gradeValveAnswer(e4, [3], false), false);
  assert.equal(gradeValveAnswer(e4, [3], true), true);
});

test('quiz candidate selection excludes the previous key and honors weight up to four', () => {
  const candidates = quizCandidates({ octaves: ['mid'], includeSharps: false });
  assert.equal(candidates.length, 8);
  const firstKey = 'mid:0:1';
  const choice = chooseQuizQuestion({
    candidates,
    lastQuestionKey: firstKey,
    wrongWeightByQuestion: { 'mid:0:3': 4 },
    random: () => 0.2,
  });
  assert.notDeepEqual(choice, candidates[0]);
  assert.equal(choice.degree, 3);
});
