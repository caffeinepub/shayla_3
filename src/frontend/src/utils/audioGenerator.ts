let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export async function playChime(): Promise<void> {
  try {
    const ctx = getAudioContext();

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;

    // --- Rapid tick-tock buildup (6 ticks, 80ms apart) ---
    const tickFreqs = [3400, 1800, 3400, 1800, 3400, 1800];
    const tickGains = [0.55, 0.45, 0.38, 0.30, 0.22, 0.14];

    tickFreqs.forEach((freq, i) => {
      const tickTime = now + i * 0.08;
      const bufferSize = Math.floor(ctx.sampleRate * 0.015); // 15ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = 12;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(tickGains[i], tickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, tickTime + 0.04);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(tickTime);
      source.stop(tickTime + 0.05);
    });

    // --- Warm bell chord after buildup (~0.5s) ---
    const bellTime = now + 0.5;

    // C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, bellTime);
    gain1.gain.setValueAtTime(0, bellTime);
    gain1.gain.linearRampToValueAtTime(0.35, bellTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, bellTime + 2.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(bellTime);
    osc1.stop(bellTime + 2.2);

    // E5 (659.25 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, bellTime);
    gain2.gain.setValueAtTime(0, bellTime);
    gain2.gain.linearRampToValueAtTime(0.22, bellTime + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.001, bellTime + 1.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(bellTime);
    osc2.stop(bellTime + 1.8);

    // G5 (783.99 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(783.99, bellTime);
    gain3.gain.setValueAtTime(0, bellTime);
    gain3.gain.linearRampToValueAtTime(0.14, bellTime + 0.01);
    gain3.gain.exponentialRampToValueAtTime(0.001, bellTime + 1.4);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(bellTime);
    osc3.stop(bellTime + 1.4);

  } catch (err) {
    // Silently handle autoplay restrictions
    console.warn('Audio playback blocked:', err);
  }
}

export function playTick(isTick: boolean): void {
  try {
    const ctx = getAudioContext();

    if (ctx.state === 'closed') return;

    // Resume if suspended but don't await — fire and forget
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
      return;
    }

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.012); // 12ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = isTick ? 2800 : 1600;
    filter.Q.value = 10;

    const gain = ctx.createGain();
    const gainValue = isTick ? 0.18 : 0.12;
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
    source.stop(now + 0.030);

  } catch {
    // Silently ignore any errors
  }
}
