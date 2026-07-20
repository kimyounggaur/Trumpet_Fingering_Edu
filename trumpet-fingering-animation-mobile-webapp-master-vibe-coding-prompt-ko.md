# 트럼펫 운지법 배우기 애니메이션 모바일 웹앱 — 마스터 바이브코딩 프롬프트

이 문서는 다음 두 설계 문서를 하나의 실행 가능한 개발 지시서로 통합한 마스터 프롬프트다.

```text
trumpet-solfege-fingering-animation-mobile-webapp-development-guide-ko.md
trumpet-solfege-c4-c5-semitone-shortcuts-vibe-coding-prompt-ko.md
```

아래 **붙여넣기용 마스터 프롬프트 전체**를 코딩 에이전트에게 제공하면, 자료 감사부터 실제 앱 구현·자동 테스트·시각 검수·오프라인 배포본 생성까지 한 흐름으로 수행하도록 설계되어 있다.

## 이 마스터 프롬프트가 고정하는 우선순위

문서와 로컬 산출물 사이에 충돌이 있으면 영역별로 다음 기준을 적용한다.

| 영역 | 최우선 기준 |
|---|---|
| 제품 범위·화면·구현 순서·완료 정의 | 이 마스터 프롬프트 |
| 31음 주운지·대체 운지·실음 | `output/trumpet-fingering-chart-hand.html`의 검증된 `NOTES` |
| 실제 SVG 바깥 ID·실루엣·기준 좌표 | `output/trumpet-fingering-chart-hand.html`의 `#trumpet-scene` |
| 인쇄 가독성·페이지 참고 | `output/trumpet-fingering-chart-hand.svg`, `output/pdf/trumpet-fingering-chart-hand.pdf` — 런타임 씬 원본으로 사용 금지 |
| Ctrl/Shift/Alt 의미와 키 수명 | 단축키 프롬프트 및 이 마스터 프롬프트의 보정 계약 |
| 세부 앱 설계·접근성·오디오 | v2 개발서와 이 마스터 프롬프트 |
| 구버전 루트 개발서·`01 Source` | 배경·교차검증 자료만 사용 |

어떤 영역에도 기준이 없을 때만 합리적인 구현 세부를 결정한다. 음 데이터, 단축키 의미, SVG 좌표처럼 사용자 의도를 바꾸는 추측은 하지 않는다.

참조용 `output` HTML·SVG·PDF는 수정 대상 앱이 아니다. 현재 작업공간에는 앱 소스가 없으므로, 재감사에서도 동일하다면 `app/index.html`을 유일한 실행·배포본으로 만든다.

---

## 붙여넣기용 마스터 프롬프트 전체

### 0. 역할, 임무, 최종 사용자 경험

너는 다음 역할을 동시에 수행하는 시니어 제품 개발자다.

1. B♭ 트럼펫 운지 데이터 검증자
2. 모바일 학습 UX·커리큘럼 설계자
3. 해부학적 손 SVG 일러스트레이터
4. SVG 리깅·모션 엔지니어
5. Web Audio 엔지니어
6. 키보드·포인터·상태 머신 엔지니어
7. 접근성·반응형 웹 엔지니어
8. 자동화·시각·실기기 QA 엔지니어

목표는 트럼펫 입문자가 숫자와 계이름을 선택하면, 화면의 B♭ 트럼펫과 양손이 정확한 연주 자세를 보여 주고 오른손 검지·중지·약지가 해당 피스톤을 누르거나 놓는 과정을 자연스럽게 시연하는 **완성도 높은 모바일 학습 웹앱**을 실제로 구현하는 것이다.

이 요청의 산출물은 또 다른 설계서가 아니라 실제 동작하는 앱 소스, 자기완결 배포본, 테스트, QA 보고서다. 계획만 제시하고 멈추지 말고 안전한 범위에서 구현과 검증까지 끝낸다.

각 구현 단계가 끝날 때 작업 로그와 `app/QA-REPORT.md`에 반드시 다음 네 항목을 남긴다.

1. 실제로 변경한 파일과 핵심 변경
2. 실행한 검증 명령
3. 추측이 아닌 실제 종료 코드·통과/실패 수·측정값
4. 남은 위험 또는 다음 단계 진입을 막는 실패

완료 게이트가 실패하면 다음 단계로 넘어가지 말고 원인을 수정한 뒤 같은 게이트를 다시 실행한다. 실행하지 않은 검사는 `통과`가 아니라 `미실행`으로 기록한다.

완성된 앱은 다음 경험을 제공해야 한다.

- 숫자 1–8과 계이름을 연결한다.
- C4–C5 낮은 계이름, C5–C6 높은 계이름, C4 기준 반음을 빠르게 연습한다.
- F♯3–C6의 31음 전체 표준 운지를 고급 `전체 음역` 컨트롤에서 학습한다.
- 음마다 오른손 손가락과 세 피스톤이 정확히 동기화된다.
- 왼손은 악기를 지지하고, 선택 설정에서만 저음 3번 슬라이드 보정을 보여 준다.
- 기보음과 B♭ 실음을 듣고 비교한다.
- 배우기, 스케일, 숫자 퀴즈, 밸브 퀴즈를 제공한다.
- 모바일 터치, 화면 버튼, 키보드, 스크린리더에서 같은 핵심 기능을 사용할 수 있다.
- 외부 네트워크 없이 단일 `app/index.html`로 실행된다.

파일이 존재한다는 이유만으로 완료하지 마라. 실제 화면을 렌더링하고 모든 핵심 입력을 실행하며 손가락–캡 접촉, 데이터, 오디오, 접근성, 모바일 레이아웃을 검증한 뒤에만 완료라고 보고하라.

---

### 1. 코드를 쓰기 전에 작업공간 전체를 감사하라

먼저 다음 파일을 UTF-8로 끝까지 읽어라.

```text
trumpet-solfege-fingering-animation-mobile-webapp-development-guide-ko.md
trumpet-solfege-c4-c5-semitone-shortcuts-vibe-coding-prompt-ko.md
output/trumpet-fingering-chart-hand.html
output/trumpet-fingering-chart-hand.svg
output/pdf/trumpet-fingering-chart-hand.pdf
output/trumpet-fingering-chart-vibe-coding-prompt-ko.md
scripts/generate_hand_fingering_chart.py
scripts/validate_hand_fingering_chart.py
```

`01 Source` 폴더의 HTML·SVG·PDF도 목록과 역할을 확인하되, 이미 보정된 최종 `NOTES`보다 우선하지 않는다.

`rg --files`, `rg`를 사용해 다음을 찾는다.

```text
index.html
app/**
src/**
tests/**
package.json
playwright.config.*
vite.config.*
```

감사 단계에서 다음을 확인하고 작업 로그에 기록하라.

- 실제 앱 구현 파일이 존재하는가
- 작업공간이 Git 저장소인지, 사용자 미커밋 변경이 있는가
- `NOTES` 선언 위치와 현재 값
- 기존 `midiFor()`, `noteFor()`, 선택 액션, 렌더 함수
- SVG 씬의 실제 viewBox·ID·피벗·캡 좌표
- 오디오 그래프와 활성 음원 정리 방식
- 기존 키보드·포인터 이벤트
- 기존 테스트와 실행 명령
- 참조 파일 검증 스크립트 결과
- 현재 화면을 열었을 때 콘솔 오류·경고

현재 워크스페이스 기준으로 앱 구현은 없다. 재감사에서도 없으면 묻고 멈추지 말고 greenfield 구현으로 진행해 `app/index.html`을 유일한 실행·배포본으로 생성한다. 루트나 `dist/`에 두 번째 `index.html`을 만들지 않는다. `output`의 참조 차트를 앱 진입 파일로 덮어쓰지 않는다.

사용자 변경과 관계없는 파일을 되돌리거나 정리하지 않는다. 수정 범위를 앱, 테스트, 필요한 빌드 스크립트로 제한한다.

#### 감사 단계 완료 게이트

- [ ] 기준 파일을 모두 읽음
- [ ] 앱 존재 여부와 진입점을 확인함
- [ ] 31음 검증 스크립트의 기존 결과를 기록함
- [ ] 실제 SVG ID와 좌표를 기록함
- [ ] 기존 실패와 새 실패를 구분할 기준선이 있음

이 게이트 전에는 UI나 운지 데이터를 구현하지 마라.

---

### 2. 제품 범위와 중요한 결정부터 고정하라

#### 2.1 핵심 제품 결정

1. 숫자 1–8은 밸브 번호가 아니라 `도–레–미–파–솔–라–시–위 도`의 차수다.
2. 밸브 번호는 1·2·3이고 각각 오른손 검지·중지·약지와 연결된다.
3. 실제 운지는 계이름 문자열이 아니라 `midi`로 `NOTES`를 조회해 결정한다.
4. 계이름과 화면 음이름은 B♭ 트럼펫 **기보음 기준 고정도법**이다.
5. 실음 모드는 소리만 기보 MIDI −2로 재생한다.
6. 숫자 키의 순간 눌림 효과는 손을 떼면 끝나지만, 트럼펫 목표 운지는 다음 음까지 유지한다.
7. 같은 음을 다시 선택하면 포즈를 유지하고 음만 다시 발음한다.
8. 전체 놓임→누름 교육 시연은 별도 `운지 동작 다시 보기`에서만 실행한다.
9. 개방음 재입력 때 거짓 피스톤 누름을 만들지 않는다.
10. 표준 주운지가 기본이며, 대체 운지는 고급 설정에서만 선택한다.
11. v2 개발서가 참조 output의 초기 D4를 설명하더라도 이 앱의 초기 선택은 숫자 1 학습 흐름에 맞춘 C4 개방으로 명시적으로 대체한다. 이는 초기 화면만의 결정이며 `NOTES` 데이터는 바꾸지 않는다.

#### 2.2 세 빠른 학습 분류

| 분류 | 화면 범위 | 화면·키보드 입력 | 내부 문맥 |
|---|---|---|---|
| `middleNatural` | 낮은 계이름 C4–C5 | 화면 분류 또는 `Ctrl+Digit1–8` | `mid,false` |
| `highNatural` | 높은 계이름 C5–C6 | 화면 분류 또는 `Shift+Digit1–8` | `high,false` |
| `middleChromatic` | 반음 C4 기준 | 화면 분류 또는 `Alt+Digit1–8` | `mid,true` |

여기서 `낮은 계이름 C4`와 기존 내부 `octave:'low'`를 혼동하지 않는다. 기존 `low`는 C3 기반 확장 문맥이다.

#### 2.3 전체 31음 접근

빠른 세 분류는 31음 전부를 포함하지 않는다. 나머지 F♯3–B3 저음 확장과 높은 음역 반음은 `전체 음역` 고급 패널의 다음 컨트롤로 제공한다.

```text
옥타브 문맥: low(C3 기반) / mid(C4 기반) / high(C5 기반)
변음: 자연음 / ♯·♭
숫자: 1–8
```

이 고급 패널은 기존 48개 문맥 중 유효한 35개 매핑을 통해 MIDI 54–84의 31음 합집합을 모두 제공해야 한다.

#### 2.4 범위 밖

- 마이크 입력으로 실제 연주 음정 채점
- 계정, 서버, 클라우드 동기화
- 외부 CDN·웹폰트·원격 음원 의존
- MIDI 장치 입력
- Service Worker·manifest·설치형 PWA
- 실제 연주자의 손 크기별 생체역학 시뮬레이션
- 반음 단축키에 숨은 직전 옥타브 상태 적용

---

### 3. 산출물과 파일 구조를 명확히 만들어라

현재처럼 기존 앱·프레임워크가 없다면 semantic HTML5, 현대 CSS, 모듈형 ES2022 JavaScript, inline SVG, Web Audio API로 구현한다. 제품 런타임 의존성과 CDN은 0으로 유지하고, 자동 테스트·번들링에만 고정 버전 개발 의존성을 허용한다. React나 대형 애니메이션 라이브러리를 새로 도입하지 않는다. 실행 가능한 HTML은 `app/index.html` 하나뿐이다.

```text
app/
├─ index.html                 # 최종 자기완결 실행·배포본
├─ package.json               # build/test/validate 스크립트, 런타임 외부 의존 없음
├─ package-lock.json          # 개발 의존성을 설치했다면 재현 가능하게 고정
├─ src/
│  ├─ main.js
│  ├─ template.js
│  ├─ data.js
│  ├─ mapping.js
│  ├─ store.js
│  ├─ scene.js
│  ├─ scene.svg
│  ├─ motion.js
│  ├─ audio.js
│  ├─ shortcuts.js
│  ├─ modes.js
│  ├─ ui.js
│  └─ styles.css
├─ tests/
│  ├─ data.test.mjs
│  ├─ mapping.test.mjs
│  ├─ shortcuts.test.mjs
│  ├─ state.test.mjs
│  ├─ modes.test.mjs
│  ├─ scene.test.mjs
│  └─ e2e/
│     └─ app.spec.*
├─ scripts/
│  ├─ build-single-file.mjs
│  └─ validate-app.mjs
├─ README.md
└─ QA-REPORT.md
```

기존 프로젝트 구조가 있다면 억지로 바꾸지 말고 동일한 책임 분리를 적용한다.

필수 최종 산출물은 다음과 같다.

| 경로 | 역할 |
|---|---|
| `app/index.html` | 사용자가 직접 여는 유일한 자기완결 앱·배포본 |
| `app/src/**` | 유지보수 가능한 원본 모듈과 스타일 |
| `app/tests/**` | 데이터·상태·입력·장면·E2E 회귀 테스트 |
| `app/scripts/**` | 단일 파일 빌드와 정적 검증 |
| `app/README.md` | 실행·빌드·테스트·브라우저 제약 안내 |
| `app/QA-REPORT.md` | 실제 명령·결과·스크린샷·알려진 제한의 증거 장부 |

두 입력 마크다운과 `output/**`, `01 Source/**`는 읽기 전용 기준 자료로 보존한다. 임시 스크린샷·렌더 파일은 앱 소스와 섞지 말고 `app/.qa-artifacts/`에 두며, 배포 HTML에는 포함하지 않는다.

최종 `app/index.html` 요구:

- 인라인 CSS
- 인라인 SVG
- 인라인 JavaScript
- favicon 자동 요청을 막는 인라인 `data:` SVG 아이콘
- 외부 요청 0건
- 로컬 파일 직접 열기 또는 정적 서버에서 실행
- 잘못된 임시 텍스트가 먼저 보였다가 JS로 고쳐지는 FOUC 없음
- 초기 화면은 1번 도 C4, 개방 운지를 데이터에서 렌더하되 자동 소리 없음

테스트를 위해 개발 코드를 모듈로 유지하되, `src/template.js`의 의미 구조, `src/scene.svg`, `src/styles.css`, `src/main.js` 진입점과 나머지 모듈을 빌드 단계에서 `app/index.html` 하나로 묶는다. `npm run build` 또는 동등한 한 명령으로 언제든 같은 최종 파일을 재생성해야 한다. 최종 HTML에는 import 문, 외부 module `src`, 외부 CSS·SVG가 남지 않으며 인라인 classic script 또는 완전히 번들된 인라인 module만 둔다. 개발 모듈은 테스트에서 직접 import하고, 최종 HTML은 `file://` 직접 열기와 정적 서버 실행을 모두 시험한다. 생성된 HTML을 수동 편집해 소스와 어긋나게 만들지 않는다.

`package.json`에는 최소한 다음 명령을 고정하고 `README.md`와 최종 보고에서 그대로 사용한다.

```text
npm run build       # app/index.html 재생성
npm test            # 데이터·매핑·상태·장면 단위/통합 테스트
npm run test:e2e    # 실제 브라우저 핵심 흐름·스크린샷
npm run validate    # 빌드 크기·인라인·ID·필수 구조 정적 검사
npm run qa          # build → test → test:e2e → validate 순차 실행
```

---

### 4. 음악 데이터를 단일 진실 공급원으로 동결하라

#### 4.1 `Note` 스키마

```js
/** @typedef {Object} Note
 * @property {number} midi
 * @property {string} name
 * @property {string|null} enh
 * @property {string} solfege
 * @property {number[]} valves
 * @property {number[][]} alts
 * @property {string} concert
 */
```

`output/trumpet-fingering-chart-hand.html`의 `NOTES`를 추출해 앱 데이터로 사용한다. UI, 퀴즈, 오디오, 단축키에 별도 운지표를 복사하지 않는다.

#### 4.2 필수 데이터 불변 조건

```js
assert.equal(NOTES.length, 31);
assert.deepEqual(NOTES.map(n => n.midi),
  Array.from({ length: 31 }, (_, i) => 54 + i));
assert.equal(new Set(NOTES.map(n => n.midi)).size, 31);
assert.equal(NOTES.filter(n => n.alts.length).length, 10);
assert.equal(NOTES.reduce((sum, n) => sum + n.alts.length, 0), 11);
assert.deepEqual(NOTES.find(n => n.midi === 62).alts, []); // D4
assert.deepEqual(NOTES.find(n => n.midi === 78).alts, []); // F♯5
```

개수만 맞는 손상 데이터도 통과시키지 않는다. 테스트는 canonical HTML의 `const NOTES=...;` JSON을 파싱한 `canonicalNotes`와 앱의 `NOTES`를 다음 필드 전체에서 `deepStrictEqual`한다.

```js
const NOTE_FIELDS = ['midi','name','enh','solfege','valves','alts','concert'];
assert.deepStrictEqual(
  NOTES.map(note => Object.fromEntries(NOTE_FIELDS.map(k => [k, note[k]]))),
  canonicalNotes.map(note => Object.fromEntries(NOTE_FIELDS.map(k => [k, note[k]])))
);
assert.ok(NOTES.every(note =>
  Object.keys(note).length === NOTE_FIELDS.length &&
  NOTE_FIELDS.every(key => Object.hasOwn(note, key))
));
```

이 검사는 `name`, `enh`, `solfege`, `concert`의 철자까지 고정한다. 별도 오디오 테스트에서는 문자열 비교와 분리해 모든 음에 `playbackMidi(written,'concert') === written - 2`가 성립하는지 검사한다.

앱의 `NOTES`, 각 note 객체, `valves`, `alts`와 그 내부 배열은 초기화 때 깊게 freeze한다. UI 정렬·퀴즈 비교·`poseKey()`가 원본 배열을 `sort()`, `push()`, `splice()`로 바꾸지 않으며 필요한 경우 복사본을 쓴다.

표준 포즈 회귀용 기대값:

```js
const EXPECTED_PRIMARY_POSE_BY_MIDI = Object.freeze({
  54:'111', 55:'101', 56:'011', 57:'110', 58:'100', 59:'010',
  60:'000', 61:'111', 62:'101', 63:'011', 64:'110', 65:'100',
  66:'010', 67:'000', 68:'011', 69:'110', 70:'100', 71:'010',
  72:'000', 73:'110', 74:'100', 75:'010', 76:'000', 77:'100',
  78:'010', 79:'000', 80:'011', 81:'110', 82:'100', 83:'010',
  84:'000'
});
```

#### 4.3 검증된 대체 운지

| 음 | 주운지 | 대체 운지 |
|---|---|---|
| A3 | 1-2 | 3 |
| E4 | 1-2 | 3 |
| G4 | 0 | 1-3 |
| A4 | 1-2 | 3 |
| C5 | 0 | 2-3 |
| D5 | 1 | 1-3 |
| D♯5/E♭5 | 2 | 2-3 |
| E5 | 0 | 1-2 또는 3 |
| G5 | 0 | 1-3 |
| A5 | 1-2 | 3 |

D4의 대체 `3`과 F♯5의 대체 `1-3`을 다시 추가하지 않는다.

---

### 5. 숫자·옥타브·변음 매핑을 순수 함수로 구현하라

```js
const DEGREE_OFFSET = [0, 2, 4, 5, 7, 9, 11, 12];
const OCTAVE_BASE = { low: 48, mid: 60, high: 72 };
const SHARPABLE = [true, true, false, true, true, true, false, true];

function midiFor(degree, octave, sharpOn) {
  if (!Number.isInteger(degree) || degree < 1 || degree > 8) return null;
  if (!Object.hasOwn(OCTAVE_BASE, octave)) return null;
  if (sharpOn && !SHARPABLE[degree - 1]) return null;

  const midi = OCTAVE_BASE[octave]
    + DEGREE_OFFSET[degree - 1]
    + Number(sharpOn);

  return midi >= 54 && midi <= 84 ? midi : null;
}

function noteFor(degree, octave, sharpOn) {
  const midi = midiFor(degree, octave, sharpOn);
  return midi === null
    ? null
    : NOTES.find(note => note.midi === midi) ?? null;
}
```

`미♯`, `시♯`은 이론상 존재하지만 초급 UI에서 F·C와의 중복을 피하려고 제공하지 않는다. `존재하지 않는 음`이라고 설명하지 않는다.

#### 5.1 빠른 학습 분류 매핑

| 입력 | MIDI | 표준 포즈 |
|---|---|---|
| Ctrl+1…8 | 60,62,64,65,67,69,71,72 | 000,101,110,100,000,110,010,000 |
| Shift+1…8 | 72,74,76,77,79,81,83,84 | 000,100,000,100,000,110,010,000 |
| Alt+1…8 | 61,63,비활성,66,68,70,비활성,73 | 111,011,—,010,011,100,—,110 |

위 요약을 추론으로 풀지 말고 다음 24행을 테스트 oracle로 고정한다. 런타임 데이터는 이 표를 별도 배열로 복제하지 않고 `noteFor()`로 `NOTES` 객체를 조회한다.

| 입력 | 숫자·계이름 | 기보음·MIDI | 표준 운지 | 포즈 |
|---|---|---|---|---|
| `Ctrl+1` | 1 도 | C4 · 60 | 개방 | `000` |
| `Ctrl+2` | 2 레 | D4 · 62 | 1-3 | `101` |
| `Ctrl+3` | 3 미 | E4 · 64 | 1-2 | `110` |
| `Ctrl+4` | 4 파 | F4 · 65 | 1 | `100` |
| `Ctrl+5` | 5 솔 | G4 · 67 | 개방 | `000` |
| `Ctrl+6` | 6 라 | A4 · 69 | 1-2 | `110` |
| `Ctrl+7` | 7 시 | B4 · 71 | 2 | `010` |
| `Ctrl+8` | 8 위 도 | C5 · 72 | 개방 | `000` |
| `Shift+1` | 1 도 | C5 · 72 | 개방 | `000` |
| `Shift+2` | 2 레 | D5 · 74 | 1 | `100` |
| `Shift+3` | 3 미 | E5 · 76 | 개방 | `000` |
| `Shift+4` | 4 파 | F5 · 77 | 1 | `100` |
| `Shift+5` | 5 솔 | G5 · 79 | 개방 | `000` |
| `Shift+6` | 6 라 | A5 · 81 | 1-2 | `110` |
| `Shift+7` | 7 시 | B5 · 83 | 2 | `010` |
| `Shift+8` | 8 위 도 | C6 · 84 | 개방 | `000` |
| `Alt+1` | 도♯ / 레♭ | C♯4 / D♭4 · 61 | 1-2-3 | `111` |
| `Alt+2` | 레♯ / 미♭ | D♯4 / E♭4 · 63 | 2-3 | `011` |
| `Alt+3` | 미♯ = 파 | E♯4 = F4 | 비활성: 이명동음 중복 | — |
| `Alt+4` | 파♯ / 솔♭ | F♯4 / G♭4 · 66 | 2 | `010` |
| `Alt+5` | 솔♯ / 라♭ | G♯4 / A♭4 · 68 | 2-3 | `011` |
| `Alt+6` | 라♯ / 시♭ | A♯4 / B♭4 · 70 | 1 | `100` |
| `Alt+7` | 시♯ = 도 | B♯4 = C5 | 비활성: 이명동음 중복 | — |
| `Alt+8` | 위 도♯ / 레♭ | C♯5 / D♭5 · 73 | 1-2 | `110` |

다음 조건을 고정한다.

- 24개 단축키 문맥 중 유효 22개, 비활성 2개
- 유효 결과의 고유 MIDI 21개
- `Ctrl+8`과 `Shift+1`은 동일한 C5 `Note` 객체
- `Alt+3`, `Alt+7`은 기존 상태를 바꾸지 않고 이유만 알림
- 빠른 세 분류에 없는 31음은 전체 음역 패널로 접근

#### 5.2 전체 음역 매핑

`low/mid/high × natural/sharp × 1–8`의 48개 문맥을 모두 열거해 검사한다.

- 유효 문맥: 35개
- 비활성 문맥: 13개
- 유효 MIDI 합집합: 정확히 54–84의 31음
- 같은 MIDI의 중복 문맥은 같은 `Note` 객체

---

### 6. 앱 상태와 중앙 선택 액션을 설계하라

#### 6.1 최소 상태

```js
const state = {
  mode: 'learn',               // learn | scale | quiz-number | quiz-valves
  octave: 'mid',               // low | mid | high
  sharpOn: false,
  selectedDegree: 1,
  currentMidi: 60,
  selectedAlt: null,
  pitchMode: 'written',        // written | concert
  soundOn: true,
  hapticOn: true,
  slideMotionOn: false,
  motionPreference: 'system',   // system | reduced
  shortcutsOn: true,
  openDialogId: null,
  lastInputSource: 'initial',
  motionRevision: 0,
  scale: {
    direction: 'ascending',
    sessionOctave: 'mid',
    sessionSharpOn: false,
    expectedDegree: 1,
    runningSequenceId: 0
  },
  quiz: {
    questionType: 'staff',      // staff | name | sound
    targetDegree: null,
    targetOctave: null,
    targetSharpOn: false,
    inputValves: [],
    feedbackPhase: 'answering', // answering | revealed
    attemptsThisQuestion: 0,
    firstTryCorrectCount: 0,
    answeredCount: 0,
    wrongWeightByQuestion: {},
    lastQuestionKey: null,
    questionIndex: 0
  },
  learnSnapshot: {
    degree: 1, octave: 'mid', sharpOn: false
  }
};
```

`currentNote`, `activeValves`, `poseKey`, 키패드 모델, 현재 분류와 `quizTargetNote`는 파생값이다. 중복 저장하지 않는다. `quiz.targetDegree`와 target 문맥은 C5처럼 숫자 8과 1이 모두 될 수 있는 경계음을 모호하지 않게 채점하기 위한 문제 정의이지, 현재 선택 문맥의 복제가 아니다.

```js
function activeValves(state, note) {
  if (!note) return [];
  return state.selectedAlt === null
    ? note.valves
    : note.alts[state.selectedAlt] ?? note.valves;
}

function deriveCategory({ octave, sharpOn }) {
  if (octave === 'mid' && !sharpOn) return 'middleNatural';
  if (octave === 'high' && !sharpOn) return 'highNatural';
  if (octave === 'mid' && sharpOn) return 'middleChromatic';
  return 'fullRange';
}
```

#### 6.2 중앙 선택 액션

모든 화면 버튼과 키보드는 `순수 해석 → 원자적 dispatch → 파생 렌더 → 단일 effect coordinator`의 한 경로를 사용한다. 함수마다 `state`를 직접 바꾸지 않는다.

```js
function resolveSelection({ degree, octave, sharpOn, source, play = true }) {
  const note = noteFor(degree, octave, sharpOn);
  if (!note) return { ok:false, reason:'unavailable' };
  return {
    ok:true,
    note,
    action:{
      type:'COMMIT_SELECTION',
      payload:{ degree, octave, sharpOn, currentMidi:note.midi,
        selectedAlt:null, lastInputSource:source }
    },
    effect:{ source, play }
  };
}

function activateDegreeInContext(input) {
  const resolved = resolveSelection(input);
  if (!resolved.ok) {
    announceUnavailable(input);
    return resolved;
  }

  const previous = store.getState();
  store.dispatch(resolved.action); // reducer에서 한 번에 커밋
  const next = store.getState();

  // store subscriber의 renderState는 DOM 정보만 렌더한다.
  runSelectionEffects({
    previous,
    next,
    note:resolved.note,
    ...resolved.effect
  });
  return resolved;
}
```

후보를 검증하기 전에 상태를 변경하지 않는다. 비활성 키는 현재 음, 포즈, 오디오, 점수, 스케일 진행도를 바꾸지 않는다.

모든 사용자 입력은 `activateDegreeInContext()`를 직접 호출하기 전에 `handleIntent(intent)` 하나를 통과한다. 이 함수는 현재 모드의 정책을 적용해 `allow-selection`, `preview-only`, `quiz-answer`, `deny` 중 하나를 반환한다. `deny`는 한 번 안내하고 무상태로 끝내며, `quiz-answer`는 퀴즈 reducer로만 보낸다. 스케일의 `preview-only` 선택은 장면·카드·소리는 갱신하지만 `expectedDegree`를 바꾸지 않는다. 화면·키보드·자동 시연이 이 가드를 우회하지 못하게 한다.

`runSelectionEffects()`만 다음 부작용을 소유한다.

```text
sceneController.setFingering(activeValves)
audioController.playNote(...)
hapticsController.pulse(...)
announcer.announce(...)
```

coordinator는 `const nextNote = noteByMidi(next.currentMidi)`와 `derivePresentation(next)`를 먼저 파생하며 `resolved.note.valves`를 직접 고정하지 않는다. 자유·스케일 또는 퀴즈 공개 단계의 장면 목표는 `activeValves(next,nextNote)`, 퀴즈 answering 단계는 `presentation.candidateValves ?? []`이다. 그래야 대체 운지·선택 해제·퀴즈 후보가 같은 장면 경로를 사용하면서 target 운지는 새지 않는다. `nextNote=null`이면 자동 소리는 없다.

`renderState()`는 다시 `applyFingering()`·`playNote()`를 호출하지 않는다. `.pressed`는 논리·접근성 상태를 나타내며 실제 정밀 관절 transform은 motion controller 하나가 소유한다. CSS whole-finger 회전과 rAF 관절 보간을 동시에 적용하지 않는다.

분류·옥타브·변음 컨트롤만 바꿀 때는 같은 `selectedDegree`를 새 문맥에서 조용히 다시 해석한다. 유효하면 `selectedAlt=null`로 주운지에 돌아가 카드·포즈만 갱신하고 소리·햅틱은 실행하지 않는다. 무효면 `currentMidi=null`, `selectedAlt=null`로 선택을 해제하고 개방 포즈와 이유를 안내한다.

대체 운지 선택은 현재 `note.alts` 범위의 인덱스만 받아 `SELECT_ALTERNATE`로 커밋한다. `midi`, 계이름, 옥타브·변음 문맥은 유지하고 카드의 운지 설명과 손·피스톤 포즈만 바꾸며 자동 소리·햅틱은 내지 않는다. `기본 운지`는 `selectedAlt=null`이다. 음이 바뀌면 항상 기본 운지로 돌아간다.

---

### 7. 모바일 정보 구조와 디자인 시스템을 구현하라

#### 7.1 390×844 기준 화면 순서

```text
┌─────────────────────────────────┐
│ 제목 · 음소거 · 설정            │
├─────────────────────────────────┤
│ 현재 분류 · 숫자 · 계이름 · 음명 │
│ 손가락 · 밸브 · 실음 · 다시 보기 │
├─────────────────────────────────┤
│                                 │
│       트럼펫 + 양손 SVG          │
│                                 │
├─────────────────────────────────┤
│ 배우기 · 스케일 · 숫자/밸브 퀴즈 │
│ 낮은 C4 · 높은 C5 · 반음         │
│ [1][2][3][4]                    │
│ [5][6][7][8]                    │
└─────────────────────────────────┘
  sticky 키패드 + 하단 safe area
```

#### 7.2 핵심 컴포넌트

| 컴포넌트 | 책임 |
|---|---|
| Header | 제목, 음소거, 설정·도움말 |
| CurrentNoteCard | 분류, 숫자, 계이름, 기보음, 실음, 운지, 손가락 |
| TrumpetScene | 양손·트럼펫·피스톤 모션 |
| ReplayMotionButton | 현재 운지 놓임→누름 교육 시연 |
| ModeControl | 배우기, 스케일, 숫자 퀴즈, 밸브 퀴즈 |
| CategoryControl | 낮은 C4, 높은 C5, C4 반음 |
| DegreeKeypad | 동적 1–8 실제 버튼 |
| FullRangePanel | 31음 전체 옥타브·변음 제어 |
| AltFingeringPicker | 검증된 대체 운지 고급 선택 |
| SettingsDialog | 소리, 햅틱, 실음, 슬라이드, 단축키, 모션 줄이기 |
| ShortcutHelpDialog | 단축키와 브라우저 제약 설명 |
| LiveStatus | 스크린리더 한 문장 알림 |

#### 7.3 분류와 키패드

- 분류는 실제 버튼 그룹과 `aria-pressed`를 사용한다.
- 화면 음역 명칭은 `C3 기반 전체 문맥 · 지원 F♯3–C♯4`, `낮은 계이름 C4–C5`, `높은 계이름 C5–C6`처럼 절대 음역을 병기한다. 빠른 세 분류 밖의 고유 추가 저음만 말할 때는 `저음 확장 F♯3–B3`로 쓴다. `낮음`만 단독으로 써 C3 low와 C4 분류를 혼동시키지 않는다.
- 키패드는 실제 `<button>` 8개다.
- 숫자 최소 24px, 계이름 16px, 음이름 12px 이상이다.
- 1번 `도`, 8번 `위 도`를 구분한다.
- 반음은 `도♯ / 레♭`, `C♯4 / D♭4`처럼 병기한다.
- 반음 3·7은 네이티브 `disabled`이며 이유를 인접 도움말에 표시한다.
- 선택은 골드 테두리, 위치, 텍스트, `aria-pressed`로 함께 표시한다.
- 색만으로 눌린 밸브·선택·정오답을 전달하지 않는다.

상태 표현을 섞지 않는다.

| 표현 | 의미 |
|---|---|
| `.is-selected` + `aria-pressed` | 현재 유지되는 숫자·분류 선택 |
| `.is-key-held` | pointer/key가 내려가 있는 동안만 보이는 순간 키 외형 |
| SVG `.pressed` | 목표 운지에 포함된 손가락·피스톤의 논리 상태 |
| 관절·피스톤 `transform` | `MotionController`만 쓰는 연속 시각 상태 |

#### 7.4 설정 dialog

실제 `<dialog>`를 사용한다.

- 열 때 첫 컨트롤로 포커스 이동
- Escape와 닫기 버튼 지원
- 닫은 뒤 호출 버튼으로 포커스 복귀
- 열린 동안 배경 전역 단축키 비활성
- 지원하지 않는 햅틱은 비활성 상태와 이유 표시

---

### 8. `output`의 정교한 SVG를 화면 씬으로 이식하라

#### 8.1 canonical geometry

```text
viewBox: 0 0 760 460
벨: 왼쪽
마우스피스: 오른쪽
화면 밸브 순서: 3, 2, 1
3번 캡 중심: (320,165)
2번 캡 중심: (385,165)
1번 캡 중심: (450,165)
캡 반지름: 18
피스톤 이동: +14px Y
```

반드시 유지할 바깥 ID:

```text
#trumpet-scene
#scene-trumpet
#scene-bell
#scene-valve-casings
#scene-slide-3
#scene-valve-1
#scene-valve-2
#scene-valve-3
#scene-left-hand
#scene-lh-ring
#scene-right-hand
#scene-finger-index
#scene-finger-middle
#scene-finger-ring
```

현재 `output`의 곡선 손가락, 손톱, 관절 주름, 피부 하이라이트, 엄지, 소지, 왼손, 3·2·1 라벨을 보존한다. 더 단순한 막대 손가락으로 다시 그리지 않는다.

퀴즈 오선에 독립 SVG의 Bravura 기반 음표 글리프를 재사용하면 해당 SVG metadata와 화면의 크레딧에서 SIL OFL 저작자 표시를 보존한다. 글리프를 복사해 놓고 출처·라이선스 정보를 삭제하지 않으며, 런타임 웹폰트 요청은 만들지 않는다.

#### 8.2 레이어

```text
#scene-background
#scene-left-hand-back
#scene-trumpet
#scene-left-hand
#scene-right-hand-base
#scene-right-hand-fingers
#scene-overlays
```

왼손 후면 일부는 악기 뒤, 손가락 전면은 악기 앞에 그려 파지 깊이를 표현한다. 오른손 엄지는 1·2번 케이싱 사이 아래, 소지는 핑거 후크에 고정한다.

#### 8.3 정밀 손가락 리그

최종 품질에서는 각 움직이는 손가락을 다음 중첩 구조로 만든다.

```text
.finger-rig
└─ .joint-mcp
   ├─ .segment-proximal
   └─ .joint-pip
      ├─ .segment-middle
      └─ .joint-dip
         ├─ .segment-distal
         ├─ .finger-pad
         ├─ .nail
         ├─ .crease
         └─ .contact-anchor
```

초기 캘리브레이션:

| 손가락 | 밸브 | MCP 루트 | 근위/중위/원위 투영 길이 |
|---|---:|---:|---:|
| 검지 | 1 | 575,105 | 58 / 52 / 32 |
| 중지 | 2 | 550,88 | 70 / 67 / 48 |
| 약지 | 3 | 525,101 | 78 / 82 / 58 |

이 값은 시작점이다. 캡 중심과 14px 이동은 바꾸지 말고 관절 각도와 링크 길이만 보정한다.

세그먼트는 관절에서 5–8px 겹쳐 회전 중 틈이 생기지 않게 한다. CSS bounding box에 의존하는 임의 `transform-origin`보다 중첩 SVG 행렬을 사용한다.

현재 whole-finger 회전은 기준선 캡처와 초기 scaffold에서만 허용한다. 최종 릴리스는 MCP/PIP/DIP 정밀 리그가 필수이며 whole-finger CSS rotate가 남아 있으면 완료가 아니다. 리그가 손을 조악하게 만들면 각 관절 path와 각도를 고쳐야 하며, 기존 방식으로 되돌린 채 완료 처리하지 않는다. 최종 실루엣은 기존 손보다 같거나 더 자연스러워야 한다.

---

### 9. 8개 운지 포즈와 모션 엔진을 구현하라

#### 9.1 포즈

| 포즈 | 운지 | 오른손 |
|---|---|---|
| `000` | 개방 | 모두 놓음 |
| `100` | 1 | 검지 |
| `010` | 2 | 중지 |
| `001` | 3 | 약지 |
| `110` | 1-2 | 검지+중지 |
| `101` | 1-3 | 검지+약지 |
| `011` | 2-3 | 중지+약지 |
| `111` | 1-2-3 | 검지+중지+약지 |

```js
const poseKey = valves => [1, 2, 3]
  .map(number => valves.includes(number) ? '1' : '0')
  .join('');
```

`001`은 표준 주운지에서 잘 보이지 않지만 대체 운지 `3` 때문에 필수다.

#### 9.2 타이밍

| 동작 | 시간 | 이징 |
|---|---:|---|
| 새 피스톤·손가락 누름 | 120ms | `cubic-bezier(.3,0,.2,1)` |
| 피스톤·손가락 해제 | 170ms | `cubic-bezier(.34,1.3,.3,1)` |
| 3번 슬라이드·왼손 약지 | 220ms | `ease-out` |
| 교육용 다시 보기의 짧은 놓임 | 70ms | `ease-out` |

#### 9.3 상태 전환 규칙

1. 바뀌는 모든 밸브 채널은 같은 `performance.now()`로 시작한다.
2. 새로 필요한 밸브는 내려간다.
3. 불필요해진 밸브는 올라간다.
4. 두 운지에 공통인 밸브는 계속 눌린다.
5. 전환 중 새 입력이 오면 현재 위치에서 새 목표로 이어진다.
6. 애니메이션 큐·완료 Promise·오래된 timeout을 쌓지 않는다.
7. 마지막 유효 입력이 최종 상태다.
8. 소리 종료와 포즈 수명을 연결하지 않는다.
9. `transitionend`가 없어도 상태가 완료된다.

#### 9.4 공유 진행도

정밀 엔진에서는 밸브별 `p∈[0,1]`을 피스톤과 손가락이 공유한다.

프레임별 `p`와 보간 시작값은 `MotionController` 내부에만 두고 중앙 store를 매 프레임 갱신하지 않는다. store의 파생 `activeValves`와 `poseKey`가 목표의 논리적 진실이며, 컨트롤러가 끝나면 정확히 그 목표에 스냅한다.

```js
function capTarget(number, p) {
  const cap = {
    1:{cx:450,cy:165,r:18},
    2:{cx:385,cy:165,r:18},
    3:{cx:320,cy:165,r:18}
  }[number];
  return { x: cap.cx, y: cap.cy - cap.r + 14 * p + 1 };
}
```

`capTarget()`은 캡 중심이 아니라 손가락 패드가 닿는 **캡 윗면 접촉점**이다. 캡 중심 `(cx,cy)`를 보존하는 `data-cap-center`와 캡 그룹 안에서 함께 움직이는 `data-cap-contact`를 별도 앵커로 둔다. 손가락의 `data-tip`은 패드 중심 접촉점이어야 하며 손톱 끝을 사용하지 않는다.

한 접촉점만 맞추는 임의 IK 해를 쓰지 않는다. 각 손가락의 출력 상대 굴곡각은 해부학적 한계인 MCP −5°…65°, PIP 0°…105°, DIP −5°…80° 안에 두고, 다음 목적을 순서대로 최소화한다.

1. finger-pad와 캡 접촉점 거리
2. output 기준 중립 포즈에서의 불필요한 각도 이탈
3. 이전 `p` 샘플과의 각도 변화량과 2차 차분
4. 손가락끼리·케이싱과의 교차 페널티

빌드 또는 초기화 때 `p=0..1`의 33개 관절 포즈를 계산하고 런타임에는 인접 포즈를 보간한다. 33개 node의 root SVG 좌표계 solver 접촉 오차는 0.75 user unit 이하이다. 각 node뿐 아니라 그 사이 32개 중간점, 즉 최소 `p=k/64`의 65개 점에서도 접촉 오차 1.5 user unit 이하·관절 한계·교차를 검사한다. 인접 lookup 샘플의 관절각 점프는 관절당 4° 이하이고 부호가 갑자기 뒤집히는 지그재그가 없어야 한다. 대표 전환의 실제 렌더 프레임에서도 같은 1.5 user-unit 기준을 재검사한다. 프레임마다 IK를 다시 풀거나 `getBBox()`로 레이아웃을 읽지 않는다. 하나의 공유 `requestAnimationFrame`만 사용하고 모든 채널이 도달하면 종료한다.

#### 9.5 접촉 품질

- 피스톤 최종 이동: 14±0.5 SVG user unit
- 정밀 리그 손끝–캡 거리: 1.5 SVG user unit 이하
- 손끝 수평 이탈: 1.5 SVG user unit 이하
- 390px 화면 캡처에서 시각적 배경 틈: 2 screen px 이하
- 눌린 손끝과 캡 사이 배경색 틈 없음
- 손가락이 케이싱·관을 관통하지 않음
- 세 손가락 동시 포즈에서 교차·순서 역전 없음

단위가 다른 검사를 한 식에 섞지 않는다.

1. 순수 scene/solver 테스트는 `SceneModel.samplePose()`가 반환한 root SVG user 좌표의 `tip`과 `capContact`를 비교해 0.75/1.5 user-unit 기준을 검사한다.
2. 브라우저 시각 테스트는 `data-tip`과 `data-cap-contact`를 `DOMPoint.matrixTransform(getScreenCTM())`으로 CSS screen px에 변환해 390px 캡처의 보이는 틈 2px 기준을 검사한다.
3. `getScreenCTM()` 결과를 그대로 user-unit 임계치와 비교하거나, 움직이는 캡의 정적 중심점에 손끝을 맞추지 않는다.

개발 검사에는 세 앵커를 유지하되 화면에는 보이지 않게 한다. `data-cap-center`는 geometry 확인용, `data-cap-contact`는 실제 접촉 검사용이다.

#### 9.6 3번 슬라이드

기본값은 꺼짐이다. 켜면 기존 교육용 임시 규칙을 적용한다.

```js
const needsSlide = state.slideMotionOn
  && note !== null
  && note.midi <= 62
  && activeValves.includes(1)
  && activeValves.includes(3);
```

이는 F♯3, G3, C♯4, D4의 시각적 보정 예시이며 정밀 센트 계산 모델이 아니다. 고음 대체 운지에는 자동 적용하지 않는다.

왼손 약지 whole-group translate는 기준 구현일 뿐이다. 정밀 리그에서는 MCP 루트를 손바닥에 고정하고 관절만 펴 손끝이 슬라이드 링을 따라가게 한다.

조건이 true가 되면 밸브 모션 시작 20ms 뒤 `#scene-slide-3`을 X −14 SVG user unit으로 220ms `ease-out` 이동하고 왼손 약지 패드는 이동한 `#scene-lh-ring`과 접촉을 유지한다. false, `currentNote=null`, 설정 OFF, 모드 전환이면 현재 위치에서 X 0으로 복귀한다. 빠른 음 변경은 motion revision으로 이전 20ms 예약과 220ms 목표를 취소·재지정하며 timeout 큐를 남기지 않는다. 자동 검사는 이동량 −14±0.5, MCP root 이동 ≤0.5, 약지–링 접촉, true→false→true 연타의 최종 위치를 확인한다.

#### 9.7 모션 감소

유효 감소 모드는 `matchMedia('(prefers-reduced-motion: reduce)').matches || state.motionPreference === 'reduced'`로 계산한다. 시스템 설정이 항상 우선하고 사용자는 `system`에서 `reduced`로 추가 감소만 할 수 있으며, 시스템이 reduce인데 강제 전체 모션을 켜는 옵션은 제공하지 않는다. media query 변경도 즉시 반영한다.

유효 감소 모드에서는 진행 중 rAF·replay·slide delay를 취소하고 장식 펄스·흔들림·보간을 제거한 뒤 한 프레임 안에 정확한 최종 손가락·피스톤·슬라이드 상태를 표시한다. 교육용 다시 보기의 인위적 놓임 단계도 생략하되 정답 정보와 최종 포즈를 제거하지 않는다.

---

### 10. 포인터·키보드 입력을 안전하게 통합하라

#### 10.1 포인터

- 실제 버튼의 `click`을 의미상 활성화 이벤트로 사용한다.
- `pointerdown/up/cancel`은 눌린 외형에만 사용한다.
- pointerdown의 `pointerId`를 기록하고 document/window 수준의 `pointerup`, `pointercancel`, `lostpointercapture`, blur에서 `.is-key-held`를 반드시 정리한다. 네이티브 click의 안/밖 release 판정을 바꿀 수 있는 무조건적 pointer capture는 사용하지 않는다.
- 포인터와 click에 같은 음 로직을 이중 연결하지 않는다.
- click을 모두 `source:'pointer'`로 단정하지 않는다. 직전 pointerdown과 같은 컨트롤에서 만들어진 click만 pointer로 분류하고, Enter/Space·스크린리더가 만든 합성 click은 `keyboard` 또는 `assistive`로 분류해 햅틱을 실행하지 않는다.
- 구체적으로 `event.isTrusted`, pointerId, pointerType, 대상 button, pointerdown 시각을 가진 일회성 provenance를 기록한다. 동일 button의 정상 pointerup 뒤 750ms 안에 온 click에만 이를 한 번 소비해 pointer로 판정하고, cancel·blur·다른 대상·시간 초과·이미 소비됨·`isTrusted:false`이면 pointer가 아니다. 테스트나 앱 코드가 `.click()`을 호출해 햅틱을 우회하지 못한다.
- `touch-action: manipulation`을 적용한다.
- 멀티터치는 마지막 유효 선택이 승리한다.

#### 10.2 키보드 문맥

```js
const SHORTCUT_CONTEXTS = Object.freeze({
  middleNatural:Object.freeze({octave:'mid',sharpOn:false}),
  highNatural:Object.freeze({octave:'high',sharpOn:false}),
  middleChromatic:Object.freeze({octave:'mid',sharpOn:true})
});

const DEGREE_BY_CODE = Object.freeze({
  Digit1:1, Digit2:2, Digit3:3, Digit4:4,
  Digit5:5, Digit6:6, Digit7:7, Digit8:8
});

function shortcutContextFromEvent(event) {
  if (event.metaKey || event.getModifierState?.('AltGraph')) return null;

  const modifierCount = Number(event.ctrlKey)
    + Number(event.shiftKey)
    + Number(event.altKey);

  if (modifierCount === 0) return { kind:'current' };
  if (modifierCount !== 1) return null;
  if (event.ctrlKey) return {
    kind:'middleNatural', ...SHORTCUT_CONTEXTS.middleNatural
  };
  if (event.shiftKey) return {
    kind:'highNatural', ...SHORTCUT_CONTEXTS.highNatural
  };
  return { kind:'middleChromatic', ...SHORTCUT_CONTEXTS.middleChromatic };
}
```

```text
Digit1–8         현재 화면 문맥
Ctrl+Digit1–8    C4–C5 낮은 계이름
Shift+Digit1–8   C5–C6 높은 계이름
Alt+Digit1–8     C4 기준 반음
Space            현재 음 다시 듣기
KeyR             운지 동작 다시 보기
ArrowUp/Down     low/mid/high 문맥을 한 단계 이동
KeyS             현재 문맥의 자연음/♯·♭ 토글
```

물리 상단 `Digit1–Digit8`만 사용한다. Shift가 `!`, `@`를 만들 수 있으므로 `event.key`가 아니라 `event.code`로 숫자를 판정한다. Numpad는 Alt 문자 입력 충돌 때문에 이번 범위에서 제외한다.

수정키가 있는 음 단축키는 Ctrl, Shift, Alt 중 정확히 하나만 허용하고, 무수정 `Digit1–8`은 현재 화면 문맥으로 허용한다. Ctrl+Shift, Ctrl+Alt, Shift+Alt, 세 수정키, Meta, AltGraph는 무시한다. `Space`와 `KeyR`도 Ctrl/Shift/Alt/Meta가 없는 경우에만 실행한다.

`ArrowUp/Down`과 `KeyS`도 수정키 없는 경우에만 화면의 옥타브·변음 컨트롤과 같은 조용한 문맥 변경 액션을 호출한다. Arrow는 `low↔mid↔high`를 범위 끝에서 멈추고, `KeyS`는 `sharpOn`을 토글한다. 둘 다 새 문맥이 유효하면 카드·포즈만 갱신하고, 무효면 선택 해제 정책을 적용하며 소리·햅틱은 내지 않는다. 숫자·밸브 퀴즈에서는 잠근다.

`shortcutsOn:false`는 전역 `Digit1–8`, Ctrl/Shift/Alt 조합, Space, R, ArrowUp/Down, S를 모두 끈다. 이때 handler는 가장 먼저 반환해 상태 변경·알림·오디오·`preventDefault()`가 0회이며, 화면 버튼의 click과 네이티브 Enter/Space 활성화는 계속 동작한다. 모든 `aria-keyshortcuts`를 제거하고 키패드·도움말의 `<kbd>` 힌트는 숨기는 대신 `키보드 단축키 꺼짐` 상태를 텍스트로 표시한다.

다음 문맥에서는 전역 음 단축키를 실행하거나 기본 동작을 막지 않는다.

- 이미 defaultPrevented
- IME composing 또는 229
- input, textarea, select, contenteditable
- ARIA textbox, combobox, spinbutton
- `[data-global-shortcuts="off"]`
- 열린 modal dialog
- 숨김 문서

`event.composedPath()`로 Shadow DOM까지 검사한다.

`Space`는 포커스된 `<button>`, `<a>`, `<summary>`, 실제/ARIA 버튼·체크박스·라디오 같은 컨트롤의 네이티브 활성화 키이므로, 이벤트 경로에 조작 가능한 요소가 있으면 전역 `다시 듣기`로 처리하지 않고 기본 click 경로에 맡긴다. 문서의 비조작 영역에 포커스가 있고 수정키가 없을 때만 Space 재청취를 실행한다. 따라서 화면 숫자 버튼에 포커스한 채 Space를 눌러도 그 버튼 선택 1회만 발생한다.

`Digit1–8` 문맥과 Space/R/ArrowUp/Down/S를 해석한 뒤, 페이지에 실제로 전달된 허용 명령, 모드가 의도적으로 잠근 명령, 비활성 `Alt+3·7`만 앱이 인식한 명령으로 간주한다. 잠긴/비활성 명령은 상태를 바꾸지 않고 이유를 한 번 안내한다. 이 경우에만 `event.cancelable`이면 `preventDefault()`한다. 제외 문맥, 단축키 OFF, 복합 수정키, Meta/AltGraph, Numpad, 범위 밖 키에는 `preventDefault()`도 `stopPropagation()`도 호출하지 않는다. 앱 내부의 다른 리스너는 `defaultPrevented`를 존중해 중복 실행을 막는다.

#### 10.3 repeat와 키 수명

- 첫 keydown 한 번만 활성화
- `event.repeat` 또는 held Set 중복은 오디오·모션·알림 없음
- `activateDegreeInContext()`가 `{ok:true}`를 반환한 유효 음만 눌림 외형을 표시한다. Alt+3·7은 disabled 피드백만 주고 활성 키처럼 표시하지 않는다.
- keyup은 키 외형과 held Set만 정리
- keyup에서 목표 운지 해제 금지
- modifier를 먼저 놓아도 digit keyup으로 정리
- blur·visibility hidden에서 모든 held 외형 정리

#### 10.4 브라우저 예약키 제약

일반 브라우저는 `Ctrl+1–8`을 탭 전환으로 먼저 소비할 수 있다. 페이지가 받지 못한 이벤트는 `preventDefault()`나 capture listener로 되찾을 수 없다.

따라서:

- 화면 분류 버튼과 1–8 키를 필수 기본 경로로 유지
- 단축키 도움말에 충돌 가능성을 표시
- 일반 탭과 standalone 환경을 구분해 테스트
- 모든 브라우저에서 Ctrl+숫자 100% 보장이라고 주장하지 않음
- `accesskey` 사용 금지
- 활성 화면 키에는 무수정 숫자와 현재 분류 조합을 함께 제공한다. 예: `aria-keyshortcuts="1 Control+1"`. 비활성 키에는 속성을 제거한다.
- `전체 음역`의 custom 문맥에는 대응 수정키가 없으므로 활성 키에 무수정 숫자만, 예: `aria-keyshortcuts="1"`을 제공한다.

---

### 11. Web Audio와 햅틱을 구현하라

#### 11.1 음높이

```js
const playbackMidi = (writtenMidi, pitchMode) =>
  pitchMode === 'concert' ? writtenMidi - 2 : writtenMidi;

const midiToHz = midi => 440 * 2 ** ((midi - 69) / 12);
```

#### 11.2 합성 그래프

```text
sawtooth(f) ─────────┐
                     ├─ lowpass(f×5.2,Q=.8) ─ gain envelope ─ output
sine(2f) ─ gain(.10) ┘
```

- 첫 사용자 활성화에서만 AudioContext 생성·resume
- attack 35ms
- sustain 약 .16
- 약 780ms부터 release
- 총 1.25s 이내
- `Voice` 하나는 sawtooth 기본음과 sine 2배음 oscillator 2개, filter 1개, envelope gain 1개를 소유
- 새 음이 오면 기존 Voice의 gain을 35–50ms에 안전하게 낮춘 뒤 두 oscillator 주파수를 함께 retune하고 새 attack을 시작; 겹치는 두 번째 Voice를 만들지 않음
- 정상·전환 중 활성 Voice 최대 1개, oscillator 최대 2개
- 같은 음 재선택은 주파수 변경 없이 envelope만 안전하게 retrigger
- release 종료 뒤 두 oscillator를 stop/disconnect하고 모든 노드 참조 정리
- 새 입력 전 `cancelAndHoldAtTime()` 또는 호환 폴백으로 이전 gain 예약과 cleanup token을 취소해 오래된 release가 새 음을 끊지 않게 함
- 무음·Web Audio 미지원에서도 앱 기능 유지
- 합성음을 `실제 트럼펫 음색`으로 과장하지 않고 `참고 음높이`로 설명

키보드 입력에는 햅틱을 실행하지 않는다. 포인터 입력은 설정이 켜지고 지원될 때만 10ms 진동을 사용한다. 햅틱은 유일한 피드백이 아니다.

---

### 12. 학습 모드를 완성하라

모드마다 음 선택 단축키와 진도 처리 정책을 먼저 고정한다.

| 모드 | 음·답안 입력 정책 | `Space`·`R`·정답 노출 | 진도·정답 정책 |
|---|---|---|---|
| 배우기 | 모든 유효 화면 입력과 Ctrl/Shift/Alt 허용 | 둘 다 허용 | 진도 없음, 즉시 시연 |
| 스케일 | 모든 유효 음은 시연 가능, 세션 분류는 별도 고정 | 현재 음 재청취·동작 다시 보기 허용, 진도 불변 | 세션 분류의 기대 degree만 진행, 다른 입력은 진도 불변 |
| 숫자 퀴즈 | 문제 분류 고정, 화면 숫자와 무수정 Digit1–8만 답안, Ctrl/Shift/Alt·분류·전체 음역 잠금 | 소리 문제일 때 Space는 문제음 재생, R·대체 운지는 정답 전 잠금 | 문제에 맞는 숫자만 정답 |
| 밸브 퀴즈 | 음 선택·분류·전체 음역·Ctrl/Shift/Alt 잠금 | Space는 문제음 재생 가능, R·대체 운지는 정답 전 잠금 | HTML 밸브 1·2·3과 확인만 답안 |

잠긴 명령은 상태·포즈·오디오·점수를 바꾸지 않고 `퀴즈에서는 화면의 답안 버튼을 사용하세요`처럼 한 번 안내한다. 정답 피드백이 시작된 뒤에만 정답 손 포즈와 `R`을 열고, 다음 문제를 만들 때 다시 잠근다.

#### 12.0 퀴즈 정답 비노출 계약

원본 `state`나 `Note`를 그대로 DOM에 뿌리지 말고 `derivePresentation(state)`가 현재 모드·`feedbackPhase`에 허용된 표시 모델만 반환하게 한다.

```js
const presentation = derivePresentation(state);
// 예: { prompt, showDegree, showSolfege, showFingering,
//       showTargetPose, candidateValves, liveMessage, svgTitle, svgDesc }
```

`answering` 단계에는 다음을 지킨다.

- 숫자 퀴즈는 선택한 문제 유형의 오선·음이름·소리와 문제 분류·절대 음역만 제시하고 정답 숫자·계이름은 숨긴다. 소리 문제에서도 `낮은 계이름 C4–C5` 같은 분류를 보여 C5의 8번/1번 경계를 모호하게 만들지 않는다.
- 밸브 퀴즈는 계이름·음이름은 제시하되 정답 운지·손가락·밸브 조합은 숨긴다.
- 정답 운지 문자열을 CSS로만 가리지 말고 CurrentNoteCard, 숨김 텍스트, `aria-label`, 라이브 영역, SVG `<title>/<desc>`, `data-*`, overlay label을 포함한 DOM·접근성 트리에 생성하지 않는다.
- 숫자 퀴즈의 SVG는 정답과 무관한 가림 상태를 표시한다. 개방 포즈를 정답 포즈처럼 보여 주지 않는다.
- 밸브 퀴즈 SVG는 사용자가 누른 `quiz.inputValves` 후보만 표시하고 target 운지는 적용하지 않는다.

정답 제출 뒤 `feedbackPhase:'revealed'`에서만 목표 운지·손가락·설명·다시 보기를 생성한다. 다음 문제를 만들기 전에 후보 밸브와 공개 DOM을 먼저 비우고 `answering`으로 원자 전환한다.

#### 12.1 배우기

- 기본 모드
- 숫자·계이름·기보음·실음·운지·손가락 표시
- 선택 즉시 포즈·소리
- 분류·전체 음역·기보음/실음·대체 운지 비교
- 같은 음 재선택은 포즈 유지·재발음
- `운지 동작 다시 보기` 제공

권장 커리큘럼:

1. 검지=1, 중지=2, 약지=3
2. C4–C5 자연음
3. 개방음 C4·G4·C5
4. 같은 계이름의 옥타브 차이: C♯4/C♯5, D4/D5, E4/E5
5. C4 기준 반음
6. C5–C6 높은 계이름
7. F♯3–B3 저음 확장과 높은 반음
8. 기보음과 B♭ 실음
9. 대체 운지와 슬라이드 보정

#### 12.2 스케일

- 초급 C4–C5: 1→8
- 높은 C5–C6: 1→8
- 사용자가 켜고 끌 수 있는 하행 8→1 연습 옵션을 반드시 제공
- 다음 키를 골드 윤곽과 `다음: 3번 미` 텍스트로 표시
- 정답이면 진행
- 다른 키도 포즈·소리는 제공하되 진행도 유지
- 스케일 시작 때 `scale.sessionOctave`와 `scale.sessionSharpOn`을 세션 문맥으로 고정하며, 외부 분류 단축키가 이를 덮지 않는다. 다른 문맥을 미리 듣고 있으면 `연습 음역으로 돌아가기` 버튼과 다음 입력의 전체 표기(예: `다음: Ctrl+3 미`)를 보여 준다.
- 완주 뒤 사용자가 `전체 다시 듣기`를 누를 때만 자동 시연
- 자동 시연 중 사용자 입력 또는 모드 변경 시 즉시 취소
- 낮은 C3 기반 문맥은 완전한 C장조가 아니므로 초급 스케일로 제공하지 않음

#### 12.3 숫자 퀴즈

- 인라인 SVG 높은음자리표 오선, 음이름 또는 소리를 문제 유형으로 제시
- 오선 문제는 F♯3–C6의 음표 머리·기둥·필요한 덧줄·♯/♭을 기보음 철자에서 계산하고, `aria-label="기보 D4 음표"`처럼 동등한 텍스트를 제공
- 오선 위치 계산은 별도 운지 데이터를 갖지 않으며, 외부 악보 라이브러리·웹폰트 없이 검증된 로컬 SVG 글리프 또는 단순 벡터를 사용
- 키패드에는 숫자 중심 표시
- 문제 음역은 문제 상태에 고정하고 Ctrl/Shift/Alt 음 선택 단축키는 정답 노출 방지를 위해 잠근다.
- 올바른 차수를 고르면 포즈·소리와 설명
- 첫 오답은 정답 숫자·계이름을 밝히지 않고 한 번 재시도; 두 번째 오답 또는 `정답 보기`에서 revealed로 전환해 설명하고 해당 문제는 첫 시도 오답으로 기록
- 직전 문제 반복 금지
- `questionKey = octave + ':' + Number(sharpOn) + ':' + degree`로 직전 문제와 경계 C5 문맥을 구분
- 오답이면 해당 `wrongWeightByQuestion[questionKey]`를 1 올려 다음 추출 확률에 반영하되 최대 가중치 4로 제한; 정답 뒤에도 세션 중 기록은 유지
- 무작위 함수는 테스트에서 seed를 주입할 수 있고, 직전 `questionKey`를 후보에서 제외한 뒤 유효 `noteFor()` 문맥만 추출
- 문제당 `attemptsThisQuestion`은 0에서 시작한다. 첫 제출 정답일 때만 `firstTryCorrectCount`를 1 올리고, 문제 완료 때 `answeredCount`를 1 올린다.
- 10문제 뒤 `첫 시도 정답률 = firstTryCorrectCount / answeredCount × 100`을 0으로 나누지 않게 표시하고 세션 종료 전에는 진행 수와 함께 표시
- 새 10문제 세션을 시작할 때 문제 인덱스·정답 수·가중치·직전 키·후보 입력·feedback phase를 한 reducer action으로 초기화

#### 12.4 밸브 퀴즈

- 계이름·음이름 제시, 정답 운지 숨김
- SVG `<g>`만 클릭 컨트롤로 쓰지 않음
- 캡 위에 정렬한 실제 HTML 밸브 버튼 1·2·3 제공
- 문제 중 분류 선택기·음 키패드·전역 음 단축키는 잠근다.
- `aria-pressed`, 44×44px 이상
- 초급은 표준 운지만 정답
- 고급은 검증된 대체 운지도 정답
- 첫 오답은 `선택한 밸브를 다시 확인하세요`처럼 정답 비트를 노출하지 않는 텍스트 힌트를 주고 `answering`을 유지; reduced-motion에서는 흔들림 없이 같은 텍스트·테두리 피드백
- 두 번째 오답 또는 사용자가 누른 `정답 보기`에서만 `feedbackPhase:'revealed'`로 전환해 `정답은 검지와 약지, 밸브 1번과 3번`처럼 정확한 설명과 목표 포즈 제공
- 첫 제출 정답도 `revealed`로 전환해 골드 플래시·음 재생 뒤 사용자의 `다음 문제` 활성화 또는 짧은 취소 가능한 지연으로 이동

HTML 밸브 overlay는 SVG와 같은 wrapper 안의 절대 배치 레이어로 만든다. 초기 배치와 resize/orientation 때 각 캡 중심을 `DOMPoint(cx,cy).matrixTransform(scene.getScreenCTM())`으로 화면 좌표화하고 wrapper의 `getBoundingClientRect()`를 빼 로컬 위치를 계산한다. `ResizeObserver`와 viewport 변화에서만 기준 위치·scale을 다시 측정하며 rAF 프레임마다 layout을 읽지 않는다. 후보 피스톤이 움직일 때는 MotionController의 같은 `p`와 미리 계산한 Y scale로 HTML 버튼 transform도 이동시켜 캡 중심을 따른다.

각 밸브 버튼은 `Set` 성격의 `inputValves`를 토글한 뒤 `[1,2,3]` 순으로 정규화한다. 확인 전에는 이 후보 조합만 손·피스톤에 적용한다. 제출 시 초급 정답 집합은 `[note.valves]`, 고급 정답 집합은 `[note.valves, ...note.alts]`이며 정렬된 숫자 배열의 길이와 원소를 비교한다. target 배열을 class명·data 속성·accessible name에 미리 넣지 않는다. `000`부터 `111`까지 8개 후보 조합, 대체 운지 허용/거부, 8개 뷰포트의 캡 중심 정렬을 E2E로 검사한다.

#### 12.5 모드 안전성

- 모드 변경 시 자동 시연, 재생 예약, 퀴즈 지연, replay timer 취소
- 퀴즈 입력 밸브와 실제 학습 포즈 상태 분리
- 배우기 모드의 유효한 수동 선택 때만 `learnSnapshot` 갱신; 자유 모드로 돌아오면 그 스냅숏을 주운지 기준으로 복구
- 스케일·퀴즈가 `NOTES` 외 별도 운지 데이터를 갖지 않음

---

### 13. 접근성을 기능 수준으로 구현하라

#### 13.1 의미 구조

- `<main>`: 현재 음 → SVG 설명 → 모드 → 분류 → 키패드
- 실제 `<button>`, `<fieldset>`, `<legend>`, `<dialog>` 사용
- 모드는 button group+`aria-pressed`; 실제 tabpanel이 아니면 `role=tablist` 금지
- 현재 음은 `aria-live="polite" aria-atomic="true"`
- SVG는 `<title>`, `<desc>`를 가지되 상세 중복 낭독 방지
- 동적 버튼 `aria-label`에 분류, 숫자, 음, 운지 포함
- 비활성 이유를 시각·스크린리더 모두 제공

#### 13.2 낭독 예시

```text
낮은 계이름 2번 레, 기보 D4. 검지와 약지로 1번과 3번 밸브를 누릅니다. 실음 C4.
높은 계이름 3번 미, 기보 E5. 모든 밸브를 놓는 개방 운지입니다. 실음 D5.
반음 1번 도 샤프 또는 레 플랫, 기보 C샤프4 또는 D플랫4. 세 밸브를 모두 누릅니다.
```

#### 13.3 필수 접근성 조건

- 터치 타겟 최소 44×44px
- 본문 대비 4.5:1, 큰 텍스트 3:1
- focus-visible 3px 이상
- 200% 확대에서 조작 가능
- forced-colors에서 선택·눌림·포커스 구분
- reduced-motion에서 기능 동등
- 키보드만으로 모든 화면 기능 사용
- 화면 단축키 도움말 제공
- 포커스를 전역 단축키로 강제 이동하지 않음
- 스크린리더의 Control+Option과 AltGr를 탈취하지 않음

---

### 14. 반응형 레이아웃과 시각 품질을 검증하라

| 폭 | 레이아웃 |
|---|---|
| 320–599 | 한 열, SVG 위, sticky 4×2 키패드 아래 |
| 600–899 세로 | 세로 흐름 유지, SVG 최대폭 제한 |
| 600 이상 가로 | 왼쪽 SVG 60%, 오른쪽 컨트롤 40%, 키패드 2×4 가능 |
| 900 이상 | 최대폭 1100–1200px, 장면/컨트롤 약 62:38 |

필수 CSS·viewport:

```html
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
```

```css
html, body { min-height: 100%; }
body { min-height: 100dvh; }
.app {
  padding-top: env(safe-area-inset-top);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
}
#trumpet-scene { width: 100%; height: auto; aspect-ratio: 760 / 460; }
```

페이지 수준 overflow를 숨겨 버그를 가리지 않는다. 자식 폭을 고쳐 실제 가로 overflow를 0으로 만든다.

디자인 토큰:

```text
velvet        #17302E
velvet-2      #1E3C39
brass-bright  #C9A227
brass         #8A6A1F
pearl         #F4EFE4
navy          #15243A
danger        #C62828
page          #EEF2F6
```

외부 웹폰트 없이 시스템 한글 폰트 스택을 사용한다.

---

### 15. 성능·오프라인·보안 예산을 지켜라

| 항목 | 목표 |
|---|---|
| 외부·서브리소스 요청 | 0 (`file://` 0건, 정적 서버는 최초 HTML 문서 1건만) |
| 최종 HTML | UTF-8 기준 350KB 이하, 필수 합격 기준 |
| 입력→첫 시각 변화 | 목표 50ms, 최대 100ms |
| 정상 모션 | 평균 55fps 이상, 목표 60fps |
| rAF 간격 | warm-up 뒤 10초 전환 시나리오에서 p95 ≤18.2ms |
| Long Task | 동일 측정 구간에서 50ms 초과 0회 |
| 장면 DOM | 권장 300노드 이하 |
| 움직이는 노드 | 권장 20개 이하 |
| 래스터 런타임 자산 | 0, 손·트럼펫·아이콘은 벡터 |
| 콘솔 | error 0, warning 0 |

- 런타임 path `d` 변경 금지
- transform, opacity, fill, stroke 중심
- 움직이는 상위 그룹의 blur/filter 제거 또는 정적 그림자로 대체
- 프레임 루프에서 레이아웃 측정 금지
- 사용자 문자열을 `innerHTML`로 삽입 금지
- localStorage는 설정만 버전과 허용 필드로 읽고 파싱 실패 폴백
- Service Worker·web app manifest·설치형 PWA는 이번 범위에서 제외
- 참조 파일과 최종 앱에 외부 URL 런타임 요청 없음
- 정적 서버 네트워크 로그에서는 최초 `app/index.html` 문서 요청만 허용하고 favicon·CSS·JS·SVG·폰트·오디오 추가 요청은 0건

성능은 390×844 viewport, 브라우저 zoom 100%, CPU throttling OFF에서 앱을 한 번 warm-up한 뒤 `000↔111`, `101↔011`, 빠른 음 20회가 포함된 10초 구간을 측정한다. 브라우저·OS·CPU와 측정 횟수를 `QA-REPORT.md`에 기록하고 최소 3회 중 중앙값을 보고한다. 다른 기기 전체에 같은 수치를 보장한다고 일반화하지 않는다.

`build-single-file.mjs`가 생성한 최종본에서 개발 전용 전역 API, 소스맵 주석, 테스트 fixture와 디버그 오버레이를 제거한 뒤 크기를 측정한다. 접촉 검증에 필요한 의미 있는 SVG 앵커는 숨김 상태로 남겨도 되지만, 개발 패널은 남기지 않는다. 350KB를 넘으면 압축되지 않은 중복 SVG·CSS·데이터·코드를 먼저 제거하고, 초과한 채 완료 처리하지 않는다.

`validate-app.mjs`는 문자열 전체에서 `http`만 찾는 조악한 방식 대신 HTML/CSS/JS의 실제 리소스 위치와 네트워크 API를 검사한다. 인라인 SVG의 `xmlns="http://www.w3.org/2000/svg"` 같은 비요청 네임스페이스 URI는 허용한다. 최소한 다음을 자동 실패로 판정한다.

- `src`, 리소스용 `href`, `srcset`, CSS `url()`, `@import`, 정적·동적 import에 있는 원격 또는 비인라인 앱 자원
- `fetch`, XHR, WebSocket, EventSource 등으로 호출하는 원격 endpoint와 프로토콜 상대 URL
- 외부 `<script src>`, `<link rel="stylesheet">`, 원격 이미지·SVG·오디오·웹폰트 참조
- 인라인되지 않은 로컬 앱 모듈·스타일·SVG·이미지·오디오 참조
- `sourceMappingURL`, 개발 서버 주소, 테스트 전용 전역 API
- 중복 SVG `id`, 깨진 `url(#id)`·`href="#id"` 참조
- 최종 파일 350KB 초과
- 필수 씬 ID 또는 접근성 landmark 누락

---

### 16. 다음 순서로 구현하고 각 단계에서 멈춰 검증하라

각 단계의 체크박스는 파일을 만들었다는 뜻이 아니라, 그 단계의 자동 검사와 필요한 브라우저 검사를 실제로 통과했다는 뜻이다. 단계마다 `변경 → 명령 → 실제 결과 → 남은 위험`을 `QA-REPORT.md`에 누적하고, 실패한 완료 게이트를 건너뛰지 않는다.

#### 단계 0 — 기준선 동결

- [ ] 두 설계 문서와 output 자료 감사
- [ ] 검증 스크립트 실행
- [ ] NOTES·SVG ID·좌표 스냅숏
- [ ] 기존 앱·테스트·콘솔 상태 기록

완료 게이트: 기존 상태를 재현할 수 있음.

#### 단계 1 — 데이터·순수 함수·테스트

- [ ] NOTES 추출과 불변 검사
- [ ] `midiFor`, `noteFor`, `poseKey`
- [ ] 전체 48문맥·단축키 24문맥 테이블 테스트
- [ ] 대체 운지 보정 회귀

완료 게이트: DOM 없이 모든 음악 데이터 테스트 통과.

#### 단계 2 — 모바일 정적 골격

- [ ] 의미 구조와 390×844 레이아웃
- [ ] 현재 음 카드, 모드, 분류, 키패드, 전체 음역 패널
- [ ] 설정·도움말 dialog
- [ ] 초기 C4 개방 포즈를 NOTES에서 렌더하고 자동 소리를 내지 않음

완료 게이트: SVG·오디오 없이도 라벨·disabled·포커스 정확.

#### 단계 3 — SVG 이식과 정적 8포즈

- [ ] output 장면·ID·geometry 보존
- [ ] 양손 파지·손가락·캡 레이어
- [ ] 8개 포즈를 개발 API로 강제 렌더
- [ ] 접촉 앵커와 정적 스냅숏

완료 게이트: 8포즈 모두 올바른 손가락·캡과 시각 접촉.

#### 단계 4 — 정밀 리그와 모션 엔진

- [ ] MCP/PIP/DIP 리그
- [ ] 공유 진행도와 단일 rAF
- [ ] 누름·해제·공통 비트 유지
- [ ] 빠른 재지정과 취소 토큰
- [ ] 슬라이드·reduced-motion

완료 게이트: 접촉 수치·20회 빠른 전환·성능 기준 통과.

#### 단계 5 — 상태·UI 통합

- [ ] 중앙 선택 액션
- [ ] 화면 분류와 전체 음역
- [ ] 대체 운지 선택·리셋
- [ ] 같은 음 재발음·다시 보기

완료 게이트: 카드·키·SVG가 같은 Note/운지를 표시.

#### 단계 6 — 키보드·포인터

- [ ] click 단일 활성화
- [ ] Ctrl/Shift/Alt exact-one
- [ ] IME·AltGraph·Meta·editable 제외
- [ ] repeat·keyup·blur·visibility 수명
- [ ] 브라우저 충돌 도움말

완료 게이트: 합성·실제 입력 테스트와 화면 fallback 통과.

#### 단계 7 — 오디오·햅틱

- [ ] 첫 제스처 unlock
- [ ] written/concert
- [ ] envelope·fade·노드 정리
- [ ] 음소거·미지원 폴백
- [ ] 포인터만 선택 햅틱

완료 게이트: 1분 연타 뒤 클리핑·노드 누적 없음.

#### 단계 8 — 학습 모드

- [ ] 배우기
- [ ] C4·C5 스케일과 하행
- [ ] 숫자 퀴즈
- [ ] 접근 가능한 밸브 퀴즈
- [ ] 자동 시연·타이머 취소

완료 게이트: 각 모드의 시작→완료→전환 흐름 통과.

#### 단계 9 — 접근성·반응형

- [ ] 키보드 전체 흐름
- [ ] 라이브 문장
- [ ] dialog 포커스
- [ ] reduced-motion·forced-colors·200%
- [ ] 전체 뷰포트

완료 게이트: 접근성·시각 매트릭스 통과.

#### 단계 10 — 빌드·오프라인·최종 QA

- [ ] 자기완결 `app/index.html` 생성
- [ ] 외부 요청 0
- [ ] 자동 테스트 전체
- [ ] 실제 브라우저 상호작용
- [ ] 스크린샷·콘솔·성능 검수
- [ ] 개발 전용 훅 제거 후 최종 HTML 350KB 이하 확인
- [ ] `file://` 직접 열기와 로컬 정적 서버 양쪽에서 핵심 흐름 재검증
- [ ] `QA-REPORT.md`에 8포즈·8뷰포트·외부/서브리소스 요청·콘솔 증거 연결
- [ ] 최종 보고

완료 게이트: §18 완료 정의 전체 통과.

---

### 17. 테스트 계획을 실제 코드로 만들고 실행하라

#### 17.1 데이터 테스트

- canonical HTML의 31개 객체와 `midi/name/enh/solfege/valves/alts/concert` 전 필드 deep equality
- 31음, MIDI 54–84 연속·고유
- 표준 운지 31개가 기대 포즈와 일치
- 대체 운지 10음·11조합
- D4·F♯5 대체 없음
- `concert` 문자열은 canonical과 동일, 실제 재생 MIDI는 모든 음에서 written −2
- 밸브 값은 정렬된 1/2/3 고유 집합
- 퀴즈·대체 운지·pose 계산 뒤에도 frozen `NOTES` 직렬화가 불변

#### 17.2 매핑 테스트

- 전체 48문맥: 유효 35·비활성 13·고유 31
- 단축키 24문맥: 유효 22·비활성 2·고유 21
- Ctrl+8과 Shift+1 동일 C5 객체
- Alt+3·7 외 shortcut null 없음
- 같은 MIDI 문맥은 같은 객체

#### 17.3 상태·DOM 테스트

| 시나리오 | 기대 결과 |
|---|---|
| C4 2번 | D4, 1-3, 검지+약지, 101 |
| C5 2번 | D5, 1, 검지, 100 |
| 반음 1번 | C♯4, 1-2-3, 111 |
| 반음 3번 | 상태·포즈·오디오 불변 |
| 같은 음 재선택 | 포즈 유지, 음 재발음 |
| 다시 보기 | 비개방만 놓임→복귀 |
| 분류 변경 | 같은 숫자 재해석, 소리 없음 |
| 무효 분류 전환 | 선택 해제와 안내 |
| 대체 E5=3 | MIDI 유지, 001 |
| 빠른 입력 20회 | 마지막 입력과 전체 상태 일치 |

#### 17.4 모션 테스트

- 000,100,010,001,110,101,011,111
- 101→100: 1 유지, 3 해제
- 111→000: 세 밸브 동시 해제
- 000→111: 세 밸브 동시 누름
- 101→011: 3 유지, 1 해제, 2 누름
- 손가락·피스톤 시작 시각 차이 ≤1프레임
- 접촉·관통·교차 기준 통과
- reduced-motion 즉시 최종 포즈
- 사용자 `motionPreference:'reduced'`도 즉시 포즈, 시스템 reduce는 사용자 설정보다 항상 우선
- 20회 연타 후 활성 rAF·타이머 0

#### 17.5 키보드 테스트

- Shift+Digit1에서 key가 `!`여도 C5
- exact-one 수정키
- 복합 수정키·Meta·AltGraph 무시
- Numpad·Digit9 무시
- ArrowUp/Down 문맥 경계·KeyS 변음 토글은 무음이며 화면 컨트롤과 동일
- input·textarea·select·contenteditable·dialog 무시
- composing·229·defaultPrevented 무시
- repeat 20회에서 실행 1회
- keyup은 외형만 해제
- 허용 명령·모드 잠금 명령·Alt+3·7만 preventDefault, 단축키 OFF·제외·미인식 입력은 기본 동작 유지
- 어떤 경우에도 stopPropagation 없음
- 숫자 버튼 포커스+Space에서 native click 한 번만 실행되고 전역 재청취는 0회
- 비조작 영역+Space에서 현재 음 재청취 한 번만 실행
- modifier 먼저 해제해도 stuck 없음
- blur·hidden에서 held Set 0
- 키보드와 화면 결과 동일
- 키보드 햅틱 0
- 화면 버튼 Enter/Space·스크린리더 합성 click 햅틱 0
- `shortcutsOn:false`에서 모든 전역 키 처리·preventDefault 0, `aria-keyshortcuts`·kbd 힌트 0

#### 17.6 오디오 테스트

- 사용자 제스처 전 AudioContext 없음
- C4 written 약 261.63Hz, concert 약 233.08Hz
- A4 written 440Hz, concert 약 392Hz
- 활성 Voice 하나·oscillator 두 개 이하
- 음소거에서 새 oscillator 없음
- 새 음 click noise 없음
- 마지막 탭 뒤 1.5초 안에 노드 정리
- 백그라운드 복귀 가능

#### 17.7 접근성 테스트

- 키보드만으로 배우기·스케일·퀴즈 완료
- 라이브 영역 선택당 한 문장
- 비활성 이유 낭독
- dialog 포커스·Escape·복귀
- 실제 밸브 HTML 버튼
- VoiceOver·NVDA 또는 사용 가능한 스크린리더
- reduced-motion·forced-colors·200% 확대

#### 17.8 모드 상태 머신 테스트

`modes.test.mjs`와 E2E에서 최소한 다음 oracle을 고정한다.

- 배우기: 유효 수동 선택만 `learnSnapshot` 갱신, 다른 모드 뒤 복귀 시 같은 문맥·degree·주운지 복구
- 스케일: session 문맥 밖 음은 카드·포즈·소리 preview만, `expectedDegree`·진도 불변
- 스케일: session 문맥의 정확한 expected 입력만 한 단계 진행; 오답·같은 음 반복은 불변
- 스케일: 전체 다시 듣기 중 수동 입력·모드 전환 시 sequence id가 바뀌고 예약 콜백 0
- 숫자 퀴즈: answering 단계의 숫자·계이름·운지 정답 DOM/접근성 비노출, 수정키·분류·R 잠금
- 숫자 퀴즈: 10문제의 첫 시도 수·오답 후 정답·가중치 상한·직전 문제 비반복·정답률 계산
- 밸브 퀴즈: 8개 후보 조합 토글과 정렬, 첫 오답 뒤에도 target 비노출·재시도, 두 번째 오답/정답 보기/정답 뒤에만 revealed, 초급 주운지/고급 대체 운지 판정
- 두 퀴즈: revealed에서만 target 포즈·설명·R 공개, 다음 문제에서 다시 완전 비노출
- 모든 모드 전환: 오디오 release 외 오래된 rAF·timeout·자동 시연·퀴즈 지연 0

#### 17.9 시각·실기기 매트릭스

```text
320×568
360×740
390×844
430×932
768×1024
844×390
1280×800
1440×900
```

각 뷰포트에서 화면을 캡처하고 다음을 확인한다.

- 가로 overflow 0
- 손·트럼펫 잘림 없음
- sticky 키패드가 콘텐츠를 가리지 않음
- 계이름·음이름·운지 텍스트 겹침 없음
- dialog가 화면 밖으로 나가지 않음
- 손가락이 올바른 캡에 닿음
- touch/hasTouch 환경의 한 번 탭이 한 번만 선택되고 300ms 지연·이중 실행이 없음
- 세로↔가로 회전 뒤 현재 음·운지는 유지되고 레이아웃만 재배치됨

실제 또는 동등 환경:

```text
iOS Safari
Android Chrome
Windows Chrome/Edge/Firefox
macOS Safari/Chrome
standalone 브라우저 창 또는 설치 기능 없는 앱형 창
한국어·영문 키보드
```

Ctrl/Alt 이벤트가 브라우저에 소비된 환경은 알려진 제한으로 기록하고 화면 대체 입력을 검증한다.

#### 17.10 요구사항–증거 추적표

`QA-REPORT.md`에 다음 표를 채워 요구사항마다 테스트와 증거 파일을 역추적할 수 있게 한다. `예정`이나 빈 칸은 합격이 아니다.

| 요구사항 | 필수 자동 증거 | 필수 시각·수동 증거 |
|---|---|---|
| 31음·대체 운지 | 데이터 테스트 31/10/11, 기존 검증 스크립트 | 현재 음 카드 표본 비교 |
| 전체 48문맥 | 35 유효·13 비활성·31 고유 | 전체 음역 패널 비활성 이유 |
| 단축키 24문맥 | 22 유효·2 비활성·21 고유 | 브라우저별 전달 여부와 화면 fallback |
| 8개 운지 포즈 | pose/접촉 자동 검사 8/8 | `000`–`111` 각각의 PNG 또는 동등 캡처 8장 |
| 손가락–피스톤 동기화 | 1프레임 이내·빠른 전환 테스트 | 000→111, 101→011 모션 관찰 기록 |
| 4개 학습 모드 | 모드별 E2E 시작→완료→전환 | 정답·오답·잠금 UI 캡처 |
| 접근성 | axe 또는 동등 검사, 키보드 테스트 | 스크린리더·200%·forced-colors 결과 |
| 8개 뷰포트 | overflow 측정 8/8 | 위 매트릭스의 전체 화면 캡처 8장 |
| 오프라인 배포 | 정적 validator, 외부·서브리소스 요청 0 | file:// 0건·정적 서버 최초 HTML 1건만인 실행 기록 |
| 릴리스 품질 | 파일 크기·중복 ID·콘솔 검사 | 최종 빌드 정보와 알려진 제한 |

각 캡처에는 빌드 식별자, 뷰포트, 포즈 또는 시나리오를 파일명이나 보고서 표에 기록한다. 접촉 거리의 SVG user unit 수치와 화면 캡처의 screen px 수치를 섞어 쓰지 않는다.

---

### 18. 완료 정의

- [ ] 31음과 대체 운지 데이터가 검증본과 일치한다.
- [ ] 빠른 세 분류와 전체 음역으로 31음에 접근할 수 있다.
- [ ] 48개 전체 문맥과 24개 shortcut 문맥 테스트가 통과한다.
- [ ] 숫자 차수와 밸브 번호가 UI에서 혼동되지 않는다.
- [ ] 오른손만 밸브를 누르고 왼손은 파지·슬라이드 역할을 한다.
- [ ] 8개 운지 포즈가 모두 정확하다.
- [ ] 손가락과 피스톤이 같은 진행도로 움직인다.
- [ ] 접촉 오차와 관통·교차 검사가 통과한다.
- [ ] 공통 밸브 유지, 같은 음 재발음, 개방음, 다시 보기가 정확하다.
- [ ] 빠른 20회 입력 뒤 마지막 상태가 일치한다.
- [ ] 배우기·스케일·숫자 퀴즈·밸브 퀴즈가 완료된다.
- [ ] 두 퀴즈의 answering 단계에서 target 숫자·운지·손가락·밸브가 DOM과 접근성 트리에 없고 revealed 뒤에만 나타난다.
- [ ] 기보음·실음·음소거·햅틱 설정이 동작한다.
- [ ] 화면·키보드·스크린리더 경로가 동등하다.
- [ ] 브라우저 예약 단축키 한계와 화면 fallback이 설명된다.
- [ ] 320px부터 데스크톱까지 가로 overflow와 손 잘림이 없다.
- [ ] reduced-motion, forced-colors, 200% 확대에서 기능이 유지된다.
- [ ] 최종 `app/index.html`은 외부 요청 없이 file://와 정적 서버에서 오프라인 동작한다.
- [ ] 개발 전용 훅을 제거한 최종 `app/index.html`이 UTF-8 기준 350KB 이하이다.
- [ ] 콘솔 error·warning 0, 중복 SVG ID 0이다.
- [ ] 성능 시나리오의 rAF p95·Long Task·입력 지연 예산을 실제 수치로 통과했다.
- [ ] 8포즈 캡처, 8뷰포트 캡처, 접촉 수치, 외부·서브리소스 요청 0, 콘솔 0을 `QA-REPORT.md`에 실제로 기록했다.

하나라도 미검증이면 완료 대신 미검증 또는 알려진 제한으로 보고한다.

---

### 19. 절대 하지 말아야 할 구현

- 단축키·퀴즈·모드마다 별도 운지 데이터 복제
- 계이름 문자열로 운지 추론
- D4·F♯5 삭제 대체 운지 복원
- C4 낮은 계이름을 기존 C3 `low`와 혼동
- Alt 결과를 직전 옥타브에 따라 변경
- 분류 변경에서 무효 숫자를 가장 가까운 음으로 임의 자동 선택
- 비활성 Alt+3·7에서 문맥·숫자·포즈·오디오를 먼저 변경
- 단순 막대 손가락으로 output의 정교한 손 퇴행
- 손가락만 움직이고 피스톤 정지
- 피스톤만 움직이고 손가락 정지
- 왼손이 밸브 캡을 누르는 잘못된 애니메이션
- 복수 밸브를 불필요하게 순차 누름
- 같은 음마다 강제 전체 해제
- keyup·소리 종료에서 목표 운지 해제
- `event.key`로 Shift 숫자 판정
- AltGr·Meta·복합 수정키 탈취
- Numpad 암묵 지원
- pointerdown과 click 이중 실행
- 모든 키에 무조건 preventDefault
- SVG `<g>`만 퀴즈 버튼으로 사용
- accesskey 사용
- 전역 `*` reduced-motion으로 전체 UI 파괴
- 프레임마다 IK·getBBox·path d 계산
- 외부 CDN·웹폰트·원격 오디오
- 전체 페이지 래스터 손 이미지
- 테스트 없이 파일 존재만 확인
- 브라우저 예약 Ctrl+숫자 100% 지원 주장
- 참조 output 파일 덮어쓰기

---

### 20. 최종 보고 형식

완료 후 다음 순서로 간결하지만 수치와 증거가 있는 보고서를 작성하라.

1. 구현 결과 한 문단
2. 변경 파일과 역할
3. 앱 실행 방법과 최종 `app/index.html` 경로
4. 데이터 검사: 31음·대체 10음/11조합
5. 매핑 검사: 전체 48문맥, shortcut 24문맥
6. SVG 검사: ID, 8포즈, 접촉 오차, 동기화
7. 모션 검사: 빠른 입력, 공통 비트, reduced-motion
8. 오디오 검사: written/concert, fade, 활성 노드
9. 모드 검사: 배우기·스케일·두 퀴즈
10. 접근성 검사: 키보드·스크린리더·dialog
11. 반응형 캡처와 overflow 결과
12. 브라우저별 Ctrl/Alt 단축키 전달 결과와 fallback
13. 외부 요청·콘솔·중복 ID·성능 결과
14. 최종 HTML 바이트 수와 350KB 예산 결과
15. `QA-REPORT.md`와 핵심 증거 경로
16. 남은 알려진 제한

테스트를 실행하지 않았다면 통과라고 쓰지 마라. 이미지나 화면을 만들었다면 반드시 직접 열어 손가락, 캡, 텍스트, 잘림을 눈으로 확인하라.
