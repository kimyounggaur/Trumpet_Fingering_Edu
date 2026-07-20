import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(testDir, '../..');
const indexPath = path.join(appDir, 'index.html');
const artifactDir = path.join(appDir, '.qa-artifacts');
const poseDir = path.join(artifactDir, 'poses');
const viewportDir = path.join(artifactDir, 'viewports');
const scenarioDir = path.join(artifactDir, 'scenarios');
const fileUrl = pathToFileURL(indexPath).href;

await Promise.all([
  mkdir(poseDir, { recursive: true }),
  mkdir(viewportDir, { recursive: true }),
  mkdir(scenarioDir, { recursive: true }),
]);

const result = {
  browser: null,
  fileMode: {},
  staticServer: {},
  initial: {},
  shortcuts: {},
  modes: {},
  accessibility: {},
  poses: {},
  viewports: {},
  touch: {},
  performance: {},
  console: { errors: [], warnings: [], pageErrors: [] },
};

function observePage(page, label) {
  page.on('console', message => {
    if (message.type() === 'error') result.console.errors.push(`${label}: ${message.text()}`);
    if (message.type() === 'warning') result.console.warnings.push(`${label}: ${message.text()}`);
  });
  page.on('pageerror', error => result.console.pageErrors.push(`${label}: ${error.message}`));
}

async function waitForPose(page, pose) {
  await page.waitForFunction(expected => {
    const svg = document.querySelector('#trumpet-scene');
    if (svg?.dataset.pose !== expected) return false;
    return [1, 2, 3].every(number => {
      const target = expected[number - 1] === '1' ? 1 : 0;
      const value = Number(document.querySelector(`#scene-valve-${number}`)?.dataset.progress);
      return Number.isFinite(value) && Math.abs(value - target) < 0.015;
    });
  }, pose, { timeout: 3_000 });
}

async function dispatchChord(page, modifier, digit) {
  return page.evaluate(({ modifierName, number }) => {
    const flags = {
      ctrlKey: modifierName === 'Control',
      shiftKey: modifierName === 'Shift',
      altKey: modifierName === 'Alt',
    };
    const down = new KeyboardEvent('keydown', {
      code: `Digit${number}`,
      key: String(number),
      bubbles: true,
      cancelable: true,
      ...flags,
    });
    document.dispatchEvent(down);
    document.dispatchEvent(new KeyboardEvent('keyup', {
      code: `Digit${number}`,
      key: String(number),
      bubbles: true,
      ...flags,
    }));
    return down.defaultPrevented;
  }, { modifierName: modifier, number: digit });
}

async function setPose(page, pose) {
  const screenSelection = {
    '000': ['middleNatural', 1],
    '100': ['middleNatural', 4],
    '010': ['middleNatural', 7],
    '110': ['middleNatural', 3],
    '101': ['middleNatural', 2],
    '011': ['middleChromatic', 2],
    '111': ['middleChromatic', 1],
  }[pose];
  if (screenSelection) {
    await page.locator(`[data-category="${screenSelection[0]}"]`).click();
    await page.locator(`[data-degree="${screenSelection[1]}"]`).click();
  } else if (pose === '001') {
    await page.locator('[data-category="middleNatural"]').click();
    await page.locator('[data-degree="3"]').click();
    if (!(await page.locator('#advanced-panel').evaluate(details => details.open))) {
      await page.locator('#advanced-panel summary').click();
    }
    await page.locator('[data-action="alternate"][data-alt-index="0"]').click();
  } else {
    throw new Error(`Unknown pose ${pose}`);
  }
  await waitForPose(page, pose);
}

async function screenContactGaps(page) {
  return page.evaluate(() => {
    const pointFor = element => {
      const svg = document.querySelector('#trumpet-scene');
      const point = svg.createSVGPoint();
      point.x = element.cx.baseVal.value;
      point.y = element.cy.baseVal.value;
      return point.matrixTransform(element.getScreenCTM());
    };
    const gaps = {};
    for (const number of [1, 2, 3]) {
      const tip = pointFor(document.querySelector(`[data-tip="${number}"]`));
      const cap = pointFor(document.querySelector(`[data-cap-contact="${number}"]`));
      gaps[number] = Math.hypot(tip.x - cap.x, tip.y - cap.y);
    }
    return gaps;
  });
}

function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
result.browser = {
  name: browser.browserType().name(),
  version: browser.version(),
  platform: process.platform,
  arch: process.arch,
};

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'ko-KR',
    colorScheme: 'light',
  });
  await context.addInitScript(() => {
    const NativeAudioContext = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    globalThis.__audioQa = {
      contexts: 0,
      oscillators: 0,
      gains: 0,
      filters: 0,
      oscillatorStarts: 0,
      gainRamps: 0,
    };
    if (!NativeAudioContext) return;
    const WrappedAudioContext = new Proxy(NativeAudioContext, {
      construct(Target, argumentsList) {
        const audioContext = Reflect.construct(Target, argumentsList, Target);
        globalThis.__audioQa.contexts += 1;
        const createOscillator = audioContext.createOscillator.bind(audioContext);
        const createGain = audioContext.createGain.bind(audioContext);
        const createBiquadFilter = audioContext.createBiquadFilter.bind(audioContext);
        audioContext.createOscillator = () => {
          const node = createOscillator();
          globalThis.__audioQa.oscillators += 1;
          const start = node.start.bind(node);
          node.start = (...args) => {
            globalThis.__audioQa.oscillatorStarts += 1;
            return start(...args);
          };
          return node;
        };
        audioContext.createGain = () => {
          const node = createGain();
          globalThis.__audioQa.gains += 1;
          const ramp = node.gain.linearRampToValueAtTime.bind(node.gain);
          node.gain.linearRampToValueAtTime = (...args) => {
            globalThis.__audioQa.gainRamps += 1;
            return ramp(...args);
          };
          return node;
        };
        audioContext.createBiquadFilter = () => {
          globalThis.__audioQa.filters += 1;
          return createBiquadFilter();
        };
        return audioContext;
      },
    });
    globalThis.AudioContext = WrappedAudioContext;
    if (globalThis.webkitAudioContext) globalThis.webkitAudioContext = WrappedAudioContext;
  });
  const page = await context.newPage();
  observePage(page, 'functional');
  const fileRequests = [];
  page.on('request', request => fileRequests.push({ url: request.url(), type: request.resourceType() }));
  await page.goto(fileUrl, { waitUntil: 'load' });

  assert.equal(await page.locator('#note-name').textContent(), 'C4');
  assert.equal(await page.locator('#trumpet-scene').getAttribute('data-pose'), '000');
  assert.equal(await page.locator('#fingering-text').textContent(), '개방');
  const initialAudioQa = await page.evaluate(() => globalThis.__audioQa);
  assert.equal(initialAudioQa.contexts, 0);
  result.initial = {
    note: 'C4',
    pose: '000',
    audioContextCreatedBeforeActivation: initialAudioQa.contexts > 0,
  };
  result.fileMode = {
    documentRequests: fileRequests.filter(item => item.type === 'document').length,
    subresourceRequests: fileRequests.filter(item => item.type !== 'document').length,
    externalRequests: fileRequests.filter(item => !item.url.startsWith('file:') && !item.url.startsWith('data:')).length,
  };
  assert.equal(result.fileMode.subresourceRequests, 0);
  assert.equal(result.fileMode.externalRequests, 0);

  // Keep browser QA silent while testing frequent selection paths.
  await page.locator('#mute-toggle').click();

  const ctrl2Prevented = await dispatchChord(page, 'Control', 2);
  await waitForPose(page, '101');
  assert.equal(await page.locator('#note-name').textContent(), 'D4');
  const beforeInvalid = await page.locator('#note-name').textContent();
  const alt3Prevented = await dispatchChord(page, 'Alt', 3);
  assert.equal(await page.locator('#note-name').textContent(), beforeInvalid);
  const shift7Prevented = await dispatchChord(page, 'Shift', 7);
  await waitForPose(page, '010');
  assert.equal(await page.locator('#note-name').textContent(), 'B5');
  result.shortcuts = {
    control2: 'D4/101',
    alt3: 'inactive-state-preserved',
    shift7: 'B5/010',
    defaultPrevented: { control2: ctrl2Prevented, alt3: alt3Prevented, shift7: shift7Prevented },
    browserReservedFallback: 'screen category buttons verified by pose matrix',
  };

  // Learn → scale complete.
  await page.locator('[data-mode="learn"]').click();
  assert.equal(await page.locator('#progress-chip').isVisible(), false);
  await page.locator('[data-mode="scale"]').click();
  for (let degree = 1; degree <= 8; degree += 1) {
    await page.locator(`[data-degree="${degree}"]`).click();
  }
  assert.match(await page.locator('#mode-panel').innerText(), /완주/);
  assert.match(await page.locator('#progress-chip').innerText(), /8\s*\/\s*8/);
  result.modes.scale = 'ascending-8-of-8-complete';

  // Number quiz: answering state contains no answer labels/fingering/pose.
  await page.locator('[data-mode="quiz-number"]').click();
  assert.equal(await page.locator('#degree-display').textContent(), '?');
  assert.equal(await page.locator('#fingering-text').textContent(), '비공개');
  assert.equal(await page.locator('#pose-text').textContent(), '???');
  assert.equal(await page.locator('#quiz-scene-mask').isVisible(), true);
  assert.equal(await page.locator('#progress-chip').isVisible(), false);
  const answerButtonText = await page.locator('[data-degree]').allTextContents();
  assert.equal(answerButtonText.some(text => /C\d|D\d|E\d|F\d|G\d|A\d|B\d|개방|1-2|1-3/.test(text)), false);
  const answerButtonNames = await page.locator('[data-degree]').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')));
  assert.equal(answerButtonNames.some(name => /기보|운지|도|레|미|파|솔|라|시/.test(name)), false);
  await page.screenshot({ path: path.join(scenarioDir, 'quiz-number-answer-hidden.png'), fullPage: true });
  await page.locator('[data-degree="1"]').click();
  if (await page.locator('[data-action="quiz-reveal"]').isVisible().catch(() => false)) {
    await page.locator('[data-action="quiz-reveal"]').click();
  }
  assert.notEqual(await page.locator('#pose-text').textContent(), '???');
  result.modes.numberQuiz = 'answer-hidden-then-revealed';

  // Complete a full ten-question number session, regardless of randomized targets.
  await page.locator('[data-mode="quiz-number"]').click();
  for (let question = 1; question <= 10; question += 1) {
    await page.locator('[data-degree="1"]').click();
    if (await page.locator('#pose-text').textContent() === '???') {
      await page.locator('[data-degree="1"]').click();
    }
    assert.notEqual(await page.locator('#pose-text').textContent(), '???');
    if (question < 10) await page.locator('[data-action="quiz-next"]').click();
  }
  assert.match(await page.locator('#progress-chip').innerText(), /첫 시도\s+\d+%/);
  await page.screenshot({ path: path.join(scenarioDir, 'quiz-number-10-complete.png'), fullPage: true });
  await page.locator('[data-action="quiz-next"]').click();
  assert.equal(await page.locator('#pose-text').textContent(), '???');
  assert.equal(await page.locator('#progress-chip').isVisible(), false);
  result.modes.numberQuizTenQuestions = 'complete-and-new-session-reset';

  // Valve quiz: candidate pose only; first error remains hidden if it is wrong.
  await page.locator('[data-mode="quiz-valves"]').click();
  assert.equal(await page.locator('#fingering-text').textContent(), '비공개');
  assert.equal(await page.locator('#valve-quiz-overlay').isVisible(), true);
  await page.locator('[data-quiz-valve="1"]').click();
  await waitForPose(page, '100');
  const overlayGap = await page.evaluate(() => {
    const button = document.querySelector('[data-quiz-valve="1"]');
    const cap = document.querySelector('[data-cap-center="1"]');
    const svg = document.querySelector('#trumpet-scene');
    const point = svg.createSVGPoint();
    point.x = cap.cx.baseVal.value;
    point.y = cap.cy.baseVal.value;
    const capPoint = point.matrixTransform(cap.getScreenCTM());
    const rect = button.getBoundingClientRect();
    return Math.hypot(rect.x + rect.width / 2 - capPoint.x, rect.y + rect.height / 2 - capPoint.y);
  });
  assert.ok(overlayGap <= 1, `valve overlay gap ${overlayGap}px`);
  assert.match(await page.locator('.candidate-readout').textContent(), /1/);
  await page.locator('[data-action="quiz-submit-valves"]').click();
  const valvePhaseHidden = await page.locator('#fingering-text').textContent() === '비공개';
  if (valvePhaseHidden) {
    assert.equal(await page.locator('#pose-text').textContent(), '???');
    assert.equal(await page.locator('#progress-chip').isVisible(), false);
  }
  await page.screenshot({ path: path.join(scenarioDir, 'quiz-valve-candidate.png'), fullPage: true });
  result.modes.valveQuiz = valvePhaseHidden
    ? 'first-wrong-target-still-hidden'
    : 'first-answer-correct-and-revealed';

  // Complete a full ten-question valve session using open as the deterministic candidate.
  await page.locator('[data-mode="quiz-valves"]').click();
  for (let question = 1; question <= 10; question += 1) {
    await page.locator('[data-action="quiz-submit-valves"]').click();
    if (await page.locator('#pose-text').textContent() === '???') {
      await page.locator('[data-action="quiz-submit-valves"]').click();
    }
    assert.notEqual(await page.locator('#pose-text').textContent(), '???');
    if (question < 10) await page.locator('[data-action="quiz-next"]').click();
  }
  assert.match(await page.locator('#progress-chip').innerText(), /첫 시도\s+\d+%/);
  await page.screenshot({ path: path.join(scenarioDir, 'quiz-valve-10-complete.png'), fullPage: true });
  await page.locator('[data-action="quiz-next"]').click();
  assert.equal(await page.locator('#pose-text').textContent(), '???');
  assert.equal(await page.locator('#progress-chip').isVisible(), false);
  result.modes.valveQuizTenQuestions = 'complete-and-new-session-reset';

  // Dialog semantics, keyboard exclusion and accessible control names.
  await page.locator('[data-mode="learn"]').click();
  await page.locator('#settings-open').click();
  assert.equal(await page.locator('#settings-dialog').getAttribute('aria-labelledby'), 'settings-title');
  const dialogBefore = await page.locator('#note-name').textContent();
  await dispatchChord(page, 'Control', 4);
  assert.equal(await page.locator('#note-name').textContent(), dialogBefore);
  await page.locator('#settings-dialog .dialog-close').click();
  const unnamedVisibleButtons = await page.locator('button:visible').evaluateAll(buttons => buttons.filter(button => {
    const label = button.getAttribute('aria-label') || button.textContent.trim();
    return !label;
  }).length);
  assert.equal(unnamedVisibleButtons, 0);
  result.accessibility = {
    visibleButtonsWithNames: true,
    settingsDialogLabelled: true,
    globalShortcutsExcludedWhileDialogOpen: true,
    quizAnswerLabelsNeutral: true,
  };

  // All 8 final poses with measured screen-pixel contact and visual evidence.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const pose of ['000', '100', '010', '001', '110', '101', '011', '111']) {
    await setPose(page, pose);
    const gaps = await screenContactGaps(page);
    const maximumGap = Math.max(...Object.values(gaps));
    assert.ok(maximumGap <= 2, `${pose} contact gap ${maximumGap}px exceeds 2px`);
    const screenshot = path.join(poseDir, `pose-${pose}-390x844.png`);
    await page.locator('.scene-card').screenshot({ path: screenshot });
    result.poses[pose] = { gapsScreenPx: gaps, maximumGap, screenshot: path.relative(appDir, screenshot) };
  }

  // Responsive matrix, including rotation persistence.
  const viewports = [
    [320, 568], [360, 740], [390, 844], [430, 932],
    [768, 1024], [844, 390], [1280, 800], [1440, 900],
  ];
  await page.locator('[data-category="middleNatural"]').click();
  await page.locator('[data-degree="2"]').click();
  await waitForPose(page, '101');
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(40);
    const metrics = await page.evaluate(() => {
      const svgRect = document.querySelector('#trumpet-scene').getBoundingClientRect();
      return {
        innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        sceneLeft: svgRect.left,
        sceneRight: svgRect.right,
        note: document.querySelector('#note-name').textContent,
        pose: document.querySelector('#trumpet-scene').dataset.pose,
      };
    });
    assert.ok(metrics.scrollWidth <= metrics.innerWidth + 1, `${width}x${height} horizontal overflow`);
    assert.ok(metrics.sceneLeft >= -1 && metrics.sceneRight <= metrics.innerWidth + 1, `${width}x${height} scene clipping`);
    assert.equal(metrics.note, 'D4');
    assert.equal(metrics.pose, '101');
    const screenshot = path.join(viewportDir, `viewport-${width}x${height}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    result.viewports[`${width}x${height}`] = { ...metrics, screenshot: path.relative(appDir, screenshot) };
  }

  // 320px dialog bounds.
  await page.setViewportSize({ width: 320, height: 568 });
  await page.locator('#settings-open').click();
  const dialogRect = await page.locator('#settings-dialog').boundingBox();
  assert.ok(dialogRect.x >= 0 && dialogRect.y >= 0);
  assert.ok(dialogRect.x + dialogRect.width <= 320.5 && dialogRect.y + dialogRect.height <= 568.5);
  const dialogScroll = await page.locator('#settings-dialog').evaluate(dialog => ({
    clientHeight: dialog.clientHeight,
    scrollHeight: dialog.scrollHeight,
    overflowY: getComputedStyle(dialog).overflowY,
  }));
  assert.ok(dialogScroll.scrollHeight >= dialogScroll.clientHeight);
  assert.match(dialogScroll.overflowY, /auto|scroll/);
  await page.screenshot({ path: path.join(scenarioDir, 'settings-dialog-320x568.png') });
  await page.locator('#settings-dialog .dialog-close').click();

  // Forced colors and reduced motion equivalents.
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.locator('[data-category="middleChromatic"]').click();
  await page.locator('[data-degree="1"]').click();
  const reducedProgress = await page.locator('#scene-valve-1').getAttribute('data-progress');
  assert.equal(Number(reducedProgress), 1);
  assert.equal(await page.locator('#trumpet-scene').getAttribute('data-pose'), '111');
  await page.screenshot({ path: path.join(scenarioDir, 'forced-colors-reduced-motion-320x568.png') });
  result.accessibility.forcedColorsRendered = true;
  result.accessibility.reducedMotionSnaps = true;
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });

  // Warm up, then collect the mandated three 10-second frame samples.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#mute-toggle').evaluate(button => {
    if (button.getAttribute('aria-pressed') === 'false') button.click();
  });
  await page.evaluate(async () => {
    const natural = document.querySelector('[data-category="middleNatural"]');
    const chromatic = document.querySelector('[data-category="middleChromatic"]');
    const one = document.querySelector('[data-degree="1"]');
    const two = document.querySelector('[data-degree="2"]');
    for (const [category, degree] of [[natural, one], [chromatic, one], [natural, two], [chromatic, two]]) {
      category.click(); degree.click(); await new Promise(resolve => setTimeout(resolve, 220));
    }
  });

  await page.waitForTimeout(260);
  const firstVisual = await page.evaluate(async () => {
    const one = document.querySelector('[data-degree="1"]');
    const valve = document.querySelector('#scene-valve-1');
    const before = Number(valve.dataset.progress);
    const started = performance.now();
    one.click();
    const logicalMs = performance.now() - started;
    const firstFrameMs = await new Promise(resolve => {
      const check = () => {
        if (Number(valve.dataset.progress) > before + 0.0001) resolve(performance.now() - started);
        else requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
    return { logicalMs, firstFrameMs };
  });
  assert.ok(firstVisual.logicalMs <= 50, `logical response ${firstVisual.logicalMs}ms`);
  assert.ok(firstVisual.firstFrameMs <= 100, `first visual response ${firstVisual.firstFrameMs}ms`);

  const sceneBudget = await page.evaluate(() => ({
    sceneNodes: document.querySelector('#trumpet-scene').querySelectorAll('*').length,
    movingTopLevelNodes: document.querySelectorAll('.scene-valve, .scene-finger, #scene-slide-3, #scene-lh-ring').length,
  }));
  assert.ok(sceneBudget.sceneNodes <= 300);
  assert.ok(sceneBudget.movingTopLevelNodes <= 20);

  const samples = [];
  for (let run = 0; run < 3; run += 1) {
    const sample = await page.evaluate(async () => {
      const natural = document.querySelector('[data-category="middleNatural"]');
      const chromatic = document.querySelector('[data-category="middleChromatic"]');
      const one = document.querySelector('[data-degree="1"]');
      const two = document.querySelector('[data-degree="2"]');
      const transitions = [[natural, one], [chromatic, one], [natural, two], [chromatic, two]];
      const frameIntervals = [];
      const longTasks = [];
      const observer = typeof PerformanceObserver === 'function'
        ? new PerformanceObserver(list => longTasks.push(...list.getEntries().map(entry => entry.duration)))
        : null;
      try { observer?.observe({ type: 'longtask', buffered: false }); } catch { /* unsupported */ }

      const started = performance.now();
      let previousFrame = null;
      let nextTransition = started;
      let transitionIndex = 0;
      await new Promise(resolve => {
        const tick = timestamp => {
          if (previousFrame !== null) frameIntervals.push(timestamp - previousFrame);
          previousFrame = timestamp;
          if (timestamp >= nextTransition) {
            const [category, degree] = transitions[transitionIndex % transitions.length];
            category.click();
            degree.click();
            transitionIndex += 1;
            nextTransition += 250;
          }
          if (timestamp - started < 10_000) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      observer?.disconnect();
      const duration = performance.now() - started;
      return {
        duration,
        transitions: transitionIndex,
        frameIntervals,
        longTasks,
      };
    });
    const averageInterval = sample.frameIntervals.reduce((sum, value) => sum + value, 0) / sample.frameIntervals.length;
    samples.push({
      durationMs: sample.duration,
      transitions: sample.transitions,
      frames: sample.frameIntervals.length,
      averageFps: 1000 / averageInterval,
      p95IntervalMs: percentile(sample.frameIntervals, 0.95),
      maximumIntervalMs: Math.max(...sample.frameIntervals),
      longTasksOver50Ms: sample.longTasks.filter(value => value > 50).length,
    });
  }
  result.performance = {
    samples,
    medianAverageFps: median(samples.map(sample => sample.averageFps)),
    medianP95IntervalMs: median(samples.map(sample => sample.p95IntervalMs)),
    medianLongTasksOver50Ms: median(samples.map(sample => sample.longTasksOver50Ms)),
    viewport: '390x844',
    runs: 3,
    durationPerRunSeconds: 10,
    inputToLogicalMs: firstVisual.logicalMs,
    inputToFirstVisualMs: firstVisual.firstFrameMs,
    ...sceneBudget,
  };
  assert.ok(result.performance.medianAverageFps >= 55, `median FPS ${result.performance.medianAverageFps}`);
  assert.ok(result.performance.medianP95IntervalMs <= 18.2, `median p95 ${result.performance.medianP95IntervalMs}`);
  assert.equal(result.performance.medianLongTasksOver50Ms, 0);

  // Actual Chrome Web Audio smoke: lazy creation and one reusable two-oscillator voice.
  if (await page.locator('#mute-toggle').getAttribute('aria-pressed') === 'true') {
    await page.locator('#mute-toggle').click();
  }
  await page.locator('[data-category="middleNatural"]').click();
  await page.locator('[data-degree="2"]').click();
  await page.waitForTimeout(60);
  await page.locator('[data-degree="3"]').click();
  await page.waitForTimeout(60);
  const audioQa = await page.evaluate(() => globalThis.__audioQa);
  assert.equal(audioQa.contexts, 1);
  assert.equal(audioQa.oscillators, 2);
  assert.equal(audioQa.oscillatorStarts, 2);
  assert.equal(audioQa.gains, 2);
  assert.equal(audioQa.filters, 1);
  assert.ok(audioQa.gainRamps >= 4);
  result.audio = {
    ...audioQa,
    lazyContext: true,
    voiceReusedAcrossTwoNotes: true,
  };

  await context.close();

  // Touch path: one tap, one selection, no legacy 300ms delay.
  const touchContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
  });
  const touchPage = await touchContext.newPage();
  observePage(touchPage, 'touch');
  await touchPage.goto(fileUrl, { waitUntil: 'load' });
  await touchPage.locator('#mute-toggle').tap();
  const tapStarted = Date.now();
  await touchPage.locator('[data-degree="2"]').tap();
  await touchPage.waitForFunction(() => document.querySelector('#note-name').textContent === 'D4');
  const tapLatency = Date.now() - tapStarted;
  assert.ok(tapLatency < 300, `tap latency ${tapLatency}ms`);
  assert.equal(await touchPage.locator('#note-name').textContent(), 'D4');
  assert.equal(await touchPage.locator('#trumpet-scene').getAttribute('data-pose'), '101');
  result.touch = { oneTapOneSelection: true, latencyMs: tapLatency };
  await touchContext.close();

  // Static-server mode must issue exactly one document request and no subresources.
  const html = await readFile(indexPath);
  const serverRequests = [];
  const server = createServer((request, response) => {
    serverRequests.push(request.url);
    if (request.url === '/' || request.url === '/index.html') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(html);
    } else {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const serverContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const serverPage = await serverContext.newPage();
  observePage(serverPage, 'static-server');
  const browserRequests = [];
  serverPage.on('request', request => browserRequests.push({ url: request.url(), type: request.resourceType() }));
  await serverPage.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'networkidle' });
  assert.equal(await serverPage.locator('#note-name').textContent(), 'C4');
  assert.deepEqual(serverRequests, ['/index.html']);
  assert.equal(browserRequests.filter(item => item.type !== 'document').length, 0);
  result.staticServer = {
    serverRequests,
    documentRequests: browserRequests.filter(item => item.type === 'document').length,
    subresourceRequests: browserRequests.filter(item => item.type !== 'document').length,
  };
  await serverContext.close();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));

  assert.deepEqual(result.console.errors, []);
  assert.deepEqual(result.console.warnings, []);
  assert.deepEqual(result.console.pageErrors, []);
} finally {
  await browser.close();
}

const reportPath = path.join(artifactDir, 'e2e-results.json');
await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  report: path.relative(appDir, reportPath),
  poses: Object.keys(result.poses).length,
  viewports: Object.keys(result.viewports).length,
  fileSubresources: result.fileMode.subresourceRequests,
  serverRequests: result.staticServer.serverRequests,
  consoleErrors: result.console.errors.length,
  consoleWarnings: result.console.warnings.length,
  performance: result.performance,
}, null, 2));
