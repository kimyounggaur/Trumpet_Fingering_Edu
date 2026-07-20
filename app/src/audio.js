export function playbackMidi(writtenMidi, pitchMode = 'written') {
  if (!Number.isFinite(writtenMidi)) return null;
  return pitchMode === 'concert' ? writtenMidi - 2 : writtenMidi;
}

export function midiToHz(midi) {
  return Number.isFinite(midi) ? 440 * (2 ** ((midi - 69) / 12)) : null;
}

function defaultContextFactory() {
  const AudioContextConstructor = globalThis.AudioContext
    ?? globalThis.webkitAudioContext;
  return AudioContextConstructor ? new AudioContextConstructor() : null;
}

function holdAudioParam(param, time) {
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(time);
    return;
  }
  param.cancelScheduledValues(time);
  param.setValueAtTime(param.value, time);
}

function safeDisconnect(node) {
  try {
    node?.disconnect();
  } catch {
    // A node may already have been disconnected during a racing cleanup.
  }
}

/**
 * Dependency-free, lazy Web Audio controller.
 * No AudioContext is created until unlock() is called from a user activation.
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
    this.voice = null;
    this.cleanupTimer = null;
    this.cleanupToken = 0;
    this.disposed = false;
  }

  get isUnlocked() {
    return Boolean(this.context && this.context.state !== 'closed');
  }

  get activeOscillatorCount() {
    return this.voice ? 2 : 0;
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
  } = {}) {
    if (!soundOn) return { ok: false, reason: 'muted' };
    if (!this.context || this.context.state === 'closed') {
      return { ok: false, reason: 'not-unlocked' };
    }

    const soundingMidi = playbackMidi(writtenMidi, pitchMode);
    const frequency = midiToHz(soundingMidi);
    if (!frequency || frequency <= 0) return { ok: false, reason: 'invalid-midi' };

    const safeVolume = Math.min(0.35, Math.max(0, Number(volume) || 0));
    const now = this.context.currentTime;
    const hadVoice = Boolean(this.voice);
    const retuneAt = hadVoice ? now + 0.035 : now;
    const attackEnd = retuneAt + 0.035;
    const releaseStart = retuneAt + 0.78;
    const releaseEnd = retuneAt + 1.25;

    this.#cancelCleanup();
    const voice = this.voice ?? this.#createVoice();
    if (!voice) return { ok: false, reason: 'unsupported' };

    holdAudioParam(voice.envelope.gain, now);
    if (hadVoice) {
      voice.envelope.gain.linearRampToValueAtTime(0, retuneAt);
    } else {
      voice.envelope.gain.setValueAtTime(0, now);
    }

    for (const [oscillator, multiplier] of [
      [voice.fundamental, 1],
      [voice.harmonic, 2],
    ]) {
      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.setValueAtTime(frequency * multiplier, retuneAt);
    }
    voice.filter.frequency.cancelScheduledValues(now);
    voice.filter.frequency.setValueAtTime(frequency * 5.2, retuneAt);

    voice.envelope.gain.setValueAtTime(0, retuneAt);
    voice.envelope.gain.linearRampToValueAtTime(safeVolume, attackEnd);
    voice.envelope.gain.setValueAtTime(safeVolume, releaseStart);
    voice.envelope.gain.linearRampToValueAtTime(0, releaseEnd);

    const token = ++this.cleanupToken;
    const delayMilliseconds = Math.max(0, (releaseEnd - now + 0.05) * 1000);
    if (this.setTimer) {
      this.cleanupTimer = this.setTimer(() => {
        if (token === this.cleanupToken) this.#destroyVoice();
      }, delayMilliseconds);
    }

    return {
      ok: true,
      writtenMidi,
      playbackMidi: soundingMidi,
      frequency,
      duration: releaseEnd - retuneAt,
    };
  }

  release({ duration = 0.035 } = {}) {
    if (!this.voice || !this.context || this.context.state === 'closed') return false;
    this.#cancelCleanup();

    const now = this.context.currentTime;
    const end = now + Math.max(0, Number(duration) || 0);
    holdAudioParam(this.voice.envelope.gain, now);
    this.voice.envelope.gain.linearRampToValueAtTime(0, end);
    const token = ++this.cleanupToken;
    if (this.setTimer) {
      this.cleanupTimer = this.setTimer(() => {
        if (token === this.cleanupToken) this.#destroyVoice();
      }, Math.max(0, (end - now + 0.02) * 1000));
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

  #createVoice() {
    const context = this.context;
    if (!context
      || typeof context.createOscillator !== 'function'
      || typeof context.createGain !== 'function'
      || typeof context.createBiquadFilter !== 'function') {
      return null;
    }

    const fundamental = context.createOscillator();
    const harmonic = context.createOscillator();
    const harmonicGain = context.createGain();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();

    fundamental.type = 'sawtooth';
    harmonic.type = 'sine';
    harmonicGain.gain.setValueAtTime(0.10, context.currentTime);
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(0.8, context.currentTime);
    envelope.gain.setValueAtTime(0, context.currentTime);

    fundamental.connect(filter);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(filter);
    filter.connect(envelope);
    envelope.connect(context.destination);

    fundamental.start(context.currentTime);
    harmonic.start(context.currentTime);

    this.voice = {
      fundamental,
      harmonic,
      harmonicGain,
      filter,
      envelope,
    };
    return this.voice;
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

    for (const oscillator of [voice.fundamental, voice.harmonic]) {
      try {
        oscillator.stop();
      } catch {
        // stop() is one-shot; ignore a racing second cleanup.
      }
    }
    safeDisconnect(voice.fundamental);
    safeDisconnect(voice.harmonic);
    safeDisconnect(voice.harmonicGain);
    safeDisconnect(voice.filter);
    safeDisconnect(voice.envelope);
  }
}
