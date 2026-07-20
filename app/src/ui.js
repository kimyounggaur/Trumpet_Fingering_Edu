import { noteFor, poseKey } from './mapping.js';
import { deriveCategory, currentNote } from './store.js';
import { quizTargetNote } from './modes.js';

const MODE_LABELS = Object.freeze({
  learn: '배우기',
  scale: '스케일',
  'quiz-number': '숫자 퀴즈',
  'quiz-valves': '밸브 퀴즈',
});

const FINGER_NAMES = Object.freeze({ 1: '검지', 2: '중지', 3: '약지' });
const MODIFIER_BY_CATEGORY = Object.freeze({
  middleNatural: 'Control',
  highNatural: 'Shift',
  middleChromatic: 'Alt',
});

const DEGREE_NAMES = Object.freeze([
  '도', '레', '미', '파', '솔', '라', '시', '위 도',
]);

const MODE_HELP = Object.freeze({
  learn: '숫자를 눌러 계이름과 손가락 움직임을 자유롭게 비교하세요.',
  scale: '금색으로 안내되는 다음 계이름을 순서대로 연주하세요.',
  'quiz-number': '문제를 보고 알맞은 계이름 숫자를 고르세요.',
  'quiz-valves': '제시된 음에 맞는 밸브 조합을 직접 만들어 보세요.',
});

function setText(element, value = '') {
  if (element && element.textContent !== String(value)) element.textContent = String(value);
}

function setPressed(element, pressed) {
  if (element) element.setAttribute('aria-pressed', String(Boolean(pressed)));
}

export function formatValves(valves) {
  return valves?.length ? valves.join('-') : '개방';
}

export function formatFingers(valves) {
  if (!valves?.length) return '모두 놓음';
  return valves.map((valve) => FINGER_NAMES[valve]).join(' + ');
}

export function liveSelectionSentence(note, valves, categoryLabel, degree) {
  if (!note) return '선택된 음이 없습니다. 활성 숫자를 선택하세요.';
  const fingering = valves.length
    ? `${formatFingers(valves)}로 ${formatValves(valves)}번 밸브를 누릅니다.`
    : '모든 밸브를 놓는 개방 운지입니다.';
  return `${categoryLabel}, ${degree}번 ${note.solfege}, 기보 ${note.name}. ${fingering} 실음 ${note.concert}.`;
}

function keyShortcutFor(state, degree, enabled) {
  if (!state.shortcutsOn || !enabled) return null;
  const category = deriveCategory(state);
  const modifier = MODIFIER_BY_CATEGORY[category];
  return modifier ? `${degree} ${modifier}+${degree}` : String(degree);
}

function addButton(parent, { text, action, pressed, disabled = false, className = '' }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  if (action) button.dataset.action = action;
  if (className) button.className = className;
  if (pressed !== undefined) button.setAttribute('aria-pressed', String(pressed));
  button.disabled = disabled;
  parent.append(button);
  return button;
}

function staffPosition(name) {
  const match = /^([A-G])([♯♭]?)(\d)$/.exec(name ?? 'C4');
  if (!match) return { y: 72, accidental: '' };
  const letters = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  const diatonic = Number(match[3]) * 7 + letters[match[1]];
  const e4 = 4 * 7 + letters.E;
  return { y: 72 - (diatonic - e4) * 6, accidental: match[2] };
}

function makeStaffFigure(name, enharmonic) {
  const figure = document.createElement('figure');
  figure.className = 'staff-figure';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 220 124');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `기보 ${name}${enharmonic ? ` 또는 ${enharmonic}` : ''} 음표`);

  for (let index = 0; index < 5; index += 1) {
    const line = document.createElementNS(svg.namespaceURI, 'line');
    const y = 24 + index * 12;
    line.setAttribute('x1', '32'); line.setAttribute('x2', '198');
    line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y));
    line.setAttribute('class', 'staff-line');
    svg.append(line);
  }

  const clef = document.createElementNS(svg.namespaceURI, 'text');
  clef.setAttribute('x', '38'); clef.setAttribute('y', '72');
  clef.setAttribute('class', 'staff-clef'); clef.textContent = '𝄞';
  svg.append(clef);

  const { y, accidental } = staffPosition(name);
  for (let ledger = 84; ledger <= y + 1; ledger += 12) {
    const line = document.createElementNS(svg.namespaceURI, 'line');
    line.setAttribute('x1', '98'); line.setAttribute('x2', '140');
    line.setAttribute('y1', String(ledger)); line.setAttribute('y2', String(ledger));
    line.setAttribute('class', 'staff-line'); svg.append(line);
  }
  for (let ledger = 12; ledger >= y - 1; ledger -= 12) {
    const line = document.createElementNS(svg.namespaceURI, 'line');
    line.setAttribute('x1', '98'); line.setAttribute('x2', '140');
    line.setAttribute('y1', String(ledger)); line.setAttribute('y2', String(ledger));
    line.setAttribute('class', 'staff-line'); svg.append(line);
  }

  if (accidental) {
    const accidentalText = document.createElementNS(svg.namespaceURI, 'text');
    accidentalText.setAttribute('x', '91'); accidentalText.setAttribute('y', String(y + 7));
    accidentalText.setAttribute('class', 'staff-accidental'); accidentalText.textContent = accidental;
    svg.append(accidentalText);
  }

  const head = document.createElementNS(svg.namespaceURI, 'ellipse');
  head.setAttribute('cx', '120'); head.setAttribute('cy', String(y));
  head.setAttribute('rx', '10'); head.setAttribute('ry', '7');
  head.setAttribute('class', 'staff-note');
  head.setAttribute('transform', `rotate(-18 120 ${y})`);
  svg.append(head);
  const stem = document.createElementNS(svg.namespaceURI, 'line');
  stem.setAttribute('x1', '129'); stem.setAttribute('x2', '129');
  stem.setAttribute('y1', String(y)); stem.setAttribute('y2', String(Math.max(10, y - 38)));
  stem.setAttribute('class', 'staff-stem'); svg.append(stem);

  const caption = document.createElement('figcaption');
  caption.textContent = '이 음은 몇 번일까요?';
  figure.append(svg, caption);
  return figure;
}

export class AppUI {
  constructor(doc = document) {
    this.document = doc;
    this.valveOverlayLayout = null;
    this.elements = Object.freeze({
      root: doc.querySelector('#app-root'),
      categoryBadge: doc.querySelector('#category-badge'),
      modeBadge: doc.querySelector('#mode-badge'),
      degree: doc.querySelector('#degree-display'),
      solfege: doc.querySelector('#solfege-display'),
      noteName: doc.querySelector('#note-name'),
      concert: doc.querySelector('#concert-name'),
      fingering: doc.querySelector('#fingering-text'),
      fingers: doc.querySelector('#finger-text'),
      pose: doc.querySelector('#pose-text code'),
      sceneCaption: doc.querySelector('#scene-caption'),
      sceneTitle: doc.querySelector('#trumpet-scene title'),
      sceneDesc: doc.querySelector('#trumpet-scene desc'),
      live: doc.querySelector('#live-status'),
      modePanel: doc.querySelector('#mode-panel'),
      progress: doc.querySelector('#progress-chip'),
      mask: doc.querySelector('#quiz-scene-mask'),
      valveOverlay: doc.querySelector('#valve-quiz-overlay'),
      alternateFieldset: doc.querySelector('#alternate-fieldset'),
      alternateControl: doc.querySelector('#alternate-control'),
      keypadHint: doc.querySelector('#keypad-hint'),
      replayMotion: doc.querySelector('#replay-motion'),
      replayAudio: doc.querySelector('#replay-audio'),
    });
  }

  announce(message) {
    setText(this.elements.live, '');
    requestAnimationFrame(() => setText(this.elements.live, message));
  }

  render(state, presentation) {
    this.renderStaticControls(state, presentation);
    this.renderKeypad(state);
    this.renderCurrent(state, presentation);
    this.renderModePanel(state, presentation);
    this.renderAlternates(state);
    this.renderQuizScene(state, presentation);
    this.positionValveOverlay();
  }

  renderStaticControls(state, presentation) {
    for (const button of this.document.querySelectorAll('[data-mode]')) {
      setPressed(button, button.dataset.mode === state.mode);
    }
    for (const button of this.document.querySelectorAll('[data-category]')) {
      const selected = button.dataset.category === deriveCategory(state);
      setPressed(button, selected);
      button.disabled = state.mode.startsWith('quiz-');
    }
    for (const button of this.document.querySelectorAll('[data-octave]')) {
      setPressed(button, button.dataset.octave === state.octave);
      button.disabled = state.mode.startsWith('quiz-');
    }
    for (const button of this.document.querySelectorAll('[data-sharp]')) {
      setPressed(button, (button.dataset.sharp === 'true') === state.sharpOn);
      button.disabled = state.mode.startsWith('quiz-');
    }
    this.document.body.classList.toggle('shortcuts-off', !state.shortcutsOn);
    setText(this.elements.modeBadge, MODE_LABELS[state.mode]);
    setText(this.elements.categoryBadge, presentation.categoryLabel ?? '전체 음역 F♯3–C6');
    this.elements.replayMotion.disabled = state.mode.startsWith('quiz-')
      && state.quiz.feedbackPhase !== 'revealed';
  }

  renderKeypad(state) {
    const quizContext = state.mode === 'quiz-number' ? state.quiz : null;
    const isNumberQuizAnswering = state.mode === 'quiz-number'
      && state.quiz.feedbackPhase === 'answering';
    const octave = quizContext?.targetOctave ?? state.octave;
    const sharpOn = quizContext?.targetSharpOn ?? state.sharpOn;
    const locked = state.mode === 'quiz-valves';

    for (const button of this.document.querySelectorAll('[data-degree]')) {
      const degree = Number(button.dataset.degree);
      const note = noteFor(degree, octave, sharpOn);
      const disabled = locked || !note;
      button.disabled = disabled;
      button.classList.toggle('is-selected', state.mode === 'learn' || state.mode === 'scale'
        ? state.currentMidi === note?.midi && state.selectedDegree === degree
        : false);
      setPressed(button, button.classList.contains('is-selected'));
      setText(button.querySelector('strong'), degree);
      setText(button.querySelector('span'), isNumberQuizAnswering
        ? '답 선택'
        : sharpOn && note ? note.solfege : DEGREE_NAMES[degree - 1]);
      setText(button.querySelector('small'), isNumberQuizAnswering
        ? (note ? '이 숫자로 답하기' : '이 분류에서는 비활성')
        : note ? `${note.name}${note.enh ? ` / ${note.enh}` : ''} · ${formatValves(note.valves)}` : '이명동음 중복');
      const shortcut = keyShortcutFor({ ...state, octave, sharpOn }, degree, !disabled);
      if (shortcut) button.setAttribute('aria-keyshortcuts', shortcut);
      else button.removeAttribute('aria-keyshortcuts');
      button.setAttribute('aria-label', isNumberQuizAnswering
        ? (note ? `${degree}번으로 답하기` : `${degree}번, 이 분류에서는 비활성`)
        : note
          ? `${degree}번 ${note.solfege}, 기보 ${note.name}, ${formatValves(note.valves)} 운지`
          : `${degree}번, 이 분류에서는 비활성`);
    }

    const category = deriveCategory({ octave, sharpOn });
    const hint = !state.shortcutsOn
      ? '키보드 단축키 꺼짐 · 화면 버튼을 사용하세요'
      : category === 'middleNatural' ? '화면 버튼 또는 Ctrl+1–8'
        : category === 'highNatural' ? '화면 버튼 또는 Shift+1–8'
          : category === 'middleChromatic' ? '화면 버튼 또는 Alt+1–8'
            : '화면 버튼 또는 무수정 숫자 1–8';
    setText(this.elements.keypadHint, hint);
  }

  renderCurrent(state, presentation) {
    const revealedOrFree = presentation.showFingering;
    const note = state.mode.startsWith('quiz-')
      ? quizTargetNote(state.quiz)
      : currentNote(state);
    const valves = revealedOrFree ? presentation.fingering ?? [] : [];

    setText(this.elements.degree, presentation.showDegree ? presentation.degree : '?');
    if (state.mode === 'quiz-valves' && presentation.phase === 'answering') {
      setText(this.elements.solfege, presentation.question?.solfege ?? '운지 문제');
      setText(this.elements.noteName, presentation.question?.writtenName ?? '');
    } else if (state.mode === 'quiz-number' && presentation.phase === 'answering') {
      setText(this.elements.solfege, '숫자를 맞혀요');
      setText(this.elements.noteName, presentation.question?.writtenName
        ?? presentation.question?.writtenPitch
        ?? (presentation.question?.soundAvailable ? '소리 문제' : ''));
    } else {
      setText(this.elements.solfege, presentation.solfege ?? '선택 대기');
      setText(this.elements.noteName, presentation.writtenName ?? '—');
    }
    setText(this.elements.concert, revealedOrFree && note
      ? `B♭ 트럼펫 실음 ${presentation.concertName ?? note.concert}`
      : '정답을 고른 뒤 운지를 확인하세요');
    setText(this.elements.fingering, revealedOrFree ? formatValves(valves) : '비공개');
    setText(this.elements.fingers, revealedOrFree ? formatFingers(valves) : '먼저 답해 보세요');
    setText(this.elements.pose, revealedOrFree ? presentation.pose ?? poseKey(valves) : '???');
    setText(this.elements.sceneCaption, presentation.prompt ?? MODE_HELP[state.mode]);
    setText(this.elements.sceneTitle, presentation.svgTitle ?? '트럼펫 운지 장면');
    setText(this.elements.sceneDesc, presentation.svgDesc ?? '양손과 트럼펫');
  }

  renderAlternates(state) {
    const note = currentNote(state);
    const allowed = !state.mode.startsWith('quiz-') && note?.alts?.length > 0;
    this.elements.alternateFieldset.hidden = !allowed;
    this.elements.alternateControl.replaceChildren();
    if (!allowed) return;
    addButton(this.elements.alternateControl, {
      text: `기본 · ${formatValves(note.valves)}`,
      action: 'alternate-primary',
      pressed: state.selectedAlt === null,
    });
    note.alts.forEach((valves, index) => {
      const button = addButton(this.elements.alternateControl, {
        text: `대체 ${index + 1} · ${formatValves(valves)}`,
        action: 'alternate',
        pressed: state.selectedAlt === index,
      });
      button.dataset.altIndex = String(index);
    });
  }

  renderModePanel(state, presentation) {
    const panel = this.elements.modePanel;
    panel.replaceChildren();
    this.elements.progress.hidden = true;

    if (state.mode === 'learn') {
      setText(panel, MODE_HELP.learn);
      return;
    }

    if (state.mode === 'scale') {
      const expected = state.scale.expectedDegree;
      const note = noteFor(expected, state.scale.sessionOctave, state.scale.sessionSharpOn);
      const message = document.createElement('p');
      message.textContent = state.scale.completed
        ? '스케일을 완주했습니다. 다시 시작하거나 전체 시연을 들어 보세요.'
        : `다음: ${expected}번 ${DEGREE_NAMES[expected - 1]} · ${note?.name ?? ''}`;
      panel.append(message);
      addButton(panel, { text: '오름 1→8', action: 'scale-up', pressed: state.scale.direction === 'ascending' });
      addButton(panel, { text: '내림 8→1', action: 'scale-down', pressed: state.scale.direction === 'descending' });
      addButton(panel, { text: '전체 다시 듣기', action: 'scale-demo', disabled: !state.scale.completed });
      this.elements.progress.hidden = false;
      setText(this.elements.progress, `${Math.min(state.scale.stepIndex, 8)} / 8`);
      return;
    }

    const target = quizTargetNote(state.quiz);
    const message = document.createElement('p');
    message.textContent = presentation.prompt;
    panel.append(message);

    if (state.mode === 'quiz-number' && presentation.phase === 'answering') {
      if (presentation.question?.type === 'staff' && target) {
        panel.append(makeStaffFigure(target.name, target.enh));
      } else if (presentation.question?.writtenName && target) {
        const name = document.createElement('strong');
        name.className = 'quiz-note-name';
        name.textContent = `${target.name}${target.enh ? ` / ${target.enh}` : ''}`;
        panel.append(name);
      } else if (presentation.question?.soundAvailable) {
        addButton(panel, { text: '문제음 듣기', action: 'quiz-sound' });
      }
    }

    if (state.mode === 'quiz-valves' && presentation.phase === 'answering') {
      const candidate = document.createElement('strong');
      candidate.className = 'candidate-readout';
      candidate.textContent = `내 답: ${formatValves(state.quiz.inputValves)}`;
      panel.append(candidate);
      addButton(panel, { text: '운지 확인', action: 'quiz-submit-valves' });
    }

    if (presentation.phase === 'answering' && state.quiz.attemptsThisQuestion > 0) {
      const retry = document.createElement('p');
      retry.className = 'quiz-feedback is-wrong';
      retry.textContent = '아직 아니에요. 한 번 더 생각해 보세요.';
      panel.append(retry);
      addButton(panel, { text: '정답 보기', action: 'quiz-reveal' });
    }

    if (presentation.phase === 'revealed') {
      const feedback = document.createElement('p');
      feedback.className = `quiz-feedback ${state.quiz.lastAnswerCorrect ? 'is-correct' : 'is-wrong'}`;
      feedback.textContent = state.quiz.lastAnswerCorrect
        ? '정답입니다! 손 모양과 소리를 확인해 보세요.'
        : `정답은 ${state.quiz.targetDegree}번, ${formatValves(presentation.fingering)} 운지입니다.`;
      panel.append(feedback);
      addButton(panel, { text: state.quiz.answeredCount >= 10 ? '새 10문제 시작' : '다음 문제', action: 'quiz-next' });
      this.elements.progress.hidden = false;
      setText(this.elements.progress, state.quiz.answeredCount >= 10
        ? `첫 시도 ${Math.round((state.quiz.firstTryCorrectCount / state.quiz.answeredCount) * 100)}%`
        : `${state.quiz.answeredCount} / 10`);
    }
  }

  renderQuizScene(state, presentation) {
    const numberAnswering = state.mode === 'quiz-number' && presentation.phase === 'answering';
    this.elements.mask.hidden = !numberAnswering;
    const valvesAnswering = state.mode === 'quiz-valves' && presentation.phase === 'answering';
    this.elements.valveOverlay.hidden = !valvesAnswering;
    for (const button of this.elements.valveOverlay.querySelectorAll('[data-quiz-valve]')) {
      const valve = Number(button.dataset.quizValve);
      setPressed(button, state.quiz.inputValves.includes(valve));
    }
  }

  positionValveOverlay() {
    if (this.elements.valveOverlay.hidden) {
      this.valveOverlayLayout = null;
      return;
    }
    const svg = this.document.querySelector('#trumpet-scene');
    const wrapper = this.document.querySelector('#scene-wrapper');
    const matrix = svg?.getScreenCTM?.();
    if (!svg || !wrapper || !matrix) return;
    const rect = wrapper.getBoundingClientRect();
    const centers = { 1: [450, 165], 2: [385, 165], 3: [320, 165] };
    const scaleY = Math.hypot(matrix.c, matrix.d);
    this.valveOverlayLayout = { scaleY };
    for (const button of this.elements.valveOverlay.querySelectorAll('[data-quiz-valve]')) {
      const valve = Number(button.dataset.quizValve);
      const [x, y] = centers[valve];
      const point = new DOMPoint(x, y).matrixTransform(matrix);
      button.style.left = `${point.x - rect.left}px`;
      button.style.top = `${point.y - rect.top}px`;
    }
    const progress = {};
    for (const number of [1, 2, 3]) {
      progress[number] = Number(this.document.querySelector(`#scene-valve-${number}`)?.dataset.progress) || 0;
    }
    this.applyValveOverlayProgress(progress);
  }

  applyValveOverlayProgress(progress) {
    if (this.elements.valveOverlay.hidden || !this.valveOverlayLayout) return;
    for (const button of this.elements.valveOverlay.querySelectorAll('[data-quiz-valve]')) {
      const valve = Number(button.dataset.quizValve);
      const p = Math.max(0, Math.min(1, Number(progress?.[valve]) || 0));
      const offset = 14 * this.valveOverlayLayout.scaleY * p;
      button.style.transform = `translate(-50%, calc(-50% + ${offset}px))`;
    }
  }
}
