import { AudioController } from './audio.js';
import {
  INTENT_RESULTS,
  chooseQuizQuestion,
  handleIntent,
  quizCandidates,
  quizTargetNote,
  scaleSequence,
} from './modes.js';
import { createSceneController } from './scene.js';
import {
  addHeldCode,
  clearHeldCodes,
  releaseHeldCode,
  resolveShortcut,
} from './shortcuts.js';
import {
  activeValves,
  createInitialState,
  createStore,
  currentNote,
  derivePresentation,
  deriveState,
  reducer,
  resolveSelection,
} from './store.js';
import { AppUI, liveSelectionSentence } from './ui.js';

const STORAGE_KEY = 'trumpet-fingering-settings-v1';
const SETTINGS_VERSION = 1;
const CATEGORY_CONTEXTS = Object.freeze({
  middleNatural: Object.freeze({ octave: 'mid', sharpOn: false }),
  highNatural: Object.freeze({ octave: 'high', sharpOn: false }),
  middleChromatic: Object.freeze({ octave: 'mid', sharpOn: true }),
});
const SETTINGS_FIELDS = Object.freeze({
  pitchMode: value => value === 'written' || value === 'concert',
  soundOn: value => typeof value === 'boolean',
  soundTimbre: value => ['concert', 'warm', 'mute'].includes(value),
  soundDynamics: value => ['soft', 'natural', 'forte'].includes(value),
  hapticOn: value => typeof value === 'boolean',
  slideMotionOn: value => typeof value === 'boolean',
  motionPreference: value => value === 'system' || value === 'reduced',
  shortcutsOn: value => typeof value === 'boolean',
});
const SOUND_TIMBRE_LABELS = Object.freeze({
  concert: '콘서트 오픈',
  warm: '웜 브라스',
  mute: '컵 뮤트',
});
const SOUND_DYNAMIC_LABELS = Object.freeze({
  soft: '부드럽게 p',
  natural: '자연스럽게 mf',
  forte: '힘차게 f',
});
const QUIZ_POOL = quizCandidates({
  octaves: ['mid', 'high'],
  includeSharps: true,
});
const NUMBER_QUESTION_TYPES = Object.freeze(['staff', 'name', 'sound']);

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!saved || saved.version !== SETTINGS_VERSION || typeof saved.values !== 'object') return {};
    const values = {};
    for (const [key, validate] of Object.entries(SETTINGS_FIELDS)) {
      if (validate(saved.values[key])) values[key] = saved.values[key];
    }
    return values;
  } catch {
    return {};
  }
}

function saveSettings(state) {
  const values = {};
  for (const key of Object.keys(SETTINGS_FIELDS)) values[key] = state[key];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SETTINGS_VERSION, values }));
  } catch {
    // file:// privacy modes may deny storage; the app remains fully usable.
  }
}

function denyMessage(reason) {
  const messages = {
    'quiz-use-answer-buttons': '숫자 퀴즈에서는 화면 숫자나 수정키 없는 숫자 키로 답하세요.',
    'quiz-controls-locked': '퀴즈 중에는 음역과 반음 분류를 바꿀 수 없습니다.',
    'quiz-pitch-controls-locked': '밸브 퀴즈에서는 장면 위 밸브로 답하세요.',
    'quiz-answer-not-revealed': '정답을 확인한 뒤 손동작을 다시 볼 수 있습니다.',
    'quiz-replay-is-for-sound-questions': '소리 문제에서만 문제음을 다시 들을 수 있습니다.',
    'octave-range-end': '선택할 수 있는 음역의 끝입니다.',
    unavailable: '이 분류에서는 그 숫자를 사용하지 않습니다.',
  };
  return messages[reason] ?? '현재 학습 모드에서는 이 동작을 사용할 수 없습니다.';
}

function createPointerProvenance(doc) {
  let pending = null;

  const clear = () => { pending = null; };
  doc.addEventListener('pointerdown', event => {
    const button = event.target.closest?.('button');
    pending = event.isTrusted && button && event.isPrimary !== false
      ? {
          button,
          pointerId: event.pointerId,
          pointerType: event.pointerType,
          startedAt: performance.now(),
          released: false,
        }
      : null;
  }, true);
  doc.addEventListener('pointerup', event => {
    const button = event.target.closest?.('button');
    if (!pending || pending.pointerId !== event.pointerId || pending.button !== button) {
      clear();
      return;
    }
    pending.released = true;
  }, true);
  doc.addEventListener('pointercancel', clear, true);
  window.addEventListener('blur', clear);

  return Object.freeze({
    consume(event, button) {
      const match = Boolean(
        event.isTrusted
        && pending
        && pending.released
        && pending.button === button
        && performance.now() - pending.startedAt <= 750,
      );
      const pointerType = pending?.pointerType;
      clear();
      if (match) return { source: 'pointer', pointerType };
      return { source: event.isTrusted && event.detail === 0 ? 'keyboard' : 'assistive' };
    },
    clear,
  });
}

const supportsHaptics = typeof navigator.vibrate === 'function';
const initialState = createInitialState(loadSettings());
const store = createStore(reducer, initialState);
const ui = new AppUI(document);
const audio = new AudioController();
const scene = createSceneController(document.querySelector('#trumpet-scene'), {
  motionPreference: initialState.motionPreference,
  onRender: snapshot => ui.applyValveOverlayProgress(snapshot.progress),
});
const pointerProvenance = createPointerProvenance(document);

let heldCodes = new Set();
let demoRevision = 0;
let demoTimer = null;

function presentationSceneTarget(state, presentation) {
  if (state.mode.startsWith('quiz-') && presentation.phase === 'answering') {
    return [...(presentation.candidateValves ?? [])];
  }
  return presentation.showTargetPose ? [...(presentation.fingering ?? [])] : [];
}

function targetNoteForScene(state, presentation) {
  if (state.mode.startsWith('quiz-')) {
    return presentation.phase === 'revealed' ? quizTargetNote(state.quiz) : null;
  }
  return currentNote(state);
}

function syncSettingsControls(state) {
  const sound = document.querySelector('#setting-sound');
  const pitch = document.querySelector('#setting-pitch');
  const timbre = document.querySelector('#setting-timbre');
  const dynamics = document.querySelector('#setting-dynamics');
  const haptic = document.querySelector('#setting-haptic');
  const slide = document.querySelector('#setting-slide');
  const shortcuts = document.querySelector('#setting-shortcuts');
  const motion = document.querySelector('#setting-motion');
  const mute = document.querySelector('#mute-toggle');
  const soundProfile = document.querySelector('#sound-profile-open');

  sound.checked = state.soundOn;
  pitch.value = state.pitchMode;
  timbre.value = state.soundTimbre;
  dynamics.value = state.soundDynamics;
  haptic.checked = state.hapticOn && supportsHaptics;
  haptic.disabled = !supportsHaptics;
  slide.checked = state.slideMotionOn;
  shortcuts.checked = state.shortcutsOn;
  motion.value = state.motionPreference;
  mute.setAttribute('aria-pressed', String(!state.soundOn));
  mute.setAttribute('aria-label', state.soundOn ? '출력 소리 끄기' : '출력 소리 켜기');
  mute.querySelector('span').textContent = state.soundOn ? '♪' : '×';
  soundProfile.textContent = `${SOUND_TIMBRE_LABELS[state.soundTimbre]} · ${
    SOUND_DYNAMIC_LABELS[state.soundDynamics].split(' ').at(-1)
  }`;
  soundProfile.setAttribute(
    'aria-label',
    `트럼펫 음색 설정 열기, 현재 ${SOUND_TIMBRE_LABELS[state.soundTimbre]}, ${
      SOUND_DYNAMIC_LABELS[state.soundDynamics]
    }`,
  );

  if (!supportsHaptics) {
    const hint = haptic.closest('label')?.querySelector('small');
    if (hint) hint.textContent = '이 브라우저에서는 진동을 지원하지 않습니다.';
  }
}

function playbackOptions(state) {
  return {
    pitchMode: state.pitchMode,
    soundOn: state.soundOn,
    timbre: state.soundTimbre,
    dynamics: state.soundDynamics,
  };
}

function render(state, { animate = true } = {}) {
  const presentation = derivePresentation(state);
  ui.render(state, presentation);
  syncSettingsControls(state);
  scene.setMotionPreference(state.motionPreference);
  const note = targetNoteForScene(state, presentation);
  scene.setFingering(presentationSceneTarget(state, presentation), {
    midi: note?.midi,
    slideMotionOn: state.slideMotionOn,
    animate,
  });
  return presentation;
}

function vibrateIfPointer(source) {
  const state = store.getState();
  if (source === 'pointer' && state.hapticOn && supportsHaptics) {
    try { navigator.vibrate(10); } catch { /* best-effort haptic */ }
  }
}

function playNoteFromActivation(note, source, { vibrate = true } = {}) {
  if (!note) return;
  const state = store.getState();
  if (vibrate) vibrateIfPointer(source);
  if (!state.soundOn) return;
  void audio.playFromGesture(note.midi, playbackOptions(state));
}

function announceCurrentSelection() {
  const state = store.getState();
  const derived = deriveState(state);
  ui.announce(liveSelectionSentence(
    derived.currentNote,
    derived.activeValves,
    derived.categoryLabel,
    state.selectedDegree,
  ));
}

function cancelDemo({ updateStore = true } = {}) {
  const wasRunning = demoTimer !== null;
  demoRevision += 1;
  if (demoTimer !== null) clearTimeout(demoTimer);
  demoTimer = null;
  if (wasRunning && updateStore && store.getState().mode === 'scale') {
    store.dispatch({ type: 'CANCEL_AUTOMATION' });
  }
}

function waitForDemo(milliseconds, revision) {
  return new Promise(resolve => {
    demoTimer = setTimeout(() => {
      demoTimer = null;
      resolve(revision === demoRevision);
    }, milliseconds);
  });
}

function commitSelection({ degree, octave, sharpOn, source, play = true, manual = true }) {
  const resolved = resolveSelection({ degree, octave, sharpOn, source, play, manual });
  if (!resolved.ok) {
    ui.announce(denyMessage('unavailable'));
    return false;
  }
  store.dispatch(resolved.action);
  if (play) playNoteFromActivation(resolved.note, source);
  announceCurrentSelection();
  return true;
}

function activateScreenDegree(degree, source) {
  const state = store.getState();
  const intent = {
    type: 'selection',
    degree,
    octave: state.octave,
    sharpOn: state.sharpOn,
    input: 'screen',
    modifier: 'none',
  };
  const policy = handleIntent(state, intent);
  if (policy.kind === INTENT_RESULTS.DENY) {
    ui.announce(denyMessage(policy.reason));
    return;
  }
  if (policy.kind === INTENT_RESULTS.QUIZ_ANSWER) {
    answerNumber(degree, source);
    return;
  }
  cancelDemo();
  commitSelection({ ...intent, source, manual: true });
}

function setContext(context, source = 'screen') {
  const state = store.getState();
  const policy = handleIntent(state, { type: 'context', input: source });
  if (policy.kind === INTENT_RESULTS.DENY) {
    ui.announce(denyMessage(policy.reason));
    return false;
  }
  cancelDemo();
  store.dispatch({ type: 'SET_CONTEXT', payload: { ...context, source } });
  const note = currentNote(store.getState());
  ui.announce(note
    ? `${deriveState(store.getState()).categoryLabel}, ${note.name}. 소리 없이 문맥만 바꿨습니다.`
    : `${deriveState(store.getState()).categoryLabel}. 이 숫자는 현재 분류에서 비활성입니다.`);
  return true;
}

function replayAudio(source = 'screen') {
  const state = store.getState();
  const policy = handleIntent(state, { type: 'replay-audio', input: source });
  if (policy.kind === INTENT_RESULTS.DENY) {
    ui.announce(denyMessage(policy.reason));
    return;
  }
  const note = state.mode.startsWith('quiz-') ? quizTargetNote(state.quiz) : currentNote(state);
  playNoteFromActivation(note, source, { vibrate: false });
  if (note) ui.announce(state.mode.startsWith('quiz-') ? '문제음을 재생합니다.' : `${note.name} 음을 다시 재생합니다.`);
}

function replayMotion() {
  const state = store.getState();
  const policy = handleIntent(state, { type: 'replay-motion', input: 'screen' });
  if (policy.kind === INTENT_RESULTS.DENY) {
    ui.announce(denyMessage(policy.reason));
    return;
  }
  scene.replay();
  ui.announce('손가락과 피스톤 동작을 다시 보여 줍니다.');
}

function quizPayload(mode, state, { reset = false } = {}) {
  const question = chooseQuizQuestion({
    candidates: QUIZ_POOL,
    wrongWeightByQuestion: reset ? {} : state.quiz.wrongWeightByQuestion,
    lastQuestionKey: reset ? null : state.quiz.lastQuestionKey,
  });
  if (!question) return null;
  const nextIndex = reset ? 0 : state.quiz.answeredCount;
  return {
    mode,
    targetDegree: question.degree,
    targetOctave: question.octave,
    targetSharpOn: question.sharpOn,
    questionType: mode === 'quiz-number'
      ? NUMBER_QUESTION_TYPES[nextIndex % NUMBER_QUESTION_TYPES.length]
      : 'name',
    allowAlternates: false,
  };
}

function startQuiz(mode) {
  cancelDemo();
  audio.release();
  const payload = quizPayload(mode, store.getState(), { reset: true });
  if (!payload) return;
  store.dispatch({ type: 'START_QUIZ_SESSION', payload });
  ui.announce(mode === 'quiz-number'
    ? '숫자 퀴즈를 시작합니다. 문제를 보고 숫자로 답하세요.'
    : '밸브 퀴즈를 시작합니다. 장면 위 밸브를 눌러 답하세요.');
}

function nextQuizQuestion(source) {
  const state = store.getState();
  const reset = state.quiz.answeredCount >= 10;
  const payload = quizPayload(state.mode, state, { reset });
  if (!payload) return;
  store.dispatch({ type: reset ? 'START_QUIZ_SESSION' : 'SET_QUIZ_QUESTION', payload });
  ui.announce(reset ? '새 10문제 세션을 시작합니다.' : '다음 문제입니다.');
  if (payload.questionType === 'sound') {
    playNoteFromActivation(quizTargetNote(store.getState().quiz), source, { vibrate: false });
  }
}

function revealQuizAnswer(source) {
  const before = store.getState();
  store.dispatch({ type: 'REVEAL_QUIZ_ANSWER' });
  const after = store.getState();
  if (before === after) return;
  const target = quizTargetNote(after.quiz);
  playNoteFromActivation(target, source, { vibrate: false });
  ui.announce(`정답을 공개했습니다. ${target?.name ?? ''} 손 모양을 확인하세요.`);
}

function answerNumber(degree, source) {
  const before = store.getState();
  if (before.mode !== 'quiz-number' || before.quiz.feedbackPhase !== 'answering') return;
  store.dispatch({ type: 'ANSWER_NUMBER', payload: { degree } });
  const after = store.getState();
  vibrateIfPointer(source);
  if (after.quiz.feedbackPhase === 'revealed') {
    const target = quizTargetNote(after.quiz);
    playNoteFromActivation(target, source, { vibrate: false });
    ui.announce(after.quiz.lastAnswerCorrect
      ? `정답입니다. ${target?.name ?? ''} 운지를 확인하세요.`
      : `두 번째 답까지 달랐습니다. ${target?.name ?? ''} 정답 운지를 보여 줍니다.`);
  } else {
    ui.announce('아직 아니에요. 한 번 더 시도하세요.');
  }
}

function toggleQuizValve(valve, source) {
  const state = store.getState();
  const policy = handleIntent(state, { type: 'toggle-valve', input: 'screen' });
  if (policy.kind !== INTENT_RESULTS.QUIZ_ANSWER) {
    ui.announce(denyMessage(policy.reason));
    return;
  }
  store.dispatch({ type: 'TOGGLE_QUIZ_VALVE', payload: { valve } });
  vibrateIfPointer(source);
  const selected = store.getState().quiz.inputValves;
  ui.announce(selected.length ? `후보 밸브 ${selected.join(', ')}번.` : '후보 운지를 개방으로 만들었습니다.');
}

function submitQuizValves(source) {
  const before = store.getState();
  const policy = handleIntent(before, { type: 'submit-valves', input: 'screen' });
  if (policy.kind !== INTENT_RESULTS.QUIZ_ANSWER) {
    ui.announce(denyMessage(policy.reason));
    return;
  }
  store.dispatch({ type: 'SUBMIT_VALVE_ANSWER' });
  const after = store.getState();
  vibrateIfPointer(source);
  if (after.quiz.feedbackPhase === 'revealed') {
    const target = quizTargetNote(after.quiz);
    playNoteFromActivation(target, source, { vibrate: false });
    ui.announce(after.quiz.lastAnswerCorrect
      ? '정답입니다. 목표 손 모양을 보여 줍니다.'
      : '두 번째 답까지 달랐습니다. 목표 손 모양을 보여 줍니다.');
  } else {
    ui.announce('아직 아니에요. 후보 밸브를 바꾸고 다시 확인하세요.');
  }
}

async function runScaleDemo(source) {
  const state = store.getState();
  if (state.mode !== 'scale') return;
  cancelDemo({ updateStore: false });
  const revision = ++demoRevision;
  const direction = state.scale.direction;
  const octave = state.scale.sessionOctave;
  store.dispatch({ type: 'START_SCALE_SESSION', payload: { direction, sessionOctave: octave } });
  if (store.getState().soundOn) await audio.unlock();

  for (const degree of scaleSequence(direction)) {
    if (revision !== demoRevision || store.getState().mode !== 'scale') return;
    const resolved = resolveSelection({
      degree,
      octave,
      sharpOn: false,
      source: 'automation',
      play: true,
      manual: false,
    });
    if (resolved.ok) {
      store.dispatch(resolved.action);
      const current = store.getState();
      audio.playWrittenMidi(resolved.note.midi, playbackOptions(current));
    }
    if (!(await waitForDemo(420, revision))) return;
  }
  demoTimer = null;
  ui.announce('전체 스케일 시연이 끝났습니다.');
}

function executeShortcutCommand(command) {
  if (!command) return;
  if (command.type === 'select-degree') {
    cancelDemo();
    commitSelection({
      degree: command.degree,
      octave: command.octave,
      sharpOn: command.sharpOn,
      source: 'keyboard',
      manual: true,
    });
  } else if (command.type === 'answer-degree') {
    answerNumber(command.degree, 'keyboard');
  } else if (command.type === 'set-context') {
    setContext({ octave: command.octave, sharpOn: command.sharpOn }, 'keyboard');
  } else if (command.type === 'replay-audio') {
    replayAudio('keyboard');
  } else if (command.type === 'replay-motion') {
    replayMotion();
  }
}

function openDialog(id) {
  const dialog = document.querySelector(`#${id}`);
  if (!dialog || dialog.open) return;
  store.dispatch({ type: 'SET_DIALOG', payload: { id } });
  dialog.showModal();
}

function handleActionButton(button, source) {
  const { action } = button.dataset;
  if (action === 'alternate-primary' || action === 'alternate') {
    const state = store.getState();
    const policy = handleIntent(state, { type: 'alternate', input: 'screen' });
    if (policy.kind === INTENT_RESULTS.DENY) return ui.announce(denyMessage(policy.reason));
    store.dispatch({
      type: 'SELECT_ALTERNATE',
      payload: { index: action === 'alternate-primary' ? null : Number(button.dataset.altIndex) },
    });
    ui.announce(action === 'alternate-primary' ? '기본 운지로 돌아왔습니다.' : '대체 운지를 표시합니다.');
  } else if (action === 'scale-up' || action === 'scale-down') {
    cancelDemo();
    store.dispatch({
      type: 'START_SCALE_SESSION',
      payload: {
        direction: action === 'scale-up' ? 'ascending' : 'descending',
        sessionOctave: store.getState().octave === 'high' ? 'high' : 'mid',
      },
    });
    ui.announce(action === 'scale-up' ? '오름 스케일을 시작합니다.' : '내림 스케일을 시작합니다.');
  } else if (action === 'scale-demo') {
    void runScaleDemo(source);
  } else if (action === 'quiz-sound') {
    replayAudio(source);
  } else if (action === 'quiz-submit-valves') {
    submitQuizValves(source);
  } else if (action === 'quiz-reveal') {
    revealQuizAnswer(source);
  } else if (action === 'quiz-next') {
    nextQuizQuestion(source);
  }
}

store.subscribe((state, previous) => {
  render(state);
  if (Object.keys(SETTINGS_FIELDS).some(key => state[key] !== previous[key])) saveSettings(state);
});

document.addEventListener('click', event => {
  const button = event.target.closest?.('button');
  if (!button || button.disabled) return;
  const { source } = pointerProvenance.consume(event, button);

  if (button.matches('[data-degree]')) {
    activateScreenDegree(Number(button.dataset.degree), source);
  } else if (button.matches('[data-category]')) {
    const context = CATEGORY_CONTEXTS[button.dataset.category];
    if (context) setContext(context, source);
  } else if (button.matches('[data-octave]')) {
    setContext({ octave: button.dataset.octave, sharpOn: store.getState().sharpOn }, source);
  } else if (button.matches('[data-sharp]')) {
    setContext({ octave: store.getState().octave, sharpOn: button.dataset.sharp === 'true' }, source);
  } else if (button.matches('[data-mode]')) {
    const mode = button.dataset.mode;
    cancelDemo();
    audio.release();
    if (mode.startsWith('quiz-')) startQuiz(mode);
    else {
      store.dispatch({ type: 'SET_MODE', payload: { mode } });
      ui.announce(mode === 'learn' ? '배우기 모드입니다.' : '스케일 모드입니다. 다음 숫자를 순서대로 선택하세요.');
    }
  } else if (button.matches('[data-quiz-valve]')) {
    toggleQuizValve(Number(button.dataset.quizValve), source);
  } else if (button.dataset.action) {
    handleActionButton(button, source);
  } else if (button.id === 'replay-audio') {
    replayAudio(source);
  } else if (button.id === 'replay-motion') {
    replayMotion();
  } else if (button.id === 'mute-toggle') {
    const value = !store.getState().soundOn;
    store.dispatch({ type: 'SET_SETTING', payload: { key: 'soundOn', value } });
    if (!value) audio.release();
    ui.announce(value ? '소리를 켰습니다.' : '소리를 껐습니다.');
  } else if (button.id === 'settings-open') {
    openDialog('settings-dialog');
  } else if (button.id === 'sound-profile-open') {
    openDialog('settings-dialog');
    document.querySelector('#setting-timbre')?.focus();
  } else if (button.id === 'help-open') {
    openDialog('help-dialog');
  }
});

document.addEventListener('change', event => {
  const control = event.target;
  const mapping = {
    'setting-sound': ['soundOn', control.checked],
    'setting-pitch': ['pitchMode', control.value],
    'setting-timbre': ['soundTimbre', control.value],
    'setting-dynamics': ['soundDynamics', control.value],
    'setting-haptic': ['hapticOn', control.checked],
    'setting-slide': ['slideMotionOn', control.checked],
    'setting-motion': ['motionPreference', control.value],
  };
  if (control.id === 'setting-shortcuts') {
    store.dispatch({ type: 'SET_SHORTCUTS_ON', payload: { value: control.checked } });
    heldCodes = clearHeldCodes();
    ui.announce(control.checked ? '키보드 단축키를 켰습니다.' : '키보드 단축키를 껐습니다.');
    return;
  }
  const setting = mapping[control.id];
  if (!setting) return;
  store.dispatch({ type: 'SET_SETTING', payload: { key: setting[0], value: setting[1] } });
  if (setting[0] === 'soundOn' && !setting[1]) audio.release();
  if (['soundTimbre', 'soundDynamics'].includes(setting[0])) {
    const state = store.getState();
    if (!state.mode.startsWith('quiz-')) {
      playNoteFromActivation(currentNote(state), 'screen', { vibrate: false });
    }
    ui.announce(`${SOUND_TIMBRE_LABELS[state.soundTimbre]}, ${
      SOUND_DYNAMIC_LABELS[state.soundDynamics]
    } 음색으로 변경했습니다.`);
  }
});

for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('close', () => {
    store.dispatch({ type: 'SET_DIALOG', payload: { id: null } });
    heldCodes = clearHeldCodes();
  });
  dialog.addEventListener('cancel', () => {
    store.dispatch({ type: 'SET_DIALOG', payload: { id: null } });
  });
}

document.addEventListener('keydown', event => {
  const resolution = resolveShortcut(event, store.getState(), {
    heldCodes,
    dialogOpen: Boolean(store.getState().openDialogId),
    documentHidden: document.hidden,
  });
  if (!resolution.recognized) return;
  if (resolution.preventDefault && event.cancelable) event.preventDefault();
  heldCodes = addHeldCode(heldCodes, resolution);
  if (resolution.status === 'locked' || resolution.status === 'unavailable') {
    ui.announce(denyMessage(resolution.reason));
    return;
  }
  executeShortcutCommand(resolution.command);
});

document.addEventListener('keyup', event => {
  heldCodes = releaseHeldCode(heldCodes, event.code);
});
window.addEventListener('blur', () => { heldCodes = clearHeldCodes(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) heldCodes = clearHeldCodes();
});

const resizeSceneControls = () => ui.positionValveOverlay();
window.addEventListener('resize', resizeSceneControls, { passive: true });
window.addEventListener('orientationchange', resizeSceneControls, { passive: true });
window.visualViewport?.addEventListener('resize', resizeSceneControls, { passive: true });
const resizeObserver = globalThis.ResizeObserver
  ? new ResizeObserver(resizeSceneControls)
  : null;
resizeObserver?.observe(document.querySelector('#scene-wrapper'));

window.addEventListener('pagehide', () => {
  cancelDemo({ updateStore: false });
  resizeObserver?.disconnect();
  scene.destroy();
  void audio.dispose();
}, { once: true });

render(store.getState(), { animate: false });
