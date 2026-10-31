import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
  Trash2,
  ExternalLink,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  Activity,
  Layers,
  Sparkles,
  X,
  FileDown,
  RotateCcw,
} from 'lucide-react';
import { DetectionRecord, HardwareTelemetry } from '../types';
import { soundEngine } from '../services/soundEngine';

interface MonthlyDataManagerProps {
  detections: DetectionRecord[];
  hardware: HardwareTelemetry | null;
  onSelectDetection: (detection: DetectionRecord) => void;
  onDeleteDetection: (id: string) => Promise<void>;
  onAddRecord: (record: DetectionRecord) => void;
  onNavigateToScan: () => void;
}

export const MonthlyDataManager: React.FC<MonthlyDataManagerProps> = ({
  detections,
  hardware,
  onSelectDetection,
  onDeleteDetection,
  onAddRecord,
  onNavigateToScan,
}) => {
  // Current active month in view ('YYYY-MM')
  const [activeMonth, setActiveMonth] = useState<string>(() => {
    // Default to the month of the most recent detection, or current month
    if (detections.length > 0 && detections[0].timestamp) {
      return detections[0].timestamp.slice(0, 7);
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Selected particular date ('YYYY-MM-DD' or null for full month)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  // Modal for recording manual data entry
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    siteName: 'Coastal Marine Sanctuary',
    latitude: 34.2541,
    longitude: -140.7812,
    source: 'Autonomous Buoy' as const,
    imagingMode: 'Optical' as const,
    debrisLabel: 'Polyethylene Bottle & Packaging Cluster',
    debrisCategory: 'Plastic' as const,
    estimatedWeightKg: 1.25,
    severityLevel: 'Moderate' as 'Low' | 'Moderate' | 'High' | 'Severe',
    severityScore: 55,
    turbidityNtu: 14.5,
    waterTempC: 21.0,
    actionPlan: 'Deploy surface skimmer craft for collection within 48 hours.',
    reasoning: 'Concentrated synthetic polymer aggregation in surface current.',
  });

  // Available months extracted from actual detections
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    // Always include active month
    set.add(activeMonth);
    detections.forEach((d) => {
      if (d.timestamp) {
        set.add(d.timestamp.slice(0, 7));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [detections, activeMonth]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    soundEngine.playUiClick();
    const [year, month] = activeMonth.split('-').map(Number);
    let nextY = year;
    let nextM = month - 1;
    if (nextM < 1) {
      nextM = 12;
      nextY--;
    }
    setActiveMonth(`${nextY}-${String(nextM).padStart(2, '0')}`);
    setSelectedDate(null);
  };

  // Navigate to next month
  const handleNextMonth = () => {
    soundEngine.playUiClick();
    const [year, month] = activeMonth.split('-').map(Number);
    let nextY = year;
    let nextM = month + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY++;
    }
    setActiveMonth(`${nextY}-${String(nextM).padStart(2, '0')}`);
    setSelectedDate(null);
  };

  // Human readable month title
  const monthTitle = useMemo(() => {
    const [year, month] = activeMonth.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [activeMonth]);

  // Calendar days generation for activeMonth
  const calendarDays = useMemo(() => {
    const [year, month] = activeMonth.split('-').map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    const days = [];
    // Padding before day 1
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateStr: null });
    }
    // Real days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr });
    }
    return days;
  }, [activeMonth]);

  // Map of dateStr -> records count & severities
  const dateMap = useMemo(() => {
    const map: Record<string, { count: number; highestSeverity: string; records: DetectionRecord[] }> = {};
    detections.forEach((d) => {
      const dateStr = (d.timestamp || '').slice(0, 10);
      if (!map[dateStr]) {
        map[dateStr] = { count: 0, highestSeverity: 'Low', records: [] };
      }
      map[dateStr].count++;
      map[dateStr].records.push(d);

      const lvl = d.pollutionSeverity?.level || 'Low';
      if (lvl === 'Severe') map[dateStr].highestSeverity = 'Severe';
      else if (lvl === 'High' && map[dateStr].highestSeverity !== 'Severe') map[dateStr].highestSeverity = 'High';
      else if (lvl === 'Moderate' && map[dateStr].highestSeverity === 'Low') map[dateStr].highestSeverity = 'Moderate';
    });
    return map;
  }, [detections]);

  // Filter records for active view (Month and optional Date)
  const filteredRecords = useMemo(() => {
    return detections.filter((d) => {
      const ts = d.timestamp || '';
      const dateStr = ts.slice(0, 10);
      const monthStr = ts.slice(0, 7);

      // Month check
      if (monthStr !== activeMonth) return false;

      // Date check
      if (selectedDate && dateStr !== selectedDate) return false;

      // Severity check
      if (severityFilter !== 'All' && d.pollutionSeverity?.level !== severityFilter) return false;

      // Source check
      if (sourceFilter !== 'All' && d.source !== sourceFilter) return false;

      // Search check
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const siteMatches = (d.location?.name || '').toLowerCase().includes(q);
        const objMatches = (d.detectedObjects || []).some((o) =>
          o.label.toLowerCase().includes(q) || o.material.toLowerCase().includes(q)
        );
        if (!siteMatches && !objMatches) return false;
      }

      return true;
    });
  }, [detections, activeMonth, selectedDate, severityFilter, sourceFilter, searchTerm]);

  // Month-level or Date-level summary statistics
  const summaryStats = useMemo(() => {
    let objectCount = 0;
    let criticalCount = 0;
    let totalWeight = 0;
    let sumTurbidity = 0;
    let turbidityCount = 0;
    let sumTemp = 0;
    let tempCount = 0;

    filteredRecords.forEach((r) => {
      objectCount += (r.detectedObjects || []).length;
      if (r.pollutionSeverity?.level === 'Severe' || r.pollutionSeverity?.level === 'High') {
        criticalCount++;
      }
      (r.detectedObjects || []).forEach((o) => {
        totalWeight += o.estimatedWeightKg || 0;
      });
      if (r.sensorContext?.turbidityNtu) {
        sumTurbidity += r.sensorContext.turbidityNtu;
        turbidityCount++;
      }
      if (r.sensorContext?.waterTempC) {
        sumTemp += r.sensorContext.waterTempC;
        tempCount++;
      }
    });

    return {
      recordCount: filteredRecords.length,
      objectCount,
      criticalCount,
      totalWeightKg: totalWeight.toFixed(1),
      avgTurbidity: turbidityCount > 0 ? (sumTurbidity / turbidityCount).toFixed(1) : '—',
      avgTemp: tempCount > 0 ? (sumTemp / tempCount).toFixed(1) : '—',
    };
  }, [filteredRecords]);

  // Export handler (calls server export endpoint)
  const handleExport = (format: 'csv' | 'json') => {
    soundEngine.playSuccessSound();
    const params = new URLSearchParams();
    params.set('format', format);
    if (selectedDate) {
      params.set('date', selectedDate);
    } else {
      params.set('month', activeMonth);
    }
    window.open(`/api/history/export?${params.toString()}`, '_blank');
  };

  // Submit manual record entry
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playUiClick();

    const timestamp = new Date(`${newEntry.date}T${newEntry.time}:00Z`).toISOString();
    const newRecord: DetectionRecord = {
      id: `manual-${Date.now().toString(36)}`,
      timestamp,
      imageUrl: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=800&q=80',
      source: newEntry.source,
      imagingMode: newEntry.imagingMode,
      location: {
        name: newEntry.siteName,
        latitude: Number(newEntry.latitude),
        longitude: Number(newEntry.longitude),
      },
      detectedObjects: [
        {
          id: `det-${Date.now()}`,
          label: newEntry.debrisLabel,
          category: newEntry.debrisCategory,
          confidence: 0.95,
          box_2d: [200, 200, 700, 700],
          material: newEntry.debrisCategory === 'Plastic' ? 'PET / Polyethylene' : 'Synthetic Composition',
          estimatedWeightKg: Number(newEntry.estimatedWeightKg),
        },
      ],
      objectCount: 1,
      pollutionSeverity: {
        level: newEntry.severityLevel,
        score: Number(newEntry.severityScore),
        reasoning: newEntry.reasoning,
      },
      cleanupPriority: {
        priority: newEntry.severityLevel === 'Severe' ? 'Critical Response' : newEntry.severityLevel === 'High' ? 'Priority' : 'Routine',
        timeframe: newEntry.severityLevel === 'Severe' ? 'Within 48 hours' : 'Within 7 days',
        equipmentRecommended: ['Autonomous surface skimmer', 'Harbor cleanup craft'],
        actionPlan: newEntry.actionPlan,
      },
      marineEcosystemImpact: {
        entanglementRisk: newEntry.severityLevel === 'Severe' ? 'Critical' : newEntry.severityLevel === 'High' ? 'High' : 'Medium',
        ingestionHazard: 'Ingestion risk for marine organisms',
        degradationTimeEstimate: '300-500 years',
      },
      sensorContext: {
        turbidityNtu: Number(newEntry.turbidityNtu),
        waterTempC: Number(newEntry.waterTempC),
        waterClarity: Number(newEntry.turbidityNtu) > 20 ? 'High Turbidity' : 'Clear',
      },
    };

    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
      if (res.ok) {
        const data = await res.json();
        onAddRecord(data.data || newRecord);
        soundEngine.playSuccessSound();
        setIsRecordModalOpen(false);
        // Switch to the month/date of the created record
        setActiveMonth(newEntry.date.slice(0, 7));
        setSelectedDate(newEntry.date);
      }
    } catch (err) {
      console.error('Failed creating record:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Monthly Ocean Records & Date Manager</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-normal">
                  Persistent Storage
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Archived ocean observations, IoT sensor telemetry, and environmental logs organized by month and specific date
              </p>
            </div>
          </div>
        </div>

        {/* Global Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-200 hover:text-cyan-300 transition-colors flex items-center gap-1.5 shadow-sm"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export {selectedDate ? 'Date' : 'Month'} (CSV)</span>
          </button>

          <button
            onClick={() => handleExport('json')}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-200 hover:text-cyan-300 transition-colors flex items-center gap-1.5 shadow-sm"
            title="Download JSON data"
          >
            <FileDown className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              // Pre-fill date to selectedDate or today
              if (selectedDate) {
                setNewEntry((prev) => ({ ...prev, date: selectedDate }));
              }
              setIsRecordModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-semibold rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record New Data</span>
          </button>
        </div>
      </div>

      {/* Month Navigator & KPI Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Month Selector Card (5 cols) */}
        <div className="lg:col-span-5 ocean-glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Active Month Selector</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="py-4">
            <div className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>{monthTitle}</span>
              <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {activeMonth}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Click any calendar day below to inspect observations recorded on that particular date.
            </p>
          </div>

          {/* Quick Month Quick-jump Pills */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-slate-500 shrink-0 font-medium">Months:</span>
            {availableMonths.map((m) => {
              const [y, mon] = m.split('-').map(Number);
              const label = new Date(y, mon - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
              return (
                <button
                  key={m}
                  onClick={() => {
                    soundEngine.playUiClick();
                    setActiveMonth(m);
                    setSelectedDate(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono transition-colors shrink-0 ${
                    activeMonth === m
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Metric Cards (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="ocean-glass-card rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              {selectedDate ? 'Date Records' : 'Monthly Records'}
            </span>
            <div className="my-1">
              <span className="text-3xl font-extrabold font-mono text-white tabular-nums">
                {summaryStats.recordCount}
              </span>
              <span className="text-xs text-slate-400 ml-1">scans</span>
            </div>
            <span className="text-[11px] text-cyan-400 font-mono">
              {summaryStats.objectCount} target items
            </span>
          </div>

          <div className="ocean-glass-card rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Critical Alerts
            </span>
            <div className="my-1">
              <span className="text-3xl font-extrabold font-mono text-rose-400 tabular-nums">
                {summaryStats.criticalCount}
              </span>
              <span className="text-xs text-rose-300/80 ml-1">urgent</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Severe or High score
            </span>
          </div>

          <div className="ocean-glass-card rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Avg Turbidity
            </span>
            <div className="my-1">
              <span className="text-3xl font-extrabold font-mono text-amber-300 tabular-nums">
                {summaryStats.avgTurbidity}
              </span>
              <span className="text-xs text-amber-400 ml-1">NTU</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Temp: {summaryStats.avgTemp}°C
            </span>
          </div>

          <div className="ocean-glass-card rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Est. Waste Mass
            </span>
            <div className="my-1">
              <span className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                {summaryStats.totalWeightKg}
              </span>
              <span className="text-xs text-emerald-300 ml-1">kg</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Synthetic polymers
            </span>
          </div>

        </div>

      </div>

      {/* Calendar Matrix Section (Interactive Particular Date Selection) */}
      <div className="ocean-glass-card rounded-2xl p-5 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>{monthTitle} — Calendar Days Matrix</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select any specific day to drill into all telemetry and debris images logged on that date
            </p>
          </div>

          {/* Date Selection Active State / Reset */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {selectedDate ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/15 border border-cyan-500/40 rounded-xl text-xs">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-300 font-mono font-medium">
                  Filtering by Date: <strong className="text-white">{selectedDate}</strong>
                </span>
                <button
                  onClick={() => {
                    soundEngine.playUiClick();
                    setSelectedDate(null);
                  }}
                  className="p-1 hover:bg-cyan-500/20 rounded-md text-cyan-300 hover:text-white transition-colors ml-1"
                  title="Clear date filter (show whole month)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                Viewing all days in {monthTitle}
              </span>
            )}
          </div>
        </div>

        {/* 7-Day Grid */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-slate-400 py-1 uppercase tracking-wider">
              {d}
            </div>
          ))}

          {calendarDays.map((item, idx) => {
            if (!item.dateStr) {
              return <div key={`empty-${idx}`} className="h-16 rounded-xl bg-slate-950/20 border border-transparent" />;
            }

            const dayData = dateMap[item.dateStr];
            const hasData = Boolean(dayData && dayData.count > 0);
            const isSelected = selectedDate === item.dateStr;

            return (
              <button
                key={item.dateStr}
                onClick={() => {
                  soundEngine.playUiClick();
                  setSelectedDate(isSelected ? null : item.dateStr);
                }}
                className={`h-16 sm:h-20 p-2 rounded-xl text-left border transition-all flex flex-col justify-between relative group ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-2 ring-cyan-400/40'
                    : hasData
                    ? 'bg-slate-900/80 hover:bg-slate-900 border-slate-700/80 hover:border-cyan-500/50 cursor-pointer'
                    : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/40 text-slate-600 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-bold font-mono ${
                      isSelected
                        ? 'text-cyan-300'
                        : hasData
                        ? 'text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    {item.dayNumber}
                  </span>

                  {hasData && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        dayData.highestSeverity === 'Severe'
                          ? 'bg-rose-400 ring-2 ring-rose-400/30'
                          : dayData.highestSeverity === 'High'
                          ? 'bg-amber-400 ring-2 ring-amber-400/30'
                          : dayData.highestSeverity === 'Moderate'
                          ? 'bg-yellow-400'
                          : 'bg-emerald-400'
                      }`}
                      title={`${dayData.highestSeverity} severity recorded`}
                    />
                  )}
                </div>

                {hasData ? (
                  <div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium block w-fit truncate">
                      {dayData.count} {dayData.count === 1 ? 'obs' : 'obs'}
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-600 hidden sm:block">No data</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Observation Records Table & Filters */}
      <div className="ocean-glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>
                {selectedDate
                  ? `Observations for Date: ${selectedDate} (${filteredRecords.length})`
                  : `All Observations for ${monthTitle} (${filteredRecords.length})`}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {selectedDate
                ? `Detailed log of debris detected and in-situ telemetry measured on ${selectedDate}`
                : `Showing all recorded data entries within ${monthTitle}`}
            </p>
          </div>

          {/* Search & Filters Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search site, debris..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-44 sm:w-52"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="All">All Severities</option>
              <option value="Low">Low (&lt;25)</option>
              <option value="Moderate">Moderate (25-50)</option>
              <option value="High">High (51-75)</option>
              <option value="Severe">Severe (&gt;75)</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="All">All Sources</option>
              <option value="Autonomous Buoy">Autonomous Buoy</option>
              <option value="Field Camera">Field Camera</option>
              <option value="Satellite/Drone">Satellite/Drone</option>
              <option value="Side-Scan Sonar Towfish">Side-Scan Sonar</option>
            </select>
          </div>
        </div>

        {/* Record Cards Grid / Table */}
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800/80 rounded-xl overflow-hidden">
              <thead className="bg-slate-900/80 text-slate-300 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Observation Site</th>
                  <th className="p-3">Source & Mode</th>
                  <th className="p-3">Detected Debris</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Sensor Context</th>
                  <th className="p-3">Cleanup Priority</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredRecords.map((record) => {
                  const d = new Date(record.timestamp);
                  const dateStr = d.toLocaleDateString();
                  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={record.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Date & Time */}
                      <td className="p-3 whitespace-nowrap font-mono">
                        <div className="text-white font-medium flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{timeStr}</span>
                        </div>
                      </td>

                      {/* Site */}
                      <td className="p-3">
                        <div className="font-semibold text-white flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate max-w-xs">{record.location?.name || 'Ocean Coordinates'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {record.location?.latitude?.toFixed(4)}°N, {record.location?.longitude?.toFixed(4)}°W
                        </div>
                      </td>

                      {/* Source & Mode */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px] block w-fit">
                          {record.source}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                          {record.imagingMode || 'Optical'}
                        </span>
                      </td>

                      {/* Detected Objects */}
                      <td className="p-3">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          <span className="font-mono text-cyan-400 font-bold">
                            {record.detectedObjects.length}
                          </span>
                          <span>{record.detectedObjects.length === 1 ? 'item' : 'items'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {record.detectedObjects.map((o) => o.label).join(', ') || 'No debris'}
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold font-mono border ${
                            record.pollutionSeverity?.level === 'Severe'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : record.pollutionSeverity?.level === 'High'
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                              : record.pollutionSeverity?.level === 'Moderate'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {record.pollutionSeverity?.level} ({record.pollutionSeverity?.score})
                        </span>
                      </td>

                      {/* Sensor Context */}
                      <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                        {record.sensorContext ? (
                          <div>
                            <span className="text-cyan-300">{record.sensorContext.turbidityNtu} NTU</span>
                            <span className="text-slate-500 mx-1">·</span>
                            <span className="text-slate-300">{record.sensorContext.waterTempC}°C</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Cleanup */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="text-cyan-300 font-medium block">
                          {record.cleanupPriority?.priority || 'Routine'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {record.cleanupPriority?.timeframe || 'Scheduled'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectDetection(record)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                            title="Inspect in Detection Studio"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteDetection(record.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete this record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center rounded-xl bg-slate-900/30 border border-slate-800/80 space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <Calendar className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                No observations found for {selectedDate ? selectedDate : monthTitle}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No verified records match your active month, date, or filter criteria. You can record a new entry or analyze a new ocean frame.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  if (selectedDate) setNewEntry((prev) => ({ ...prev, date: selectedDate }));
                  setIsRecordModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Entry for This Date</span>
              </button>
              <button
                onClick={onNavigateToScan}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Run AI Detection</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Record Creation Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl ocean-glass-card rounded-2xl p-6 shadow-2xl border border-cyan-500/30 text-slate-100 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Record Ocean Observation Entry</h2>
                  <p className="text-xs text-slate-400">
                    Log new marine debris survey or telemetry data pinned to a particular date
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateRecord} className="mt-5 space-y-4 text-xs">
              
              {/* Date & Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Particular Observation Date</label>
                  <input
                    type="date"
                    required
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Observation Time (UTC)</label>
                  <input
                    type="time"
                    required
                    value={newEntry.time}
                    onChange={(e) => setNewEntry({ ...newEntry, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Site Name & Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Observation Site Name</label>
                  <input
                    type="text"
                    required
                    value={newEntry.siteName}
                    onChange={(e) => setNewEntry({ ...newEntry, siteName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                    placeholder="e.g. North Pacific Gyre Sector 4"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Observation Source</label>
                  <select
                    value={newEntry.source}
                    onChange={(e) => setNewEntry({ ...newEntry, source: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="Autonomous Buoy">Autonomous Buoy</option>
                    <option value="Field Camera">Field Camera</option>
                    <option value="Satellite/Drone">Satellite/Drone</option>
                    <option value="Side-Scan Sonar Towfish">Side-Scan Sonar Towfish</option>
                    <option value="Upload">Manual Research Log</option>
                  </select>
                </div>
              </div>

              {/* Lat & Long */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newEntry.latitude}
                    onChange={(e) => setNewEntry({ ...newEntry, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Longitude (°E/W)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newEntry.longitude}
                    onChange={(e) => setNewEntry({ ...newEntry, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Debris Target & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">Primary Debris Identified</label>
                  <input
                    type="text"
                    required
                    value={newEntry.debrisLabel}
                    onChange={(e) => setNewEntry({ ...newEntry, debrisLabel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                    placeholder="e.g. Lost Gillnet Section"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Category</label>
                  <select
                    value={newEntry.debrisCategory}
                    onChange={(e) => setNewEntry({ ...newEntry, debrisCategory: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="Plastic">Plastic</option>
                    <option value="Fishing Gear">Fishing Gear</option>
                    <option value="Metal">Metal</option>
                    <option value="Rubber">Rubber</option>
                    <option value="Other Debris">Other Debris</option>
                  </select>
                </div>
              </div>

              {/* Severity & Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Severity Level</label>
                  <select
                    value={newEntry.severityLevel}
                    onChange={(e) => setNewEntry({ ...newEntry, severityLevel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="Low">Low (&lt;25)</option>
                    <option value="Moderate">Moderate (25-50)</option>
                    <option value="High">High (51-75)</option>
                    <option value="Severe">Severe (&gt;75)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Severity Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newEntry.severityScore}
                    onChange={(e) => setNewEntry({ ...newEntry, severityScore: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Est. Weight (kg)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={newEntry.estimatedWeightKg}
                    onChange={(e) => setNewEntry({ ...newEntry, estimatedWeightKg: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Sensor Telemetry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-cyan-300 mb-1 font-medium">In-Situ Turbidity (NTU)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEntry.turbidityNtu}
                    onChange={(e) => setNewEntry({ ...newEntry, turbidityNtu: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 mb-1 font-medium">Water Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEntry.waterTempC}
                    onChange={(e) => setNewEntry({ ...newEntry, waterTempC: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Action Plan */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Recommended Cleanup Action Plan</label>
                <textarea
                  rows={2}
                  value={newEntry.actionPlan}
                  onChange={(e) => setNewEntry({ ...newEntry, actionPlan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  Save & Pin to Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

