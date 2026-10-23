/**
 * DREADLOCK — Restrained procedural ambience & synthesized sound cues.
 *
 * Web Audio API only: zero external audio files, zero downloads.
 * Ambient bed: sub-bass drone, mains hum, air noise.
 * SFX: Shard extraction chime, conduit power surge, hydraulic piston release,
 * gate rumble, footstep taps, and jump impulse.
 */
export class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
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

    const sfx = ctx.createGain();
    sfx.gain.value = 0.45;
    sfx.connect(ctx.destination);
    this.sfxGain = sfx;

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

    console.log('[DREADLOCK Audio] Ambience and procedural sound engine started');
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
    if (this.ctx && this.master && this.sfxGain) {
      const target = this.muted ? 0.0 : 0.16;
      this.master.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.4);
      this.sfxGain.gain.linearRampToValueAtTime(this.muted ? 0.0 : 0.45, this.ctx.currentTime + 0.4);
    }
    return this.muted;
  }

  // --- PROCEDURAL SOUND EFFECTS (Phase 4) ---

  /** Crystalline Shard extraction harmonic chime */
  public playShardCollectSound(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + idx * 0.08 + 0.8);

      gain.gain.setValueAtTime(0.0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.25);
    });
  }

  /** Electrical conduit power surge sound */
  public playConduitPowerSound(pitchFactor: number = 1.0): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80 * pitchFactor, now);
    osc.frequency.exponentialRampToValueAtTime(260 * pitchFactor, now + 0.45);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200 * pitchFactor, now);
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(filter).connect(gain).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  /** Hydraulic piston ram release (pneumatic hiss + metal clank) */
  public playHydraulicReleaseSound(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;

    // 1. Pneumatic hiss
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1400, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(400, now + 0.35);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    noise.connect(noiseFilter).connect(noiseGain).connect(this.sfxGain);
    noise.start(now);

    // 2. Heavy metallic clank
    const clank = this.ctx.createOscillator();
    clank.type = 'triangle';
    clank.frequency.setValueAtTime(180, now + 0.08);
    clank.frequency.exponentialRampToValueAtTime(45, now + 0.4);

    const clankGain = this.ctx.createGain();
    clankGain.gain.setValueAtTime(0.35, now + 0.08);
    clankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    clank.connect(clankGain).connect(this.sfxGain);
    clank.start(now + 0.08);
    clank.stop(now + 0.46);
  }

  /** Heavy mechanical blast gate sliding rumble */
  public playGateOpenRumble(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;

    const rumble = this.ctx.createOscillator();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(48, now);
    rumble.frequency.linearRampToValueAtTime(42, now + 2.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.4);
    gain.gain.setValueAtTime(0.25, now + 1.8);
    gain.gain.linearRampToValueAtTime(0.001, now + 2.6);

    rumble.connect(filter).connect(gain).connect(this.sfxGain);
    rumble.start(now);
    rumble.stop(now + 2.7);
  }

  /** Subtle footstep tap on concrete */
  public playFootstepSound(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  /** Jump impulse */
  public playJumpSound(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.19);
  }
}
