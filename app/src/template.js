export const APP_HTML = String.raw`
<a class="skip-link" href="#degree-keypad">계이름 숫자 버튼으로 건너뛰기</a>
<main class="app-shell" id="app-root">
  <header class="app-header">
    <div class="brand-block">
      <span class="brand-kicker">B♭ TRUMPET LAB</span>
      <h1>손으로 익히는 트럼펫 운지</h1>
      <p>계이름을 고르면 손가락과 피스톤이 함께 움직여요.</p>
    </div>
    <div class="header-actions" aria-label="빠른 설정">
      <button class="icon-button" id="mute-toggle" type="button" aria-pressed="false" aria-label="소리 끄기"><span aria-hidden="true">♪</span></button>
      <button class="icon-button" id="help-open" type="button" aria-label="단축키 도움말"><span aria-hidden="true">?</span></button>
      <button class="icon-button" id="settings-open" type="button" aria-label="설정 열기"><span aria-hidden="true">⚙</span></button>
    </div>
  </header>

  <section class="current-card" aria-labelledby="current-title">
    <div class="current-copy">
      <div class="eyebrow-row">
        <span class="category-badge" id="category-badge">낮은 계이름 · C4–C5</span>
        <span class="mode-badge" id="mode-badge">배우기</span>
      </div>
      <div class="note-heading">
        <span class="degree-orb" id="degree-display" aria-hidden="true">1</span>
        <div>
          <h2 id="current-title"><span id="solfege-display">도</span> <small id="note-name">C4</small></h2>
          <p id="concert-name">B♭ 트럼펫 실음 B♭3</p>
        </div>
      </div>
    </div>
    <dl class="fingering-summary">
      <div><dt>운지</dt><dd id="fingering-text">개방</dd></div>
      <div><dt>오른손</dt><dd id="finger-text">모두 놓음</dd></div>
      <div><dt>포즈</dt><dd id="pose-text"><code>000</code></dd></div>
    </dl>
    <div class="current-actions">
      <button type="button" id="replay-audio"><span aria-hidden="true">♪</span> 다시 듣기</button>
      <button type="button" id="replay-motion"><span aria-hidden="true">↻</span> 동작 다시 보기</button>
    </div>
  </section>

  <section class="scene-card" aria-labelledby="scene-section-title">
    <div class="scene-heading">
      <div>
        <span class="section-kicker">FINGERING MOTION</span>
        <h2 id="scene-section-title">양손과 밸브 움직임</h2>
      </div>
      <div class="valve-legend" aria-label="밸브와 손가락 대응">
        <span><b>1</b> 검지</span><span><b>2</b> 중지</span><span><b>3</b> 약지</span>
      </div>
    </div>
    <div class="scene-wrap" id="scene-wrapper">
      {{SCENE_SVG}}
      <div class="valve-quiz-overlay" id="valve-quiz-overlay" hidden aria-label="밸브 퀴즈 답안">
        <button type="button" data-quiz-valve="3" aria-pressed="false">3<span class="sr-only">번 밸브</span></button>
        <button type="button" data-quiz-valve="2" aria-pressed="false">2<span class="sr-only">번 밸브</span></button>
        <button type="button" data-quiz-valve="1" aria-pressed="false">1<span class="sr-only">번 밸브</span></button>
      </div>
      <div class="quiz-scene-mask" id="quiz-scene-mask" hidden>
        <span aria-hidden="true">?</span>
        <strong>먼저 답을 골라 보세요</strong>
      </div>
    </div>
    <p class="scene-caption" id="scene-caption">오른손 검지·중지·약지가 1·2·3번 밸브와 같은 속도로 움직입니다.</p>
  </section>

  <section class="practice-card" aria-labelledby="practice-title">
    <div class="control-heading">
      <div><span class="section-kicker">PRACTICE</span><h2 id="practice-title">학습 방식</h2></div>
      <span class="progress-chip" id="progress-chip" hidden></span>
    </div>
    <div class="segmented mode-control" id="mode-control" role="group" aria-label="학습 모드">
      <button type="button" data-mode="learn" aria-pressed="true">배우기</button>
      <button type="button" data-mode="scale" aria-pressed="false">스케일</button>
      <button type="button" data-mode="quiz-number" aria-pressed="false">숫자 퀴즈</button>
      <button type="button" data-mode="quiz-valves" aria-pressed="false">밸브 퀴즈</button>
    </div>

    <div class="mode-panel" id="mode-panel" aria-live="polite"></div>

    <fieldset class="category-fieldset" id="category-fieldset">
      <legend>빠른 계이름 분류</legend>
      <div class="category-grid" id="category-control">
        <button type="button" data-category="middleNatural" aria-pressed="true"><b>낮은 계이름</b><span>C4–C5</span><kbd>Ctrl</kbd></button>
        <button type="button" data-category="highNatural" aria-pressed="false"><b>높은 계이름</b><span>C5–C6</span><kbd>Shift</kbd></button>
        <button type="button" data-category="middleChromatic" aria-pressed="false"><b>반음</b><span>C4 기준</span><kbd>Alt</kbd></button>
      </div>
    </fieldset>

    <details class="advanced-panel" id="advanced-panel">
      <summary><span>전체 음역 · 대체 운지</span><small>F♯3–C6, 31음</small></summary>
      <div class="advanced-content">
        <fieldset>
          <legend>옥타브 문맥</legend>
          <div class="mini-segmented" id="octave-control">
            <button type="button" data-octave="low" aria-pressed="false">C3 기반<small>F♯3–C♯4</small></button>
            <button type="button" data-octave="mid" aria-pressed="true">C4 기반<small>C4–C♯5</small></button>
            <button type="button" data-octave="high" aria-pressed="false">C5 기반<small>C5–C6</small></button>
          </div>
        </fieldset>
        <fieldset>
          <legend>변음</legend>
          <div class="mini-segmented" id="accidental-control">
            <button type="button" data-sharp="false" aria-pressed="true">자연음</button>
            <button type="button" data-sharp="true" aria-pressed="false">♯ / ♭</button>
          </div>
        </fieldset>
        <fieldset id="alternate-fieldset" hidden>
          <legend>대체 운지</legend>
          <div class="mini-segmented" id="alternate-control"></div>
        </fieldset>
      </div>
    </details>
  </section>

  <section class="keypad-dock" aria-labelledby="keypad-title">
    <div class="keypad-heading"><h2 id="keypad-title">계이름 숫자</h2><p id="keypad-hint">화면 버튼 또는 Ctrl+1–8</p></div>
    <div class="degree-keypad" id="degree-keypad">
      <button type="button" class="degree-key is-selected" data-degree="1" aria-pressed="true" aria-keyshortcuts="1 Control+1"><strong>1</strong><span>도</span><small>C4 · 개방</small></button>
      <button type="button" class="degree-key" data-degree="2" aria-pressed="false" aria-keyshortcuts="2 Control+2"><strong>2</strong><span>레</span><small>D4 · 1-3</small></button>
      <button type="button" class="degree-key" data-degree="3" aria-pressed="false" aria-keyshortcuts="3 Control+3"><strong>3</strong><span>미</span><small>E4 · 1-2</small></button>
      <button type="button" class="degree-key" data-degree="4" aria-pressed="false" aria-keyshortcuts="4 Control+4"><strong>4</strong><span>파</span><small>F4 · 1</small></button>
      <button type="button" class="degree-key" data-degree="5" aria-pressed="false" aria-keyshortcuts="5 Control+5"><strong>5</strong><span>솔</span><small>G4 · 개방</small></button>
      <button type="button" class="degree-key" data-degree="6" aria-pressed="false" aria-keyshortcuts="6 Control+6"><strong>6</strong><span>라</span><small>A4 · 1-2</small></button>
      <button type="button" class="degree-key" data-degree="7" aria-pressed="false" aria-keyshortcuts="7 Control+7"><strong>7</strong><span>시</span><small>B4 · 2</small></button>
      <button type="button" class="degree-key" data-degree="8" aria-pressed="false" aria-keyshortcuts="8 Control+8"><strong>8</strong><span>위 도</span><small>C5 · 개방</small></button>
    </div>
  </section>
</main>

<p class="sr-only" id="live-status" role="status" aria-live="polite" aria-atomic="true">낮은 계이름 1번 도, 기보 C4. 모든 밸브를 놓는 개방 운지입니다. 실음 B플랫3.</p>

<dialog id="settings-dialog" aria-labelledby="settings-title">
  <form method="dialog" class="dialog-card">
    <div class="dialog-heading"><div><span class="section-kicker">SETTINGS</span><h2 id="settings-title">학습 설정</h2></div><button class="dialog-close" value="close" aria-label="설정 닫기">×</button></div>
    <div class="settings-list">
      <label><span><b>소리</b><small>참고 음높이 재생</small></span><input id="setting-sound" type="checkbox" checked></label>
      <label><span><b>재생 음높이</b><small>기보음 또는 B♭ 실음</small></span><select id="setting-pitch"><option value="written">기보음</option><option value="concert">B♭ 실음</option></select></label>
      <label><span><b>터치 진동</b><small>지원 기기에서 10ms</small></span><input id="setting-haptic" type="checkbox" checked></label>
      <label><span><b>3번 슬라이드</b><small>저음 1-3 운지 보정 시연</small></span><input id="setting-slide" type="checkbox"></label>
      <label><span><b>키보드 단축키</b><small>숫자·Ctrl·Shift·Alt</small></span><input id="setting-shortcuts" type="checkbox" checked></label>
      <label><span><b>모션 줄이기</b><small>시스템 설정보다 더 줄일 수 있어요</small></span><select id="setting-motion"><option value="system">시스템 설정</option><option value="reduced">항상 줄이기</option></select></label>
    </div>
    <button class="primary-action" value="close">완료</button>
  </form>
</dialog>

<dialog id="help-dialog" aria-labelledby="help-title">
  <form method="dialog" class="dialog-card help-card">
    <div class="dialog-heading"><div><span class="section-kicker">SHORTCUTS</span><h2 id="help-title">키보드 도움말</h2></div><button class="dialog-close" value="close" aria-label="도움말 닫기">×</button></div>
    <dl class="shortcut-list">
      <div><dt><kbd>1–8</kbd></dt><dd>현재 화면 분류의 계이름</dd></div>
      <div><dt><kbd>Ctrl</kbd> + <kbd>1–8</kbd></dt><dd>C4–C5 낮은 계이름</dd></div>
      <div><dt><kbd>Shift</kbd> + <kbd>1–8</kbd></dt><dd>C5–C6 높은 계이름</dd></div>
      <div><dt><kbd>Alt</kbd> + <kbd>1–8</kbd></dt><dd>C4 기준 반음, 3·7은 중복으로 비활성</dd></div>
      <div><dt><kbd>↑</kbd><kbd>↓</kbd> / <kbd>S</kbd></dt><dd>옥타브 문맥 / 변음 전환</dd></div>
      <div><dt><kbd>Space</kbd> / <kbd>R</kbd></dt><dd>다시 듣기 / 운지 동작 다시 보기</dd></div>
    </dl>
    <p class="browser-note"><strong>알아두기</strong> 일반 브라우저는 Ctrl+숫자를 탭 이동에 사용할 수 있습니다. 이때는 화면의 분류와 숫자 버튼을 사용하세요.</p>
    <button class="primary-action" value="close">확인</button>
  </form>
</dialog>
`;
