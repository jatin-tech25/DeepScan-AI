import React from 'react';
import { Waves, Scan, Radio, Calendar } from 'lucide-react';
import { AcousticSoundHub } from './AcousticSoundHub';

interface NavbarProps {
  activeTab: 'home' | 'detection' | 'map' | 'hardware' | 'analytics';
  setActiveTab: (tab: 'home' | 'detection' | 'map' | 'hardware' | 'analytics') => void;
  onOpenSoundModal: () => void;
  hardwareConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSoundModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full ocean-glass border-b border-cyan-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Wordmark */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 text-left focus:outline-none shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Waves className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            DeepScan <span className="text-cyan-400">AI</span>
          </span>
        </button>

        {/* Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => setActiveTab('home')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'home'
                ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('detection')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'detection'
                ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            AI Detection
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'map'
                ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Ocean GIS Map
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'hardware'
                ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            IoT Telemetry
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'text-cyan-400 border-b-2 border-cyan-400 pb-0.5'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Records & Analytics
          </button>
        </nav>

        {/* Right CTA Action & Consolidated Sound Hub */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Consolidated Sound Hub in the Right Corner */}
          <AcousticSoundHub onOpenFullSettings={onOpenSoundModal} />

          <button
            onClick={() => setActiveTab('detection')}
            className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Launch Scanner</span>
            <span className="sm:hidden">Scan</span>
          </button>
        </div>

      </div>
    </header>
  );
};
