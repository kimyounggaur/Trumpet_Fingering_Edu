# 트럼펫 운지법 배우기 모바일 웹앱 QA 보고서

## 릴리스 요약

- 검증 일시: 2026-07-20 (Asia/Seoul)
- 최종 실행본: `app/index.html`
- 빌드 SHA-256: `b08755d4d1d8f853e54daeb5543ffe004a16dd44c37898fffc9dfec0b0cc7029`
- 최종 크기: 113,273 bytes / 358,400 bytes(350KB), 예산 사용률 31.6%
- 자동 QA: `npm.cmd run qa` 종료 코드 0
- 단위 테스트: 51 통과, 0 실패
- 실제 브라우저: Google Chrome 150.0.7871.128, Windows 11 Pro 64-bit
- 측정 장치: 12th Gen Intel(R) Core(TM) i7-1280P, CPU throttling OFF
- 외부 런타임 자산: 0
- 콘솔: error 0, warning 0, pageerror 0

## 단계별 변경·검증 로그

### 단계 0 — 기준선 동결

- 변경: 작업공간, `output/`, 기준 개발서와 마스터 프롬프트를 감사했다. 참조 파일은 수정하지 않았다.
- 명령: `rg --files`, `python scripts/validate_hand_fingering_chart.py`
- 실제 결과: 기존 앱 없음, Git 저장소 아님. 참조 데이터 31음(MIDI 54–84), 대체 운지 10음·11조합, 참조 HTML 외부 요청 0건, SVG 래스터 0개. 검증 종료 코드 0.
- 남은 위험: 없음. 신규 앱은 `app/`에만 생성했다.

### 단계 1 — 데이터·순수 매핑

- 변경: canonical `NOTES`, 깊은 freeze, `midiFor`·`noteFor`·`poseKey`·대체 운지 조회를 구현했다.
- 명령: `npm.cmd test`
- 실제 결과: 31음, MIDI 54–84 연속·고유, 대체 운지 10음/11조합. 전체 48문맥은 35 유효/13 비활성/31 고유, 단축키 24문맥은 22 유효/2 비활성/21 고유. C5의 `Ctrl+8 === Shift+1` canonical identity 확인.
- 남은 위험: 없음.

### 단계 2 — 모바일 정적 골격

- 변경: semantic HTML5, 현재 음 카드, 장면, 4개 모드, 3개 빠른 분류, 전체 음역, sticky 숫자 키패드, 설정·도움말 dialog를 구현했다.
- 명령: `npm.cmd run build`, 브라우저 초기 상태 검사.
- 실제 결과: 최초 상태 C4/개방/포즈 `000`. 테스트가 `AudioContext`를 계측해 사용자 활성화 전 생성 수 0을 확인했다. 320px에서 dialog는 뷰포트 안에 있고 내부 스크롤이 동작했다.
- 남은 위험: 실제 iOS Safari의 dialog 렌더 차이는 실기기에서 별도 확인이 필요하다.

### 단계 3 — SVG 이식과 8포즈

- 변경: canonical `viewBox="0 0 760 460"`, 트럼펫, 양손, 밸브, 슬라이드와 8개 운지 포즈를 inline SVG로 구현했다.
- 명령: `npm.cmd test`, `npm.cmd run test:e2e`
- 실제 결과: `000`, `001`, `010`, `011`, `100`, `101`, `110`, `111` 8/8 통과. 중복 ID 0, 깨진 SVG 참조 0, 래스터 0. 각 포즈 PNG 8장 생성.
- 남은 위험: 없음.

### 단계 4 — 정밀 리그와 모션

- 변경: 오른손 검지·중지·약지 MCP/PIP/DIP 리그, 33-node lookup, 단일 rAF, 누름 120ms/해제 170ms, replay 70→120ms, 3번 슬라이드 20ms 지연·220ms를 구현했다.
- 명령: scene 단위 테스트, 65개 중간 샘플 계산, Chrome screen-contact 검사, 3×10초 성능 측정.
- 실제 결과:
  - root SVG user unit 최대 접촉 오차 0.000956, 최대 수평 오차 0.000927
  - lookup 인접 관절각 최대 변화 0.716°
  - 390px 화면 8포즈 최대 anchor 접촉 오차 0.000324 screen px
  - 피스톤 이동 14 user unit, 슬라이드 이동 −14 user unit
  - 밸브 퀴즈 HTML 캡 버튼과 SVG 캡 중심의 최종 오차 1px 이하
  - reduced-motion은 한 프레임 안에 최종 상태로 스냅
- 남은 위험: anchor 수치는 수학·DOM 좌표 검사이며, 캡처의 실루엣은 별도 육안 검사로 배경 틈·관통이 없음을 확인했다.

### 단계 5 — 상태·UI 통합

- 변경: 중앙 store/reducer와 단일 선택 경로를 연결했다. 문맥 변경은 무음, 음 변경 시 대체 운지 초기화, 같은 음 재선택은 포즈를 유지하고 재발음한다.
- 명령: state 테스트와 Chrome 기능 시나리오.
- 실제 결과: 카드·키패드·SVG가 같은 canonical Note/운지를 사용했다. 무효 `Alt+3·7`은 상태·포즈를 유지했다. 배우기 스냅숏 복원과 스케일 preview-only 정책이 통과했다.
- 남은 위험: 없음.

### 단계 6 — 키보드·포인터

- 변경: Ctrl/Shift/Alt exact-one, Meta/AltGraph/IME/editable/dialog/repeat/held 제외, `Space`, `R`, 화살표, `S`, pointer provenance와 10ms 햅틱을 구현했다.
- 명령: 단축키 24문맥 단위 테스트, 합성 DOM keydown 통합 검사, hasTouch Chrome tap 검사.
- 실제 결과: 허용·잠금·비활성 입력만 `preventDefault`; 나머지는 브라우저 기본 동작 유지. 한 번 탭→한 번 선택, 측정 지연 45ms. 키보드·assistive 합성 click에서는 햅틱을 실행하지 않는다.
- 남은 위험: 실제 브라우저가 `Ctrl+숫자`를 탭 전환으로 먼저 소비할 수 있다. 동일 기능의 화면 분류·숫자 버튼을 8포즈 매트릭스에서 검증했다.

### 단계 7 — 오디오·햅틱

- 변경: lazy Web Audio, 기보음/실음(−2 semitone), 단일 2-oscillator voice, filter·gain envelope·release와 포인터 전용 햅틱을 구현했다.
- 명령: audio 단위 테스트와 실제 Chrome Web Audio 계측.
- 실제 결과: 사용자 활성화 전 context 0, 이후 context 1, oscillator 2, gain 2, filter 1, oscillator start 2. 연속 두 음에서도 oscillator 수가 늘지 않았고 gain ramp 5회를 확인했다. 지원하지 않는 햅틱은 설정에서 비활성 안내한다.
- 남은 위험: 헤드리스 환경에서는 스피커의 실제 음색·음량을 청음하지 않았다.

### 단계 8 — 학습 모드

- 변경: 배우기, C4/C5 오름·내림 스케일, 오선·음이름·소리 숫자 퀴즈, HTML 밸브 퀴즈, 오답 가중치·직전 문제 비반복·10문제 정답률을 구현했다.
- 명령: mode/state 단위 테스트와 Chrome E2E.
- 실제 결과:
  - 오름 스케일 1→8 E2E 완료, 내림 8→1 단위 상태 머신 완료
  - 숫자 퀴즈 10문제 완료→정답률→새 세션 초기화 통과
  - 밸브 퀴즈 10문제 완료→정답률→새 세션 초기화 통과
  - 두 퀴즈 answering 단계에서 degree/운지/포즈를 렌더 모델에서 omit하고, 숫자 답안 버튼의 text·`aria-label`도 중립화
  - 밸브 퀴즈는 사용자 후보 포즈만 장면에 반영하고 첫 오답 뒤에도 target을 숨김
- 남은 위험: 없음.

### 단계 9 — 접근성·반응형

- 변경: landmark, heading, fieldset/legend, dialog 이름, status live region, focus-visible, skip link, forced-colors와 reduced-motion CSS를 구현했다.
- 명령: Chrome 의미 구조 검사, 키보드 dialog 잠금, forced-colors/reduced-motion 캡처, 8뷰포트 검사.
- 실제 결과: 표시된 버튼의 접근 가능한 이름 누락 0. dialog 열린 동안 전역 단축키 0회. 8개 뷰포트 모두 `scrollWidth === innerWidth`, 장면 좌우 잘림 0, 회전 후 D4/`101` 유지. 이전 진도 배지와 스킵 링크가 캡처에 남던 결함을 수정하고 재검증했다.
- 남은 위험: VoiceOver/NVDA 실사용 낭독, 브라우저 200% zoom, iOS/Android/macOS 실기기 검사는 이번 Windows 환경에서 실행하지 못했다.

### 단계 10 — 빌드·오프라인·최종 QA

- 변경: ES 모듈·CSS·SVG를 classic inline script/style/SVG로 묶는 재현 가능한 단일 파일 빌드를 만들었다.
- 명령: `npm.cmd run qa`
- 실제 결과: 전체 체인 종료 코드 0. 113,273 bytes, ID 75개, 중복 0, fragment 27개/깨짐 0, 외부 리소스 0. `file://` 서브리소스 0·외부 요청 0, 정적 서버는 `/index.html` 문서 1건만 요청. 콘솔 error/warning/pageerror 모두 0.
- 남은 위험: 없음. 단, 위의 실제 기기·스크린리더 미실행 항목은 환경 제약으로 남는다.

## 요구사항–증거 추적표

| 요구사항 | 자동 증거 | 시각·수동 증거 | 상태 |
|---|---|---|---|
| 31음·대체 운지 | `data.test.mjs`: 31음/10음/11조합 | 현재 카드·전체 음역 패널 표본 확인 | 통과 |
| 전체 48문맥 | 35 유효/13 비활성/31 고유 | 비활성 버튼 이유·전체 음역 패널 확인 | 통과 |
| 단축키 24문맥 | 22 유효/2 비활성/21 고유 | Chrome DOM 전달·화면 fallback 확인 | 통과(예약키 제약 명시) |
| 8개 운지 포즈 | `scene.test.mjs`, 8/8 contact 검사 | `.qa-artifacts/poses/pose-*.png` 8장 | 통과 |
| 손가락–피스톤 동기화 | shared `p`, 65 samples, rapid-retarget | `000↔111`, `101↔011` 3×10초 관찰 | 통과 |
| 4개 학습 모드 | 단위 상태 머신 + 10문제×2 E2E | 퀴즈 hidden/candidate/완료 캡처 | 통과 |
| 접근성 | 이름·dialog·키보드·forced-colors 검사 | reduced/forced-colors 캡처 | 조건부 통과(실제 SR 미실행) |
| 8개 뷰포트 | overflow 0, scene clipping 0, 상태 유지 8/8 | `.qa-artifacts/viewports/viewport-*.png` 8장 | 통과 |
| 오프라인 배포 | validator, file 서브리소스 0, server 1문서 | file://·정적 서버 실제 렌더 | 통과 |
| 릴리스 품질 | 113,273 bytes, console 0/0, ID·참조 0오류 | 최종 캡처 직접 비교 | 통과 |

## 성능 측정

조건: 390×844, zoom 100%, CPU throttling OFF, Chrome 150, Windows 11, i7-1280P. warm-up 뒤 `000↔111`, `101↔011`을 포함해 250ms마다 총 41회 전환한 10초 구간을 3회 측정했다. 디스플레이/헤드리스 rAF 환경은 약 144Hz이며 다른 기기에 일반화하지 않는다.

| 회차 | 평균 FPS | rAF p95 | 최대 간격 | 50ms 초과 Long Task |
|---:|---:|---:|---:|---:|
| 1 | 139.52 | 7.2ms | 14.2ms | 0 |
| 2 | 140.52 | 7.2ms | 14.0ms | 0 |
| 3 | 136.92 | 13.3ms | 14.2ms | 0 |
| 중앙값 | 139.52 | 7.2ms | — | 0 |

- 입력→논리 상태: 0.5ms
- 입력→첫 시각 변화: 4.0ms
- 장면 DOM: 167 nodes
- 움직이는 상위 노드: 5

## 증거 파일

- 기계 판독 결과: `.qa-artifacts/e2e-results.json`
- 8포즈: `.qa-artifacts/poses/pose-{000,001,010,011,100,101,110,111}-390x844.png`
- 8뷰포트: `.qa-artifacts/viewports/viewport-{320x568,360x740,390x844,430x932,768x1024,844x390,1280x800,1440x900}.png`
- 시나리오: `.qa-artifacts/scenarios/quiz-number-answer-hidden.png`
- 시나리오: `.qa-artifacts/scenarios/quiz-valve-candidate.png`
- 10문제 완료: `.qa-artifacts/scenarios/quiz-number-10-complete.png`, `.qa-artifacts/scenarios/quiz-valve-10-complete.png`
- 설정·고대비: `.qa-artifacts/scenarios/settings-dialog-320x568.png`, `.qa-artifacts/scenarios/forced-colors-reduced-motion-320x568.png`

## 알려진 환경 제약

- Chrome/Edge 계열은 `Ctrl+1–8`을 탭 전환으로 먼저 소비할 수 있고 일부 OS는 `Alt+숫자`를 예약한다. 앱이 이벤트를 받으면 계약대로 처리하며, 받지 못하는 환경을 위해 동일한 화면 분류·숫자 버튼을 항상 제공한다.
- 이번 자동화 환경은 Windows Chrome이다. iOS Safari, Android Chrome, macOS Safari/Chrome, 실제 VoiceOver/NVDA는 미실행으로 남겼으며 통과로 과장하지 않는다.
- Web Audio 그래프와 수명은 실제 Chrome에서 계측했지만 헤드리스 장치의 스피커 출력은 청음하지 않았다.
