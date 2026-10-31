export type SoundEffect =
  | 'dig'
  | 'tink'
  | 'place'
  | 'swing'
  | 'bow'
  | 'gun'
  | 'laser'
  | 'magic'
  | 'hit'
  | 'playerHurt'
  | 'kill'
  | 'roar'
  | 'potion'
  | 'mana'
  | 'pickup'
  | 'craft'
  | 'explosion'
  | 'jump'
  | 'grapple'
  | 'menu';

export type MusicTrack =
  | 'day'
  | 'night'
  | 'underground'
  | 'corruption'
  | 'jungle'
  | 'underworld'
  | 'hallow'
  | 'boss1'
  | 'boss2'
  | 'moonlord';

export class AudioManager {
  private ctx: AudioContext | null = null;
  sfxMuted = false;
  musicMuted = false;
  sfxVolume = 0.35;
  musicVolume = 0.16;

  private currentTrack: MusicTrack = 'day';
  private stepIndex = 0;
  private stepTimer = 0;

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  play(sfx: SoundEffect): void {
    if (this.sfxMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const vol = this.sfxVolume;

    switch (sfx) {
      case 'dig': {
        this.playTone(ctx, 'triangle', 160 + Math.random() * 50, 70, 0.07, vol * 0.7);
        this.playNoise(ctx, 0.05, vol * 0.4, 900);
        break;
      }
      case 'tink': {
        this.playTone(ctx, 'sine', 950 + Math.random() * 200, 520, 0.08, vol * 0.75);
        break;
      }
      case 'place': {
        this.playTone(ctx, 'square', 190, 260, 0.06, vol * 0.5);
        break;
      }
      case 'swing': {
        this.playNoise(ctx, 0.09, vol * 0.45, 1400);
        this.playTone(ctx, 'sine', 300, 120, 0.09, vol * 0.4);
        break;
      }
      case 'bow': {
        this.playTone(ctx, 'triangle', 460, 210, 0.11, vol * 0.65);
        break;
      }
      case 'gun': {
        this.playNoise(ctx, 0.11, vol * 0.85, 2200);
        this.playTone(ctx, 'sawtooth', 260, 60, 0.1, vol * 0.7);
        break;
      }
      case 'laser': {
        this.playTone(ctx, 'sawtooth', 980, 240, 0.14, vol * 0.65);
        break;
      }
      case 'magic': {
        this.playTone(ctx, 'sine', 520, 1080, 0.18, vol * 0.6);
        this.playTone(ctx, 'triangle', 760, 1340, 0.18, vol * 0.35);
        break;
      }
      case 'hit': {
        this.playTone(ctx, 'square', 220, 95, 0.08, vol * 0.75);
        this.playNoise(ctx, 0.05, vol * 0.5, 800);
        break;
      }
      case 'playerHurt': {
        this.playTone(ctx, 'sawtooth', 320, 110, 0.18, vol * 0.9);
        break;
      }
      case 'kill': {
        this.playTone(ctx, 'sawtooth', 260, 65, 0.19, vol * 0.8);
        this.playNoise(ctx, 0.14, vol * 0.6, 650);
        break;
      }
      case 'roar': {
        // Classic Terraria boss roar
        this.playTone(ctx, 'sawtooth', 165, 55, 0.65, vol * 1.1);
        this.playTone(ctx, 'square', 110, 42, 0.65, vol * 0.9);
        this.playNoise(ctx, 0.55, vol * 0.7, 450);
        break;
      }
      case 'potion': {
        this.playTone(ctx, 'sine', 360, 740, 0.22, vol * 0.7);
        break;
      }
      case 'mana': {
        this.playTone(ctx, 'sine', 640, 1280, 0.25, vol * 0.65);
        break;
      }
      case 'pickup': {
        this.playTone(ctx, 'sine', 680 + Math.random() * 140, 960, 0.06, vol * 0.45);
        break;
      }
      case 'craft': {
        this.playTone(ctx, 'triangle', 440, 880, 0.14, vol * 0.7);
        break;
      }
      case 'explosion': {
        this.playNoise(ctx, 0.35, vol * 1.1, 400);
        this.playTone(ctx, 'sawtooth', 130, 32, 0.35, vol * 0.95);
        break;
      }
      case 'jump': {
        this.playTone(ctx, 'sine', 190, 380, 0.1, vol * 0.45);
        break;
      }
      case 'grapple': {
        this.playTone(ctx, 'square', 380, 640, 0.09, vol * 0.55);
        break;
      }
      case 'menu': {
        this.playTone(ctx, 'sine', 780, 880, 0.04, vol * 0.4);
        break;
      }
    }
    void now;
  }

  private playTone(
    ctx: AudioContext,
    type: OscillatorType,
    startFreq: number,
    endFreq: number,
    duration: number,
    volume: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  private playNoise(ctx: AudioContext, duration: number, volume: number, cutoff: number): void {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  }

  updateMusic(dt: number, track: MusicTrack): void {
    if (this.musicMuted) return;
    if (this.currentTrack !== track) {
      this.currentTrack = track;
      this.stepIndex = 0;
    }

    const scales: Record<MusicTrack, { notes: number[]; tempo: number; wave: OscillatorType }> = {
      day: {
        notes: [261.6, 329.6, 392.0, 523.3, 392.0, 329.6, 293.7, 349.2, 440.0, 392.0, 329.6, 261.6],
        tempo: 0.24,
        wave: 'triangle'
      },
      night: {
        notes: [220.0, 261.6, 329.6, 311.1, 261.6, 246.9, 196.0, 220.0],
        tempo: 0.32,
        wave: 'sine'
      },
      underground: {
        notes: [146.8, 174.6, 220.0, 207.7, 174.6, 164.8, 130.8, 146.8],
        tempo: 0.30,
        wave: 'triangle'
      },
      corruption: {
        notes: [130.8, 138.6, 164.8, 155.6, 130.8, 123.5, 110.0, 123.5],
        tempo: 0.25,
        wave: 'sawtooth'
      },
      jungle: {
        notes: [293.7, 349.2, 440.0, 523.3, 440.0, 392.0, 349.2, 293.7],
        tempo: 0.22,
        wave: 'triangle'
      },
      underworld: {
        notes: [110.0, 116.5, 130.8, 146.8, 130.8, 116.5, 98.0, 110.0],
        tempo: 0.28,
        wave: 'sawtooth'
      },
      hallow: {
        notes: [523.3, 659.3, 784.0, 1046.5, 880.0, 784.0, 659.3, 587.3],
        tempo: 0.21,
        wave: 'sine'
      },
      boss1: {
        notes: [164.8, 196.0, 220.0, 233.1, 220.0, 196.0, 164.8, 146.8, 164.8, 246.9, 233.1, 196.0],
        tempo: 0.13,
        wave: 'square'
      },
      boss2: {
        notes: [196.0, 233.1, 261.6, 277.2, 293.7, 277.2, 233.1, 196.0, 174.6, 207.7, 233.1, 261.6],
        tempo: 0.11,
        wave: 'sawtooth'
      },
      moonlord: {
        notes: [130.8, 196.0, 246.9, 261.6, 311.1, 293.7, 246.9, 196.0, 155.6, 233.1, 293.7, 392.0],
        tempo: 0.10,
        wave: 'sawtooth'
      }
    };

    const cfg = scales[this.currentTrack];
    this.stepTimer += dt;
    if (this.stepTimer >= cfg.tempo) {
      this.stepTimer -= cfg.tempo;
      if (!this.ctx || this.ctx.state !== 'running') return;
      const freq = cfg.notes[this.stepIndex % cfg.notes.length];
      this.stepIndex++;
      this.playTone(this.ctx, cfg.wave, freq, freq * 0.995, cfg.tempo * 0.9, this.musicVolume);
    }
  }
}
