import { SoundSettings } from '../types';

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private ambienceOsc1: OscillatorNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private ambienceNoiseNode: AudioBufferSourceNode | null = null;
  private scanningOsc: OscillatorNode | null = null;
  private scanningGain: GainNode | null = null;
  public isScanningPlaying = false;
  public isAmbiencePlaying = false;
  public hasUserInteracted = false;

  private settings: SoundSettings = {
    masterMuted: false,
    masterVolume: 0.85,
    ambienceEnabled: false,
    ambienceVolume: 0.5,
    scanningEnabled: true,
    detectionChimeEnabled: true,
    warningAlertEnabled: true,
    successSoundEnabled: true,
    notificationEnabled: true,
    voicePlaybackEnabled: true,
  };

  constructor() {
    try {
      const saved = localStorage.getItem('deepscan_sound_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch {
      // Local storage unavailable
    }

    // Auto-unlock audio on first user gesture anywhere on window
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.hasUserInteracted = true;
        this.ensureContext();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  public getSettings(): SoundSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<SoundSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('deepscan_sound_settings', JSON.stringify(this.settings));
    } catch {
      // Ignore
    }

    if (this.masterGain && this.audioCtx) {
      const vol = this.settings.masterMuted ? 0 : this.settings.masterVolume;
      this.masterGain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
    }

    if (this.ambienceGain && this.audioCtx) {
      const ambVol = this.settings.ambienceEnabled && !this.settings.masterMuted ? this.settings.ambienceVolume : 0;
      this.ambienceGain.gain.setValueAtTime(ambVol, this.audioCtx.currentTime);
    }

    // Toggle ambience according to settings
    if (this.settings.ambienceEnabled && !this.isAmbiencePlaying && !this.settings.masterMuted) {
      this.startOceanAmbience();
    } else if ((!this.settings.ambienceEnabled || this.settings.masterMuted) && this.isAmbiencePlaying) {
      this.stopOceanAmbience();
    }
  }

  // Ensures AudioContext is created/resumed on user gesture
  public ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      this.audioCtx = new AudioContextClass();

      this.masterGain = this.audioCtx.createGain();
      const initialVol = this.settings.masterMuted ? 0 : this.settings.masterVolume;
      this.masterGain.gain.setValueAtTime(initialVol, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  // 1. Rich, Realistic Ocean Wave Ambience (Synthesized Pink Noise with rolling low-pass surf swell)
  public startOceanAmbience() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (this.isAmbiencePlaying) return;

    try {
      // Create 5-second seamless noise buffer
      const bufferSize = ctx.sampleRate * 5;
      const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
      const left = noiseBuffer.getChannelData(0);
      const right = noiseBuffer.getChannelData(1);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + whiteL * 0.0555179;
        b1 = 0.99332 * b1 + whiteL * 0.0750759;
        b2 = 0.96900 * b2 + whiteL * 0.1538520;
        b3 = 0.86650 * b3 + whiteL * 0.3104856;
        b4 = 0.55000 * b4 + whiteL * 0.5329522;
        b5 = -0.7616 * b5 - whiteL * 0.0168980;
        left[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + whiteL * 0.5362) * 0.22;
        right[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + whiteR * 0.5362) * 0.22;
        b6 = whiteL * 0.115926;
      }

      this.ambienceNoiseNode = ctx.createBufferSource();
      this.ambienceNoiseNode.buffer = noiseBuffer;
      this.ambienceNoiseNode.loop = true;

      // Resonant dynamic filter that sweeps between 250Hz and 1100Hz
      this.ambienceFilter = ctx.createBiquadFilter();
      this.ambienceFilter.type = 'lowpass';
      this.ambienceFilter.frequency.setValueAtTime(450, ctx.currentTime);
      this.ambienceFilter.Q.setValueAtTime(1.8, ctx.currentTime);

      // Low frequency oscillator for ocean surf rhythmic breathing (~5s period)
      this.ambienceOsc1 = ctx.createOscillator();
      this.ambienceOsc1.frequency.setValueAtTime(0.2, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(320, ctx.currentTime);

      this.ambienceOsc1.connect(lfoGain);
      lfoGain.connect(this.ambienceFilter.frequency);

      this.ambienceGain = ctx.createGain();
      const ambVol = this.settings.masterMuted ? 0 : this.settings.ambienceVolume;
      this.ambienceGain.gain.setValueAtTime(ambVol, ctx.currentTime);

      this.ambienceNoiseNode.connect(this.ambienceFilter);
      this.ambienceFilter.connect(this.ambienceGain);
      this.ambienceGain.connect(this.masterGain);

      this.ambienceNoiseNode.start();
      this.ambienceOsc1.start();
      this.isAmbiencePlaying = true;
    } catch (e) {
      console.warn('Could not start ocean ambience', e);
    }
  }

  public stopOceanAmbience() {
    try {
      if (this.ambienceNoiseNode) {
        this.ambienceNoiseNode.stop();
        this.ambienceNoiseNode.disconnect();
        this.ambienceNoiseNode = null;
      }
      if (this.ambienceOsc1) {
        this.ambienceOsc1.stop();
        this.ambienceOsc1.disconnect();
        this.ambienceOsc1 = null;
      }
      this.isAmbiencePlaying = false;
    } catch {
      // Ignore
    }
  }

  // 2. Submarine Sonar Ping (Classic oceanic sonar ping with long resonant decay)
  public playSonarPing() {
    if (this.settings.masterMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(840, now);
      // Slight glide down to give classic naval sonar acoustics
      osc.frequency.exponentialRampToValueAtTime(810, now + 0.15);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 1.8);
    } catch (e) {
      console.warn('Sonar ping error', e);
    }
  }

  // 3. Futuristic AI Scanning Sound (Active during image/video inference)
  public startScanningSound() {
    if (!this.settings.scanningEnabled || this.settings.masterMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (this.isScanningPlaying) return;

    try {
      this.scanningOsc = ctx.createOscillator();
      this.scanningGain = ctx.createGain();

      this.scanningOsc.type = 'sawtooth';
      this.scanningOsc.frequency.setValueAtTime(320, ctx.currentTime);
      
      const now = ctx.currentTime;
      this.scanningOsc.frequency.linearRampToValueAtTime(880, now + 0.5);
      this.scanningOsc.frequency.linearRampToValueAtTime(320, now + 1.0);
      this.scanningOsc.frequency.linearRampToValueAtTime(920, now + 1.5);
      this.scanningOsc.frequency.linearRampToValueAtTime(400, now + 2.0);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now);
      filter.Q.setValueAtTime(4.5, now);

      this.scanningGain.gain.setValueAtTime(0.12, now);

      this.scanningOsc.connect(filter);
      filter.connect(this.scanningGain);
      this.scanningGain.connect(this.masterGain);

      this.scanningOsc.start();
      this.isScanningPlaying = true;
    } catch (e) {
      console.warn('Could not start scanning sound', e);
    }
  }

  public stopScanningSound() {
    try {
      if (this.scanningOsc && this.audioCtx && this.scanningGain) {
        this.scanningGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
        setTimeout(() => {
          this.scanningOsc?.stop();
          this.scanningOsc?.disconnect();
          this.scanningOsc = null;
          this.isScanningPlaying = false;
        }, 120);
      } else {
        this.isScanningPlaying = false;
      }
    } catch {
      this.isScanningPlaying = false;
    }
  }

  // 4. Debris Detection Sound (Triggered when marine debris is detected)
  public playDebrisDetectionChime() {
    if (!this.settings.detectionChimeEnabled || this.settings.masterMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      // High harmonic triple chime (E5 -> G#5 -> B5: 659Hz -> 830Hz -> 987Hz)
      const notes = [659.25, 830.61, 987.77];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.55);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.55);
      });
    } catch (e) {
      console.warn('Debris detection sound error', e);
    }
  }

  // 5. Critical Warning Sound (Sonar alert descent)
  public playCriticalWarningAlert() {
    if (!this.settings.warningAlertEnabled || this.settings.masterMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      // Dual high-intensity sonar warning pulses
      [0, 0.28].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now + offset);
        osc.frequency.exponentialRampToValueAtTime(320, now + offset + 0.2);

        gain.gain.setValueAtTime(0.35, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + offset);
        osc.stop(now + offset + 0.25);
      });
    } catch (e) {
      console.warn('Critical warning sound error', e);
    }
  }

  // 6. Success Sound (Confirmation tone)
  public playSuccessSound() {
    if (!this.settings.successSoundEnabled || this.settings.masterMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // C5 to G5

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn('Success sound error', e);
    }
  }

  // 7. UI Click Tone
  public playUiClick() {
    if (this.settings.masterMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignore
    }
  }

  // 8. Notification Sound
  public playNotificationSound() {
    if (!this.settings.notificationEnabled || this.settings.masterMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.09);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn('Notification sound error', e);
    }
  }

  // 9. Chatbot Voice Playback (Gemini TTS audio with SpeechSynthesis fallback)
  public async speakText(text: string, language: string = 'English'): Promise<void> {
    if (!this.settings.voicePlaybackEnabled || this.settings.masterMuted) return;
    this.ensureContext();

    // First attempt server-side Gemini 3.8 Flash Lite TTS
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Kore' }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audio.volume = this.settings.masterVolume;
          await audio.play();
          return;
        }
      }
    } catch (err) {
      console.warn('Server TTS unavailable, falling back to Web Speech API', err);
    }

    // Client-side Web Speech API Fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.settings.masterVolume;
      utterance.rate = 1.0;

      const langMap: Record<string, string> = {
        'English': 'en-US',
        'Hindi (हिंदी)': 'hi-IN',
        'Spanish (Español)': 'es-ES',
        'French (Français)': 'fr-FR',
        'Arabic (العربية)': 'ar-SA',
        'Chinese (中文)': 'zh-CN',
        'Bengali (বাংলা)': 'bn-IN',
        'Tamil (தமிழ்)': 'ta-IN',
        'German (Deutsch)': 'de-DE',
        'Japanese (日本語)': 'ja-JP',
      };

      utterance.lang = langMap[language] || 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const soundEngine = new SoundEngine();
