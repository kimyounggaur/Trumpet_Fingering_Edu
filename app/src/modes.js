import { noteFor, valvesForNote } from './mapping.js';

export const MODES = Object.freeze([
  'learn',
  'scale',
  'quiz-number',
  'quiz-valves',
]);

export const SCALE_DIRECTIONS = Object.freeze(['ascending', 'descending']);
export const SCALE_DEGREES = Object.freeze({
  ascending: Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]),
  descending: Object.freeze([8, 7, 6, 5, 4, 3, 2, 1]),
});

export const INTENT_RESULTS = Object.freeze({
  ALLOW_SELECTION: 'allow-selection',
  PREVIEW_ONLY: 'preview-only',
  QUIZ_ANSWER: 'quiz-answer',
  ALLOW_COMMAND: 'allow-command',
  DENY: 'deny',
});

const QUIZ_TYPES = new Set(['quiz-number', 'quiz-valves']);
const VALID_QUESTION_TYPES = new Set(['staff', 'name', 'sound']);

export function isMode(mode) {
  return MODES.includes(mode);
}

export function isQuizMode(mode) {
  return QUIZ_TYPES.has(mode);
}

export function createScaleState({
  direction = 'ascending',
  sessionOctave = 'mid',
  sessionSharpOn = false,
  runningSequenceId = 0,
} = {}) {
  const safeDirection = SCALE_DIRECTIONS.includes(direction)
    ? direction
    : 'ascending';
  const degrees = SCALE_DEGREES[safeDirection];

  return {
    direction: safeDirection,
    sessionOctave: sessionOctave === 'high' ? 'high' : 'mid',
    sessionSharpOn: Boolean(sessionSharpOn),
    expectedDegree: degrees[0],
    stepIndex: 0,
    completed: false,
    runningSequenceId,
  };
}

export function scaleSequence(direction = 'ascending') {
  return SCALE_DEGREES[direction] ?? SCALE_DEGREES.ascending;
}

export function isExpectedScaleSelection(scale, selection) {
  if (!scale || scale.completed || scale.expectedDegree === null) return false;

  return selection.degree === scale.expectedDegree
    && selection.octave === scale.sessionOctave
    && Boolean(selection.sharpOn) === Boolean(scale.sessionSharpOn);
}

/** Advance only for the exact degree in the immutable session context. */
export function advanceScale(scale, selection) {
  if (!isExpectedScaleSelection(scale, selection)) return scale;

  const sequence = scaleSequence(scale.direction);
  const currentIndex = Number.isInteger(scale.stepIndex)
    ? scale.stepIndex
    : sequence.indexOf(scale.expectedDegree);
  const nextIndex = currentIndex + 1;

  if (nextIndex >= sequence.length) {
    return {
      ...scale,
      stepIndex: sequence.length,
      expectedDegree: null,
      completed: true,
    };
  }

  return {
    ...scale,
    stepIndex: nextIndex,
    expectedDegree: sequence[nextIndex],
    completed: false,
  };
}

function deny(reason) {
  return { kind: INTENT_RESULTS.DENY, reason };
}

function isModifiedPitchShortcut(intent) {
  return intent.input === 'shortcut'
    && intent.modifier
    && intent.modifier !== 'none';
}

/**
 * Pure mode gate. Call this before dispatching any selection or command.
 * It never exposes or resolves a quiz target note.
 */
export function handleIntent(state, intent) {
  if (!state || !intent || typeof intent.type !== 'string') {
    return deny('invalid-intent');
  }

  const mode = state.mode;

  if (mode === 'learn') {
    if (intent.type === 'selection') {
      return { kind: INTENT_RESULTS.ALLOW_SELECTION, advancesScale: false };
    }
    return { kind: INTENT_RESULTS.ALLOW_COMMAND };
  }

  if (mode === 'scale') {
    if (intent.type === 'selection') {
      const advancesScale = isExpectedScaleSelection(state.scale, intent);
      return {
        kind: advancesScale
          ? INTENT_RESULTS.ALLOW_SELECTION
          : INTENT_RESULTS.PREVIEW_ONLY,
        advancesScale,
      };
    }

    if (intent.type === 'context') {
      return { kind: INTENT_RESULTS.ALLOW_COMMAND, preservesSessionContext: true };
    }

    return { kind: INTENT_RESULTS.ALLOW_COMMAND };
  }

  if (mode === 'quiz-number') {
    if (intent.type === 'selection') {
      if (isModifiedPitchShortcut(intent) || intent.input === 'full-range') {
        return deny('quiz-use-answer-buttons');
      }
      return {
        kind: INTENT_RESULTS.QUIZ_ANSWER,
        answerType: 'degree',
        degree: intent.degree,
      };
    }

    if (intent.type === 'replay-audio') {
      return state.quiz.questionType === 'sound'
        ? { kind: INTENT_RESULTS.ALLOW_COMMAND, command: 'replay-question' }
        : deny('quiz-replay-is-for-sound-questions');
    }

    if (intent.type === 'replay-motion') {
      return state.quiz.feedbackPhase === 'revealed'
        ? { kind: INTENT_RESULTS.ALLOW_COMMAND }
        : deny('quiz-answer-not-revealed');
    }

    if (intent.type === 'context'
      || intent.type === 'alternate'
      || intent.type === 'full-range') {
      return deny('quiz-controls-locked');
    }

    return deny('quiz-use-answer-buttons');
  }

  if (mode === 'quiz-valves') {
    if (intent.type === 'toggle-valve' || intent.type === 'submit-valves') {
      return { kind: INTENT_RESULTS.QUIZ_ANSWER, answerType: 'valves' };
    }

    if (intent.type === 'replay-audio') {
      return { kind: INTENT_RESULTS.ALLOW_COMMAND, command: 'replay-question' };
    }

    if (intent.type === 'replay-motion') {
      return state.quiz.feedbackPhase === 'revealed'
        ? { kind: INTENT_RESULTS.ALLOW_COMMAND }
        : deny('quiz-answer-not-revealed');
    }

    if (intent.type === 'alternate' && state.quiz.feedbackPhase === 'revealed') {
      return { kind: INTENT_RESULTS.ALLOW_COMMAND };
    }

    return deny('quiz-pitch-controls-locked');
  }

  return deny('unknown-mode');
}

export function normalizeValves(valves) {
  if (!Array.isArray(valves)) return [];

  return [...new Set(valves)]
    .filter((valve) => Number.isInteger(valve) && valve >= 1 && valve <= 3)
    .sort((left, right) => left - right);
}

export function valveSetsEqual(left, right) {
  const a = normalizeValves(left);
  const b = normalizeValves(right);
  return a.length === b.length && a.every((valve, index) => valve === b[index]);
}

export function acceptedValveSets(note, allowAlternates = false) {
  if (!note) return [];
  const sets = [note.valves];
  if (allowAlternates) sets.push(...note.alts);
  return sets;
}

export function gradeValveAnswer(note, inputValves, allowAlternates = false) {
  return acceptedValveSets(note, allowAlternates)
    .some((answer) => valveSetsEqual(answer, inputValves));
}

export function quizQuestionKey({ targetOctave, targetSharpOn, targetDegree }) {
  if (!targetOctave || !Number.isInteger(targetDegree)) return null;
  return `${targetOctave}:${Number(Boolean(targetSharpOn))}:${targetDegree}`;
}

export function quizTargetNote(quiz) {
  if (!quiz) return null;
  return noteFor(quiz.targetDegree, quiz.targetOctave, quiz.targetSharpOn);
}

export function createQuizState({
  questionType = 'staff',
  targetDegree = null,
  targetOctave = null,
  targetSharpOn = false,
  allowAlternates = false,
} = {}) {
  return {
    questionType: VALID_QUESTION_TYPES.has(questionType) ? questionType : 'staff',
    targetDegree,
    targetOctave,
    targetSharpOn: Boolean(targetSharpOn),
    allowAlternates: Boolean(allowAlternates),
    inputValves: [],
    feedbackPhase: 'answering',
    attemptsThisQuestion: 0,
    firstTryCorrectCount: 0,
    answeredCount: 0,
    wrongWeightByQuestion: {},
    lastQuestionKey: null,
    questionIndex: 0,
    lastAnswerCorrect: null,
  };
}

export function quizCandidates({
  octaves = ['mid', 'high'],
  includeSharps = false,
} = {}) {
  const candidates = [];
  for (const octave of octaves) {
    for (const sharpOn of includeSharps ? [false, true] : [false]) {
      for (let degree = 1; degree <= 8; degree += 1) {
        if (!noteFor(degree, octave, sharpOn)) continue;
        candidates.push(Object.freeze({ degree, octave, sharpOn }));
      }
    }
  }
  return candidates;
}

/** Deterministic when a seeded random function is injected. */
export function chooseQuizQuestion({
  candidates,
  wrongWeightByQuestion = {},
  lastQuestionKey = null,
  random = Math.random,
}) {
  const pool = candidates.filter((candidate) => (
    quizQuestionKey({
      targetDegree: candidate.degree,
      targetOctave: candidate.octave,
      targetSharpOn: candidate.sharpOn,
    }) !== lastQuestionKey
  ));
  const available = pool.length > 0 ? pool : candidates;
  if (available.length === 0) return null;

  const weighted = available.map((candidate) => {
    const key = quizQuestionKey({
      targetDegree: candidate.degree,
      targetOctave: candidate.octave,
      targetSharpOn: candidate.sharpOn,
    });
    const weight = Math.min(4, Math.max(1, Number(wrongWeightByQuestion[key]) || 1));
    return { candidate, weight };
  });
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.min(Math.max(Number(random()) || 0, 0), 0.999999999) * total;

  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor < 0) return item.candidate;
  }

  return weighted.at(-1).candidate;
}

export function selectedValvesForState(state, note) {
  return normalizeValves(valvesForNote(note, state?.selectedAlt ?? null));
}
