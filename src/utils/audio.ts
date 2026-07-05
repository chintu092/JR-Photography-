let audioCtx: AudioContext | null = null;
let soundEnabled = true;

// Pre-create ambient nodes so we can toggle them
let ambientOscillators: OscillatorNode[] = [];
let ambientGain: GainNode | null = null;
let isAmbientPlaying = false;

// Initialize audio context lazily on first interaction to comply with browser autoplay policies
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export const audioService = {
  isSoundEnabled(): boolean {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("jr_audio_enabled");
      if (stored !== null) {
        soundEnabled = stored === "true";
      }
    }
    return soundEnabled;
  },

  setSoundEnabled(enabled: boolean) {
    soundEnabled = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("jr_audio_enabled", enabled ? "true" : "false");
    }
    if (!enabled) {
      this.stopAmbient();
    } else {
      this.playAmbient();
    }
  },

  /**
   * Generates a subtle cinematic background ambient soundscape (dark, low drone).
   */
  playAmbient() {
    if (!this.isSoundEnabled()) return;
    if (isAmbientPlaying) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    ambientGain = ctx.createGain();
    // Keep it extremely subtle
    ambientGain.gain.setValueAtTime(0, now);
    ambientGain.gain.linearRampToValueAtTime(0.015, now + 5); // 5s fade in
    
    ambientGain.connect(ctx.destination);

    // Create a 3-oscillator drone with slight detuning for a thick texture
    const frequencies = [55, 55.4, 110]; // A1, slight detune, A2
    ambientOscillators = frequencies.map(freq => {
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      // Set base frequency
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      // Create slow modulation (LFO) on frequency for movement
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.1 + Math.random() * 0.05, now); // ~0.1 Hz
      lfoGain.gain.setValueAtTime(0.5, now); // +/- 0.5Hz variation

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      // Route to main gain
      osc.connect(ambientGain!);

      lfo.start(now);
      osc.start(now);

      return osc;
    });

    isAmbientPlaying = true;
  },

  stopAmbient() {
    if (!isAmbientPlaying || !ambientGain || !audioCtx) return;

    const now = audioCtx.currentTime;
    
    // Fade out over 2 seconds
    ambientGain.gain.cancelScheduledValues(now);
    ambientGain.gain.setValueAtTime(ambientGain.gain.value, now);
    ambientGain.gain.linearRampToValueAtTime(0, now + 2);

    // Stop after fade out
    setTimeout(() => {
      ambientOscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          // ignore already stopped errors
        }
      });
      ambientOscillators = [];
      if (ambientGain) {
        ambientGain.disconnect();
      }
      ambientGain = null;
      isAmbientPlaying = false;
    }, 2100);
  },

  /**
   * Synthesizes a high-end, tactile, organic camera shutter "click" using sine waves with fast exponential decay.
   * Matches the luxury Leica tactile visual theme.
   */
  playClick() {
    if (!this.isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Wake context if suspended (common browser requirement)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Primary metallic snap (oscillators)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1400, now);
    osc1.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(800, now);
    osc2.frequency.exponentialRampToValueAtTime(100, now + 0.06);

    gainNode.gain.setValueAtTime(0.015, now); // Super subtle, and non-distracting
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    
    osc1.stop(now + 0.09);
    osc2.stop(now + 0.09);
  },

  /**
   * Synthesizes a soft velvet "whoosh", perfect as a micro-interaction hover indicator for navigation links.
   */
  playWhoosh() {
    if (!this.isSoundEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Synthesize whoosh with a bandpass filter swept quickly
    const bufferSize = ctx.sampleRate * 0.25; // 250ms whoosh
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill buffer with noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Filter sweeps frequency quickly to mimic motion
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(4.0, now);
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(350, now + 0.25);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(0.012, now + 0.08); // kept extremely soft & high-end
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + 0.25);
  }
};
