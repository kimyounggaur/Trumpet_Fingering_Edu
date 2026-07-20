import { MotionController } from './motion.js';

export const SCENE_VIEW_BOX = Object.freeze({ x: 0, y: 0, width: 760, height: 460 });
export const PISTON_TRAVEL = 14;
export const LOOKUP_STEPS = 32;

const radians = degrees => degrees * Math.PI / 180;
const degrees = angle => angle * 180 / Math.PI;
const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const round = (value, precision = 6) => Number(value.toFixed(precision));

export const FINGERING_POSES = Object.freeze({
  '000': Object.freeze([]),
  '100': Object.freeze([1]),
  '010': Object.freeze([2]),
  '001': Object.freeze([3]),
  '110': Object.freeze([1, 2]),
  '101': Object.freeze([1, 3]),
  '011': Object.freeze([2, 3]),
  '111': Object.freeze([1, 2, 3]),
});

export const VALVE_CAPS = Object.freeze({
  1: Object.freeze({ cx: 450, cy: 165, r: 18 }),
  2: Object.freeze({ cx: 385, cy: 165, r: 18 }),
  3: Object.freeze({ cx: 320, cy: 165, r: 18 }),
});

/**
 * The base direction plus relative MCP/PIP/DIP angles produces the original
 * curved silhouette while keeping every output angle inside the anatomical
 * limits from the master specification.
 */
export const FINGER_RIGS = Object.freeze({
  1: Object.freeze({
    name: 'index',
    id: 'scene-finger-index',
    root: Object.freeze({ x: 575, y: 105 }),
    lengths: Object.freeze([58, 52, 32]),
    base: 177,
    dip: -1,
  }),
  2: Object.freeze({
    name: 'middle',
    id: 'scene-finger-middle',
    root: Object.freeze({ x: 550, y: 88 }),
    lengths: Object.freeze([70, 67, 48]),
    base: 171,
    dip: 21,
  }),
  3: Object.freeze({
    name: 'ring',
    id: 'scene-finger-ring',
    root: Object.freeze({ x: 525, y: 101 }),
    lengths: Object.freeze([78, 82, 58]),
    base: 173,
    dip: 24,
  }),
});

export const JOINT_LIMITS = Object.freeze({
  mcp: Object.freeze([-5, 65]),
  pip: Object.freeze([0, 105]),
  dip: Object.freeze([-5, 80]),
});

export function normalizeValves(valves) {
  const input = Array.isArray(valves) ? valves : [];
  return Object.freeze([1, 2, 3].filter(number => input.includes(number)));
}

export function poseKey(valves) {
  const normalized = normalizeValves(valves);
  return [1, 2, 3].map(number => normalized.includes(number) ? '1' : '0').join('');
}

export function valvesForPose(key) {
  if (!Object.hasOwn(FINGERING_POSES, key)) {
    throw new RangeError(`Unknown fingering pose: ${key}`);
  }
  return FINGERING_POSES[key];
}

export function capTarget(number, progress) {
  const cap = VALVE_CAPS[number];
  if (!cap) throw new RangeError(`Unknown valve: ${number}`);
  const p = clamp01(progress);
  return Object.freeze({
    x: cap.cx,
    y: cap.cy - cap.r + PISTON_TRAVEL * p + 1,
  });
}

/** Forward kinematics in root SVG user coordinates. */
export function forwardFingerTip(number, angles) {
  const rig = FINGER_RIGS[number];
  if (!rig) throw new RangeError(`Unknown valve: ${number}`);
  const [proximal, middle, distal] = rig.lengths;
  const theta1 = radians(rig.base + angles.mcp);
  const theta2 = theta1 - radians(angles.pip);
  const theta3 = theta2 - radians(angles.dip);
  return Object.freeze({
    x: rig.root.x
      + proximal * Math.cos(theta1)
      + middle * Math.cos(theta2)
      + distal * Math.cos(theta3),
    y: rig.root.y
      + proximal * Math.sin(theta1)
      + middle * Math.sin(theta2)
      + distal * Math.sin(theta3),
  });
}

/**
 * Exact, non-iterative IK. The fixed DIP angle lets the middle and distal
 * links collapse into one equivalent link, after which ordinary two-link IK
 * solves MCP and PIP without layout reads or per-frame optimization.
 */
export function solveFingerAngles(number, progress) {
  const rig = FINGER_RIGS[number];
  if (!rig) throw new RangeError(`Unknown valve: ${number}`);
  const target = capTarget(number, progress);
  const [proximal, middle, distal] = rig.lengths;
  const dipRadians = radians(rig.dip);

  const combinedX = middle + distal * Math.cos(dipRadians);
  const combinedY = -distal * Math.sin(dipRadians);
  const combinedLength = Math.hypot(combinedX, combinedY);
  const combinedOffset = Math.atan2(combinedY, combinedX);

  const dx = target.x - rig.root.x;
  const dy = target.y - rig.root.y;
  const distanceSquared = dx ** 2 + dy ** 2;
  const cosine = Math.max(-1, Math.min(1,
    (distanceSquared - proximal ** 2 - combinedLength ** 2)
      / (2 * proximal * combinedLength)));
  const combinedJoint = -Math.acos(cosine);
  const theta1 = Math.atan2(dy, dx)
    - Math.atan2(
      combinedLength * Math.sin(combinedJoint),
      proximal + combinedLength * Math.cos(combinedJoint),
    );

  const angles = Object.freeze({
    mcp: degrees(theta1) - rig.base,
    pip: degrees(combinedOffset - combinedJoint),
    dip: rig.dip,
  });
  for (const joint of ['mcp', 'pip', 'dip']) {
    const [minimum, maximum] = JOINT_LIMITS[joint];
    if (angles[joint] < minimum - 1e-7 || angles[joint] > maximum + 1e-7) {
      throw new RangeError(`${rig.name} ${joint} angle is outside its anatomical limit.`);
    }
  }
  return angles;
}

function freezeLookup() {
  const lookup = {};
  for (const number of [1, 2, 3]) {
    lookup[number] = Object.freeze(Array.from(
      { length: LOOKUP_STEPS + 1 },
      (_, index) => solveFingerAngles(number, index / LOOKUP_STEPS),
    ));
  }
  return Object.freeze(lookup);
}

export const FINGER_POSE_LOOKUP = freezeLookup();

export function interpolatedFingerAngles(number, progress) {
  if (!FINGER_RIGS[number]) throw new RangeError(`Unknown valve: ${number}`);
  const scaled = clamp01(progress) * LOOKUP_STEPS;
  const lowerIndex = Math.floor(scaled);
  const upperIndex = Math.min(LOOKUP_STEPS, lowerIndex + 1);
  const amount = scaled - lowerIndex;
  const lower = FINGER_POSE_LOOKUP[number][lowerIndex];
  const upper = FINGER_POSE_LOOKUP[number][upperIndex];
  return Object.freeze({
    mcp: lower.mcp + (upper.mcp - lower.mcp) * amount,
    pip: lower.pip + (upper.pip - lower.pip) * amount,
    dip: lower.dip + (upper.dip - lower.dip) * amount,
  });
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export class SceneModel {
  static sampleFinger(number, progress) {
    const p = clamp01(progress);
    const angles = interpolatedFingerAngles(number, p);
    const tip = forwardFingerTip(number, angles);
    const capContact = capTarget(number, p);
    const cap = VALVE_CAPS[number];
    return Object.freeze({
      number,
      progress: p,
      root: FINGER_RIGS[number].root,
      angles,
      tip,
      capCenter: Object.freeze({ x: cap.cx, y: cap.cy + PISTON_TRAVEL * p }),
      capContact,
      contactError: distance(tip, capContact),
      horizontalError: Math.abs(tip.x - capContact.x),
    });
  }

  static samplePose(valves = []) {
    const normalized = typeof valves === 'string' ? valvesForPose(valves) : normalizeValves(valves);
    const fingers = {};
    for (const number of [1, 2, 3]) {
      fingers[number] = SceneModel.sampleFinger(number, normalized.includes(number) ? 1 : 0);
    }
    return Object.freeze({
      key: poseKey(normalized),
      valves: normalized,
      fingers: Object.freeze(fingers),
    });
  }
}

/** The optional pedagogical slide rule; it is not a cents-accurate model. */
export function shouldUseThirdSlide({ midi, activeValves, slideMotionOn }) {
  const valves = normalizeValves(activeValves);
  return slideMotionOn === true
    && Number.isFinite(midi)
    && midi <= 62
    && valves.includes(1)
    && valves.includes(3);
}

const LEFT_RING = Object.freeze({
  root: Object.freeze({ x: 291, y: 329 }),
  lengths: Object.freeze([33, 33]),
  contact: Object.freeze({ x: 246, y: 316 }),
});

export function sampleLeftRing(progress) {
  const p = clamp01(progress);
  const target = {
    x: LEFT_RING.contact.x - PISTON_TRAVEL * p,
    y: LEFT_RING.contact.y,
  };
  const [first, second] = LEFT_RING.lengths;
  const dx = target.x - LEFT_RING.root.x;
  const dy = target.y - LEFT_RING.root.y;
  const cosine = Math.max(-1, Math.min(1,
    (dx ** 2 + dy ** 2 - first ** 2 - second ** 2) / (2 * first * second)));
  const pip = Math.acos(cosine);
  const mcp = Math.atan2(dy, dx)
    - Math.atan2(second * Math.sin(pip), first + second * Math.cos(pip));
  const tip = {
    x: LEFT_RING.root.x + first * Math.cos(mcp) + second * Math.cos(mcp + pip),
    y: LEFT_RING.root.y + first * Math.sin(mcp) + second * Math.sin(mcp + pip),
  };
  return Object.freeze({
    progress: p,
    root: LEFT_RING.root,
    mcp: degrees(mcp),
    pip: degrees(pip),
    tip: Object.freeze(tip),
    contact: Object.freeze(target),
    contactError: distance(tip, target),
  });
}

function resolveSvgRoot(root) {
  if (!root) throw new TypeError('A scene SVG root or containing element is required.');
  if (root.id === 'trumpet-scene') return root;
  const svg = root.querySelector?.('#trumpet-scene');
  if (!svg) throw new TypeError('The supplied root does not contain #trumpet-scene.');
  return svg;
}

function required(root, selector) {
  const element = root.querySelector(selector);
  if (!element) throw new Error(`Trumpet scene is missing ${selector}.`);
  return element;
}

function transformNumber(value) {
  return round(value, 4).toString();
}

/** Applies pure SceneModel samples to the nested SVG joint matrices. */
export class SVGSceneRenderer {
  constructor(root) {
    this.svg = resolveSvgRoot(root);
    this.valves = {};
    this.fingers = {};
    for (const number of [1, 2, 3]) {
      const rig = FINGER_RIGS[number];
      const finger = required(this.svg, `#${rig.id}`);
      this.valves[number] = required(this.svg, `#scene-valve-${number}`);
      this.fingers[number] = {
        root: finger,
        mcp: required(finger, '[data-joint="mcp"]'),
        pip: required(finger, '[data-joint="pip"]'),
        dip: required(finger, '[data-joint="dip"]'),
      };
    }
    this.slide = required(this.svg, '#scene-slide-3');
    this.leftRing = required(this.svg, '#scene-lh-ring');
    this.leftRingMcp = required(this.leftRing, '[data-joint="mcp"]');
    this.leftRingPip = required(this.leftRing, '[data-joint="pip"]');
  }

  render(snapshot) {
    for (const number of [1, 2, 3]) {
      const p = clamp01(snapshot.progress[number]);
      const sample = SceneModel.sampleFinger(number, p);
      const rig = FINGER_RIGS[number];
      this.valves[number].setAttribute('transform', `translate(0 ${transformNumber(PISTON_TRAVEL * p)})`);
      this.valves[number].classList.toggle('pressed', snapshot.targets[number]);
      this.valves[number].setAttribute('data-progress', transformNumber(p));

      this.fingers[number].root.classList.toggle('pressed', snapshot.targets[number]);
      this.fingers[number].root.setAttribute('data-progress', transformNumber(p));
      this.fingers[number].mcp.setAttribute(
        'transform',
        `rotate(${transformNumber(rig.base + sample.angles.mcp)})`,
      );
      this.fingers[number].pip.setAttribute(
        'transform',
        `rotate(${transformNumber(-sample.angles.pip)})`,
      );
      this.fingers[number].dip.setAttribute(
        'transform',
        `rotate(${transformNumber(-sample.angles.dip)})`,
      );
    }

    const slideProgress = clamp01(snapshot.slideProgress);
    this.slide.setAttribute('transform', `translate(${transformNumber(-PISTON_TRAVEL * slideProgress)} 0)`);
    this.slide.classList.toggle('extended', snapshot.slideTarget);
    this.slide.setAttribute('data-progress', transformNumber(slideProgress));

    const left = sampleLeftRing(slideProgress);
    this.leftRingMcp.setAttribute('transform', `rotate(${transformNumber(left.mcp)})`);
    this.leftRingPip.setAttribute('transform', `rotate(${transformNumber(left.pip)})`);
    this.leftRing.classList.toggle('extended', snapshot.slideTarget);
    this.leftRing.setAttribute('data-progress', transformNumber(slideProgress));

    this.svg.setAttribute('data-pose', snapshot.poseKey);
    this.svg.classList.toggle('is-reduced-motion', snapshot.reducedMotion);
  }
}

/** Public bridge expected by the application effect coordinator. */
export class SceneController {
  constructor(root, options = {}) {
    this.renderer = new SVGSceneRenderer(root);
    if (typeof options.onRender === 'function') {
      const renderScene = this.renderer.render.bind(this.renderer);
      this.renderer.render = snapshot => {
        renderScene(snapshot);
        options.onRender(snapshot);
      };
    }
    this.motion = new MotionController(this.renderer, options);
  }

  setFingering(valves, options = {}) {
    const normalized = normalizeValves(valves);
    const slide = Object.hasOwn(options, 'slide')
      ? options.slide === true
      : shouldUseThirdSlide({
        midi: options.midi,
        activeValves: normalized,
        slideMotionOn: options.slideMotionOn,
      });
    return this.motion.setFingering(normalized, {
      slide,
      animate: options.animate !== false,
    });
  }

  replay() {
    return this.motion.replay();
  }

  setMotionPreference(preference) {
    this.motion.setMotionPreference(preference);
  }

  setReducedMotion(reduced) {
    this.motion.setReducedMotion(reduced);
  }

  snapshot() {
    return this.motion.snapshot();
  }

  destroy() {
    this.motion.destroy();
  }
}

export function createSceneController(root, options) {
  return new SceneController(root, options);
}
