import { noteFor } from './mapping.js';
import { handleIntent, INTENT_RESULTS } from './modes.js';

export const SHORTCUT_CONTEXTS = Object.freeze({
  middleNatural: Object.freeze({ octave: 'mid', sharpOn: false }),
  highNatural: Object.freeze({ octave: 'high', sharpOn: false }),
  middleChromatic: Object.freeze({ octave: 'mid', sharpOn: true }),
});

export const DEGREE_BY_CODE = Object.freeze({
  Digit1: 1,
  Digit2: 2,
  Digit3: 3,
  Digit4: 4,
  Digit5: 5,
  Digit6: 6,
  Digit7: 7,
  Digit8: 8,
});

const OCTAVES = Object.freeze(['low', 'mid', 'high']);
const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const EDITABLE_ROLES = new Set(['textbox', 'combobox', 'spinbutton']);
const INTERACTIVE_TAGS = new Set(['BUTTON', 'A', 'SUMMARY', 'INPUT', 'SELECT', 'TEXTAREA']);
const INTERACTIVE_ROLES = new Set(['button', 'checkbox', 'radio', 'switch', 'link', 'menuitem']);

function altGraphIsActive(event) {
  try {
    return Boolean(event.getModifierState?.('AltGraph'));
  } catch {
    return false;
  }
}

function modifierCount(event) {
  return Number(Boolean(event.ctrlKey))
    + Number(Boolean(event.shiftKey))
    + Number(Boolean(event.altKey));
}

export function shortcutContextFromEvent(event) {
  if (!event || event.metaKey || altGraphIsActive(event)) return null;

  const count = modifierCount(event);
  if (count === 0) return { kind: 'current', modifier: 'none' };
  if (count !== 1) return null;
  if (event.ctrlKey) {
    return {
      kind: 'middleNatural',
      modifier: 'control',
      ...SHORTCUT_CONTEXTS.middleNatural,
    };
  }
  if (event.shiftKey) {
    return {
      kind: 'highNatural',
      modifier: 'shift',
      ...SHORTCUT_CONTEXTS.highNatural,
    };
  }
  return {
    kind: 'middleChromatic',
    modifier: 'alt',
    ...SHORTCUT_CONTEXTS.middleChromatic,
  };
}

export function eventPath(event) {
  try {
    const path = event?.composedPath?.();
    if (Array.isArray(path) && path.length > 0) return path;
  } catch {
    // Fall through to the target-only path.
  }
  return event?.target ? [event.target] : [];
}

function tagName(node) {
  return String(node?.tagName ?? '').toUpperCase();
}

function attribute(node, name) {
  if (typeof node?.getAttribute !== 'function') return null;
  return node.getAttribute(name);
}

function hasGlobalShortcutsOff(node) {
  if (attribute(node, 'data-global-shortcuts') === 'off') return true;
  return node?.dataset?.globalShortcuts === 'off';
}

function isContentEditable(node) {
  if (node?.isContentEditable) return true;
  const value = attribute(node, 'contenteditable');
  return value === '' || value === 'true' || value === 'plaintext-only';
}

export function isEditableNode(node) {
  if (!node || typeof node !== 'object') return false;
  if (EDITABLE_TAGS.has(tagName(node)) || isContentEditable(node)) return true;
  return EDITABLE_ROLES.has(String(attribute(node, 'role') ?? '').toLowerCase());
}

export function isInteractiveNode(node) {
  if (!node || typeof node !== 'object') return false;
  if (INTERACTIVE_TAGS.has(tagName(node))) return true;
  return INTERACTIVE_ROLES.has(String(attribute(node, 'role') ?? '').toLowerCase());
}

export function excludedShortcutReason(event, {
  dialogOpen = false,
  documentHidden = false,
} = {}) {
  if (!event) return 'missing-event';
  if (event.defaultPrevented) return 'default-prevented';
  if (event.isComposing || event.keyCode === 229 || event.which === 229) return 'composing';
  if (documentHidden) return 'document-hidden';
  if (dialogOpen) return 'dialog-open';

  const path = eventPath(event);
  if (path.some(hasGlobalShortcutsOff)) return 'global-shortcuts-off-region';
  if (path.some(isEditableNode)) return 'editable';
  if (event.code === 'Space' && path.some(isInteractiveNode)) return 'native-space-activation';
  return null;
}

function ignored(reason) {
  return {
    status: 'ignored',
    recognized: false,
    preventDefault: false,
    reason,
  };
}

function recognized(status, event, details = {}) {
  return {
    status,
    recognized: true,
    preventDefault: Boolean(event.cancelable),
    heldCode: event.code,
    ...details,
  };
}

function isUnmodified(event) {
  return !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;
}

function currentContextForDigit(state) {
  if (state.mode === 'quiz-number' && state.quiz?.targetOctave) {
    return {
      octave: state.quiz.targetOctave,
      sharpOn: Boolean(state.quiz.targetSharpOn),
    };
  }
  return { octave: state.octave, sharpOn: Boolean(state.sharpOn) };
}

function resolveDigit(event, state, shortcutContext) {
  const degree = DEGREE_BY_CODE[event.code];
  const context = shortcutContext.kind === 'current'
    ? currentContextForDigit(state)
    : { octave: shortcutContext.octave, sharpOn: shortcutContext.sharpOn };
  const intent = {
    type: 'selection',
    degree,
    ...context,
    input: 'shortcut',
    modifier: shortcutContext.modifier,
  };
  const policy = handleIntent(state, intent);

  if (policy.kind === INTENT_RESULTS.DENY) {
    return recognized('locked', event, {
      reason: policy.reason,
      command: null,
    });
  }

  if (policy.kind === INTENT_RESULTS.QUIZ_ANSWER) {
    return recognized('command', event, {
      command: {
        type: 'answer-degree',
        degree,
        source: 'keyboard',
      },
    });
  }

  const note = noteFor(degree, context.octave, context.sharpOn);
  if (!note) {
    return recognized('unavailable', event, {
      reason: shortcutContext.kind === 'middleChromatic'
        ? 'enharmonic-duplicate'
        : 'unavailable',
      command: null,
    });
  }

  return recognized('command', event, {
    command: {
      type: 'select-degree',
      degree,
      ...context,
      midi: note.midi,
      source: 'keyboard',
      play: true,
      policy: policy.kind,
      advancesScale: Boolean(policy.advancesScale),
    },
  });
}

function resolveSimpleCommand(event, state) {
  let intent;
  let command;
  let rangeEnd = false;

  if (event.code === 'Space') {
    intent = { type: 'replay-audio', input: 'shortcut', modifier: 'none' };
    command = { type: 'replay-audio', source: 'keyboard' };
  } else if (event.code === 'KeyR') {
    intent = { type: 'replay-motion', input: 'shortcut', modifier: 'none' };
    command = { type: 'replay-motion', source: 'keyboard' };
  } else if (event.code === 'KeyS') {
    intent = { type: 'context', input: 'shortcut', modifier: 'none' };
    command = {
      type: 'set-context',
      octave: state.octave,
      sharpOn: !state.sharpOn,
      source: 'keyboard',
      play: false,
    };
  } else if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
    intent = { type: 'context', input: 'shortcut', modifier: 'none' };
    const currentIndex = OCTAVES.indexOf(state.octave);
    const delta = event.code === 'ArrowUp' ? 1 : -1;
    const nextIndex = Math.min(OCTAVES.length - 1, Math.max(0, currentIndex + delta));
    if (currentIndex < 0 || nextIndex === currentIndex) {
      rangeEnd = true;
    } else {
      command = {
        type: 'set-context',
        octave: OCTAVES[nextIndex],
        sharpOn: state.sharpOn,
        source: 'keyboard',
        play: false,
      };
    }
  } else {
    return ignored('unrecognized-code');
  }

  const policy = handleIntent(state, intent);
  if (policy.kind === INTENT_RESULTS.DENY) {
    return recognized('locked', event, { reason: policy.reason, command: null });
  }

  if (rangeEnd) {
    return recognized('unavailable', event, {
      reason: 'octave-range-end',
      command: null,
    });
  }

  if (policy.command) command.quizCommand = policy.command;
  return recognized('command', event, { command });
}

/**
 * Pure keydown interpreter. The caller performs preventDefault/dispatch and then
 * stores heldCode only for recognized results.
 */
export function resolveShortcut(event, state, {
  heldCodes = new Set(),
  dialogOpen = Boolean(state?.openDialogId),
  documentHidden = false,
} = {}) {
  if (!state?.shortcutsOn) return ignored('shortcuts-off');

  const exclusion = excludedShortcutReason(event, { dialogOpen, documentHidden });
  if (exclusion) return ignored(exclusion);
  if (event.repeat || heldCodes.has(event.code)) return ignored('repeat-or-held');
  if (event.metaKey || altGraphIsActive(event)) return ignored('reserved-modifier');

  if (Object.hasOwn(DEGREE_BY_CODE, event.code)) {
    const context = shortcutContextFromEvent(event);
    return context ? resolveDigit(event, state, context) : ignored('modifier-combination');
  }

  if (!isUnmodified(event)) return ignored('command-requires-no-modifier');
  return resolveSimpleCommand(event, state);
}

export function addHeldCode(heldCodes, resolution) {
  const next = new Set(heldCodes);
  if (resolution?.recognized && resolution.heldCode) next.add(resolution.heldCode);
  return next;
}

export function releaseHeldCode(heldCodes, code) {
  const next = new Set(heldCodes);
  next.delete(code);
  return next;
}

export function clearHeldCodes() {
  return new Set();
}

export function ariaKeyShortcutsForDegree(degree, state) {
  if (!state?.shortcutsOn || !Number.isInteger(degree) || degree < 1 || degree > 8) {
    return null;
  }
  if (!noteFor(degree, state.octave, state.sharpOn)) return null;

  const keys = [String(degree)];
  if (state.octave === 'mid' && !state.sharpOn) keys.push(`Control+${degree}`);
  else if (state.octave === 'high' && !state.sharpOn) keys.push(`Shift+${degree}`);
  else if (state.octave === 'mid' && state.sharpOn) keys.push(`Alt+${degree}`);
  return keys.join(' ');
}
