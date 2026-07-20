import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  FINGERING_POSES,
  FINGER_POSE_LOOKUP,
  JOINT_LIMITS,
  LOOKUP_STEPS,
  PISTON_TRAVEL,
  SCENE_VIEW_BOX,
  SceneModel,
  capTarget,
  interpolatedFingerAngles,
  poseKey,
  sampleLeftRing,
  shouldUseThirdSlide,
} from '../src/scene.js';
import { MOTION_TIMING, MotionController } from '../src/motion.js';

const sceneUrl = new URL('../src/scene.svg', import.meta.url);
const REQUIRED_IDS = [
  'trumpet-scene',
  'scene-background',
  'scene-left-hand-back',
  'scene-trumpet',
  'scene-bell',
  'scene-valve-casings',
  'scene-slide-3',
  'scene-valve-1',
  'scene-valve-2',
  'scene-valve-3',
  'scene-left-hand',
  'scene-lh-ring',
  'scene-right-hand',
  'scene-right-hand-base',
  'scene-right-hand-fingers',
  'scene-finger-index',
  'scene-finger-middle',
  'scene-finger-ring',
  'scene-overlays',
];

const ALL_POSE_KEYS = ['000', '001', '010', '011', '100', '101', '110', '111'];

test('scene.svg keeps canonical geometry, unique IDs, and internal-only assets', async () => {
  const svg = await readFile(sceneUrl, 'utf8');
  assert.match(svg, /<svg\b[^>]*\bid="trumpet-scene"[^>]*\bviewBox="0 0 760 460"/);
  assert.deepEqual(SCENE_VIEW_BOX, { x: 0, y: 0, width: 760, height: 460 });

  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'SVG IDs must be unique');
  for (const id of REQUIRED_IDS) assert.ok(ids.includes(id), `missing #${id}`);

  for (const reference of svg.matchAll(/url\(#([^)]+)\)/g)) {
    assert.ok(ids.includes(reference[1]), `broken url(#${reference[1]}) reference`);
  }
  assert.doesNotMatch(svg, /<(?:image|foreignObject)\b/i);
  assert.doesNotMatch(svg, /\b(?:href|src)\s*=\s*["'](?:https?:)?\/\//i);
  assert.doesNotMatch(svg, /data:image\//i);

  assert.equal((svg.match(/data-tip="[123]"/g) ?? []).length, 3);
  assert.equal((svg.match(/data-cap-center="[123]"/g) ?? []).length, 3);
  assert.equal((svg.match(/data-cap-contact="[123]"/g) ?? []).length, 3);
  assert.equal((svg.match(/data-joint="mcp"/g) ?? []).length, 4);
  assert.equal((svg.match(/data-joint="pip"/g) ?? []).length, 4);
  assert.equal((svg.match(/data-joint="dip"/g) ?? []).length, 3);
});

test('all eight pose keys map to exactly the intended valve set', () => {
  assert.deepEqual(Object.keys(FINGERING_POSES).sort(), ALL_POSE_KEYS);
  for (const key of ALL_POSE_KEYS) {
    assert.equal(poseKey(FINGERING_POSES[key]), key);
    const sample = SceneModel.samplePose(key);
    assert.equal(sample.key, key);
    for (const number of [1, 2, 3]) {
      assert.equal(sample.fingers[number].progress, key[number - 1] === '1' ? 1 : 0);
    }
  }
});

test('33-node lookup and all 65 half-step samples satisfy contact and joint limits', () => {
  for (const number of [1, 2, 3]) {
    const lookup = FINGER_POSE_LOOKUP[number];
    assert.equal(lookup.length, LOOKUP_STEPS + 1);

    for (let index = 0; index < lookup.length; index += 1) {
      const sample = SceneModel.sampleFinger(number, index / LOOKUP_STEPS);
      assert.ok(sample.contactError <= 0.75, `valve ${number}, node ${index}: ${sample.contactError}`);
      assert.ok(sample.horizontalError <= 0.75);
      for (const joint of ['mcp', 'pip', 'dip']) {
        const [minimum, maximum] = JOINT_LIMITS[joint];
        assert.ok(sample.angles[joint] >= minimum - 1e-7);
        assert.ok(sample.angles[joint] <= maximum + 1e-7);
        if (index > 0) {
          assert.ok(
            Math.abs(lookup[index][joint] - lookup[index - 1][joint]) <= 4,
            `valve ${number} ${joint} jumps at node ${index}`,
          );
        }
      }
    }

    for (let halfStep = 0; halfStep <= 64; halfStep += 1) {
      const sample = SceneModel.sampleFinger(number, halfStep / 64);
      assert.ok(sample.contactError <= 1.5, `valve ${number}, half-step ${halfStep}`);
      assert.ok(sample.horizontalError <= 1.5);
      const interpolated = interpolatedFingerAngles(number, halfStep / 64);
      for (const joint of ['mcp', 'pip', 'dip']) {
        const [minimum, maximum] = JOINT_LIMITS[joint];
        assert.ok(interpolated[joint] >= minimum - 1e-7);
        assert.ok(interpolated[joint] <= maximum + 1e-7);
      }
    }
  }
});

test('piston and finger share p, preserving the 14-unit contact path', () => {
  for (const number of [1, 2, 3]) {
    const open = SceneModel.sampleFinger(number, 0);
    const pressed = SceneModel.sampleFinger(number, 1);
    assert.ok(Math.abs((pressed.capCenter.y - open.capCenter.y) - PISTON_TRAVEL) <= 1e-9);
    assert.ok(Math.abs((pressed.tip.y - open.tip.y) - PISTON_TRAVEL) <= 1e-9);
    assert.deepEqual(capTarget(number, 0), { x: open.capContact.x, y: open.capContact.y });
  }
});

test('third-slide rule and left ring maintain the fixed-root -14 contact contract', () => {
  assert.equal(shouldUseThirdSlide({ midi: 62, activeValves: [1, 3], slideMotionOn: true }), true);
  assert.equal(shouldUseThirdSlide({ midi: 63, activeValves: [1, 3], slideMotionOn: true }), false);
  assert.equal(shouldUseThirdSlide({ midi: 62, activeValves: [1], slideMotionOn: true }), false);
  assert.equal(shouldUseThirdSlide({ midi: 62, activeValves: [1, 3], slideMotionOn: false }), false);

  const open = sampleLeftRing(0);
  const extended = sampleLeftRing(1);
  assert.deepEqual(open.root, extended.root);
  assert.ok(Math.abs((extended.contact.x - open.contact.x) + 14) <= 1e-9);
  assert.ok(open.contactError <= 0.5);
  assert.ok(extended.contactError <= 0.5);
});

function motionHarness({ reducedMotion = false } = {}) {
  let now = 0;
  let nextId = 0;
  const callbacks = new Map();
  const frames = [];
  const media = {
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  };
  const renderer = { render: snapshot => frames.push(snapshot) };
  const controller = new MotionController(renderer, {
    now: () => now,
    requestFrame: callback => {
      const id = ++nextId;
      callbacks.set(id, callback);
      assert.ok(callbacks.size <= 1, 'only one shared rAF may be queued');
      return id;
    },
    cancelFrame: id => callbacks.delete(id),
    matchMedia: () => media,
    reducedMotion,
  });

  return {
    controller,
    frames,
    queued: () => callbacks.size,
    step(time) {
      assert.ok(time >= now);
      now = time;
      const scheduled = [...callbacks.values()];
      callbacks.clear();
      for (const callback of scheduled) callback(now);
      return controller.snapshot();
    },
    time: () => now,
  };
}

test('motion uses press 120/release 170 and does not restart a common valve', () => {
  const harness = motionHarness();
  const { controller } = harness;
  controller.setFingering([1, 2]);
  assert.equal(controller.snapshot().poseKey, '110');
  assert.equal(harness.step(MOTION_TIMING.press - 1).progress[1] < 1, true);
  let snapshot = harness.step(MOTION_TIMING.press);
  assert.equal(snapshot.progress[1], 1);
  assert.equal(snapshot.progress[2], 1);

  const commonBefore = controller.debugState().channels[2];
  controller.setFingering([2, 3]);
  const commonAfter = controller.debugState().channels[2];
  assert.equal(commonAfter.value, 1);
  assert.equal(commonAfter.active, false);
  assert.equal(commonAfter.startedAt, commonBefore.startedAt);
  assert.equal(controller.snapshot().poseKey, '011');

  snapshot = harness.step(MOTION_TIMING.press * 2);
  assert.equal(snapshot.progress[3], 1);
  assert.equal(controller.debugState().channels[1].active, true);
  snapshot = harness.step(MOTION_TIMING.press + MOTION_TIMING.release);
  assert.equal(snapshot.progress[1], 0);
  assert.equal(snapshot.progress[2], 1);
  assert.equal(snapshot.progress[3], 1);
  assert.equal(harness.queued(), 0);
  controller.destroy();
});

test('replay performs 70ms release then 120ms return without changing logical pose', () => {
  const harness = motionHarness();
  const { controller } = harness;
  controller.setFingering([1, 3]);
  harness.step(120);
  assert.equal(controller.replay(), true);
  assert.equal(controller.snapshot().poseKey, '101');

  harness.step(189);
  assert.equal(controller.debugState().channels[1].active, true);
  let snapshot = harness.step(190);
  assert.equal(snapshot.progress[1], 0);
  assert.equal(snapshot.replaying, true);
  snapshot = harness.step(310);
  assert.equal(snapshot.progress[1], 1);
  assert.equal(snapshot.progress[3], 1);
  assert.equal(snapshot.replaying, false);
  assert.equal(snapshot.poseKey, '101');
  controller.destroy();
});

test('reduced motion snaps fingers, pistons, replay, and slide in one render', () => {
  const harness = motionHarness({ reducedMotion: true });
  const { controller } = harness;
  const snapshot = controller.setFingering([1, 3], { slide: true });
  assert.deepEqual(snapshot.progress, { 1: 1, 2: 0, 3: 1 });
  assert.equal(snapshot.slideProgress, 1);
  assert.equal(snapshot.reducedMotion, true);
  assert.equal(snapshot.isAnimating, false);
  assert.equal(harness.queued(), 0);
  assert.equal(controller.replay(), false);
  controller.destroy();
});

test('third slide waits 20ms, reaches -14 at 220ms, and reverses cleanly', () => {
  const harness = motionHarness();
  const { controller } = harness;
  controller.setFingering([1, 3], { slide: true });
  assert.equal(harness.step(19).slideProgress, 0);
  assert.equal(harness.step(20).slideProgress, 0);
  assert.ok(harness.step(130).slideProgress > 0);
  let snapshot = harness.step(240);
  assert.equal(snapshot.slideProgress, 1);

  controller.setFingering([1, 3], { slide: false });
  snapshot = harness.step(459);
  assert.equal(controller.debugState().slide.active, true);
  snapshot = harness.step(460);
  assert.equal(snapshot.slideProgress, 0);
  assert.equal(snapshot.slideTarget, false);
  controller.destroy();
});

test('rapid retargeting continues from the current frame and last input wins', () => {
  const harness = motionHarness();
  const { controller } = harness;
  controller.setFingering([1]);
  const partial = harness.step(40).progress[1];
  assert.ok(partial > 0 && partial < 1);
  controller.setFingering([3]);
  assert.equal(controller.debugState().channels[1].from, partial);
  const snapshot = harness.step(220);
  assert.equal(snapshot.poseKey, '001');
  assert.equal(snapshot.progress[1], 0);
  assert.equal(snapshot.progress[2], 0);
  assert.equal(snapshot.progress[3], 1);
  assert.equal(harness.queued(), 0);
  controller.destroy();
});

test('scene source path is stable for build tooling', () => {
  assert.match(fileURLToPath(sceneUrl), /app[\\/]src[\\/]scene\.svg$/);
});

