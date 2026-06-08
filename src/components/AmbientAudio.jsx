import React, { useEffect, useRef, useState } from 'react';
import soundtrackSrc from '../audio/soundtrack.mp3';
import riot01 from '../audio/riot_01.mp3';
import riot02 from '../audio/riot_02.mp3';
import riot03 from '../audio/riot_03.mp3';
import riot04 from '../audio/riot_04.mp3';

const RIOT_PLAYLIST = [riot01, riot02, riot03, riot04];

// Crossfade window — how long before a clip ends to start the next one
const CROSSFADE_SECONDS = 2.5;

// Target volumes
const SOUNDTRACK_VOLUME = 0.55;   // persistent bed underneath
const RIOT_VOLUME = 0.95;         // foreground crowd/impacts
const FADE_IN_MS = 2500;          // master fade-in on start
const FADE_OUT_MS = 600;          // master fade-out on stop

// ─────────────────────────────────────────────────────────────────────────────
// AMBIENT AUDIO
//
// Two independent layers:
//   1. Soundtrack    — single audio element, looped, persistent. The musical
//                      bed that sits underneath everything throughout.
//   2. Riot playlist — two audio elements (A, B) used as a ping-pong pair so
//                      consecutive clips can crossfade into each other.
//                      Sequence is 1 → 2 → 3 → 4 → 1 → ...
//
// Both layers play directly via HTMLAudioElement.volume — no Web Audio routing
// for the bed layers, which is the most reliable cross-browser path.
//
// Procedural drones + occasional impacts run through Web Audio underneath for
// continuity during any micro-gaps between riot clips.
// ─────────────────────────────────────────────────────────────────────────────

export default function AmbientAudio() {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(true);

  // Web Audio (for procedural drones + impacts only)
  const ctxRef = useRef(null);
  const masterGainRef = useRef(null);
  const busRef = useRef(null);
  const impactTimerRef = useRef(null);

  // Soundtrack
  const soundtrackElRef = useRef(null);

  // Riot crossfade pair
  const riotARef = useRef(null);
  const riotBRef = useRef(null);
  const activeRiotIsARef = useRef(true);     // which element is currently the foreground
  const riotIndexRef = useRef(0);            // which playlist item plays next
  const crossfadeTickRef = useRef(null);     // rAF id for the crossfade scheduler
  const fadeAnimsRef = useRef([]);           // active volume fades (rAF-driven)

  useEffect(() => {
    if (typeof window === 'undefined' || !(window.AudioContext || window.webkitAudioContext)) {
      setSupported(false);
    }
  }, []);

  // ─── Volume fade helper ─────────────────────────────────────────────────
  // Fades el.volume from current to target over durationMs using rAF.
  // Returns a cancel function.
  const fadeVolume = (el, target, durationMs) => {
    if (!el) return () => {};
    const start = el.volume;
    const startT = performance.now();
    let cancelled = false;
    const tick = () => {
      if (cancelled || !el) return;
      const t = Math.min(1, (performance.now() - startT) / durationMs);
      el.volume = Math.max(0, Math.min(1, start + (target - start) * t));
      if (t < 1) {
        const id = requestAnimationFrame(tick);
        fadeAnimsRef.current.push(id);
      }
    };
    const id = requestAnimationFrame(tick);
    fadeAnimsRef.current.push(id);
    return () => { cancelled = true; };
  };

  const cancelAllFades = () => {
    fadeAnimsRef.current.forEach((id) => cancelAnimationFrame(id));
    fadeAnimsRef.current = [];
  };

  // ─── Riot crossfade scheduler ──────────────────────────────────────────
  // Watches the active element's currentTime; when within CROSSFADE_SECONDS
  // of the end, starts the inactive element on the next clip and crossfades.
  const startCrossfadeWatcher = () => {
    const tick = () => {
      const a = riotARef.current;
      const b = riotBRef.current;
      if (!a || !b) return;

      const active = activeRiotIsARef.current ? a : b;
      const inactive = activeRiotIsARef.current ? b : a;

      if (active.duration && !isNaN(active.duration)) {
        const remaining = active.duration - active.currentTime;
        // When close to the end, hand over to the inactive element
        if (remaining <= CROSSFADE_SECONDS && inactive.paused) {
          // Advance the playlist index for the *next* clip after this one
          riotIndexRef.current = (riotIndexRef.current + 1) % RIOT_PLAYLIST.length;
          inactive.src = RIOT_PLAYLIST[riotIndexRef.current];
          inactive.volume = 0;
          const playPromise = inactive.play();
          if (playPromise && playPromise.then) {
            playPromise.then(() => {
              // Crossfade: active down, inactive up
              const fadeDuration = remaining * 1000;
              fadeVolume(active, 0, fadeDuration);
              fadeVolume(inactive, RIOT_VOLUME, fadeDuration);
              // Swap active assignment
              activeRiotIsARef.current = !activeRiotIsARef.current;
            }).catch((err) => console.warn('Crossfade play() failed:', err));
          }
        }
      }
      crossfadeTickRef.current = requestAnimationFrame(tick);
    };
    crossfadeTickRef.current = requestAnimationFrame(tick);
  };

  const stopCrossfadeWatcher = () => {
    if (crossfadeTickRef.current) {
      cancelAnimationFrame(crossfadeTickRef.current);
      crossfadeTickRef.current = null;
    }
  };

  // ─── Procedural impact (occasional low thump for depth) ─────────────────
  const playImpact = (ctx, bus) => {
    const now = ctx.currentTime;
    const baseFreq = 65 + Math.random() * 40;
    const peakGain = 0.18 + Math.random() * 0.08;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.06);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(peakGain, now + 0.008);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
    osc.connect(oscGain).connect(bus);
    osc.start(now);
    osc.stop(now + 2.7);

    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 240;
    noiseFilter.Q.value = 1.6;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(peakGain * 0.5, now + 0.012);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    noise.connect(noiseFilter).connect(noiseGain).connect(bus);
    noise.start(now);
    noise.stop(now + 1.7);
  };

  const scheduleNextImpact = (ctx, bus) => {
    const wait = 15000 + Math.random() * 12000;  // 15–27s — riot recording carries the foreground
    impactTimerRef.current = setTimeout(() => {
      playImpact(ctx, bus);
      scheduleNextImpact(ctx, bus);
    }, wait);
  };

  // ─── Start ─────────────────────────────────────────────────────────────
  const start = async () => {
    // Already running — just resume
    if (ctxRef.current) {
      try { await ctxRef.current.resume(); } catch {}
      if (soundtrackElRef.current) {
        soundtrackElRef.current.volume = SOUNDTRACK_VOLUME;
        soundtrackElRef.current.play().catch((err) => console.warn('Soundtrack resume failed:', err));
      }
      const active = activeRiotIsARef.current ? riotARef.current : riotBRef.current;
      if (active) {
        active.volume = RIOT_VOLUME;
        active.play().catch((err) => console.warn('Riot resume failed:', err));
      }
      if (!crossfadeTickRef.current) startCrossfadeWatcher();
      return;
    }

    // Fresh start
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    ctxRef.current = ctx;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.value = 0;
    masterGainRef.current = master;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1300;
    lowpass.Q.value = 0.7;
    busRef.current = lowpass;

    const delay = ctx.createDelay(3);
    delay.delayTime.value = 0.72;
    const fb = ctx.createGain();
    fb.gain.value = 0.42;
    const wet = ctx.createGain();
    wet.gain.value = 0.38;
    delay.connect(fb).connect(delay);
    delay.connect(wet);

    lowpass.connect(master);
    lowpass.connect(delay);
    wet.connect(master);
    master.connect(ctx.destination);

    // ─── Soundtrack: persistent looped bed ──────────────────────────────
    const stEl = new Audio();
    stEl.preload = 'auto';
    stEl.loop = true;
    stEl.volume = 0;
    stEl.src = soundtrackSrc;
    soundtrackElRef.current = stEl;
    try {
      const p = stEl.play();
      if (p && p.then) {
        p.then(() => fadeVolume(stEl, SOUNDTRACK_VOLUME, FADE_IN_MS))
         .catch((err) => console.warn('Soundtrack play() rejected:', err));
      }
    } catch (e) {
      console.warn('Soundtrack failed:', e);
    }

    // ─── Riot pair (crossfade) ──────────────────────────────────────────
    const aEl = new Audio();
    aEl.preload = 'auto';
    aEl.volume = 0;
    aEl.src = RIOT_PLAYLIST[0];
    riotARef.current = aEl;

    const bEl = new Audio();
    bEl.preload = 'auto';
    bEl.volume = 0;
    // Don't set b.src yet — it'll get set when the crossfade kicks in
    riotBRef.current = bEl;

    activeRiotIsARef.current = true;
    riotIndexRef.current = 0;

    try {
      const p = aEl.play();
      if (p && p.then) {
        p.then(() => fadeVolume(aEl, RIOT_VOLUME, FADE_IN_MS))
         .catch((err) => console.warn('Riot play() rejected:', err));
      }
    } catch (e) {
      console.warn('Riot start failed:', e);
    }

    startCrossfadeWatcher();

    // ─── Procedural drones — low + fifth + octave layers ────────────────
    const makeOsc = (freq, detune, gainVal) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      o.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = 0;
      o.connect(g).connect(lowpass);
      o.start(now);
      g.gain.linearRampToValueAtTime(gainVal, now + 5);
    };
    makeOsc(55, -6, 0.11);
    makeOsc(55, 7, 0.11);
    makeOsc(82.5, -4, 0.06);
    makeOsc(110, 3, 0.035);

    // ─── Slow wind ──────────────────────────────────────────────────────
    const pinkBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const pData = pinkBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < pData.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      pData[i] = (b0 + b1 + b2 + white * 0.1848) * 0.07;
    }
    const wind = ctx.createBufferSource();
    wind.buffer = pinkBuf;
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 280;
    windFilter.Q.value = 0.55;
    const windGain = ctx.createGain();
    windGain.gain.value = 0;
    wind.connect(windFilter).connect(windGain).connect(lowpass);
    wind.start(now);
    windGain.gain.linearRampToValueAtTime(0.18, now + 7);

    // Breath LFO on master
    const breathLfo = ctx.createOscillator();
    breathLfo.type = 'sine';
    breathLfo.frequency.value = 0.06;
    const breathDepth = ctx.createGain();
    breathDepth.gain.value = 0.08;
    breathLfo.connect(breathDepth).connect(master.gain);
    breathLfo.start(now);

    // Schedule first impact
    setTimeout(() => {
      if (ctxRef.current && busRef.current) {
        playImpact(ctxRef.current, busRef.current);
        scheduleNextImpact(ctxRef.current, busRef.current);
      }
    }, 5000 + Math.random() * 4000);

    master.gain.linearRampToValueAtTime(0.8, now + 3);
  };

  // ─── Stop ──────────────────────────────────────────────────────────────
  const stop = () => {
    if (!ctxRef.current || !masterGainRef.current) return;
    cancelAllFades();
    const ctx = ctxRef.current;
    const now = ctx.currentTime;
    masterGainRef.current.gain.cancelScheduledValues(now);
    masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
    masterGainRef.current.gain.linearRampToValueAtTime(0, now + FADE_OUT_MS / 1000);

    if (impactTimerRef.current) {
      clearTimeout(impactTimerRef.current);
      impactTimerRef.current = null;
    }
    stopCrossfadeWatcher();

    // Fade out both bed layers
    [soundtrackElRef.current, riotARef.current, riotBRef.current].forEach((el) => {
      if (!el) return;
      fadeVolume(el, 0, FADE_OUT_MS);
    });

    setTimeout(() => {
      if (ctxRef.current) ctxRef.current.suspend().catch(() => {});
      [soundtrackElRef.current, riotARef.current, riotBRef.current].forEach((el) => {
        if (el && !el.paused) el.pause();
      });
    }, FADE_OUT_MS + 50);
  };

  const toggle = () => {
    if (enabled) {
      stop();
      setEnabled(false);
    } else {
      start().then(() => setEnabled(true));
    }
  };

  useEffect(() => {
    const onVis = () => {
      if (!ctxRef.current) return;
      if (document.hidden) {
        ctxRef.current.suspend().catch(() => {});
        [soundtrackElRef.current, riotARef.current, riotBRef.current].forEach((el) => {
          if (el && !el.paused) el.pause();
        });
        stopCrossfadeWatcher();
        if (impactTimerRef.current) {
          clearTimeout(impactTimerRef.current);
          impactTimerRef.current = null;
        }
      } else if (enabled) {
        ctxRef.current.resume().catch(() => {});
        if (soundtrackElRef.current) {
          soundtrackElRef.current.volume = SOUNDTRACK_VOLUME;
          soundtrackElRef.current.play().catch(() => {});
        }
        const active = activeRiotIsARef.current ? riotARef.current : riotBRef.current;
        if (active) {
          active.volume = RIOT_VOLUME;
          active.play().catch(() => {});
        }
        if (!crossfadeTickRef.current) startCrossfadeWatcher();
        if (!impactTimerRef.current && busRef.current) {
          scheduleNextImpact(ctxRef.current, busRef.current);
        }
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [enabled]);

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      aria-label={enabled ? 'Mute ambient sound' : 'Play ambient sound'}
      className="fixed z-40 group"
      style={{
        fontFamily: 'var(--font-mono)',
        bottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))',
        right: 'max(1rem, env(safe-area-inset-right, 1rem))',
      }}
    >
      <div
        className="flex items-center gap-2 px-3.5 py-2 rounded-full backdrop-blur-sm transition-all duration-300"
        style={{
          background: enabled ? 'rgba(161, 22, 22, 0.15)' : 'rgba(20, 18, 15, 0.65)',
          border: `1px solid ${enabled ? 'rgba(161, 22, 22, 0.45)' : 'rgba(120, 105, 85, 0.25)'}`,
          color: enabled ? '#f5d8c8' : 'rgba(214, 207, 196, 0.85)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          {enabled ? (
            <>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" opacity="0.7" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" opacity="0.5" />
            </>
          ) : (
            <>
              <line x1="22" y1="9" x2="16" y2="15" opacity="0.7" />
              <line x1="16" y1="9" x2="22" y2="15" opacity="0.7" />
            </>
          )}
        </svg>
        <span className="text-[10px] tracking-[0.22em] uppercase">
          {enabled ? 'sound on' : 'sound off'}
        </span>
      </div>
    </button>
  );
}
