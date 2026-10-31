import React, { useState } from 'react';
import { Volume2, VolumeX, Waves, Sparkles, AlertTriangle, CheckCircle2, Bell, Mic, Play, X } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';
import { SoundSettings } from '../types';

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<SoundSettings>(() => soundEngine.getSettings());

  if (!isOpen) return null;

  const handleUpdate = (updates: Partial<SoundSettings>) => {
    soundEngine.updateSettings(updates);
    setSettings(soundEngine.getSettings());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div 
        role="dialog" 
        aria-labelledby="sound-settings-title"
        aria-modal="true"
        className="w-full max-w-lg ocean-glass-card rounded-2xl p-6 shadow-2xl border border-cyan-500/30 text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="sound-settings-title" className="text-lg font-semibold text-white">Audio & Acoustics Engine</h2>
              <p className="text-xs text-slate-400">Configure ocean monitoring soundscape and real-time alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sound settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Controls */}
        <div className="mt-5 space-y-4">
          <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdate({ masterMuted: !settings.masterMuted })}
                className={`p-2.5 rounded-xl border transition-colors ${
                  settings.masterMuted
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                }`}
                title={settings.masterMuted ? 'Unmute Audio' : 'Mute All Audio'}
              >
                {settings.masterMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <div>
                <span className="text-sm font-medium text-white block">Master Audio</span>
                <span className="text-xs text-slate-400">
                  {settings.masterMuted ? 'Muted' : `${Math.round(settings.masterVolume * 100)}% Volume`}
                </span>
              </div>
            </div>

            <div className="w-36">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                disabled={settings.masterMuted}
                onChange={(e) => handleUpdate({ masterVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          {/* Sound Channels */}
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {/* 1. Ocean Wave Ambience */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 transition-colors">
              <div className="flex items-center gap-3">
                <Waves className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">Ocean Wave Ambience</div>
                  <div className="text-xs text-slate-400">Gentle generative coastal pink noise swell</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdate({ ambienceEnabled: !settings.ambienceEnabled });
                  }}
                  className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                    settings.ambienceEnabled
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {settings.ambienceEnabled ? 'Active' : 'Off'}
                </button>
              </div>
            </div>

            {/* 2. AI Scanning Sound */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 transition-colors">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">AI Vision Scanning Tone</div>
                  <div className="text-xs text-slate-400">Auditory radar feedback during frame analysis</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.startScanningSound();
                    setTimeout(() => soundEngine.stopScanningSound(), 1800);
                  }}
                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                  title="Test scanning sound"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <input
                  type="checkbox"
                  checked={settings.scanningEnabled}
                  onChange={(e) => handleUpdate({ scanningEnabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
              </div>
            </div>

            {/* 3. Debris Detection Chime */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">Debris Detection Chime</div>
                  <div className="text-xs text-slate-400">Harmonic confirmation when waste is identified</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => soundEngine.playDebrisDetectionChime()}
                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                  title="Test detection chime"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <input
                  type="checkbox"
                  checked={settings.detectionChimeEnabled}
                  onChange={(e) => handleUpdate({ detectionChimeEnabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
              </div>
            </div>

            {/* 4. Critical Warning Sound */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 transition-colors">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">Critical Warning Alert</div>
                  <div className="text-xs text-slate-400">Low sonar warning for severe pollution density</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => soundEngine.playCriticalWarningAlert()}
                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                  title="Test critical warning"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <input
                  type="checkbox"
                  checked={settings.warningAlertEnabled}
                  onChange={(e) => handleUpdate({ warningAlertEnabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
              </div>
            </div>

            {/* 5. Success Sound */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 transition-colors">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">Operation Success Tone</div>
                  <div className="text-xs text-slate-400">Ascending chime for completed operations</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => soundEngine.playSuccessSound()}
                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                  title="Test success sound"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <input
                  type="checkbox"
                  checked={settings.successSoundEnabled}
                  onChange={(e) => handleUpdate({ successSoundEnabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
              </div>
            </div>

            {/* 6. Notification Sound */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">Notification Pop</div>
                  <div className="text-xs text-slate-400">Soft acoustic pop for system updates</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => soundEngine.playNotificationSound()}
                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                  title="Test notification sound"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <input
                  type="checkbox"
                  checked={settings.notificationEnabled}
                  onChange={(e) => handleUpdate({ notificationEnabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
              </div>
            </div>

            {/* 7. Chatbot Voice Playback */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 transition-colors">
              <div className="flex items-center gap-3">
                <Mic className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">Multilingual Assistant Speech</div>
                  <div className="text-xs text-slate-400">Spoken voice responses for chat assistant</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => soundEngine.speakText('Deep Scan AI acoustic telemetry online.', 'English')}
                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                  title="Test speech audio"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <input
                  type="checkbox"
                  checked={settings.voicePlaybackEnabled}
                  onChange={(e) => handleUpdate({ voicePlaybackEnabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Connected to real sensor thresholds & detections</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
