import React, { useState } from 'react';
import { Search, MapPin, Globe, Sparkles, Volume2, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

export const GroundedOceanIntel: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'search' | 'maps'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapsQuery, setMapsQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [chunks, setChunks] = useState<any[]>([]);

  const handleSearchSubmit = async (queryToRun?: string) => {
    const q = queryToRun || searchQuery;
    if (!q.trim() || isLoading) return;

    setIsLoading(true);
    setResultText(null);
    setSources([]);
    setChunks([]);
    soundEngine.playSonarPing();

    try {
      const endpoint = activeMode === 'search' ? '/api/search-grounding' : '/api/maps-grounding';
      const body = activeMode === 'search' ? { query: q } : { locationQuery: q };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to retrieve grounded ocean intelligence');
      const data = await res.json();

      setResultText(data.text);
      if (data.webSearchQueries) setSources(data.webSearchQueries);
      if (data.groundingChunks) setChunks(data.groundingChunks);

      soundEngine.playSuccessSound();
    } catch (err) {
      console.error('Grounding error:', err);
      setResultText('Unable to complete grounded search at this moment. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleSearchQueries = [
    'Great Pacific Garbage Patch latest cleanup data 2026',
    'Global UNEP plastics treaty marine litter resolutions',
    'Ghost fishing net recovery operations in Mediterranean',
  ];

  const sampleMapsQueries = [
    'Major ocean cleanup vessel ports in California',
    'Marine biodiversity conservation research stations in Hawaii',
    'Great Barrier Reef marine park authority recovery stations',
  ];

  return (
    <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>Grounded Ocean Intelligence & Location Radar</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time verified information grounded with Google Search data and Google Maps locations
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <button
            onClick={() => {
              setActiveMode('search');
              setResultText(null);
              soundEngine.playUiClick();
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeMode === 'search'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Search Data</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('maps');
              setResultText(null);
              soundEngine.playUiClick();
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeMode === 'maps'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Google Maps Locations</span>
          </button>
        </div>
      </div>

      {/* Query Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearchSubmit();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          {activeMode === 'search' ? (
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          ) : (
            <MapPin className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          )}
          <input
            type="text"
            placeholder={
              activeMode === 'search'
                ? 'Search verified ocean plastic gyres, UNEP treaties, real expeditions...'
                : 'Locate marine biology research stations, cleanup ports, ocean sanctuaries...'
            }
            value={activeMode === 'search' ? searchQuery : mapsQuery}
            onChange={(e) =>
              activeMode === 'search'
                ? setSearchQuery(e.target.value)
                : setMapsQuery(e.target.value)
            }
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2 whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Querying...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Explore Grounded Data</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-slate-500 font-medium">Quick Research Prompts:</span>
        {(activeMode === 'search' ? sampleSearchQueries : sampleMapsQueries).map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (activeMode === 'search') setSearchQuery(item);
              else setMapsQuery(item);
              handleSearchSubmit(item);
            }}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors flex items-center gap-1"
          >
            <span>{item}</span>
            <ArrowRight className="w-3 h-3 text-cyan-400" />
          </button>
        ))}
      </div>

      {/* Grounded Results Output */}
      {resultText && (
        <div className="p-5 bg-slate-950 rounded-xl border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Grounded Response ({activeMode === 'search' ? 'Google Search Grounding' : 'Google Maps Grounding'})
            </span>

            <button
              onClick={() => soundEngine.speakText(resultText, 'English')}
              className="text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
              title="Read aloud"
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Listen</span>
            </button>
          </div>

          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
            {resultText}
          </div>

          {/* Sources and Query Chips */}
          {sources.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80 text-[11px] space-y-1.5">
              <span className="text-slate-400 font-medium">Search Sources & Web Queries:</span>
              <div className="flex flex-wrap gap-1.5">
                {sources.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
