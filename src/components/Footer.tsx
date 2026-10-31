import React from 'react';
import { Waves, Heart, Radio, ShieldCheck, Compass, Scan } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: 'home' | 'detection' | 'map' | 'hardware' | 'analytics') => void;
  onOpenSoundModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, onOpenSoundModal }) => {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950/80 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Waves className="w-3.5 h-3.5" />
              </div>
              <span className="text-base font-bold text-white">
                Deep Scan <span className="text-cyan-400">AI</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              AI-powered marine debris detection and ocean monitoring platform. Combining edge computer vision, IoT environmental sensors, and geospatial mapping to preserve marine ecosystems.
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-2">
            <span className="font-semibold text-white uppercase text-[11px] tracking-wider block mb-2">
              Platform Modules
            </span>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => setActiveTab('home')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Overview & Architecture
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('detection')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  AI Marine Debris Vision Studio
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('map')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Geospatial Ocean GIS Map
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('hardware')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  IoT Telemetry & Schematics
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Monitoring Analytics & History
                </button>
              </li>
            </ul>
          </div>

          {/* Edge Architecture */}
          <div className="space-y-2">
            <span className="font-semibold text-white uppercase text-[11px] tracking-wider block mb-2">
              Hardware & Edge Stack
            </span>
            <ul className="space-y-1.5 text-slate-400 text-[11px]">
              <li>Raspberry Pi 4 Model B (Broadcom 64-bit)</li>
              <li>Sony IMX219 8MP Marine Optic Module</li>
              <li>Arduino Mega 2560 R3 Sensor Bus</li>
              <li>Analog Turbidity Probe (0 - 3000 NTU)</li>
              <li>DS18B20 Submersible Temperature Sensor</li>
              <li>u-blox NEO-6M High-Precision DGPS</li>
            </ul>
          </div>

          {/* Sound & Compliance */}
          <div className="space-y-2">
            <span className="font-semibold text-white uppercase text-[11px] tracking-wider block mb-2">
              Acoustic & Audio Controls
            </span>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Web Audio API real-time acoustic synthesizer configured for oceanic ambience, scanning radar tones, and event-verified detection alerts.
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenSoundModal}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 rounded-lg text-[11px] font-medium transition-colors"
              >
                Configure Sound Engine
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} Deep Scan AI. Dedicated to ocean conservation and zero plastic waste.
          </div>
          <div className="flex items-center gap-2">
            <span>Powered by YOLO Vision & Gemini AI</span>
            <span>·</span>
            <span>Leaflet GIS</span>
            <span>·</span>
            <span>Chart.js</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
