// Web Audio API Synthesized Sound System (No external audio file dependencies)

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function toggleSound(): boolean {
  soundEnabled = !soundEnabled;
  return soundEnabled;
}

export function playRobotChirp(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [1200, 1600, 2200];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.04);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.2, ctx.currentTime + idx * 0.04 + 0.03);

    gain.gain.setValueAtTime(0.04, ctx.currentTime + idx * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.04 + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + idx * 0.04);
    osc.stop(ctx.currentTime + idx * 0.04 + 0.035);
  });
}

export function playRobotAlert(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

export function playClick(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}

export function playCountdownBeep(frequency: number = 880): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.18);
}

export function playWhoosh(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Filtered noise sweep
  const bufferSize = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(300, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.2);
  filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4);
  filter.Q.setValueAtTime(3, ctx.currentTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
  noise.stop(ctx.currentTime + 0.4);
}

export function playUnlockSound(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [329.63, 440, 554.37, 880]; // E4, A4, C#5, A5
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);

    gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.07);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + idx * 0.07 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + idx * 0.07);
    osc.stop(ctx.currentTime + idx * 0.07 + 0.5);
  });
}

export function playQuantumChargeSound(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const subOsc = ctx.createOscillator();
  const gain = ctx.createGain();
  const subGain = ctx.createGain();

  // High-energy rising frequency
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.85);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.85);

  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.8);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

  // Sub bass charging hum
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(55, ctx.currentTime);
  subOsc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.85);
  subGain.gain.setValueAtTime(0.02, ctx.currentTime);
  subGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.8);
  subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  subOsc.connect(subGain);
  subGain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.9);
  subOsc.start();
  subOsc.stop(ctx.currentTime + 0.9);
}

export function playQuantumBlastSound(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // 1. Deep Sub Bass Impact (Punchy clean drop)
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(130, ctx.currentTime);
  subOsc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.35);

  subGain.gain.setValueAtTime(0.28, ctx.currentTime);
  subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

  subOsc.connect(subGain);
  subGain.connect(ctx.destination);
  subOsc.start();
  subOsc.stop(ctx.currentTime + 0.6);

  // 2. High-Tech Energy Dispersion Burst
  const bufferSize = ctx.sampleRate * 0.35;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3200, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.35);
  filter.Q.setValueAtTime(2.5, ctx.currentTime);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.18, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start();
  noise.stop(ctx.currentTime + 0.35);

  // 3. Shimmer Harmonic Ping
  const pingOsc = ctx.createOscillator();
  const pingGain = ctx.createGain();
  pingOsc.type = 'triangle';
  pingOsc.frequency.setValueAtTime(1760, ctx.currentTime);
  pingGain.gain.setValueAtTime(0.08, ctx.currentTime);
  pingGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  pingOsc.connect(pingGain);
  pingGain.connect(ctx.destination);
  pingOsc.start();
  pingOsc.stop(ctx.currentTime + 0.4);
}

export function playRevealChime(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 major chord
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

    gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.08 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + idx * 0.08);
    osc.stop(ctx.currentTime + idx * 0.08 + 1.2);
  });
}

export function playAnnouncementChime(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [440, 554.37, 659.25]; // A4, C#5, E5
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);

    gain.gain.setValueAtTime(0.09, ctx.currentTime + idx * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + idx * 0.09);
    osc.stop(ctx.currentTime + idx * 0.09 + 0.6);
  });
}

export function playSuccess(): void {
  playAnnouncementChime();
}

// Low-frequency ambient data processing hum reacting to scroll
let ambientOsc: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

export function startAmbientHum(): () => void {
  if (!soundEnabled) return () => {};
  const ctx = getAudioContext();
  if (!ctx) return () => {};

  try {
    if (ambientOsc) {
      ambientOsc.stop();
      ambientOsc.disconnect();
    }
  } catch (e) {}

  ambientOsc = ctx.createOscillator();
  ambientGain = ctx.createGain();

  ambientOsc.type = 'sawtooth';
  ambientOsc.frequency.setValueAtTime(55, ctx.currentTime); // Low A1 hum

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(140, ctx.currentTime);

  ambientGain.gain.setValueAtTime(0.001, ctx.currentTime);
  ambientGain.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 1.5); // subtle ambient hum

  ambientOsc.connect(filter);
  filter.connect(ambientGain);
  ambientGain.connect(ctx.destination);

  ambientOsc.start();

  const handleScroll = () => {
    if (!ambientGain || !ctx) return;
    const scrollDelta = Math.min(Math.abs(window.scrollY), 1000);
    const boost = 0.018 + (scrollDelta / 1000) * 0.035;
    ambientGain.gain.setValueAtTime(boost, ctx.currentTime);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
    try {
      if (ambientGain && ctx) {
        ambientGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      }
      setTimeout(() => {
        if (ambientOsc) {
          ambientOsc.stop();
          ambientOsc.disconnect();
          ambientOsc = null;
        }
      }, 500);
    } catch (e) {}
  };
}
