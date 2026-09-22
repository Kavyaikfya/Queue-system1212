// Audio Synthesizer Engine for FAIRQUEUE
// Generates high-fidelity pleasant chime tones using standard browser Web Audio API
// No external assets or network requests required. Handles browser autoplay restrictions gracefully.

type SoundType = 'joined' | 'position_changed' | 'turn_approaching' | 'your_turn' | 'alert';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem('fq_sound_enabled');
  return val === null ? true : val === 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fq_sound_enabled', String(enabled));
}

/**
 * Play harmonic chimes according to queue event type
 */
export function playChime(type: SoundType): void {
  if (!isSoundEnabled()) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  try {
    switch (type) {
      case 'joined': {
        // Ascending pleasant chord (C5 -> E5 -> G5)
        playTone(ctx, 523.25, now, 0.15, 0.15);
        playTone(ctx, 659.25, now + 0.1, 0.2, 0.15);
        playTone(ctx, 783.99, now + 0.22, 0.35, 0.18);
        break;
      }
      case 'position_changed': {
        // Soft positive tick (A4 -> C5)
        playTone(ctx, 440.0, now, 0.08, 0.1);
        playTone(ctx, 523.25, now + 0.06, 0.18, 0.12);
        break;
      }
      case 'turn_approaching': {
        // Double alert chime (G5 -> C6, pause, G5 -> C6)
        playTone(ctx, 783.99, now, 0.12, 0.18);
        playTone(ctx, 1046.5, now + 0.1, 0.25, 0.2);
        playTone(ctx, 783.99, now + 0.4, 0.12, 0.18);
        playTone(ctx, 1046.5, now + 0.5, 0.35, 0.22);
        break;
      }
      case 'your_turn': {
        // Grand fanfare (C5 -> E5 -> G5 -> C6 sustain)
        playTone(ctx, 523.25, now, 0.15, 0.2);
        playTone(ctx, 659.25, now + 0.12, 0.15, 0.2);
        playTone(ctx, 783.99, now + 0.24, 0.2, 0.25);
        playTone(ctx, 1046.5, now + 0.38, 0.7, 0.3);
        break;
      }
      case 'alert': {
        // Gentle double ping
        playTone(ctx, 880.0, now, 0.1, 0.15);
        playTone(ctx, 880.0, now + 0.18, 0.2, 0.15);
        break;
      }
    }
  } catch (err) {
    console.warn('[AudioEngine] Playback error or autoplay restricted:', err);
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  maxGain: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(maxGain, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}
