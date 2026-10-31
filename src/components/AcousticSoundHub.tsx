import React, { useState, useEffect, useRef } from 'react';
import {
  Waves,
  Radio,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Mic,
  SlidersHorizontal,
  ChevronDown,
  X,
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface AcousticSoundHubProps {
  onOpenFullSettings: () => void;
}

export const AcousticSoundHub: React.FC<AcousticSoundHubProps> = ({ onOpenFullSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlayingAmbience, setIsPlayingAmbience] = useState(soundEngine.isAmbiencePlaying);
  const [isMuted, setIsMuted] = useState(soundEngine.getSettings().masterMuted);
  const [volume, setVolume] = useState(soundEngine.getSettings().masterVolume);
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state periodically with soundEngine
  useEffect(() => {
    const timer = setInterval(() => {
      setIsPlayingAmbience(soundEngine.isAmbiencePlaying);
      setIsMuted(soundEngine.getSettings().masterMuted);
      setVolume(soundEngine.getSettings().masterVolume);
    }, 400);
    return () => clearInterval(timer);
  }, []);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const triggerSound = (name: string, fn: () => void) => {
    soundEngine.ensureContext();
    fn();
    setActiveFeedback(name);
    setTimeout(() => setActiveFeedback(null), 1200);
  };

  const toggleAmbience = () => {
    soundEngine.ensureContext();
    if (isPlayingAmbience) {
      soundEngine.updateSettings({ ambienceEnabled: false });
      soundEngine.stopOceanAmbience();
      setIsPlayingAmbience(false);
    } else {
      soundEngine.updateSettings({ ambienceEnabled: true, masterMuted: false });
      soundEngine.startOceanAmbience();
      setIsPlayingAmbience(true);
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    soundEngine.updateSettings({ masterMuted: next });
    setIsMuted(next);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundEngine.updateSettings({ masterVolume: newVol });
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button in Right Corner */}
      <button
        onClick={() => {
          soundEngine.ensureContext();
          setIsOpen(!isOpen);
        }}
        aria-label="Sound Controls"
        aria-expanded={isOpen}
        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ${
          isOpen
            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            : isPlayingAmbience
            ? 'bg-teal-500/15 text-teal-300 border-teal-400/40 shadow-[0_0_12px_rgba(20,184,166,0.3)] animate-pulse'
            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80'
        }`}
        title="Consolidated Acoustic Sound Controls"
      >
        {/* Animated equalizer waves when ambience is playing */}
        {isPlayingAmbience && !isMuted ? (
          <div className="flex items-end gap-0.5 h-3.5 w-3.5">
            <span className="w-0.5 bg-teal-400 h-2 animate-[pulse_0.8s_ease-in-out_infinite]" />
            <span className="w-0.5 bg-cyan-400 h-3.5 animate-[pulse_0.6s_ease-in-out_infinite_0.2s]" />
            <span className="w-0.5 bg-teal-300 h-2.5 animate-[pulse_0.9s_ease-in-out_infinite_0.4s]" />
          </div>
        ) : isMuted ? (
          <VolumeX className="w-4 h-4 text-rose-400" />
        ) : (
          <Volume2 className="w-4 h-4 text-cyan-400" />
        )}

        <span className="hidden sm:inline">Sound</span>

        {isPlayingAmbience && !isMuted && (
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cyan-400' : ''
          }`}
        />
      </button>

      {/* Floating Sound Hub Popover in Right Corner */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Acoustic Audio Hub"
          className="absolute right-0 top-full mt-2.5 w-80 sm:w-96 ocean-glass-card rounded-2xl p-4 shadow-2xl border border-cyan-500/30 text-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-cyan-500/15 rounded-lg text-cyan-400 border border-cyan-500/30">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  Acoustic Audio Hub
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">All ocean monitoring sound controls</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
              title="Close sound hub"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 space-y-3.5">
            {/* 1. Master Volume & Mute Controls */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={toggleMute}
                className={`p-2 rounded-lg border transition-colors shrink-0 ${
                  isMuted
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-slate-800 text-cyan-400 border-slate-700 hover:bg-slate-750'
                }`}
                title={isMuted ? 'Unmute master audio' : 'Mute master audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Master Volume</span>
                  <span className="font-mono text-cyan-400 text-[11px]">
                    {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  disabled={isMuted}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
                  title={`Volume: ${Math.round(volume * 100)}%`}
                />
              </div>
            </div>

            {/* 2. Ocean Waves Ambience Toggle */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-500/15 text-teal-400 border border-teal-500/20">
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Ocean Wave Ambience</div>
                  <div className="text-[10px] text-slate-400">Generative pink-noise wave swell</div>
                </div>
              </div>

              <button
                onClick={toggleAmbience}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                  isPlayingAmbience
                    ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 shadow-[0_0_14px_rgba(20,184,166,0.5)]'
                    : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30'
                }`}
                title="Toggle continuous ocean wave soundscape"
              >
                {isPlayingAmbience ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play</span>
                  </>
                )}
              </button>
            </div>

            {/* 3. Instant Acoustic Soundboard Grid */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-0.5">
                <span>Soundboard Effects</span>
                <span className="text-[10px] text-cyan-400 font-normal lowercase">click to test</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Sonar Ping */}
                <button
                  onClick={() => triggerSound('sonar', () => soundEngine.playSonarPing())}
                  className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 ${
                    activeFeedback === 'sonar'
                      ? 'border-cyan-400 bg-cyan-500/25 text-white ring-1 ring-cyan-400'
                      : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:text-white hover:border-cyan-500/40'
                  }`}
                  title="Acoustic Sonar Ping (submersible 800-1200 Hz sweep)"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-medium text-[11px] text-slate-200">Sonar Ping</div>
                    <div className="text-[9px] text-slate-500">Submersible pulse</div>
                  </div>
                </button>

                {/* AI Radar Tone */}
                <button
                  onClick={() =>
                    triggerSound('radar', () => {
                      soundEngine.startScanningSound();
                      setTimeout(() => soundEngine.stopScanningSound(), 1600);
                    })
                  }
                  className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 ${
                    activeFeedback === 'radar'
                      ? 'border-sky-400 bg-sky-500/25 text-white ring-1 ring-sky-400'
                      : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:text-white hover:border-sky-500/40'
                  }`}
                  title="Radar scanning frequency tone"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-medium text-[11px] text-slate-200">Radar Tone</div>
                    <div className="text-[9px] text-slate-500">Scan sweep</div>
                  </div>
                </button>

                {/* Detection Chime */}
                <button
                  onClick={() => triggerSound('chime', () => soundEngine.playDebrisDetectionChime())}
                  className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 ${
                    activeFeedback === 'chime'
                      ? 'border-emerald-400 bg-emerald-500/25 text-white ring-1 ring-emerald-400'
                      : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:text-white hover:border-emerald-500/40'
                  }`}
                  title="Positive Debris Detection Chime (Pentatonic chime)"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-medium text-[11px] text-slate-200">Debris Chime</div>
                    <div className="text-[9px] text-slate-500">Target identified</div>
                  </div>
                </button>

                {/* Critical Alert */}
                <button
                  onClick={() => triggerSound('warning', () => soundEngine.playCriticalWarningAlert())}
                  className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 ${
                    activeFeedback === 'warning'
                      ? 'border-rose-400 bg-rose-500/25 text-white ring-1 ring-rose-400'
                      : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:text-white hover:border-rose-500/40'
                  }`}
                  title="Hazard Alarm (Dual-oscillator alarm)"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-medium text-[11px] text-slate-200">Critical Alert</div>
                    <div className="text-[9px] text-slate-500">Hazard alarm</div>
                  </div>
                </button>
              </div>

              {/* AI Voice Synthesis Test */}
              <button
                onClick={() =>
                  triggerSound('voice', () =>
                    soundEngine.speakText('Deep Scan AI acoustic telemetry online.', 'English')
                  )
                }
                className={`w-full p-2 rounded-lg border text-left transition-all flex items-center justify-between ${
                  activeFeedback === 'voice'
                    ? 'border-purple-400 bg-purple-500/25 text-white ring-1 ring-purple-400'
                    : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:text-white hover:border-purple-500/40'
                }`}
                title="Voice Synthesis Test"
              >
                <div className="flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-medium text-[11px] text-slate-200">AI Voice Assistant Speech</span>
                </div>
                <span className="text-[10px] text-purple-300 font-mono">Test Voice</span>
              </button>
            </div>

            {/* 4. Footer link to Full Sound Settings Modal */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullSettings();
                }}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/30 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Advanced Audio Settings Modal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
