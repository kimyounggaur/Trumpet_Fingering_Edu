import { NOTES } from './data.js';
import { noteFor, poseKey, valvesForNote } from './mapping.js';
import {
  MODES,
  advanceScale,
  createQuizState,
  createScaleState,
  gradeValveAnswer,
  isQuizMode,
  normalizeValves,
  quizQuestionKey,
  quizTargetNote,
} from './modes.js';

const OCTAVES = Object.freeze(['low', 'mid', 'high']);
const MANUAL_SOURCES = new Set([
  'pointer',
  'keyboard',
  'assistive',
  'screen',
  'shortcut',
  'full-range',
]);

const CATEGORY_LABELS = Object.freeze({
  middleNatural: '낮은 계이름 C4–C5',
  highNatural: '높은 계이름 C5–C6',
  middleChromatic: '반음 C4 기준',
  fullRange: '전체 음역 F♯3–C6',
});

function cloneQuiz(quiz) {
  return {
    ...quiz,
    inputValves: [...quiz.inputValves],
    wrongWeightByQuestion: { ...quiz.wrongWeightByQuestion },
  };
}

export function createInitialState(overrides = {}) {
  const state = {
    mode: 'learn',
    octave: 'mid',
    sharpOn: false,
    selectedDegree: 1,
    currentMidi: 60,
    selectedAlt: null,
    pitchMode: 'written',
    soundOn: true,
    hapticOn: true,
    slideMotionOn: false,
    motionPreference: 'system',
    shortcutsOn: true,
    openDialogId: null,
    lastInputSource: 'initial',
    motionRevision: 0,
    scale: createScaleState(),
    quiz: createQuizState(),
    learnSnapshot: {
      degree: 1,
      octave: 'mid',
      sharpOn: false,
    },
  };

  const merged = {
    ...state,
    ...overrides,
    scale: { ...state.scale, ...(overrides.scale ?? {}) },
    quiz: {
      ...state.quiz,
      ...(overrides.quiz ?? {}),
      inputValves: [...(overrides.quiz?.inputValves ?? state.quiz.inputValves)],
      wrongWeightByQuestion: {
        ...state.quiz.wrongWeightByQuestion,
        ...(overrides.quiz?.wrongWeightByQuestion ?? {}),
      },
    },
    learnSnapshot: {
      ...state.learnSnapshot,
      ...(overrides.learnSnapshot ?? {}),
    },
  };

  return merged;
}

export const INITIAL_STATE = createInitialState();

export function noteByMidi(midi) {
  return Number.isInteger(midi)
    ? NOTES.find((note) => note.midi === midi) ?? null
    : null;
}

export function deriveCategory({ octave, sharpOn }) {
  if (octave === 'mid' && !sharpOn) return 'middleNatural';
  if (octave === 'high' && !sharpOn) return 'highNatural';
  if (octave === 'mid' && sharpOn) return 'middleChromatic';
  return 'fullRange';
}

export function categoryLabel(context) {
  return CATEGORY_LABELS[deriveCategory(context)] ?? CATEGORY_LABELS.fullRange;
}

export function currentNote(state) {
  return noteByMidi(state?.currentMidi);
}

export function activeValves(state, note = currentNote(state)) {
  return valvesForNote(note, state?.selectedAlt ?? null);
}

export function deriveState(state) {
  const note = currentNote(state);
  const valves = activeValves(state, note);
  return {
    category: deriveCategory(state),
    categoryLabel: categoryLabel(state),
    currentNote: note,
    activeValves: valves,
    poseKey: poseKey(valves),
  };
}

export function resolveSelection({
  degree,
  octave,
  sharpOn,
  source = 'screen',
  play = true,
  manual,
}) {
  const note = noteFor(degree, octave, Boolean(sharpOn));
  if (!note) return { ok: false, reason: 'unavailable' };

  return {
    ok: true,
    note,
    action: {
      type: 'COMMIT_SELECTION',
      payload: {
        degree,
        octave,
        sharpOn: Boolean(sharpOn),
        currentMidi: note.midi,
        selectedAlt: null,
        source,
        manual,
      },
    },
    effect: { source, play: Boolean(play) },
  };
}

function sourceIsManual(payload) {
  if (typeof payload.manual === 'boolean') return payload.manual;
  return MANUAL_SOURCES.has(payload.source);
}

function selectionFromPayload(payload) {
  if (!payload || !OCTAVES.includes(payload.octave)) return null;
  const note = noteFor(payload.degree, payload.octave, Boolean(payload.sharpOn));
  if (!note) return null;

  return {
    note,
    degree: payload.degree,
    octave: payload.octave,
    sharpOn: Boolean(payload.sharpOn),
    source: payload.source ?? 'unknown',
  };
}

function reduceSelection(state, payload) {
  if (isQuizMode(state.mode)) return state;
  const selection = selectionFromPayload(payload);
  if (!selection) return state;

  const next = {
    ...state,
    octave: selection.octave,
    sharpOn: selection.sharpOn,
    selectedDegree: selection.degree,
    currentMidi: selection.note.midi,
    selectedAlt: null,
    lastInputSource: selection.source,
    motionRevision: state.motionRevision + 1,
  };

  if (state.mode === 'learn' && sourceIsManual(payload)) {
    next.learnSnapshot = {
      degree: selection.degree,
      octave: selection.octave,
      sharpOn: selection.sharpOn,
    };
  }

  if (state.mode === 'scale') {
    next.scale = advanceScale(state.scale, selection);
  }

  return next;
}

function reduceContext(state, payload) {
  if (isQuizMode(state.mode)) return state;
  const octave = payload?.octave ?? state.octave;
  const sharpOn = payload?.sharpOn ?? state.sharpOn;
  if (!OCTAVES.includes(octave) || typeof sharpOn !== 'boolean') return state;
  if (octave === state.octave && sharpOn === state.sharpOn) return state;

  const note = noteFor(state.selectedDegree, octave, sharpOn);
  return {
    ...state,
    octave,
    sharpOn,
    currentMidi: note?.midi ?? null,
    selectedAlt: null,
    lastInputSource: payload.source ?? 'context',
    motionRevision: state.motionRevision + 1,
  };
}

function reduceAlternate(state, payload) {
  if (isQuizMode(state.mode) && state.quiz.feedbackPhase !== 'revealed') return state;
  const note = currentNote(state);
  if (!note) return state;

  const index = payload?.index;
  if (index === null) {
    if (state.selectedAlt === null) return state;
    return {
      ...state,
      selectedAlt: null,
      motionRevision: state.motionRevision + 1,
    };
  }

  if (!Number.isInteger(index) || !note.alts[index]) return state;
  if (state.selectedAlt === index) return state;
  return {
    ...state,
    selectedAlt: index,
    motionRevision: state.motionRevision + 1,
  };
}

function targetPayloadIsValid(payload) {
  return Boolean(noteFor(
    payload?.targetDegree,
    payload?.targetOctave,
    Boolean(payload?.targetSharpOn),
  ));
}

function quizWithTarget(quiz, payload, { resetSession = false } = {}) {
  if (!targetPayloadIsValid(payload)) return quiz;
  const base = resetSession
    ? createQuizState({
      questionType: payload.questionType,
      allowAlternates: payload.allowAlternates,
    })
    : cloneQuiz(quiz);

  return {
    ...base,
    questionType: payload.questionType ?? base.questionType,
    targetDegree: payload.targetDegree,
    targetOctave: payload.targetOctave,
    targetSharpOn: Boolean(payload.targetSharpOn),
    allowAlternates: payload.allowAlternates ?? base.allowAlternates,
    inputValves: [],
    feedbackPhase: 'answering',
    attemptsThisQuestion: 0,
    lastAnswerCorrect: null,
    questionIndex: resetSession ? 1 : base.questionIndex + 1,
  };
}

function increaseQuestionWeight(quiz) {
  const key = quizQuestionKey(quiz);
  if (!key) return quiz.wrongWeightByQuestion;
  const previousWeight = Number(quiz.wrongWeightByQuestion[key]) || 1;
  return {
    ...quiz.wrongWeightByQuestion,
    [key]: Math.min(4, previousWeight + 1),
  };
}

function finishQuizAnswer(quiz, { correct, attempts, wrongWeightByQuestion }) {
  const key = quizQuestionKey(quiz);
  return {
    ...quiz,
    attemptsThisQuestion: attempts,
    feedbackPhase: 'revealed',
    firstTryCorrectCount: quiz.firstTryCorrectCount
      + Number(correct && attempts === 1),
    answeredCount: quiz.answeredCount + 1,
    wrongWeightByQuestion,
    lastQuestionKey: key,
    lastAnswerCorrect: correct,
  };
}

function reduceNumberAnswer(state, payload) {
  if (state.mode !== 'quiz-number' || state.quiz.feedbackPhase !== 'answering') {
    return state;
  }
  if (!Number.isInteger(payload?.degree) || payload.degree < 1 || payload.degree > 8) {
    return state;
  }

  const attempts = state.quiz.attemptsThisQuestion + 1;
  const correct = payload.degree === state.quiz.targetDegree;
  const weights = correct
    ? state.quiz.wrongWeightByQuestion
    : increaseQuestionWeight(state.quiz);

  if (correct || attempts >= 2) {
    return {
      ...state,
      quiz: finishQuizAnswer(state.quiz, {
        correct,
        attempts,
        wrongWeightByQuestion: weights,
      }),
      motionRevision: state.motionRevision + 1,
    };
  }

  return {
    ...state,
    quiz: {
      ...state.quiz,
      attemptsThisQuestion: attempts,
      wrongWeightByQuestion: weights,
      lastAnswerCorrect: false,
    },
  };
}

function reduceValveAnswer(state) {
  if (state.mode !== 'quiz-valves' || state.quiz.feedbackPhase !== 'answering') {
    return state;
  }
  const target = quizTargetNote(state.quiz);
  if (!target) return state;

  const attempts = state.quiz.attemptsThisQuestion + 1;
  const correct = gradeValveAnswer(
    target,
    state.quiz.inputValves,
    state.quiz.allowAlternates,
  );
  const weights = correct
    ? state.quiz.wrongWeightByQuestion
    : increaseQuestionWeight(state.quiz);

  if (correct || attempts >= 2) {
    return {
      ...state,
      quiz: finishQuizAnswer(state.quiz, {
        correct,
        attempts,
        wrongWeightByQuestion: weights,
      }),
      motionRevision: state.motionRevision + 1,
    };
  }

  return {
    ...state,
    quiz: {
      ...state.quiz,
      attemptsThisQuestion: attempts,
      wrongWeightByQuestion: weights,
      lastAnswerCorrect: false,
    },
  };
}

function reduceMode(state, payload) {
  const mode = payload?.mode;
  if (!MODES.includes(mode) || mode === state.mode) return state;

  const cancelledScale = {
    ...state.scale,
    runningSequenceId: state.scale.runningSequenceId + 1,
  };

  if (mode === 'learn') {
    const snapshot = state.learnSnapshot;
    const note = noteFor(snapshot.degree, snapshot.octave, snapshot.sharpOn);
    return {
      ...state,
      mode,
      octave: snapshot.octave,
      sharpOn: snapshot.sharpOn,
      selectedDegree: snapshot.degree,
      currentMidi: note?.midi ?? null,
      selectedAlt: null,
      scale: cancelledScale,
      lastInputSource: 'mode',
      motionRevision: state.motionRevision + 1,
    };
  }

  if (mode === 'scale') {
    const sessionOctave = payload.sessionOctave === 'high'
      ? 'high'
      : state.octave === 'high' ? 'high' : 'mid';
    return {
      ...state,
      mode,
      selectedAlt: null,
      scale: createScaleState({
        direction: payload.direction,
        sessionOctave,
        sessionSharpOn: false,
        runningSequenceId: cancelledScale.runningSequenceId,
      }),
      lastInputSource: 'mode',
      motionRevision: state.motionRevision + 1,
    };
  }

  const nextQuiz = targetPayloadIsValid(payload)
    ? quizWithTarget(state.quiz, payload, { resetSession: true })
    : createQuizState({
      questionType: payload.questionType,
      allowAlternates: payload.allowAlternates,
    });
  return {
    ...state,
    mode,
    currentMidi: null,
    selectedAlt: null,
    scale: cancelledScale,
    quiz: nextQuiz,
    lastInputSource: 'mode',
    motionRevision: state.motionRevision + 1,
  };
}

export function reducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'COMMIT_SELECTION':
      return reduceSelection(state, action.payload);

    case 'SET_CONTEXT':
      return reduceContext(state, action.payload);

    case 'SELECT_ALTERNATE':
      return reduceAlternate(state, action.payload);

    case 'SET_MODE':
      return reduceMode(state, action.payload);

    case 'START_SCALE_SESSION': {
      const scale = createScaleState({
        ...action.payload,
        sessionSharpOn: false,
        runningSequenceId: state.scale.runningSequenceId + 1,
      });
      return { ...state, mode: 'scale', selectedAlt: null, scale };
    }

    case 'CANCEL_AUTOMATION':
      return {
        ...state,
        scale: {
          ...state.scale,
          runningSequenceId: state.scale.runningSequenceId + 1,
        },
      };

    case 'START_QUIZ_SESSION': {
      const mode = action.payload?.mode;
      if (mode !== 'quiz-number' && mode !== 'quiz-valves') return state;
      const quiz = quizWithTarget(createQuizState(), action.payload, {
        resetSession: true,
      });
      if (!targetPayloadIsValid(action.payload)) return state;
      return {
        ...state,
        mode,
        currentMidi: null,
        selectedAlt: null,
        quiz,
        motionRevision: state.motionRevision + 1,
      };
    }

    case 'SET_QUIZ_QUESTION': {
      if (!isQuizMode(state.mode) || !targetPayloadIsValid(action.payload)) return state;
      return { ...state, quiz: quizWithTarget(state.quiz, action.payload) };
    }

    case 'ANSWER_NUMBER':
      return reduceNumberAnswer(state, action.payload);

    case 'TOGGLE_QUIZ_VALVE': {
      if (state.mode !== 'quiz-valves' || state.quiz.feedbackPhase !== 'answering') {
        return state;
      }
      const valve = action.payload?.valve;
      if (![1, 2, 3].includes(valve)) return state;
      const input = new Set(state.quiz.inputValves);
      if (input.has(valve)) input.delete(valve);
      else input.add(valve);
      return {
        ...state,
        quiz: { ...state.quiz, inputValves: normalizeValves([...input]) },
        motionRevision: state.motionRevision + 1,
      };
    }

    case 'SUBMIT_VALVE_ANSWER':
      return reduceValveAnswer(state);

    case 'REVEAL_QUIZ_ANSWER': {
      if (!isQuizMode(state.mode) || state.quiz.feedbackPhase !== 'answering') return state;
      const weights = increaseQuestionWeight(state.quiz);
      return {
        ...state,
        quiz: finishQuizAnswer(state.quiz, {
          correct: false,
          attempts: Math.max(1, state.quiz.attemptsThisQuestion),
          wrongWeightByQuestion: weights,
        }),
        motionRevision: state.motionRevision + 1,
      };
    }

    case 'SET_SHORTCUTS_ON':
      return typeof action.payload?.value === 'boolean'
        ? { ...state, shortcutsOn: action.payload.value }
        : state;

    case 'SET_DIALOG':
      return {
        ...state,
        openDialogId: typeof action.payload?.id === 'string'
          ? action.payload.id
          : null,
      };

    case 'SET_SETTING': {
      const { key, value } = action.payload ?? {};
      const validators = {
        pitchMode: (input) => input === 'written' || input === 'concert',
        soundOn: (input) => typeof input === 'boolean',
        hapticOn: (input) => typeof input === 'boolean',
        slideMotionOn: (input) => typeof input === 'boolean',
        motionPreference: (input) => input === 'system' || input === 'reduced',
      };
      return validators[key]?.(value) ? { ...state, [key]: value } : state;
    }

    default:
      return state;
  }
}

function revealedQuizPresentation(state, target) {
  const valves = valvesForNote(target, null);
  return {
    mode: state.mode,
    phase: 'revealed',
    categoryLabel: categoryLabel({
      octave: state.quiz.targetOctave,
      sharpOn: state.quiz.targetSharpOn,
    }),
    prompt: state.quiz.lastAnswerCorrect ? '정답입니다.' : '정답을 확인하세요.',
    showDegree: true,
    showSolfege: true,
    showFingering: true,
    showTargetPose: true,
    degree: state.quiz.targetDegree,
    writtenName: target.name,
    enharmonic: target.enh,
    concertName: target.concert,
    solfege: target.solfege,
    fingering: [...valves],
    pose: poseKey(valves),
    candidateValves: state.mode === 'quiz-valves'
      ? normalizeValves(state.quiz.inputValves)
      : [],
    liveMessage: state.quiz.lastAnswerCorrect ? '정답' : '정답 공개',
    svgTitle: `${target.name} 정답 운지`,
    svgDesc: `밸브 ${valves.length ? valves.join(', ') : '개방'}`,
  };
}

function answeringNumberPresentation(state, target) {
  const question = { type: state.quiz.questionType };
  if (state.quiz.questionType === 'staff') {
    // The written pitch is the accessible equivalent of the visible staff glyph.
    question.writtenPitch = target.name;
  } else if (state.quiz.questionType === 'name') {
    question.writtenName = target.name;
    question.enharmonic = target.enh;
  } else {
    question.soundAvailable = true;
  }

  return {
    mode: state.mode,
    phase: 'answering',
    categoryLabel: categoryLabel({
      octave: state.quiz.targetOctave,
      sharpOn: state.quiz.targetSharpOn,
    }),
    prompt: '알맞은 숫자를 고르세요.',
    question,
    showDegree: false,
    showSolfege: false,
    showFingering: false,
    showTargetPose: false,
    candidateValves: [],
    liveMessage: state.quiz.lastAnswerCorrect === false
      ? '다시 시도하세요.'
      : '문제를 듣거나 보고 답하세요.',
    svgTitle: '숫자 운지 문제',
    svgDesc: '정답 운지를 가린 문제 상태',
  };
}

function answeringValvePresentation(state, target) {
  const candidateValves = normalizeValves(state.quiz.inputValves);
  return {
    mode: state.mode,
    phase: 'answering',
    categoryLabel: categoryLabel({
      octave: state.quiz.targetOctave,
      sharpOn: state.quiz.targetSharpOn,
    }),
    prompt: '밸브를 선택하고 확인하세요.',
    question: {
      writtenName: target.name,
      enharmonic: target.enh,
      solfege: target.solfege,
    },
    showDegree: false,
    showSolfege: true,
    showFingering: false,
    showTargetPose: false,
    candidateValves,
    liveMessage: state.quiz.lastAnswerCorrect === false
      ? '선택한 밸브를 다시 확인하세요.'
      : '밸브 답안을 선택하세요.',
    svgTitle: `${target.name} 밸브 문제`,
    svgDesc: candidateValves.length
      ? `선택한 후보 밸브 ${candidateValves.join(', ')}`
      : '아직 선택한 후보 밸브 없음',
  };
}

/**
 * Produce the only model that may be rendered. During answering it deliberately
 * omits target degree/fingering/pose data instead of merely hiding it with CSS.
 */
export function derivePresentation(state) {
  if (isQuizMode(state.mode)) {
    const target = quizTargetNote(state.quiz);
    if (!target) {
      return {
        mode: state.mode,
        phase: 'answering',
        prompt: '문제를 준비하고 있습니다.',
        showDegree: false,
        showSolfege: false,
        showFingering: false,
        showTargetPose: false,
        candidateValves: [],
        liveMessage: '문제 준비 중',
        svgTitle: '문제 준비 중',
        svgDesc: '정답 정보 없음',
      };
    }

    if (state.quiz.feedbackPhase === 'revealed') {
      return revealedQuizPresentation(state, target);
    }
    return state.mode === 'quiz-number'
      ? answeringNumberPresentation(state, target)
      : answeringValvePresentation(state, target);
  }

  const note = currentNote(state);
  if (!note) {
    return {
      mode: state.mode,
      categoryLabel: categoryLabel(state),
      prompt: '이 문맥에서는 선택한 숫자를 사용할 수 없습니다.',
      showDegree: false,
      showSolfege: false,
      showFingering: false,
      showTargetPose: false,
      candidateValves: [],
      liveMessage: '선택 해제',
      svgTitle: '개방 대기 포즈',
      svgDesc: '선택된 음 없음',
    };
  }

  const valves = activeValves(state, note);
  return {
    mode: state.mode,
    categoryLabel: categoryLabel(state),
    prompt: `${state.selectedDegree}번 ${note.solfege}`,
    showDegree: true,
    showSolfege: true,
    showFingering: true,
    showTargetPose: true,
    degree: state.selectedDegree,
    writtenName: note.name,
    enharmonic: note.enh,
    concertName: note.concert,
    solfege: note.solfege,
    fingering: [...valves],
    pose: poseKey(valves),
    candidateValves: [],
    liveMessage: `${note.name}, ${note.solfege}`,
    svgTitle: `${note.name} 트럼펫 운지`,
    svgDesc: `밸브 ${valves.length ? valves.join(', ') : '개방'}`,
  };
}

export function createStore(storeReducer = reducer, preloadedState = createInitialState()) {
  let state = preloadedState;
  let dispatching = false;
  const listeners = new Set();

  return Object.freeze({
    getState() {
      return state;
    },

    dispatch(action) {
      if (dispatching) throw new Error('Reducers may not dispatch actions.');
      let next;
      try {
        dispatching = true;
        next = storeReducer(state, action);
      } finally {
        dispatching = false;
      }
      if (next !== state) {
        const previous = state;
        state = next;
        for (const listener of [...listeners]) listener(state, previous, action);
      }
      return action;
    },

    subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('listener must be a function');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });
}
