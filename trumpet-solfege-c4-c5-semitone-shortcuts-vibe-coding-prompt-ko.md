# C4 낮은 계이름·C5 높은 계이름·반음 단축키 운지 애니메이션 추가용 바이브코딩 프롬프트

이 문서는 `trumpet-solfege-fingering-animation-mobile-webapp-development-guide-ko.md`를 기준으로, 다음 세 분류를 기존 트럼펫 운지 애니메이션에 안전하게 추가하기 위한 실행용 프롬프트다.

- 가온 도 C4 기준 낮은 계이름: `Ctrl + 숫자 1–8`
- 높은 도 C5 기준 높은 계이름: `Shift + 숫자 1–8`
- C4 기준 반음: `Alt + 숫자 1–8`

아래의 **붙여넣기용 프롬프트 전체**를 코딩 에이전트에게 그대로 제공한다.

## 사용 전 반드시 알아둘 결정

1. 이 문서에서 `낮은 계이름`은 C4–C5 자연음이다. 첨부 개발서의 내부 상태명 `octave:'low'`는 C3 기반이므로 서로 같은 뜻이 아니다.
2. 반음 단축키는 매번 같은 결과가 나와야 한다. `Alt+숫자`는 현재 선택된 옥타브에 의존하지 않고 C4 기준 반음으로 고정한다.
3. `Ctrl+1–8`은 Chrome을 비롯한 일반 브라우저에서 탭 전환에 예약되어 페이지가 키 이벤트를 받지 못할 수 있다. 요청한 단축키는 이벤트가 전달되는 환경에서 구현하되, 화면의 세 분류 버튼과 숫자 버튼을 항상 동등한 기본 입력으로 제공해야 한다.
4. 기존 31음 `NOTES`를 수정하거나 단축키용 운지 배열을 새로 만들지 않는다. 단축키는 기존 `noteFor()`와 동일한 선택 파이프라인을 호출한다.
5. 이 프롬프트의 범위에서 높은 음역의 반음은 새 단축키로 추가하지 않는다. `Alt`에 숨은 음역 상태를 넣거나 임의로 `Shift+Alt`를 추가하지 않는다.

---

## 붙여넣기용 프롬프트 전체

### 0. 역할과 최종 목표

너는 다음 역할을 동시에 수행하는 시니어 웹앱 구현자다.

1. B♭ 트럼펫 운지 데이터 엔지니어
2. 키보드 입력·상태 머신 엔지니어
3. SVG 손가락·피스톤 모션 엔지니어
4. 모바일 UI·접근성 엔지니어
5. Web Audio·상호작용 QA 엔지니어

현재 작업공간의 트럼펫 계이름 운지법 모바일 웹앱에 아래 세 입력 분류를 추가하라.

```text
Ctrl  + Digit1–Digit8 → C4–C5 자연음, 가온 도 기준 낮은 계이름
Shift + Digit1–Digit8 → C5–C6 자연음, 높은 도 기준 높은 계이름
Alt   + Digit1–Digit8 → C4 기준 반음
```

각 유효 단축키는 반드시 같은 트랜잭션 안에서 다음 결과를 만든다.

```text
분류와 숫자 해석
→ 기존 NOTES의 정확한 Note 조회
→ 선택·옥타브·변음 UI 동기화
→ 현재 음 카드 갱신
→ 오른손 손가락과 피스톤 운지 전환
→ 음 재생
→ 접근성 라이브 알림
```

왼손은 악기를 파지하고 선택 설정에서만 3번 슬라이드 링을 보정한다. 밸브 캡을 누르는 손은 오른손이며, 검지=1번, 중지=2번, 약지=3번이다.

최종 구현은 모바일 터치, 화면 버튼, 키보드, 스크린리더에서 기능이 동등해야 한다. 단축키는 유일한 입력 방법이 아니라 보조 입력 방법이다.

---

### 1. 구현 전에 로컬 자료를 감사하라

코드를 수정하기 전에 다음 파일을 UTF-8로 끝까지 읽어라.

```text
trumpet-solfege-fingering-animation-mobile-webapp-development-guide-ko.md
output/trumpet-fingering-chart-hand.html
output/trumpet-fingering-chart-vibe-coding-prompt-ko.md
scripts/generate_hand_fingering_chart.py
scripts/validate_hand_fingering_chart.py
```

그리고 실제 모바일 앱 구현 파일을 검색하라.

```text
index.html
app/index.html
src/**
tests/**
package.json
```

검색은 `rg --files`와 `rg`를 우선 사용한다. 구현 파일이 있으면 현재 구조와 사용자 변경을 보존하며 수정한다. 구현 파일이 없다면 참조용 `output` 파일을 덮어쓰지 말고 `app/index.html`에 자기완결형 모바일 앱을 만든다. 최종 배포본은 외부 요청 없이 실행되는 단일 HTML이어야 한다.

수정 전 다음 기준선을 짧게 보고하라.

- 앱 진입 파일과 실행 방법
- `NOTES`가 선언된 위치와 음 개수
- `midiFor()`, `noteFor()`, `activateDegree()` 또는 동등 함수 위치
- 앱 상태의 `octave`, `sharpOn`, `selectedDegree`, `currentMidi` 위치
- 전역 `keydown` 리스너 위치와 기존 무수정 `Digit1–8` 동작
- `applyFingering()`, `playNote()`, `announceNote()` 위치
- 실제 SVG의 `#scene-valve-1/2/3`, `#scene-finger-index/middle/ring` 존재 여부
- 테스트 실행 명령
- 작업 시작 전 기존 실패 테스트와 콘솔 오류

감사가 끝나기 전에 운지 데이터나 SVG path를 추측하여 새로 쓰지 마라.

---

### 2. 기존 데이터 계약을 절대 깨지 마라

기존 `NOTES`가 단일 진실 공급원이다.

```text
31 notes
written MIDI 54–84
10 notes with verified alternatives
11 alternative combinations
D4 alts=[]
F♯5 alts=[]
```

다음 회귀 검사는 새 기능을 추가한 뒤에도 통과해야 한다.

```js
console.assert(NOTES.length === 31);
console.assert(NOTES.every((note, index) => note.midi === 54 + index));
console.assert(NOTES.filter(note => note.alts.length).length === 10);
console.assert(NOTES.reduce((sum, note) => sum + note.alts.length, 0) === 11);
console.assert(NOTES.find(note => note.midi === 62).alts.length === 0); // D4
console.assert(NOTES.find(note => note.midi === 78).alts.length === 0); // F♯5
```

단축키마다 `midi`, `valves`, `solfege`를 복사한 별도 데이터 배열을 런타임 진실 공급원으로 만들지 마라. 단축키에는 `degree`, `octave`, `sharpOn` 문맥만 정의하고 실제 음과 운지는 기존 `noteFor()`로 찾는다.

기존 함수는 다음 의미를 보존한다.

```js
const DEGREE_OFFSET = [0, 2, 4, 5, 7, 9, 11, 12];
const OCTAVE_BASE = { low: 48, mid: 60, high: 72 };
const SHARPABLE = [true, true, false, true, true, true, false, true];

noteFor(degree, 'mid', false);  // C4–C5 자연음
noteFor(degree, 'high', false); // C5–C6 자연음
noteFor(degree, 'mid', true);   // C4 기준 반음
```

`미♯`과 `시♯`은 음악 이론상 존재한다. `Alt+3`과 `Alt+7`이 비활성인 이유는 F와 C의 이명동음 중복을 피하는 초급 UI 정책이지, 해당 음이 존재하지 않기 때문이 아니다.

---

### 3. 용어와 세 분류를 고정하라

내부 상태명과 화면 용어를 혼용하지 마라.

| 기능 분류 | 화면 문구 | 단축키 | 내부 조회 문맥 |
|---|---|---|---|
| `middleNatural` | 낮은 계이름 · 가온 도 C4 | `Ctrl+1–8` | `octave:'mid', sharpOn:false` |
| `highNatural` | 높은 계이름 · 높은 도 C5 | `Shift+1–8` | `octave:'high', sharpOn:false` |
| `middleChromatic` | 반음 · C4 기준 ♯/♭ | `Alt+1–8` | `octave:'mid', sharpOn:true` |

중요한 명명 규칙:

- 기존 `octave:'low'`는 C3 기반 확장 음역이므로 `낮은 계이름 C4`라고 표시하지 않는다.
- `middleNatural`의 `middle`은 내부 코드 문맥이고, 사용자 화면에는 `낮은 계이름 · C4–C5`로 표시한다.
- `middleChromatic`은 C4 기반으로 고정한다. 직전 Ctrl/Shift 입력이나 화면 옥타브를 기억해 결과를 바꾸지 않는다.
- `Ctrl+8`과 `Shift+1`은 모두 C5지만 분류와 숫자 문맥은 다르다.
- 기존 무수정 `Digit1–8` 동작은 삭제하지 않는다. 현재 화면 문맥의 1–8 버튼을 실행하는 기존 동작으로 유지한다.

---

### 4. 단축키별 정확한 음·운지 매핑을 구현하라

#### 4.1 낮은 계이름 — C4–C5 자연음

| 단축키 | 숫자 계이름 | 기보음 | MIDI | 표준 운지 | 오른손 | 포즈 |
|---|---|---|---:|---|---|---|
| `Ctrl+1` | 1 도 | C4 | 60 | 0, 개방 | 모두 놓음 | `000` |
| `Ctrl+2` | 2 레 | D4 | 62 | 1-3 | 검지+약지 | `101` |
| `Ctrl+3` | 3 미 | E4 | 64 | 1-2 | 검지+중지 | `110` |
| `Ctrl+4` | 4 파 | F4 | 65 | 1 | 검지 | `100` |
| `Ctrl+5` | 5 솔 | G4 | 67 | 0, 개방 | 모두 놓음 | `000` |
| `Ctrl+6` | 6 라 | A4 | 69 | 1-2 | 검지+중지 | `110` |
| `Ctrl+7` | 7 시 | B4 | 71 | 2 | 중지 | `010` |
| `Ctrl+8` | 8 위 도 | C5 | 72 | 0, 개방 | 모두 놓음 | `000` |

#### 4.2 높은 계이름 — C5–C6 자연음

| 단축키 | 숫자 계이름 | 기보음 | MIDI | 표준 운지 | 오른손 | 포즈 |
|---|---|---|---:|---|---|---|
| `Shift+1` | 1 도 | C5 | 72 | 0, 개방 | 모두 놓음 | `000` |
| `Shift+2` | 2 레 | D5 | 74 | 1 | 검지 | `100` |
| `Shift+3` | 3 미 | E5 | 76 | 0, 개방 | 모두 놓음 | `000` |
| `Shift+4` | 4 파 | F5 | 77 | 1 | 검지 | `100` |
| `Shift+5` | 5 솔 | G5 | 79 | 0, 개방 | 모두 놓음 | `000` |
| `Shift+6` | 6 라 | A5 | 81 | 1-2 | 검지+중지 | `110` |
| `Shift+7` | 7 시 | B5 | 83 | 2 | 중지 | `010` |
| `Shift+8` | 8 위 도 | C6 | 84 | 0, 개방 | 모두 놓음 | `000` |

#### 4.3 반음 — C4 기준

| 단축키 | 계이름·이명동음 | 기보음 | MIDI | 표준 운지 | 오른손 | 포즈/상태 |
|---|---|---|---:|---|---|---|
| `Alt+1` | 도♯ / 레♭ | C♯4 / D♭4 | 61 | 1-2-3 | 검지+중지+약지 | `111` |
| `Alt+2` | 레♯ / 미♭ | D♯4 / E♭4 | 63 | 2-3 | 중지+약지 | `011` |
| `Alt+3` | 미♯ = 파 | E♯4 = F4 | — | — | — | 비활성, 이명동음 중복 |
| `Alt+4` | 파♯ / 솔♭ | F♯4 / G♭4 | 66 | 2 | 중지 | `010` |
| `Alt+5` | 솔♯ / 라♭ | G♯4 / A♭4 | 68 | 2-3 | 중지+약지 | `011` |
| `Alt+6` | 라♯ / 시♭ | A♯4 / B♭4 | 70 | 1 | 검지 | `100` |
| `Alt+7` | 시♯ = 도 | B♯4 = C5 | — | — | — | 비활성, 이명동음 중복 |
| `Alt+8` | 위 도♯ / 레♭ | C♯5 / D♭5 | 73 | 1-2 | 검지+중지 | `110` |

#### 4.4 매핑 불변 조건

- 24개 조합 중 유효 단축키는 22개, 의도적 비활성은 `Alt+3`, `Alt+7` 두 개다.
- 유효 결과의 고유 MIDI는 다음 21개다.

```text
60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,76,77,79,81,83,84
```

- C5 경계 중복 때문에 유효 단축키 22개가 고유 음 21개를 가리킨다.
- `Ctrl+8`과 `Shift+1`은 반드시 `NOTES.find(note => note.midi === 72)`의 같은 객체를 가리킨다.
- `Alt+8`은 `NOTES.find(note => note.midi === 73)`을 가리킨다.
- D4는 1-3이지만 D5는 1이다. 계이름 `레`만 보고 운지를 재사용하지 않는다.
- E4는 1-2이지만 E5는 개방이다. 숫자 `3`만 보고 운지를 재사용하지 않는다.
- 모든 단축키는 표준 주운지를 사용하고 `selectedAlt=null`로 초기화한다.
- 표준 단축키에서 사용하지 않는 `001`, 즉 3번 밸브 단독 포즈도 기존 대체 운지 기능과 테스트에서 유지한다.

---

### 5. 순수 단축키 문맥과 해석기를 만들어라

단축키 문맥은 음 데이터가 아니라 기존 조회 함수에 전달할 인자만 가진다.

```js
const SHORTCUT_CONTEXTS = Object.freeze({
  middleNatural: Object.freeze({
    modifier: 'Control',
    octave: 'mid',
    sharpOn: false,
    label: '낮은 계이름 · C4–C5'
  }),
  highNatural: Object.freeze({
    modifier: 'Shift',
    octave: 'high',
    sharpOn: false,
    label: '높은 계이름 · C5–C6'
  }),
  middleChromatic: Object.freeze({
    modifier: 'Alt',
    octave: 'mid',
    sharpOn: true,
    label: '반음 · C4 기준'
  })
});

const DEGREE_BY_CODE = Object.freeze({
  Digit1: 1,
  Digit2: 2,
  Digit3: 3,
  Digit4: 4,
  Digit5: 5,
  Digit6: 6,
  Digit7: 7,
  Digit8: 8
});
```

기존 상태에 다음 필드만 추가하고, 분류를 별도의 중복 상태로 저장하지 않는다.

```js
const state = {
  // 기존 필드 유지
  shortcutsOn: true,
  openDialogId: null,
  lastInputSource: 'pointer'
};

function deriveVisibleCategory({ octave, sharpOn }) {
  if (octave === 'mid' && sharpOn === false) return 'middleNatural';
  if (octave === 'high' && sharpOn === false) return 'highNatural';
  if (octave === 'mid' && sharpOn === true) return 'middleChromatic';
  return 'custom'; // 기존 C3 확장 또는 이번 세 분류 밖의 문맥
}
```

`middleNatural` 같은 분류값과 `octave`/`sharpOn`을 서로 독립적으로 저장하면 상태가 어긋날 수 있다. 화면 분류는 항상 현재 `octave`와 `sharpOn`에서 파생한다.

`Numpad1–Numpad8`은 이번 범위에서 제외한다. 특히 Windows의 `Alt+Numpad` 문자 입력과 충돌시키지 않는다.

정확히 하나의 수정키만 허용한다.

```js
function shortcutContextFromEvent(event) {
  if (event.metaKey) return null;
  if (event.getModifierState?.('AltGraph')) return null;

  const modifierCount =
    Number(event.ctrlKey) +
    Number(event.shiftKey) +
    Number(event.altKey);

  if (modifierCount === 0) return { kind: 'current' };
  if (modifierCount !== 1) return null;

  if (event.ctrlKey) {
    return { kind: 'middleNatural', ...SHORTCUT_CONTEXTS.middleNatural };
  }
  if (event.shiftKey) {
    return { kind: 'highNatural', ...SHORTCUT_CONTEXTS.highNatural };
  }
  return { kind: 'middleChromatic', ...SHORTCUT_CONTEXTS.middleChromatic };
}
```

다음 조합은 어떤 분류로도 떨어뜨리지 말고 그대로 무시한다.

```text
Ctrl+Shift+Digit
Ctrl+Alt+Digit
Shift+Alt+Digit
Ctrl+Shift+Alt+Digit
Meta/Command+Digit
AltGraph/AltGr+Digit
```

`Ctrl`이 있으면 무조건 낮은 음처럼 우선 처리하는 식의 우선순위 코드를 만들지 마라. 복합 수정키는 무효다.

`event.key`가 아니라 `event.code`로 숫자를 찾는다. `Shift+1`에서 `event.key`는 `!` 또는 키보드 배열에 따른 다른 문자가 될 수 있지만 `event.code`는 물리 상단 숫자열의 `Digit1`이다.

---

### 6. 전역 키보드 이벤트를 안전하게 처리하라

#### 6.1 실행 제외 문맥

다음 상황에서는 단축키를 실행하거나 `preventDefault()`하지 않는다.

- 이벤트가 이미 `defaultPrevented`
- 페이지가 숨김 상태
- 앱 설정에서 단축키가 꺼짐
- 설정·도움말 등의 modal `<dialog>`가 열림
- IME 조합 중인 `event.isComposing`
- IME 호환 신호인 `event.keyCode === 229`
- `input`, `textarea`, `select`
- `contenteditable`
- `[role="textbox"]`, `[role="combobox"]`, `[role="spinbutton"]`
- `[data-global-shortcuts="off"]`

Shadow DOM도 고려해 `event.target.closest()` 하나만 보지 말고 `event.composedPath()` 전체를 검사한다.

```js
function isShortcutExcluded(event) {
  if (state.openDialogId !== null || document.querySelector('dialog[open]')) {
    return true;
  }

  return event.composedPath().some(node =>
    node instanceof HTMLElement && (
      node.isContentEditable ||
      node.matches([
        'input',
        'textarea',
        'select',
        '[role="textbox"]',
        '[role="combobox"]',
        '[role="spinbutton"]',
        '[data-global-shortcuts="off"]'
      ].join(','))
    )
  );
}
```

#### 6.2 첫 `keydown` 한 번만 활성화

키를 길게 눌러 소리·모션·라이브 알림이 폭주하지 않게 한다.

```js
const heldDigitCodes = new Set();

function onGlobalKeyDown(event) {
  if (
    event.defaultPrevented ||
    !state.shortcutsOn ||
    document.visibilityState === 'hidden' ||
    isShortcutExcluded(event) ||
    event.isComposing ||
    event.keyCode === 229
  ) {
    return;
  }

  const degree = DEGREE_BY_CODE[event.code];
  if (!degree) return;

  const context = shortcutContextFromEvent(event);
  if (!context) return;

  // 앱이 인식한 명령에만 적용한다.
  if (event.cancelable) event.preventDefault();

  if (event.repeat || heldDigitCodes.has(event.code)) return;
  heldDigitCodes.add(event.code);

  if (context.kind === 'current') {
    activateDegreeInContext({
      degree,
      octave: state.octave,
      sharpOn: state.sharpOn,
      category: deriveVisibleCategory(state),
      source: 'keyboard'
    });
    showKeyboardPressed(event.code, 'current');
    return;
  }

  activateDegreeInContext({
    degree,
    octave: context.octave,
    sharpOn: context.sharpOn,
    category: context.kind,
    source: 'keyboard'
  });
  showKeyboardPressed(event.code, context.kind);
}
```

`stopPropagation()`을 사용하지 않는다. 같은 앱의 다른 리스너는 `defaultPrevented`를 존중해 이중 실행을 막는다. 키보드 이벤트에서 실제 버튼의 합성 `.click()`을 만들지 말고 중앙 선택 액션을 직접 호출한다.

#### 6.3 `keyup`, blur, visibility 정리

`keyup`은 키가 눌린 외형만 해제한다. 트럼펫의 목표 운지와 현재 음은 유지한다.

```js
function releaseDigitVisual(code) {
  if (DEGREE_BY_CODE[code] === undefined) return;
  heldDigitCodes.delete(code);
  clearKeyboardPressed(code);
}

document.addEventListener('keyup', event => {
  releaseDigitVisual(event.code);
}, { capture: true });

function clearHeldKeyboardState() {
  heldDigitCodes.clear();
  clearAllKeyboardPressed();
}

window.addEventListener('blur', clearHeldKeyboardState);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') clearHeldKeyboardState();
});
```

사용자가 숫자보다 수정키를 먼저 놓을 수 있으므로 `keyup`에서 수정키 조합을 다시 판정하지 않는다. `event.code`만으로 눌린 외형과 Set을 정리한다.

---

### 7. 모든 입력을 하나의 원자적 선택 액션으로 통합하라

화면 버튼, 기존 무수정 숫자키, Ctrl, Shift, Alt가 각각 다른 음 선택 코드를 갖지 않게 한다.

```js
function activateDegreeInContext({
  degree,
  octave,
  sharpOn,
  category,
  source
}) {
  // 상태를 바꾸기 전에 후보를 먼저 검증한다.
  const note = noteFor(degree, octave, sharpOn);

  if (!note) {
    announceUnavailableShortcut({ degree, octave, sharpOn, category });
    return { ok: false, reason: 'unavailable' };
  }

  const previousMidi = state.currentMidi;

  // 하나의 커밋에서 UI 문맥과 음을 함께 맞춘다.
  state.octave = octave;
  state.sharpOn = sharpOn;
  state.selectedDegree = degree;
  state.currentMidi = note.midi;
  state.selectedAlt = null;
  state.lastInputSource = source;

  renderState();
  applyFingering(note.valves);

  if (state.soundOn) {
    playNote(note.midi, state.pitchMode);
  }

  // 키보드 입력에는 햅틱을 실행하지 않는다.
  if (source === 'pointer' && state.hapticOn) {
    safeVibrate(10);
  }

  announceShortcutSelection({
    note,
    valves: note.valves,
    category,
    repeated: previousMidi === note.midi
  });

  return { ok: true, note };
}
```

비활성 `Alt+3`, `Alt+7`은 후보 검증 단계에서 끝나야 한다.

- `state.octave` 변경 금지
- `state.sharpOn` 변경 금지
- `selectedDegree` 변경 금지
- `currentMidi` 변경 금지
- 손 포즈 변경 금지
- 오디오 변경 금지
- 햅틱 없음
- 점수·스케일 진행도 변경 금지
- 이유를 `aria-live`에 한 번만 알림

`pitchMode`, 음소거, 햅틱, 슬라이드, 모션 감소와 같은 사용자 설정은 단축키가 바꾸지 않는다.

---

### 8. 세 분류를 화면 UI에도 제공하라

일반 브라우저가 Ctrl/Alt 조합을 가로챌 수 있으므로 화면 입력은 선택 사항이 아니다.

#### 8.1 분류 선택기

```html
<div class="note-category-control" role="group" aria-label="계이름 분류">
  <button type="button" data-category="middleNatural" aria-pressed="true">
    낮은 계이름 <span>C4–C5</span> <kbd>Ctrl</kbd>
  </button>
  <button type="button" data-category="highNatural" aria-pressed="false">
    높은 계이름 <span>C5–C6</span> <kbd>Shift</kbd>
  </button>
  <button type="button" data-category="middleChromatic" aria-pressed="false">
    반음 <span>C4 기준</span> <kbd>Alt</kbd>
  </button>
</div>
```

- 분류 버튼만 바꾸면 숫자 키의 라벨과 disabled 상태는 갱신하되 소리·햅틱을 실행하지 않는다.
- 분류 변경 시 현재 `selectedDegree`가 새 문맥에서 유효하면 같은 숫자의 새 음으로 카드와 SVG 포즈를 조용히 전환한다. 유효하지 않으면 `currentMidi=null`로 선택을 해제하고 개방 포즈와 `활성 숫자를 선택하세요` 안내를 표시한다.
- 위 화면 분류 변경 정책과 달리, 단축키 `Alt+3`·`Alt+7` 자체는 기존 상태를 전혀 바꾸지 않고 비활성 이유만 알린다.
- 분류 버튼은 `role="tab"`이 아니라 실제 버튼 그룹과 `aria-pressed`를 사용한다.
- 단축키로 음을 선택하면 대응 분류 버튼도 선택 상태가 된다.
- 화면의 기존 옥타브·변음 컨트롤을 삭제하지 않는다. 세 분류 선택기는 빠른 학습 프리셋이다.
- 분류 상태와 `octave`/`sharpOn`이 어긋나지 않게 한 렌더 함수에서 파생한다.

#### 8.2 숫자 키패드

현재 선택된 분류에 맞춰 같은 8개 실제 `<button>`을 다시 렌더한다.

```html
<button
  type="button"
  class="degree-key"
  data-degree="1"
  aria-pressed="false"
  aria-keyshortcuts="Control+1"
  aria-label="낮은 계이름 1번 도, 기보 C4, 개방 운지">
  <strong>1</strong>
  <span>도</span>
  <small>C4 · 개방</small>
</button>
```

- 낮은 분류의 단축키 표시는 `Control+숫자`
- 높은 분류는 `Shift+숫자`
- 반음 분류는 `Alt+숫자`
- `aria-keyshortcuts`에는 실제 구현된 활성 분류의 조합만 넣는다.
- 비활성 `Alt+3`, `Alt+7`은 네이티브 `disabled`로 만들고 `aria-keyshortcuts`를 제거한다.
- 반음 키는 `도♯ / 레♭`, `C♯4 / D♭4`처럼 이명동음을 병기한다.
- 1번과 8번은 `도`, `위 도`를 구분한다.
- 현재 음 카드에 `낮은 계이름`, `높은 계이름`, `반음` 분류 배지를 텍스트로 표시한다.
- 색만으로 분류·선택·눌림을 구분하지 않는다.

#### 8.3 단축키 도움말

실제 `<dialog>`로 다음 표를 제공한다.

| 입력 | 기능 | 주의 |
|---|---|---|
| `Ctrl+1–8` | C4–C5 낮은 계이름 | 브라우저 탭 이동과 충돌할 수 있음 |
| `Shift+1–8` | C5–C6 높은 계이름 | 물리 상단 숫자열 사용 |
| `Alt+1–8` | C4 기준 반음 | 3·7은 초급 이명동음 중복으로 비활성 |
| `1–8` | 현재 화면 분류의 숫자 | 기존 동작 유지 |
| `R` | 현재 운지 동작 다시 보기 | 기존 동작 유지 |
| `Space` | 현재 음 다시 듣기 | 기존 동작 유지 |

dialog는 열 때 제목 또는 첫 컨트롤로 포커스를 보내고, `Escape`로 닫으며, 닫은 뒤 도움말 버튼으로 포커스를 돌려준다. dialog가 열린 동안 전역 음 단축키를 실행하지 않는다.

`accesskey` 속성을 사용하지 않는다. `aria-keyshortcuts`는 단축키를 만들어 주는 기능이 아니라 보조기술에 이미 구현된 단축키를 알리는 메타데이터일 뿐이므로 JavaScript와 화면 도움말을 모두 구현한다.

---

### 9. 기존 SVG 손가락·피스톤 모션을 재사용하라

단축키용 SVG나 별도 손 포즈를 복제하지 않는다. 조회한 `note.valves`를 기존 `applyFingering()`에 전달한다.

다음 기존 계약을 보존하라.

```text
viewBox: 0 0 760 460
검지 → #scene-finger-index  → #scene-valve-1
중지 → #scene-finger-middle → #scene-valve-2
약지 → #scene-finger-ring   → #scene-valve-3
피스톤 이동: translateY(14px)
누름: 120ms
해제: 170ms
3번 슬라이드: 220ms, 옵션
```

운지 전환 규칙:

1. 새로 필요한 밸브는 같은 프레임에 내려간다.
2. 더 이상 필요하지 않은 밸브는 같은 프레임에 올라간다.
3. 이전 음과 다음 음에 공통인 밸브는 계속 눌린 채 유지된다.
4. 손가락과 대응 피스톤의 시작 시각 차이는 한 프레임 이하다.
5. 최종 운지는 숫자 키를 놓거나 소리가 끝나도 유지된다.
6. `keyup`은 SVG 운지를 해제하지 않는다.
7. 같은 MIDI를 다시 선택하면 포즈를 억지로 풀지 않고 소리만 재발음한다.
8. 개방음 재입력에서 거짓 밸브 누름을 만들지 않는다.
9. 전체 놓임→누름 시연은 기존 `운지 동작 다시 보기`로만 실행한다.
10. 빠른 입력은 애니메이션 큐를 쌓지 않고 마지막 유효 입력이 이긴다.
11. `motionRevision` 또는 동등한 취소 토큰으로 오래된 타이머를 무효화한다.
12. reduced-motion에서는 정확한 최종 포즈를 한 프레임 안에 적용한다.

반드시 별도 검사할 전환:

```text
Ctrl+2 D4 [1,3] → Shift+2 D5 [1]
결과: 1번 검지는 계속 누름, 3번 약지만 올라감

Alt+1 C♯4 [1,2,3] → Ctrl+5 G4 []
결과: 세 손가락과 세 피스톤이 함께 해제

Ctrl+5 G4 [] → Alt+1 C♯4 [1,2,3]
결과: 세 손가락과 세 피스톤이 함께 누름

Ctrl+8 C5 [] → Shift+1 C5 []
결과: 분류·버튼 선택은 변경, 포즈는 개방 유지, 음만 재발음
```

표준 단축키는 `001`을 사용하지 않지만 렌더러에서 제거하지 않는다. 고급 운지의 A3, E4, A4, E5, A5 등의 대체 `3`으로 약지만 3번 피스톤을 누르는 포즈를 계속 검증한다.

---

### 10. 오디오·햅틱을 기존 선택 파이프라인에 연결하라

- 첫 사용자 활성화 전 `AudioContext`를 만들지 않는다.
- 단축키의 유효 첫 `keydown`에서 기존 `playNote(note.midi, pitchMode)`를 호출한다.
- 기보음 모드가 기본이며 실음 모드는 재생 MIDI만 −2 한다.
- 화면의 계이름, 기보음, 운지, 숫자 매핑은 실음 모드에서도 바꾸지 않는다.
- 새 음 전에 기존 음을 35–50ms 페이드해 클릭 노이즈를 막는다.
- 동시에 활성 음원은 하나만 유지한다.
- `event.repeat`에서는 오디오를 다시 시작하지 않는다.
- 같은 키를 실제로 놓았다 다시 누르면 같은 포즈를 유지한 채 음을 재발음한다.
- 키보드 입력에는 햅틱을 실행하지 않는다.
- 화면 버튼의 포인터 입력에는 기존 햅틱 설정을 적용한다.
- 비활성 단축키에는 오디오·햅틱이 모두 없어야 한다.

---

### 11. 접근성 문장을 분류까지 포함해 갱신하라

라이브 영역은 `aria-live="polite" aria-atomic="true"`를 사용하고 유효 선택당 한 문장만 알린다.

예시:

```text
낮은 계이름 2번 레, 기보 D4. 검지와 약지로 1번과 3번 밸브를 누릅니다. 실음 C4.
높은 계이름 2번 레, 기보 D5. 검지로 1번 밸브를 누릅니다. 실음 C5.
반음 1번 도 샤프 또는 레 플랫, 기보 C샤프4 또는 D플랫4. 세 밸브를 모두 누릅니다.
반음 3번은 이 초급 단계에서 미 샤프와 파의 중복을 피하기 위해 제공하지 않습니다.
```

규칙:

- `1-3`을 그대로 읽게 두지 말고 `1번과 3번 밸브`로 풀어 쓴다.
- `♯`, `♭`의 낭독용 문자열은 각각 `샤프`, `플랫`을 사용한다.
- repeat keydown에서는 라이브 영역을 갱신하지 않는다.
- 같은 음 재발음은 전체 설명을 반복하지 않고 `C5 음을 다시 들려줍니다`로 줄일 수 있다.
- 단축키 입력이 숫자 버튼으로 포커스를 강제 이동시키지 않는다.
- 화면의 실제 버튼은 Tab, Enter, Space로 모두 사용할 수 있다.
- VoiceOver의 Control+Option, AltGr의 Ctrl+Alt처럼 보조기술·입력기 조합을 exact-one 규칙으로 탈취하지 않는다.
- `prefers-reduced-motion`, 200% 확대, `forced-colors`에서도 기능과 정답 정보가 유지된다.

---

### 12. 반응형 레이아웃을 깨지 마라

#### 12.1 320–599px

- 현재 음 카드 → SVG → 세 분류 선택기 → 4열×2행 숫자 키패드 순서
- 분류 선택기는 3열 또는 세로 스택으로 표시하되 각 타겟 44×44px 이상
- 키패드는 문서 흐름 안의 sticky 하단 영역으로 유지 가능
- `env(safe-area-inset-bottom)` 포함
- 키패드가 본문·dialog를 가리지 않음
- 단축키 `<kbd>` 배지는 보조 정보이며 작은 화면에서 계이름을 밀어내지 않음

#### 12.2 600px 이상

- SVG와 컨트롤 2열 가능
- 키패드는 4×2 또는 오른쪽 2×4
- DOM 읽기 순서는 현재 음 → SVG 설명 → 분류 → 키패드 → 도움말

#### 12.3 필수 화면

```text
320×568
360×740
390×844
430×932
768×1024
844×390 landscape
1280×800
200% text zoom
```

어떤 화면에서도 가로 스크롤, 손·트럼펫 잘림, sticky 키패드 가림, dialog 잘림이 없어야 한다.

---

### 13. 단계별로 구현하고 단계마다 검증하라

#### 단계 1 — 기준선과 회귀 테스트

- [ ] 기존 테스트를 실행한다.
- [ ] 31음·대체 운지 10음·11조합 검사를 고정한다.
- [ ] 기존 `Digit1–8`, Space, R, 옥타브, 변음 동작을 기록한다.
- [ ] 실제 SVG ID와 8포즈 렌더 가능 여부를 기록한다.

완료 게이트: 새 코드를 쓰기 전 기존 실패와 새 실패를 구분할 수 있다.

#### 단계 2 — 순수 매핑 테스트부터 작성

- [ ] `SHORTCUT_CONTEXTS`, `DEGREE_BY_CODE`를 구현한다.
- [ ] 24개 조합 테이블 테스트를 작성한다.
- [ ] `Ctrl+8 === Shift+1 === MIDI 72`를 검사한다.
- [ ] `Alt+3`, `Alt+7`이 null이고 나머지 22개가 기존 `NOTES` 객체인지 검사한다.

완료 게이트: DOM 없이 매핑 테스트가 전부 통과한다.

#### 단계 3 — 중앙 선택 액션 통합

- [ ] 화면 버튼과 키보드가 `activateDegreeInContext()` 하나를 호출하게 한다.
- [ ] 후보 검증 뒤 한 번에 상태를 커밋한다.
- [ ] invalid 입력에서 상태·포즈·오디오 불변을 검사한다.
- [ ] 단축키마다 `selectedAlt=null`을 적용한다.

완료 게이트: 같은 입력을 화면과 키보드로 실행했을 때 상태 스냅숏이 같다.

#### 단계 4 — 키보드 수명주기

- [ ] exact-one 수정키 판정
- [ ] `event.code` 기반 상단 숫자열 판정
- [ ] IME·AltGraph·Meta·복합 수정키 제외
- [ ] editable·dialog 제외
- [ ] repeat/held Set 방지
- [ ] keyup·blur·visibility 정리
- [ ] `defaultPrevented`와 cancelable 처리

완료 게이트: 키를 길게 눌러도 한 번만 실행되고 stuck 키 외형이 없다.

#### 단계 5 — 분류 UI와 도움말

- [ ] 세 분류 버튼과 분류 배지
- [ ] 분류별 동적 8키 라벨
- [ ] 반음 3·7 disabled와 이유
- [ ] 활성 키의 `aria-keyshortcuts`
- [ ] 단축키 도움말 dialog와 포커스 복귀
- [ ] 브라우저 충돌 안내

완료 게이트: 키보드 단축키가 전혀 전달되지 않는 환경에서도 화면 버튼으로 22개 유효 명령을 모두 실행할 수 있다.

#### 단계 6 — SVG·오디오 연결

- [ ] `note.valves`를 기존 `applyFingering()`에 전달한다.
- [ ] 공통 밸브 유지와 동시 누름·해제를 검사한다.
- [ ] 키보드 오디오는 재생하고 햅틱은 생략한다.
- [ ] 같은 MIDI 재발음과 빠른 입력 취소를 검사한다.

완료 게이트: 카드·SVG·오디오의 마지막 MIDI가 항상 동일하다.

#### 단계 7 — 접근성·반응형·실기기 QA

- [ ] 라이브 문장 한 번만 출력
- [ ] VoiceOver/NVDA/TalkBack 경로
- [ ] reduced-motion·forced-colors·200% 확대
- [ ] 모든 기준 뷰포트
- [ ] Chrome/Edge/Firefox/Safari와 standalone 환경 수동 확인

완료 게이트: 알려진 브라우저 예약 단축키 제한은 기록되고, 화면 대체 경로는 모든 환경에서 작동한다.

#### 단계 8 — 자기완결 배포본과 보고

- [ ] 외부 요청 없는 최종 HTML 생성
- [ ] console error/warning 0
- [ ] 중복 SVG ID 0
- [ ] 자동 테스트와 수동 체크 결과 기록
- [ ] 수정 파일과 미수정 참조 파일 구분

완료 게이트: 아래 완료 정의 전체를 통과한다.

---

### 14. 자동 테스트를 구체적으로 작성하라

#### 14.1 매핑 테스트

```js
const expected = [
  ['middleNatural', 1, 60, []],
  ['middleNatural', 2, 62, [1,3]],
  ['middleNatural', 3, 64, [1,2]],
  ['middleNatural', 4, 65, [1]],
  ['middleNatural', 5, 67, []],
  ['middleNatural', 6, 69, [1,2]],
  ['middleNatural', 7, 71, [2]],
  ['middleNatural', 8, 72, []],
  ['highNatural', 1, 72, []],
  ['highNatural', 2, 74, [1]],
  ['highNatural', 3, 76, []],
  ['highNatural', 4, 77, [1]],
  ['highNatural', 5, 79, []],
  ['highNatural', 6, 81, [1,2]],
  ['highNatural', 7, 83, [2]],
  ['highNatural', 8, 84, []],
  ['middleChromatic', 1, 61, [1,2,3]],
  ['middleChromatic', 2, 63, [2,3]],
  ['middleChromatic', 3, null, null],
  ['middleChromatic', 4, 66, [2]],
  ['middleChromatic', 5, 68, [2,3]],
  ['middleChromatic', 6, 70, [1]],
  ['middleChromatic', 7, null, null],
  ['middleChromatic', 8, 73, [1,2]]
];
```

검사 항목:

- 정확히 24개 행
- 유효 22개, 비활성 2개
- 고유 MIDI 21개
- 모든 유효 결과가 `NOTES.find()`의 객체 참조와 동일
- 운지 배열과 포즈 키 일치
- `Ctrl+8`과 `Shift+1` 객체 동일
- `Alt+3`, `Alt+7` 외 null 없음

#### 14.2 키보드 해석 테스트

| ID | 입력 | 기대 결과 |
|---|---|---|
| K01 | `Ctrl+Digit1` | `middleNatural`, C4, 한 번 실행 |
| K02 | `Shift+Digit8` | `highNatural`, C6 |
| K03 | `Alt+Digit4` | `middleChromatic`, F♯4 |
| K04 | `key='!'`, `code='Digit1'`, Shift | C5 선택 |
| K05 | `Numpad1`, `Digit9`, `Unidentified` | 무시 |
| K06 | Meta, Ctrl+Shift, Ctrl+Alt, Shift+Alt | 무시·preventDefault 없음 |
| K07 | AltGraph | 무시 |
| K08 | IME composing 또는 229 | 무시 |
| K09 | 이미 `defaultPrevented` | 무시 |
| K10 | editable·dialog 문맥 | 무시 |
| K11 | 첫 keydown+repeat 20회 | 활성화·오디오·알림 각 1회 |
| K12 | keyup | 키 외형만 해제, 운지 유지 |
| K13 | modifier를 먼저 놓고 digit keyup | held Set 정상 정리 |
| K14 | blur·hidden | held Set과 눌림 외형 0개 |

#### 14.3 상태·DOM·모션 테스트

| ID | 시나리오 | 기대 결과 |
|---|---|---|
| I01 | Ctrl+2 | D4, MIDI62, 검지+약지, `101` |
| I02 | Shift+2 | D5, MIDI74, 검지, `100` |
| I03 | Alt+1 | C♯4, 세 손가락·세 피스톤, `111` |
| I04 | Alt+3 | 현재 상태·포즈·오디오 불변, 이유 1회 |
| I05 | Ctrl+8→Shift+1 | C5 유지, 포즈 변화 없음, 소리 재발음 |
| I06 | Ctrl+2→Shift+2 | 1번 유지, 3번 해제 |
| I07 | Alt+1→Ctrl+5 | 세 밸브 동시 해제 |
| I08 | Ctrl+5→Alt+1 | 세 밸브 동시 누름 |
| I09 | 빠른 교차 입력 20회 | 마지막 유효 음과 카드·SVG·오디오 일치 |
| I10 | reduced-motion | 한 프레임 안에 정확한 최종 포즈 |
| I11 | 화면 버튼과 동일 단축키 | MIDI·운지·라벨·알림 결과 동일 |
| I12 | 키보드 입력 | 햅틱 호출 0회 |

#### 14.4 회귀 테스트

- 기존 무수정 `Digit1–8` 유지
- 기존 Space 다시 듣기 유지
- 기존 R 운지 동작 다시 보기 유지
- 화면 옥타브·변음 컨트롤 유지
- 배우기·스케일·퀴즈 상태 충돌 없음
- `001` 대체 운지 유지
- D4·F♯5 삭제 대체 운지 재등장 없음
- 31음 검증 스크립트 통과
- 외부 요청 0
- 중복 SVG ID 0

#### 14.5 실제 브라우저 테스트

다음 환경에서 **이벤트 전달 여부**와 **화면 대체 경로**를 별도로 기록한다.

```text
Windows 11 Chrome
Windows 11 Edge
Windows 11 Firefox
macOS Safari
macOS Chrome
standalone PWA 또는 독립 창 환경
한국어·영문 키보드 배열
VoiceOver 또는 NVDA
외장 키보드가 연결된 모바일 기기
```

`Ctrl+1–8`이 브라우저 탭 전환으로 소비되어 앱에 도달하지 않는 것은 페이지 JavaScript로 항상 해결할 수 있는 문제가 아니다. 이를 통과한 것처럼 숨기지 말고 환경별 결과를 보고한다. 화면의 분류 선택기와 1–8 버튼은 모든 환경에서 통과해야 한다.

---

### 15. 절대 하지 말아야 할 구현

- 기존 `NOTES`를 단축키용으로 복제
- 계이름 문자열만 보고 운지 추론
- `Ctrl` 분류를 기존 C3 기반 `octave:'low'`로 연결
- Alt 결과를 직전 옥타브에 따라 변경
- `event.key`의 `1` 또는 `!`로 상단 숫자열 판정
- `keyCode`로 음 번호 매핑
- Ctrl+Alt를 Alt 또는 Ctrl로 처리
- Meta/Command를 Ctrl의 별칭으로 처리
- AltGr를 반음 단축키로 처리
- Numpad 숫자를 이번 기능에 암묵적으로 포함
- 모든 `keydown`에 무조건 `preventDefault()`
- 입력창·dialog에서 전역 음 단축키 실행
- repeat마다 오디오·모션 재시작
- keyup에서 손가락과 피스톤 해제
- 비활성 Alt+3·7에서 상태를 먼저 변경
- 키보드에서 실제 버튼 `.click()`을 합성해 이중 실행
- 같은 음을 다시 선택할 때 강제 놓임→재누름
- 단축키 때문에 기존 터치·포인터·접근성 경로 제거
- `accesskey`로 Ctrl/Shift/Alt 조합을 대체
- 일반 브라우저에서 Ctrl+숫자 100% 재정의를 보장한다고 주장
- 참조용 `output` HTML·SVG·PDF를 앱 파일로 덮어쓰기

---

### 16. 완료 정의

- [ ] Ctrl 8개가 C4–C5 자연음과 정확히 일치한다.
- [ ] Shift 8개가 C5–C6 자연음과 정확히 일치한다.
- [ ] Alt 8개 중 6개 유효 반음과 2개 비활성이 표와 일치한다.
- [ ] 22개 유효 단축키가 기존 `NOTES`의 동일 객체를 사용한다.
- [ ] `Ctrl+8`과 `Shift+1`이 같은 C5 객체를 사용한다.
- [ ] 단축키·화면 버튼이 중앙 선택 액션 하나를 공유한다.
- [ ] 상태·현재 음 카드·SVG·오디오·라이브 알림이 같은 결과를 공유한다.
- [ ] 검지=1, 중지=2, 약지=3 매핑이 유지된다.
- [ ] 여러 밸브의 누름·해제가 같은 프레임에 시작한다.
- [ ] 공통 밸브는 전환 중 눌린 상태를 유지한다.
- [ ] keyup과 소리 종료 뒤에도 목표 운지가 유지된다.
- [ ] 같은 음 재입력은 포즈 유지·음 재발음으로 동작한다.
- [ ] `event.code`, exact-one 수정키, AltGraph·IME·editable 제외가 구현된다.
- [ ] repeat, blur, visibility 정리가 구현된다.
- [ ] 비활성 단축키는 상태·포즈·오디오·진도를 변경하지 않는다.
- [ ] 화면의 세 분류와 8키가 모든 단축키의 동등한 대체 입력을 제공한다.
- [ ] 도움말에 브라우저 예약 단축키 제약을 명시한다.
- [ ] 키보드만으로도 화면 버튼 경로를 통해 전체 학습 흐름을 완료할 수 있다.
- [ ] reduced-motion, forced-colors, 200% 확대에서 기능이 유지된다.
- [ ] 기존 31음·대체 운지 검증이 통과한다.
- [ ] 모든 자동 테스트와 기준 뷰포트 시각 검사가 통과한다.
- [ ] 외부 요청, 콘솔 오류, 중복 SVG ID가 없다.
- [ ] 일반 브라우저와 standalone 환경의 실제 단축키 전달 결과를 구분해 보고한다.

---

### 17. 최종 보고 형식

작업이 끝나면 다음 순서로 보고하라.

1. 변경한 파일과 각 파일의 역할
2. 실제 앱 진입 파일과 실행 방법
3. Ctrl/Shift/Alt 24조합 결과 요약
4. 22개 유효·2개 비활성 검증 결과
5. 기존 31음 데이터 회귀 검사 결과
6. 상태·SVG·오디오 통합 검사 결과
7. 키보드 exact-one·repeat·IME·AltGraph 검사 결과
8. 접근성·반응형 검사 결과
9. Chrome/Edge/Firefox/Safari의 예약 단축키 전달 결과
10. 화면 대체 입력 검증 결과
11. 남은 플랫폼 한계 또는 후속 권장 사항

완료되지 않은 검사를 추측해 통과로 표시하지 마라. 브라우저가 Ctrl/Alt 이벤트를 전달하지 않은 경우 이를 코드 성공으로 포장하지 말고, 알려진 환경 제한과 화면 대체 경로 결과를 함께 보고하라.

---

## 공식 입력 제약 참고

- Chrome은 Windows/Linux에서 `Ctrl+1`부터 `Ctrl+8`까지를 특정 탭으로 이동하는 단축키로 문서화한다: <https://support.google.com/chrome/answer/157179>
- `KeyboardEvent.code`는 생성 문자보다 물리 키 위치를 나타내므로 Shift가 숫자를 기호로 바꾸는 입력을 구분하는 데 사용한다: <https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code>
- `KeyboardEvent.key`는 수정키와 키보드 배열을 반영한 문자를 반환한다: <https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key>
- `aria-keyshortcuts`는 구현된 단축키를 보조기술에 알릴 뿐 실제 동작을 만들지 않으며, 화면 도움말과 충돌 회피가 필요하다: <https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-keyshortcuts>

이 링크는 개발 검증용 참고이며 최종 오프라인 앱의 런타임 의존성이 아니다.
