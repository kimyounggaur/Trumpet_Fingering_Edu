/**
 * Shared trumpet-valve motion scheduler.
 *
 * The controller is deliberately DOM-free. A renderer only needs to expose
 * `render(snapshot)`, which keeps animation state out of the application store
 * and makes the timing contract testable without a browser.
 */

export const MOTION_TIMING = Object.freeze({
  press: 120,
  release: 170,
  replayRelease: 70,
  slide: 220,
  slideDelay: 20,
});

const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));

/** Return a CSS-compatible cubic-bezier easing function. */
export function cubicBezier(x1, y1, x2, y2) {
  const sample = (a, b, t) => 3 * a * (1 - t) ** 2 * t
    + 3 * b * (1 - t) * t ** 2
    + t ** 3;
  const slope = (a, b, t) => 3 * a * (1 - t) ** 2
    + 6 * (b - a) * (1 - t) * t
    + 3 * (1 - b) * t ** 2;

  return input => {
    const x = clamp01(input);
    if (x === 0 || x === 1) return x;

    let t = x;
    for (let iteration = 0; iteration < 7; iteration += 1) {
      const derivative = slope(x1, x2, t);
      if (Math.abs(derivative) < 1e-7) break;
      t -= (sample(x1, x2, t) - x) / derivative;
      t = clamp01(t);
    }

    let low = 0;
    let high = 1;
    for (let iteration = 0; iteration < 8; iteration += 1) {
      const estimate = sample(x1, x2, t);
      if (Math.abs(estimate - x) < 1e-7) break;
      if (estimate < x) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return sample(y1, y2, t);
  };
}

export const MOTION_EASING = Object.freeze({
  press: cubicBezier(0.3, 0, 0.2, 1),
  release: cubicBezier(0.34, 1.3, 0.3, 1),
  easeOut: cubicBezier(0, 0, 0.58, 1),
});

function normalizeValves(valves) {
  const input = Array.isArray(valves) ? valves : [];
  return [1, 2, 3].filter(number => input.includes(number));
}

function keyFor(valves) {
  return [1, 2, 3].map(number => valves.includes(number) ? '1' : '0').join('');
}

function createChannel() {
  return {
    value: 0,
    from: 0,
    target: 0,
    startedAt: 0,
    duration: 0,
    easing: MOTION_EASING.press,
    active: false,
  };
}

/**
 * One rAF owner for the three finger/piston pairs and third slide.
 * Common valves are not retargeted, and interruptions continue from the
 * currently sampled value rather than from a stale endpoint.
 */
export class MotionController {
  constructor(renderer, options = {}) {
    if (!renderer || typeof renderer.render !== 'function') {
      throw new TypeError('MotionController requires a renderer with render(snapshot).');
    }

    this.renderer = renderer;
    this._now = options.now
      ?? (() => globalThis.performance?.now?.() ?? Date.now());
    this._requestFrame = options.requestFrame
      ?? (callback => globalThis.requestAnimationFrame
        ? globalThis.requestAnimationFrame(callback)
        : globalThis.setTimeout(() => callback(this._now()), 16));
    this._cancelFrame = options.cancelFrame
      ?? (handle => globalThis.cancelAnimationFrame
        ? globalThis.cancelAnimationFrame(handle)
        : globalThis.clearTimeout(handle));

    this.channels = { 1: createChannel(), 2: createChannel(), 3: createChannel() };
    this.slide = createChannel();
    this.logicalValves = [];
    this.logicalSlide = false;
    this.motionPreference = options.motionPreference === 'reduced' ? 'reduced' : 'system';
    this._forcedReduced = options.reducedMotion === true;
    this._frameHandle = null;
    this._revision = 0;
    this._replay = null;
    this._destroyed = false;
    this._tick = this._tick.bind(this);

    const matcher = options.matchMedia ?? globalThis.matchMedia?.bind(globalThis);
    this._mediaQuery = matcher?.('(prefers-reduced-motion: reduce)') ?? null;
    this._onMediaChange = () => {
      if (this.isReducedMotion()) this._snapToLogicalState();
      else this._render();
    };
    if (this._mediaQuery?.addEventListener) {
      this._mediaQuery.addEventListener('change', this._onMediaChange);
    } else if (this._mediaQuery?.addListener) {
      this._mediaQuery.addListener(this._onMediaChange);
    }

    this._render();
  }

  isReducedMotion() {
    return this._forcedReduced
      || this.motionPreference === 'reduced'
      || this._mediaQuery?.matches === true;
  }

  setMotionPreference(preference) {
    if (preference !== 'system' && preference !== 'reduced') {
      throw new TypeError('motionPreference must be "system" or "reduced".');
    }
    this.motionPreference = preference;
    if (this.isReducedMotion()) this._snapToLogicalState();
    else this._render();
  }

  /** Primarily useful to react to an application-level accessibility override. */
  setReducedMotion(reduced) {
    this._forcedReduced = reduced === true;
    if (this.isReducedMotion()) this._snapToLogicalState();
    else this._render();
  }

  setFingering(valves, { slide = false, animate = true } = {}) {
    if (this._destroyed) return this.snapshot();

    const normalized = normalizeValves(valves);
    const now = this._now();
    this._revision += 1;
    this._replay = null;
    this.logicalValves = normalized;
    this.logicalSlide = slide === true;

    if (!animate || this.isReducedMotion()) {
      this._snapToLogicalState();
      return this.snapshot();
    }

    for (const number of [1, 2, 3]) {
      const target = normalized.includes(number) ? 1 : 0;
      this._retarget(
        this.channels[number],
        target,
        now,
        target ? MOTION_TIMING.press : MOTION_TIMING.release,
        target ? MOTION_EASING.press : MOTION_EASING.release,
      );
    }

    const slideTarget = this.logicalSlide ? 1 : 0;
    this._retarget(
      this.slide,
      slideTarget,
      now + (slideTarget ? MOTION_TIMING.slideDelay : 0),
      MOTION_TIMING.slide,
      MOTION_EASING.easeOut,
    );

    // Logical `.pressed` state is visible immediately; transforms remain owned
    // by the shared frame loop.
    this._render();
    this._ensureFrame();
    return this.snapshot();
  }

  /**
   * Briefly releases the current non-open fingering, then returns to it.
   * A new selection cancels this phase machine via the shared revision.
   */
  replay() {
    if (this._destroyed || this.logicalValves.length === 0 || this.isReducedMotion()) {
      if (this.isReducedMotion()) this._snapToLogicalState();
      return false;
    }

    const now = this._now();
    const revision = ++this._revision;
    this._replay = {
      phase: 'release',
      valves: [...this.logicalValves],
      revision,
    };
    for (const number of [1, 2, 3]) {
      this._retarget(
        this.channels[number],
        0,
        now,
        MOTION_TIMING.replayRelease,
        MOTION_EASING.easeOut,
        true,
      );
    }
    this._render();
    this._ensureFrame();
    return true;
  }

  snapshot() {
    const progress = Object.freeze({
      1: this.channels[1].value,
      2: this.channels[2].value,
      3: this.channels[3].value,
    });
    const targets = Object.freeze({
      1: this.logicalValves.includes(1),
      2: this.logicalValves.includes(2),
      3: this.logicalValves.includes(3),
    });
    return Object.freeze({
      progress,
      targets,
      poseKey: keyFor(this.logicalValves),
      slideProgress: this.slide.value,
      slideTarget: this.logicalSlide,
      replaying: this._replay !== null,
      reducedMotion: this.isReducedMotion(),
      isAnimating: this._hasActiveChannels(),
      revision: this._revision,
    });
  }

  debugState() {
    const copyChannel = channel => ({ ...channel });
    return {
      channels: {
        1: copyChannel(this.channels[1]),
        2: copyChannel(this.channels[2]),
        3: copyChannel(this.channels[3]),
      },
      slide: copyChannel(this.slide),
      logicalValves: [...this.logicalValves],
      logicalSlide: this.logicalSlide,
      replay: this._replay ? { ...this._replay, valves: [...this._replay.valves] } : null,
      frameScheduled: this._frameHandle !== null,
      revision: this._revision,
    };
  }

  destroy() {
    this._destroyed = true;
    this._replay = null;
    if (this._frameHandle !== null) this._cancelFrame(this._frameHandle);
    this._frameHandle = null;
    if (this._mediaQuery?.removeEventListener) {
      this._mediaQuery.removeEventListener('change', this._onMediaChange);
    } else if (this._mediaQuery?.removeListener) {
      this._mediaQuery.removeListener(this._onMediaChange);
    }
  }

  _retarget(channel, target, startedAt, duration, easing, force = false) {
    if (!force && channel.target === target) return false;

    const distance = Math.abs(target - channel.value);
    channel.from = channel.value;
    channel.target = target;
    channel.startedAt = startedAt;
    channel.duration = distance === 0 ? 0 : duration * distance;
    channel.easing = easing;
    channel.active = distance > 1e-7;
    if (!channel.active) channel.value = target;
    return channel.active;
  }

  _sample(channel, now) {
    if (!channel.active) return false;
    if (now <= channel.startedAt) {
      channel.value = channel.from;
      return true;
    }
    const elapsed = now - channel.startedAt;
    const t = channel.duration === 0 ? 1 : clamp01(elapsed / channel.duration);
    channel.value = clamp01(
      channel.from + (channel.target - channel.from) * channel.easing(t),
    );
    if (t >= 1) {
      channel.value = channel.target;
      channel.active = false;
    }
    return channel.active;
  }

  _tick(timestamp) {
    this._frameHandle = null;
    if (this._destroyed) return;
    const now = Number.isFinite(timestamp) ? timestamp : this._now();

    for (const number of [1, 2, 3]) this._sample(this.channels[number], now);
    this._sample(this.slide, now);

    if (this._replay?.revision === this._revision) {
      const valvesMoving = [1, 2, 3].some(number => this.channels[number].active);
      if (!valvesMoving && this._replay.phase === 'release') {
        this._replay.phase = 'press';
        for (const number of this._replay.valves) {
          this._retarget(
            this.channels[number],
            1,
            now,
            MOTION_TIMING.press,
            MOTION_EASING.press,
            true,
          );
        }
      } else if (!valvesMoving && this._replay.phase === 'press') {
        this._replay = null;
      }
    }

    this._render();
    this._ensureFrame();
  }

  _hasActiveChannels() {
    return this.slide.active
      || [1, 2, 3].some(number => this.channels[number].active)
      || this._replay !== null;
  }

  _ensureFrame() {
    if (this._destroyed || this._frameHandle !== null || !this._hasActiveChannels()) return;
    this._frameHandle = this._requestFrame(this._tick);
  }

  _snapToLogicalState() {
    if (this._frameHandle !== null) this._cancelFrame(this._frameHandle);
    this._frameHandle = null;
    this._replay = null;
    for (const number of [1, 2, 3]) {
      const target = this.logicalValves.includes(number) ? 1 : 0;
      Object.assign(this.channels[number], {
        value: target,
        from: target,
        target,
        duration: 0,
        active: false,
      });
    }
    const slideTarget = this.logicalSlide ? 1 : 0;
    Object.assign(this.slide, {
      value: slideTarget,
      from: slideTarget,
      target: slideTarget,
      duration: 0,
      active: false,
    });
    this._render();
  }

  _render() {
    this.renderer.render(this.snapshot());
  }
}
