import React, { useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { DetectionRecord, HardwareTelemetry } from '../types';
import { 
  BarChart3, 
  PieChart, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  Search, 
  FileSpreadsheet,
  Layers,
  Sparkles,
  Calendar
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';
import { MonthlyDataManager } from './MonthlyDataManager';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface AnalyticsDashboardProps {
  detections: DetectionRecord[];
  hardware: HardwareTelemetry | null;
  onSelectDetection: (detection: DetectionRecord) => void;
  onDeleteDetection: (id: string) => Promise<void>;
  onAddRecord: (record: DetectionRecord) => void;
  onNavigateToScan: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  detections,
  hardware,
  onSelectDetection,
  onDeleteDetection,
  onAddRecord,
  onNavigateToScan,
}) => {
  const [activeView, setActiveView] = useState<'monthly' | 'aggregate'>('monthly');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');

  // Compute category distribution from actual database records
  const categoryCounts: Record<string, number> = {
    Plastic: 0,
    'Fishing Gear': 0,
    Metal: 0,
    Rubber: 0,
    'Other Debris': 0,
  };

  let totalObjectsCount = 0;
  let criticalCount = 0;
  let totalEstimatedWeightKg = 0;

  detections.forEach((record) => {
    totalObjectsCount += record.detectedObjects.length;
    if (record.pollutionSeverity.level === 'Severe' || record.pollutionSeverity.level === 'High') {
      criticalCount++;
    }
    record.detectedObjects.forEach((obj) => {
      const cat = obj.category || 'Other Debris';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      totalEstimatedWeightKg += obj.estimatedWeightKg || 0;
    });
  });

  // Doughnut Chart Data
  const doughnutData = {
    labels: ['Plastics', 'Ghost Fishing Gear', 'Metal Waste', 'Rubber & Tires', 'Other'],
    datasets: [
      {
        data: [
          categoryCounts['Plastic'] || 0,
          categoryCounts['Fishing Gear'] || 0,
          categoryCounts['Metal'] || 0,
          categoryCounts['Rubber'] || 0,
          categoryCounts['Other Debris'] || 0,
        ],
        backgroundColor: [
          '#06b6d4', // Cyan
          '#f43f5e', // Rose
          '#f59e0b', // Amber
          '#a855f7', // Purple
          '#10b981', // Emerald
        ],
        borderColor: '#0f172a',
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#cbd5e1',
          font: { family: 'Plus Jakarta Sans', size: 11 },
          padding: 12,
        },
      },
    },
  };

  // Severity Distribution Bar Chart
  const severityBuckets = {
    Low: 0,
    Moderate: 0,
    High: 0,
    Severe: 0,
  };

  detections.forEach((d) => {
    const lvl = d.pollutionSeverity.level;
    if (lvl in severityBuckets) {
      severityBuckets[lvl as keyof typeof severityBuckets]++;
    }
  });

  const barData = {
    labels: ['Low (<25)', 'Moderate (25-50)', 'High (51-75)', 'Severe (>75)'],
    datasets: [
      {
        label: 'Recorded Observations',
        data: [
          severityBuckets.Low,
          severityBuckets.Moderate,
          severityBuckets.High,
          severityBuckets.Severe,
        ],
        backgroundColor: [
          '#10b981',
          '#f59e0b',
          '#f97316',
          '#f43f5e',
        ],
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } },
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 }, stepSize: 1 },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  // Filtered observation table
  const filteredList = detections.filter((d) => {
    const matchesSearch =
      d.location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.detectedObjects.some((o) => o.label.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSeverity =
      severityFilter === 'All' || d.pollutionSeverity.level === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 bg-slate-900/60 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
          <button
            onClick={() => {
              soundEngine.playUiClick();
              setActiveView('monthly');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeView === 'monthly'
                ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Monthly & Date Manager</span>
          </button>
          <button
            onClick={() => {
              soundEngine.playUiClick();
              setActiveView('aggregate');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeView === 'aggregate'
                ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Aggregate Charts & Trends</span>
          </button>
        </div>

        <button
          onClick={onNavigateToScan}
          className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-colors flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Analyze New Ocean Frame</span>
        </button>
      </div>

      {activeView === 'monthly' ? (
        <MonthlyDataManager
          detections={detections}
          hardware={hardware}
          onSelectDetection={onSelectDetection}
          onDeleteDetection={onDeleteDetection}
          onAddRecord={onAddRecord}
          onNavigateToScan={onNavigateToScan}
        />
      ) : (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <BarChart3 className="w-6 h-6 text-cyan-400" />
                <span>Ocean Monitoring Macro Analytics</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Aggregated marine debris counts, polymer distribution, and cleanup intervention schedules
              </p>
            </div>
          </div>

          {/* KPI Cards Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="ocean-glass-card rounded-2xl p-5 border border-slate-800">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Total Target Objects
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-white tabular-nums">
                  {totalObjectsCount}
                </span>
                <span className="text-xs text-cyan-400 font-mono">items cataloged</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Across {detections.length} recorded transects
              </span>
            </div>

            <div className="ocean-glass-card rounded-2xl p-5 border border-slate-800">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Critical Hotspots
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-rose-400 tabular-nums">
                  {criticalCount}
                </span>
                <span className="text-xs text-rose-300/80 font-mono">requiring response</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Severe (&gt;75) or High severity
              </span>
            </div>

            <div className="ocean-glass-card rounded-2xl p-5 border border-slate-800">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Total Estimated Debris
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-amber-300 tabular-nums">
                  {totalEstimatedWeightKg.toFixed(1)}
                </span>
                <span className="text-xs text-amber-400 font-mono">kg recorded</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Dry synthetic mass estimate
              </span>
            </div>

            <div className="ocean-glass-card rounded-2xl p-5 border border-slate-800">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                IoT Edge Rig Status
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xl font-bold font-mono ${
                    hardware?.connected ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {hardware?.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                {hardware?.connected ? `${hardware.sensors.turbidityNtu} NTU · ${hardware.sensors.waterTemperatureC}°C` : 'No live telemetry'}
              </span>
            </div>

          </div>

          {/* Chart.js Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Doughnut Chart (5 cols) */}
            <div className="lg:col-span-5 ocean-glass-card rounded-2xl p-6 border border-slate-800 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-white">Debris Category Distribution</h2>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">YOLO Classes</span>
              </div>

              <div className="relative flex-1 min-h-[260px] flex items-center justify-center">
                {totalObjectsCount > 0 ? (
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                ) : (
                  <div className="text-xs text-slate-500">No debris targets recorded yet.</div>
                )}
              </div>
            </div>

            {/* Severity Trends Bar Chart (7 cols) */}
            <div className="lg:col-span-7 ocean-glass-card rounded-2xl p-6 border border-slate-800 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-white">Pollution Severity Frequency</h2>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Index Ranges</span>
              </div>

              <div className="relative flex-1 min-h-[260px]">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>

          </div>

          {/* Database Observations Table */}
          <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                  <span>Verified Marine Observation Logs ({filteredList.length})</span>
                </h2>
                <p className="text-xs text-slate-400">Complete observation history with coordinates and cleanup priorities</p>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search location or target..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-52"
                  />
                </div>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                >
                  <option value="All">All Severities</option>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800/80 rounded-xl overflow-hidden">
                <thead className="bg-slate-900/80 text-slate-300 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Observation Site</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Targets Detected</th>
                    <th className="p-3">Pollution Index</th>
                    <th className="p-3">Cleanup Priority</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {filteredList.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-white">{record.location.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {record.location.latitude.toFixed(4)}°N, {record.location.longitude.toFixed(4)}°W
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px]">
                          {record.source}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-white">
                          {record.detectedObjects.length} objects
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {record.detectedObjects.map((o) => o.label).join(', ') || 'No debris'}
                        </div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold font-mono border ${
                            record.pollutionSeverity.level === 'Severe'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : record.pollutionSeverity.level === 'High'
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                              : record.pollutionSeverity.level === 'Moderate'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {record.pollutionSeverity.level} ({record.pollutionSeverity.score})
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="text-cyan-300 font-medium">
                          {record.cleanupPriority.priority}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {record.cleanupPriority.timeframe}
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectDetection(record)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                            title="View inspection"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteDetection(record.id)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Remove record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
