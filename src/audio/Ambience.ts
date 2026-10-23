/**
 * DREADLOCK — restrained procedural ambience (Phase 3).
 *
 * Web Audio API only: zero external audio files, zero downloads.
 * Layers a subterranean sub-bass drone, a faint electrical mains hum,
 * and a low air-noise bed. All modulation runs on the audio thread via
 * OscillatorNode LFOs — no per-frame JavaScript work.
 *
 * Browsers block audio until a trusted gesture, so the context is created
 * lazily and resumed on the first pointer/keydown.
 */
export class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private started = false;
  private muted = false;

  /** Called on the first trusted gesture; safe to call repeatedly. */
  public start(): void {
    if (this.started) return;
    this.started = true;

    const ctx = new AudioContext();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.0; // fade in
    master.connect(ctx.destination);
    this.master = master;

    // --- 1. Sub-bass containment drone (55 Hz + detuned companion) --------
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 220;
    droneFilter.Q.value = 0.4;
    droneFilter.connect(master);

    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.5;
    droneGain.connect(droneFilter);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 55;
    sub.connect(droneGain);
    sub.start();

    const subDetuned = ctx.createOscillator();
    subDetuned.type = 'triangle';
    subDetuned.frequency.value = 55.37; // slow beating against the sub
    const subDetunedGain = ctx.createGain();
    subDetunedGain.gain.value = 0.22;
    subDetuned.connect(subDetunedGain).connect(droneGain);
    subDetuned.start();

    // Breathing LFO on the drone (period ~9 s).
    const droneLfo = ctx.createOscillator();
    droneLfo.frequency.value = 0.11;
    const droneLfoDepth = ctx.createGain();
    droneLfoDepth.gain.value = 0.16;
    droneLfo.connect(droneLfoDepth).connect(droneGain.gain);
    droneLfo.start();

    // --- 2. Faint electrical mains hum (120 Hz harmonic, band-limited) ----
    const hum = ctx.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.value = 120;
    const humFilter = ctx.createBiquadFilter();
    humFilter.type = 'bandpass';
    humFilter.frequency.value = 120;
    humFilter.Q.value = 3;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.05;
    hum.connect(humFilter).connect(humGain).connect(master);
    hum.start();

    // --- 3. Air / ventilation noise bed ------------------------------------
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 320;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.08;
    noise.connect(noiseFilter).connect(noiseGain).connect(master);
    noise.start();

    // Slow wind-like modulation of the air bed (~13 s period).
    const noiseLfo = ctx.createOscillator();
    noiseLfo.frequency.value = 0.075;
    const noiseLfoDepth = ctx.createGain();
    noiseLfoDepth.gain.value = 0.035;
    noiseLfo.connect(noiseLfoDepth).connect(noiseGain.gain);
    noiseLfo.start();

    // Fade the whole bed in gently.
    master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 3.0);

    console.log('[DREADLOCK Audio] Ambience started (procedural Web Audio, no files)');
  }

  /** Resume the context after a trusted gesture. */
  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  /** Toggles mute; returns the new muted state. */
  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.ctx && this.master) {
      const target = this.muted ? 0.0 : 0.16;
      this.master.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.4);
    }
    console.log(`[DREADLOCK Audio] Ambience ${this.muted ? 'muted' : 'unmuted'}`);
    return this.muted;
  }

  public get isMuted(): boolean {
    return this.muted;
  }
}
