export const TRUMPET_TIMBRES = Object.freeze(['concert', 'warm', 'mute']);
export const TRUMPET_DYNAMICS = Object.freeze(['soft', 'natural', 'forte']);

const DEFAULT_TIMBRE = 'concert';
const DEFAULT_DYNAMICS = 'natural';
const MAX_HARMONICS = 40;

const TIMBRE_PROFILES = Object.freeze({
  concert: Object.freeze({
    harmonicTilt: 0.84,
    fundamental: 0.78,
    evenBias: 1.05,
    bodyLevel: 0.12,
    airLevel: 0.016,
    tongueLevel: 0.052,
    formant1: 720,
    formant1Q: 0.9,
    formant1Gain: 2,
    formant2: 6000,
    formant2Q: 1.05,
    formant2Gain: 3.2,
    cutoff: 5200,
    saturation: 1.9,
    roomMix: 0.12,
  }),
  warm: Object.freeze({
    harmonicTilt: 1.02,
    fundamental: 0.92,
    evenBias: 0.96,
    bodyLevel: 0.18,
    airLevel: 0.012,
    tongueLevel: 0.042,
    formant1: 680,
    formant1Q: 0.82,
    formant1Gain: 2.3,
    formant2: 5400,
    formant2Q: 0.95,
    formant2Gain: 2.2,
    cutoff: 4050,
    saturation: 1.55,
    roomMix: 0.16,
  }),
  mute: Object.freeze({
    harmonicTilt: 0.96,
    fundamental: 0.62,
    evenBias: 1.12,
    bodyLevel: 0.065,
    airLevel: 0.022,
    tongueLevel: 0.05,
    formant1: 1260,
    formant1Q: 2.35,
    formant1Gain: 8.4,
    formant2: 2950,
    formant2Q: 1.7,
    formant2Gain: 5.4,
    cutoff: 3450,
    saturation: 2.2,
    roomMix: 0.09,
  }),
});

const DYNAMIC_PROFILES = Object.freeze({
  soft: Object.freeze({
    level: 0.78,
    attack: 0.052,
    sustain: 0.8,
    brightness: 0.76,
    air: 0.68,
    tongue: 0.62,
    vibratoCents: 6.5,
    vibratoRate: 5.15,
    vibratoDelay: 0.3,
    release: 0.12,
  }),
  natural: Object.freeze({
    level: 1,
    attack: 0.034,
    sustain: 0.86,
    brightness: 1,
    air: 1,
    tongue: 1,
    vibratoCents: 5.2,
    vibratoRate: 5.35,
    vibratoDelay: 0.27,
    release: 0.105,
  }),
  forte: Object.freeze({
    level: 1.18,
    attack: 0.027,
    sustain: 0.91,
    brightness: 1.2,
    air: 1.24,
    tongue: 1.22,
    vibratoCents: 4.1,
    vibratoRate: 5.55,
    vibratoDelay: 0.34,
    release: 0.09,
  }),
});

export function playbackMidi(writtenMidi, pitchMode = 'written') {
  if (!Number.isFinite(writtenMidi)) return null;
  return pitchMode === 'concert' ? writtenMidi - 2 : writtenMidi;
}

export function midiToHz(midi) {
  return Number.isFinite(midi) ? 440 * (2 ** ((midi - 69) / 12)) : null;
}

export function resolveTrumpetProfile(timbre = DEFAULT_TIMBRE, dynamics = DEFAULT_DYNAMICS) {
  const safeTimbre = TRUMPET_TIMBRES.includes(timbre) ? timbre : DEFAULT_TIMBRE;
  const safeDynamics = TRUMPET_DYNAMICS.includes(dynamics) ? dynamics : DEFAULT_DYNAMICS;
  return Object.freeze({
    timbre: safeTimbre,
    dynamics: safeDynamics,
    ...TIMBRE_PROFILES[safeTimbre],
    ...DYNAMIC_PROFILES[safeDynamics],
  });
}

/**
 * Build a band-limited lip-buzz spectrum. The fixed bell formants are reinforced
 * here and again with resonant filters, while harmonics above Nyquist are omitted.
 */
export function createTrumpetHarmonics(frequency, {
  timbre = DEFAULT_TIMBRE,
  dynamics = DEFAULT_DYNAMICS,
  sampleRate = 48000,
} = {}) {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    return { real: new Float32Array(1), imag: new Float32Array(1), count: 0 };
  }

  const profile = resolveTrumpetProfile(timbre, dynamics);
  const nyquistLimit = Math.max(1, Math.floor((sampleRate * 0.47) / frequency));
  const count = Math.min(MAX_HARMONICS, nyquistLimit);
  const real = new Float32Array(count + 1);
  const imag = new Float32Array(count + 1);

  for (let harmonic = 1; harmonic <= count; harmonic += 1) {
    const partialFrequency = frequency * harmonic;
    const formantOne = Math.exp(-0.5 * (((partialFrequency - profile.formant1) / 720) ** 2));
    const formantTwo = Math.exp(-0.5 * (((partialFrequency - profile.formant2) / 1050) ** 2));
    const bellEnvelope = 0.72 + formantOne * 0.68 + formantTwo * 0.34;
    const dynamicTilt = profile.harmonicTilt / profile.brightness;
    const rolloff = harmonic ** Math.max(0.62, dynamicTilt);
    const parity = harmonic % 2 === 0 ? profile.evenBias : 1;
    const fundamentalScale = harmonic === 1 ? profile.fundamental : 1;
    const phaseSign = harmonic % 4 === 0 || harmonic % 4 === 3 ? -1 : 1;
    imag[harmonic] = phaseSign * fundamentalScale * parity * bellEnvelope / rolloff;
  }

  return { real, imag, count };
}

function defaultContextFactory() {
  const AudioContextConstructor = globalThis.AudioContext
    ?? globalThis.webkitAudioContext;
  return AudioContextConstructor ? new AudioContextConstructor({ latencyHint: 'interactive' }) : null;
}

function holdAudioParam(param, time) {
  if (!param) return;
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(time);
    return;
  }
  param.cancelScheduledValues?.(time);
  param.setValueAtTime?.(Number.isFinite(param.value) ? param.value : 0, time);
}

function setParam(param, value, time) {
  param?.setValueAtTime?.(value, time);
}

function linearParam(param, value, time) {
  if (typeof param?.linearRampToValueAtTime === 'function') {
    param.linearRampToValueAtTime(value, time);
  } else {
    setParam(param, value, time);
  }
}

function safeDisconnect(node) {
  try {
    node?.disconnect();
  } catch {
    // A node may already have been disconnected during a racing cleanup.
  }
}

function safeStop(node) {
  try {
    node?.stop();
  } catch {
    // Oscillators and buffer sources are one-shot; racing cleanup is harmless.
  }
}

function connect(source, destination) {
  if (source && destination) source.connect(destination);
  return destination;
}

const SOFT_CLIP_CURVES = new Map();

function makeSoftClipCurve(drive = 1.8, points = 2049) {
  const cacheKey = `${drive}:${points}`;
  if (SOFT_CLIP_CURVES.has(cacheKey)) return SOFT_CLIP_CURVES.get(cacheKey);
  const curve = new Float32Array(points);
  const normalization = Math.tanh(drive);
  for (let index = 0; index < points; index += 1) {
    const input = (index * 2) / (points - 1) - 1;
    curve[index] = Math.tanh(input * drive) / normalization;
  }
  SOFT_CLIP_CURVES.set(cacheKey, curve);
  return curve;
}

function seededNoise(seed) {
  let value = seed >>> 0;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return ((value >>> 0) / 4294967296) * 2 - 1;
  };
}

function createNoiseBuffer(context, duration = 0.72) {
  if (typeof context.createBuffer !== 'function') return null;
  const sampleRate = context.sampleRate || 44100;
  const length = Math.max(128, Math.floor(sampleRate * duration));
  const buffer = context.createBuffer(1, length, sampleRate);
  const samples = buffer.getChannelData(0);
  const random = seededNoise(0x5452554d);
  let smoothed = 0;
  for (let index = 0; index < samples.length; index += 1) {
    smoothed = smoothed * 0.24 + random() * 0.76;
    samples[index] = smoothed;
  }
  return buffer;
}

function createRoomImpulse(context, duration = 0.34) {
  if (typeof context.createBuffer !== 'function') return null;
  const sampleRate = context.sampleRate || 44100;
  const length = Math.max(128, Math.floor(sampleRate * duration));
  const impulse = context.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel += 1) {
    const samples = impulse.getChannelData(channel);
    const random = seededNoise(0x42524153 + channel * 97);
    for (let index = 0; index < samples.length; index += 1) {
      const time = index / sampleRate;
      const decay = Math.exp(-time * 13.5);
      const diffusion = 0.22 + Math.min(0.78, time * 18);
      samples[index] = random() * decay * diffusion * 0.42;
    }
    for (const [seconds, level] of [[0.011, 0.52], [0.023, -0.32], [0.041, 0.21]]) {
      const offset = Math.min(samples.length - 1, Math.floor(sampleRate * (seconds + channel * 0.0017)));
      samples[offset] += level;
    }
  }
  return impulse;
}

function configureCompressor(compressor, time) {
  setParam(compressor?.threshold, -12, time);
  setParam(compressor?.knee, 12, time);
  setParam(compressor?.ratio, 3.5, time);
  setParam(compressor?.attack, 0.003, time);
  setParam(compressor?.release, 0.18, time);
}

/**
 * Lazy, dependency-free Web Audio trumpet synthesizer.
 * No AudioContext is created until unlock() runs inside a trusted activation.
 */
export class AudioController {
  constructor({
    contextFactory = defaultContextFactory,
    setTimer = globalThis.setTimeout?.bind(globalThis),
    clearTimer = globalThis.clearTimeout?.bind(globalThis),
  } = {}) {
    this.contextFactory = contextFactory;
    this.setTimer = setTimer;
    this.clearTimer = clearTimer;
    this.context = null;
    this.output = null;
    this.voice = null;
    this.noiseBuffer = null;
    this.periodicWaveCache = new Map();
    this.cleanupTimer = null;
    this.cleanupToken = 0;
    this.disposed = false;
  }

  get isUnlocked() {
    return Boolean(this.context && this.context.state !== 'closed');
  }

  get activeOscillatorCount() {
    return this.voice?.oscillators.length ?? 0;
  }

  /** Call only inside a trusted pointer/keyboard activation path. */
  async unlock() {
    if (this.disposed) return { ok: false, reason: 'disposed' };

    if (!this.context) {
      try {
        this.context = this.contextFactory?.() ?? null;
      } catch {
        this.context = null;
      }
    }
    if (!this.context) return { ok: false, reason: 'unsupported' };

    if (this.context.state === 'suspended' && typeof this.context.resume === 'function') {
      try {
        await this.context.resume();
      } catch {
        return { ok: false, reason: 'resume-failed' };
      }
    }
    if (this.context.state === 'closed') return { ok: false, reason: 'closed' };
    return { ok: true };
  }

  async playFromGesture(writtenMidi, options = {}) {
    const unlocked = await this.unlock();
    if (!unlocked.ok) return unlocked;
    return this.playWrittenMidi(writtenMidi, options);
  }

  playNote(note, options = {}) {
    if (!note || !Number.isFinite(note.midi)) {
      return { ok: false, reason: 'invalid-note' };
    }
    return this.playWrittenMidi(note.midi, options);
  }

  playWrittenMidi(writtenMidi, {
    pitchMode = 'written',
    soundOn = true,
    volume = 0.16,
    timbre = DEFAULT_TIMBRE,
    dynamics = DEFAULT_DYNAMICS,
  } = {}) {
    if (!soundOn) return { ok: false, reason: 'muted' };
    if (!this.context || this.context.state === 'closed') {
      return { ok: false, reason: 'not-unlocked' };
    }

    const soundingMidi = playbackMidi(writtenMidi, pitchMode);
    const frequency = midiToHz(soundingMidi);
    if (!frequency || frequency <= 0) return { ok: false, reason: 'invalid-midi' };

    const profile = resolveTrumpetProfile(timbre, dynamics);
    const pitchCompensation = Math.min(1.1, Math.max(0.86, (440 / frequency) ** 0.09));
    const safeVolume = Math.min(0.28, Math.max(0, Number(volume) || 0))
      * profile.level
      * pitchCompensation;
    const now = this.context.currentTime;
    const hadVoice = Boolean(this.voice);
    const articulationAt = hadVoice ? now + 0.026 : now;
    const attackEnd = articulationAt + profile.attack;
    const decayEnd = attackEnd + 0.085;
    const releaseStart = articulationAt + 0.94;
    const releaseEnd = releaseStart + profile.release;

    this.#cancelCleanup();
    const voice = this.voice ?? this.#createVoice();
    if (!voice) return { ok: false, reason: 'unsupported' };

    this.#configureOutput(profile, now);
    this.#configureVoiceTone(voice, frequency, profile, now, articulationAt, attackEnd);
    this.#scheduleArticulation(voice, safeVolume, profile, now, {
      hadVoice,
      articulationAt,
      attackEnd,
      decayEnd,
      releaseStart,
      releaseEnd,
    });

    const token = ++this.cleanupToken;
    const delayMilliseconds = Math.max(0, (releaseEnd - now + 0.08) * 1000);
    if (this.setTimer) {
      this.cleanupTimer = this.setTimer(() => {
        if (token === this.cleanupToken) this.#destroyVoice();
      }, delayMilliseconds);
    }

    return {
      ok: true,
      synthesis: 'band-limited spectral brass',
      writtenMidi,
      playbackMidi: soundingMidi,
      frequency,
      timbre: profile.timbre,
      dynamics: profile.dynamics,
      harmonicCount: voice.harmonicCount,
      duration: releaseEnd - articulationAt,
    };
  }

  release({ duration = 0.06 } = {}) {
    if (!this.voice || !this.context || this.context.state === 'closed') return false;
    this.#cancelCleanup();

    const now = this.context.currentTime;
    const end = now + Math.max(0.015, Number(duration) || 0);
    for (const gain of [
      this.voice.envelope.gain,
      this.voice.airGain?.gain,
      this.voice.tongueGain?.gain,
      this.voice.vibratoDepth.gain,
    ]) {
      holdAudioParam(gain, now);
      linearParam(gain, 0, end);
    }
    const token = ++this.cleanupToken;
    if (this.setTimer) {
      this.cleanupTimer = this.setTimer(() => {
        if (token === this.cleanupToken) this.#destroyVoice();
      }, Math.max(0, (end - now + 0.03) * 1000));
    } else {
      this.#destroyVoice();
    }
    return true;
  }

  stopImmediately() {
    this.#cancelCleanup();
    this.cleanupToken += 1;
    this.#destroyVoice();
  }

  async dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stopImmediately();
    this.#destroyOutput();
    this.noiseBuffer = null;
    this.periodicWaveCache.clear();
    const context = this.context;
    this.context = null;
    if (context && context.state !== 'closed' && typeof context.close === 'function') {
      try {
        await context.close();
      } catch {
        // Disposal remains complete even if a browser refuses close().
      }
    }
  }

  #createOutput() {
    const context = this.context;
    if (!context || typeof context.createGain !== 'function') return null;

    const input = context.createGain();
    const compressor = typeof context.createDynamicsCompressor === 'function'
      ? context.createDynamicsCompressor()
      : null;
    const dryGain = context.createGain();
    const wetGain = context.createGain();
    const convolver = typeof context.createConvolver === 'function'
      ? context.createConvolver()
      : null;
    const now = context.currentTime;

    configureCompressor(compressor, now);
    setParam(input.gain, 0.9, now);
    setParam(dryGain.gain, 0.9, now);
    setParam(wetGain.gain, 0, now);

    const outputStage = compressor ?? input;
    if (compressor) input.connect(compressor);
    outputStage.connect(dryGain);
    dryGain.connect(context.destination);

    if (convolver) {
      convolver.buffer = createRoomImpulse(context);
      outputStage.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(context.destination);
    }

    this.output = {
      nodes: [input, compressor, dryGain, convolver, wetGain].filter(Boolean),
      input,
      dryGain,
      wetGain,
      convolver,
    };
    return this.output;
  }

  #configureOutput(profile, now) {
    const output = this.output ?? this.#createOutput();
    if (!output) return;
    holdAudioParam(output.dryGain.gain, now);
    holdAudioParam(output.wetGain.gain, now);
    linearParam(output.dryGain.gain, 0.9 - profile.roomMix * 0.24, now + 0.035);
    linearParam(output.wetGain.gain, output.convolver ? profile.roomMix : 0, now + 0.035);
  }

  #createVoice() {
    const context = this.context;
    if (!context
      || typeof context.createOscillator !== 'function'
      || typeof context.createGain !== 'function'
      || typeof context.createBiquadFilter !== 'function') {
      return null;
    }

    const output = this.output ?? this.#createOutput();
    if (!output) return null;

    const buzz = context.createOscillator();
    const body = context.createOscillator();
    const vibrato = context.createOscillator();
    const buzzGain = context.createGain();
    const bodyGain = context.createGain();
    const vibratoDepth = context.createGain();
    const tremoloDepth = context.createGain();
    const mix = context.createGain();
    const highpass = context.createBiquadFilter();
    const formant1 = context.createBiquadFilter();
    const formant2 = context.createBiquadFilter();
    const toneFilter = context.createBiquadFilter();
    const envelope = context.createGain();
    const shaper = typeof context.createWaveShaper === 'function'
      ? context.createWaveShaper()
      : null;

    const airSource = typeof context.createBufferSource === 'function'
      ? context.createBufferSource()
      : null;
    const airHighpass = airSource ? context.createBiquadFilter() : null;
    const airBandpass = airSource ? context.createBiquadFilter() : null;
    const tongueBandpass = airSource ? context.createBiquadFilter() : null;
    const airGain = airSource ? context.createGain() : null;
    const tongueGain = airSource ? context.createGain() : null;
    const now = context.currentTime;

    buzz.type = 'sawtooth';
    body.type = 'sine';
    vibrato.type = 'sine';
    highpass.type = 'highpass';
    formant1.type = 'peaking';
    formant2.type = 'peaking';
    toneFilter.type = 'lowpass';
    if (airHighpass) airHighpass.type = 'highpass';
    if (airBandpass) airBandpass.type = 'bandpass';
    if (tongueBandpass) tongueBandpass.type = 'bandpass';

    setParam(buzzGain.gain, 0.78, now);
    setParam(bodyGain.gain, 0.12, now);
    setParam(vibratoDepth.gain, 0, now);
    setParam(tremoloDepth.gain, 0, now);
    setParam(mix.gain, 0.82, now);
    setParam(envelope.gain, 0, now);
    setParam(highpass.frequency, 105, now);
    setParam(highpass.Q, 0.7, now);
    setParam(toneFilter.Q, 0.72, now);
    setParam(airGain?.gain, 0, now);
    setParam(tongueGain?.gain, 0, now);
    setParam(airHighpass?.frequency, 780, now);
    setParam(airHighpass?.Q, 0.72, now);
    setParam(airBandpass?.frequency, 4300, now);
    setParam(airBandpass?.Q, 0.62, now);
    setParam(tongueBandpass?.frequency, 2150, now);
    setParam(tongueBandpass?.Q, 1.15, now);

    if (shaper) {
      shaper.curve = makeSoftClipCurve();
      shaper.oversample = '2x';
    }

    buzz.connect(buzzGain);
    connect(buzzGain, shaper ?? mix);
    if (shaper) shaper.connect(mix);
    body.connect(bodyGain);
    bodyGain.connect(mix);
    mix.connect(highpass);
    highpass.connect(toneFilter);
    toneFilter.connect(formant1);
    formant1.connect(formant2);
    formant2.connect(envelope);
    envelope.connect(output.input);

    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(buzz.detune);
    vibratoDepth.connect(body.detune);
    vibrato.connect(tremoloDepth);
    tremoloDepth.connect(envelope.gain);

    const sources = [buzz, body, vibrato];
    const nodes = [
      buzz, body, vibrato, buzzGain, bodyGain, vibratoDepth, tremoloDepth, mix,
      highpass, formant1, formant2, toneFilter, envelope, shaper,
    ].filter(Boolean);

    if (airSource && airHighpass && airBandpass && tongueBandpass && airGain && tongueGain) {
      const noiseBuffer = this.noiseBuffer ?? createNoiseBuffer(context);
      if (noiseBuffer) {
        this.noiseBuffer = noiseBuffer;
        airSource.buffer = noiseBuffer;
        airSource.loop = true;
        airSource.connect(airHighpass);
        airHighpass.connect(airBandpass);
        airBandpass.connect(airGain);
        airGain.connect(mix);
        airSource.connect(tongueBandpass);
        tongueBandpass.connect(tongueGain);
        tongueGain.connect(mix);
        sources.push(airSource);
        nodes.push(airSource, airHighpass, airBandpass, tongueBandpass, airGain, tongueGain);
      }
    }

    for (const source of sources) source.start(now);

    this.voice = {
      oscillators: [buzz, body, vibrato],
      sources,
      nodes,
      buzz,
      body,
      vibrato,
      buzzGain,
      bodyGain,
      vibratoDepth,
      tremoloDepth,
      formant1,
      formant2,
      toneFilter,
      envelope,
      shaper,
      airGain,
      tongueGain,
      harmonicCount: 0,
    };
    return this.voice;
  }

  #configureVoiceTone(voice, frequency, profile, now, articulationAt, attackEnd) {
    const context = this.context;
    const harmonics = createTrumpetHarmonics(frequency, {
      timbre: profile.timbre,
      dynamics: profile.dynamics,
      sampleRate: context.sampleRate || 44100,
    });
    voice.harmonicCount = harmonics.count;
    if (typeof context.createPeriodicWave === 'function'
      && typeof voice.buzz.setPeriodicWave === 'function') {
      const waveKey = `${frequency.toFixed(5)}:${profile.timbre}:${profile.dynamics}`;
      let periodicWave = this.periodicWaveCache.get(waveKey);
      if (!periodicWave) {
        periodicWave = context.createPeriodicWave(
          harmonics.real,
          harmonics.imag,
          { disableNormalization: false },
        );
        this.periodicWaveCache.set(waveKey, periodicWave);
      }
      voice.buzz.setPeriodicWave(periodicWave);
    } else {
      voice.buzz.type = 'sawtooth';
    }

    for (const oscillator of [voice.buzz, voice.body]) {
      holdAudioParam(oscillator.frequency, now);
      linearParam(oscillator.frequency, frequency, articulationAt + 0.018);
      oscillator.detune?.cancelScheduledValues?.(now);
      setParam(oscillator.detune, -7.5, articulationAt);
      linearParam(oscillator.detune, 2.2, attackEnd);
      linearParam(oscillator.detune, 0, attackEnd + 0.045);
    }

    setParam(voice.body.detune, -2.4, attackEnd + 0.05);
    setParam(voice.vibrato.frequency, profile.vibratoRate, articulationAt);
    holdAudioParam(voice.buzzGain.gain, now);
    holdAudioParam(voice.bodyGain.gain, now);
    linearParam(voice.buzzGain.gain, 0.78, attackEnd);
    linearParam(voice.bodyGain.gain, profile.bodyLevel, attackEnd);

    for (const [filter, frequencyValue, q, gain] of [
      [voice.formant1, profile.formant1, profile.formant1Q, profile.formant1Gain],
      [voice.formant2, profile.formant2, profile.formant2Q, profile.formant2Gain],
    ]) {
      setParam(filter.frequency, frequencyValue, articulationAt);
      setParam(filter.Q, q, articulationAt);
      setParam(filter.gain, gain, articulationAt);
    }

    if (voice.shaper) voice.shaper.curve = makeSoftClipCurve(profile.saturation);
    const pitchAwareCutoff = profile.cutoff * profile.brightness;
    holdAudioParam(voice.toneFilter.frequency, now);
    setParam(voice.toneFilter.frequency, pitchAwareCutoff * 0.3, articulationAt);
    linearParam(voice.toneFilter.frequency, pitchAwareCutoff, attackEnd + 0.025);
    linearParam(voice.toneFilter.frequency, pitchAwareCutoff * 0.78, attackEnd + 0.18);
  }

  #scheduleArticulation(voice, safeVolume, profile, now, times) {
    const {
      hadVoice,
      articulationAt,
      attackEnd,
      decayEnd,
      releaseStart,
      releaseEnd,
    } = times;
    holdAudioParam(voice.envelope.gain, now);
    if (hadVoice) linearParam(voice.envelope.gain, 0, articulationAt);
    else setParam(voice.envelope.gain, 0, now);
    setParam(voice.envelope.gain, 0, articulationAt);
    linearParam(voice.envelope.gain, safeVolume, attackEnd);
    linearParam(voice.envelope.gain, safeVolume * profile.sustain, decayEnd);
    setParam(voice.envelope.gain, safeVolume * profile.sustain, releaseStart);
    linearParam(voice.envelope.gain, 0, releaseEnd);

    holdAudioParam(voice.vibratoDepth.gain, now);
    holdAudioParam(voice.tremoloDepth.gain, now);
    setParam(voice.vibratoDepth.gain, 0, articulationAt);
    setParam(voice.tremoloDepth.gain, 0, articulationAt);
    linearParam(
      voice.vibratoDepth.gain,
      profile.vibratoCents,
      articulationAt + profile.vibratoDelay + 0.13,
    );
    linearParam(
      voice.tremoloDepth.gain,
      safeVolume * 0.012,
      articulationAt + profile.vibratoDelay + 0.16,
    );
    setParam(voice.vibratoDepth.gain, profile.vibratoCents, releaseStart);
    setParam(voice.tremoloDepth.gain, safeVolume * 0.012, releaseStart);
    linearParam(voice.vibratoDepth.gain, 0, releaseEnd);
    linearParam(voice.tremoloDepth.gain, 0, releaseEnd);

    if (voice.airGain && voice.tongueGain) {
      holdAudioParam(voice.airGain.gain, now);
      holdAudioParam(voice.tongueGain.gain, now);
      setParam(voice.airGain.gain, 0, articulationAt);
      linearParam(
        voice.airGain.gain,
        profile.airLevel * profile.air,
        attackEnd + 0.035,
      );
      setParam(voice.airGain.gain, profile.airLevel * profile.air, releaseStart);
      linearParam(voice.airGain.gain, 0, releaseEnd);

      setParam(voice.tongueGain.gain, 0, articulationAt);
      linearParam(
        voice.tongueGain.gain,
        profile.tongueLevel * profile.tongue,
        articulationAt + Math.min(0.012, profile.attack * 0.3),
      );
      linearParam(voice.tongueGain.gain, 0, attackEnd + 0.075);
    }
  }

  #cancelCleanup() {
    if (this.cleanupTimer !== null && this.clearTimer) {
      this.clearTimer(this.cleanupTimer);
    }
    this.cleanupTimer = null;
    this.cleanupToken += 1;
  }

  #destroyVoice() {
    const voice = this.voice;
    this.voice = null;
    this.cleanupTimer = null;
    if (!voice) return;

    for (const source of voice.sources) safeStop(source);
    for (const node of voice.nodes) safeDisconnect(node);
  }

  #destroyOutput() {
    const output = this.output;
    this.output = null;
    if (!output) return;
    for (const node of output.nodes) safeDisconnect(node);
  }
}
