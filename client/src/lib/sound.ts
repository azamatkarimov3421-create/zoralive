// Zero-dependency Web Audio API synthesizer for gifts, games, DJ soundboard & chill room music
let ctx: AudioContext | null = null;
let musicTimer: number | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) ctx = new AudioCtx();
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08, delay = 0) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.currentTime + delay);
  gain.gain.setValueAtTime(gainVal, audio.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime + delay);
  osc.stop(audio.currentTime + delay + duration);
}

function playNoiseBurst(duration: number, gainVal = 0.05, delay = 0) {
  const audio = getCtx();
  if (!audio) return;
  const bufferSize = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1400;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(gainVal, audio.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + delay + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  src.start(audio.currentTime + delay);
}

export const sfx = {
  gift(luxury = false) {
    if (luxury) {
      playTone(523.25, 0.25, 'triangle', 0.11, 0);
      playTone(659.25, 0.25, 'triangle', 0.11, 0.09);
      playTone(783.99, 0.3, 'triangle', 0.13, 0.18);
      playTone(1046.5, 0.55, 'sine', 0.14, 0.28);
    } else {
      playTone(680, 0.14, 'sine', 0.08, 0);
      playTone(960, 0.22, 'triangle', 0.08, 0.07);
    }
  },
  dice() {
    playTone(320, 0.06, 'square', 0.05, 0);
    playTone(460, 0.06, 'square', 0.05, 0.06);
    playTone(580, 0.08, 'triangle', 0.06, 0.12);
  },
  win() {
    playTone(587.33, 0.18, 'triangle', 0.1, 0);
    playTone(739.99, 0.18, 'triangle', 0.1, 0.1);
    playTone(880, 0.22, 'triangle', 0.12, 0.2);
    playTone(1174.66, 0.45, 'sine', 0.14, 0.32);
  },
  tick() {
    playTone(720, 0.03, 'sine', 0.04, 0);
  },
  pkHorn() {
    playTone(220, 0.25, 'sawtooth', 0.07, 0);
    playTone(330, 0.35, 'sawtooth', 0.08, 0.12);
  },
  // DJ Soundboard effects
  dj(effect: string) {
    if (effect === 'applause') {
      for (let i = 0; i < 6; i++) playNoiseBurst(0.11, 0.06, i * 0.08);
    } else if (effect === 'laugh') {
      [520, 440, 500, 410, 460, 380].forEach((f, i) => playTone(f, 0.09, 'triangle', 0.08, i * 0.085));
    } else if (effect === 'drum') {
      for (let i = 0; i < 8; i++) playTone(110 + i * 8, 0.07, 'sine', 0.12, i * 0.065);
      playNoiseBurst(0.3, 0.09, 0.55);
    } else if (effect === 'fanfare') {
      playTone(440, 0.15, 'sawtooth', 0.06, 0);
      playTone(554.37, 0.15, 'sawtooth', 0.06, 0.14);
      playTone(659.25, 0.18, 'sawtooth', 0.07, 0.28);
      playTone(880, 0.45, 'triangle', 0.1, 0.44);
    } else {
      playTone(620, 0.12, 'sine', 0.08, 0);
      playTone(820, 0.18, 'sine', 0.08, 0.1);
    }
  },
  // Gentle lo-fi chill room music loop
  startMusic() {
    this.stopMusic();
    const chords = [
      [261.63, 329.63, 392.0],
      [220.0, 261.63, 329.63],
      [174.61, 220.0, 261.63],
      [196.0, 246.94, 293.66],
    ];
    let step = 0;
    const playStep = () => {
      const chord = chords[step % chords.length];
      chord.forEach((f, idx) => playTone(f, 1.4, 'sine', 0.028, idx * 0.06));
      step++;
    };
    playStep();
    musicTimer = window.setInterval(playStep, 1600);
  },
  stopMusic() {
    if (musicTimer !== null) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
  },
};
