import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Camera, 
  AlertTriangle, 
  ShieldAlert, 
  Cpu, 
  Download, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  ChevronRight,
  Radio,
  Sliders,
  Printer,
  X,
  Clock,
  Waves,
  Eye,
  FileText,
  Compass,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';
import { DetectionRecord, DetectedItem } from '../types';

interface DetectionStudioProps {
  onDetectionAdded: (record: DetectionRecord) => void;
  recentDetections: DetectionRecord[];
  targetScanLocation?: {
    locationName: string;
    lat: number;
    lng: number;
    autoScan?: boolean;
    scanId?: number;
  } | null;
  inspectedRecord?: DetectionRecord | null;
  onNavigateToArchive?: () => void;
}

export interface PresetItem {
  id: string;
  mode: 'sonar' | 'optical';
  name: string;
  description: string;
  category: 'Fishing Gear' | 'Metal' | 'Plastic' | 'Clean Baseline' | 'Rubber';
  url: string;
  locationName: string;
  lat: number;
  lng: number;
  frequencyKhz?: number;
  depthMeters?: number;
}

// Side-Scan Sonar & Optical Presets (Curated for HackIndia presentation)
const ALL_PRESETS: PresetItem[] = [
  // --- SONAR PRESETS (Authentic Hydrographic Sonar Scans) ---
  {
    id: 's-1',
    mode: 'sonar',
    name: 'Acoustic Scan: Ghost Fishing Net',
    description: '450 kHz Side-Scan Sonar showing nylon gillnet mesh & acoustic shadow profile on seabed sediment',
    category: 'Fishing Gear',
    url: '/sonar/sonar_ghost_net.jpg',
    locationName: 'Mumbai Coastline Transect (Arabian Sea)',
    lat: 19.1245,
    lng: 72.8258,
    frequencyKhz: 450,
    depthMeters: 24.5,
  },
  {
    id: 's-2',
    mode: 'sonar',
    name: 'Acoustic Scan: Submerged Metal Cylinder',
    description: 'High-backscatter metallic specular reflection with hard acoustic shadow indicating cylindrical pipe',
    category: 'Metal',
    url: '/sonar/sonar_metal_cylinder.jpg',
    locationName: 'Gulf of Mannar Shipping Transect',
    lat: 9.1524,
    lng: 79.1245,
    frequencyKhz: 450,
    depthMeters: 18.2,
  },
  {
    id: 's-3',
    mode: 'sonar',
    name: 'Acoustic Scan: Benthic Plastic Waste Cluster',
    description: 'Acoustic anomaly cluster representing discarded heavy synthetic crates & degrading polymer sheets',
    category: 'Plastic',
    url: '/sonar/sonar_benthic_plastic_waste.jpg',
    locationName: 'Ganga-Hooghly Delta Outflow (Sundarbans)',
    lat: 21.6214,
    lng: 88.1042,
    frequencyKhz: 900,
    depthMeters: 12.0,
  },
  {
    id: 's-4',
    mode: 'sonar',
    name: 'Acoustic Scan: Clean Seafloor Baseline',
    description: 'Homogeneous sand ripples with zero synthetic target backscatter or anomalous acoustic shadows',
    category: 'Clean Baseline',
    url: '/sonar/sonar_clean_seafloor.jpg',
    locationName: 'Andaman Protected Coral Biosphere',
    lat: 11.6824,
    lng: 92.7412,
    frequencyKhz: 450,
    depthMeters: 32.0,
  },

  // --- OPTICAL PRESETS ---
  {
    id: 'o-1',
    mode: 'optical',
    name: 'Surface Ghost Net Drift',
    description: 'Nylon monofilament gillnet drifting near surface convergence line',
    category: 'Fishing Gear',
    url: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=1200&q=80',
    locationName: 'North Pacific Subtropical Gyre',
    lat: 34.2541,
    lng: -140.7812,
  },
  {
    id: 'o-2',
    mode: 'optical',
    name: 'Coastal Plastic Bottles & Debris',
    description: 'Floating PET bottles and shoreline container waste in littoral wave zone',
    category: 'Plastic',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80',
    locationName: 'Bay of Bengal Littoral Zone',
    lat: 21.4272,
    lng: 91.9702,
  },
  {
    id: 'o-3',
    mode: 'optical',
    name: 'Submerged Vehicle Tire',
    description: 'Heavy synthetic rubber benthic hazard releasing chemical leachates',
    category: 'Rubber',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    locationName: 'Ligurian Marine Sanctuary',
    lat: 43.3421,
    lng: 8.5218,
  },
];

export const DetectionStudio: React.FC<DetectionStudioProps> = ({
  onDetectionAdded,
  recentDetections,
  targetScanLocation,
  inspectedRecord,
  onNavigateToArchive,
}) => {
  const [activeImagingMode, setActiveImagingMode] = useState<'sonar' | 'optical'>('sonar');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('s-1');
  const [selectedImage, setSelectedImage] = useState<string>(ALL_PRESETS[0].url);
  const [locationName, setLocationName] = useState<string>(ALL_PRESETS[0].locationName);
  const [coordinates, setCoordinates] = useState({ lat: ALL_PRESETS[0].lat, lng: ALL_PRESETS[0].lng });
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<DetectionRecord | null>(() => {
    // Match first preset or null
    return recentDetections.find((d) => d.imageUrl === ALL_PRESETS[0].url) || recentDetections[0] || null;
  });
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // OpenCV Preprocessing Filter Simulation (Matching Slide 4 & 5)
  const [opencvFilter, setOpencvFilter] = useState<'raw' | 'clahe' | 'shadow'>('raw');

  // Modals for Hackathon presentation
  const [isDossierModalOpen, setIsDossierModalOpen] = useState<boolean>(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState<boolean>(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState<boolean>(false);

  const lastProcessedScanIdRef = useRef<number | null>(null);

  // Load record when selected from Dashboard or Records Manager
  useEffect(() => {
    if (inspectedRecord) {
      setSelectedImage(inspectedRecord.imageUrl);
      setLocationName(inspectedRecord.location?.name || 'Survey Point');
      setCoordinates({
        lat: inspectedRecord.location?.latitude || ALL_PRESETS[0].lat,
        lng: inspectedRecord.location?.longitude || ALL_PRESETS[0].lng,
      });
      setAnalysisResult(inspectedRecord);
      if (inspectedRecord.imagingMode === 'Sonar') {
        setActiveImagingMode('sonar');
      } else {
        setActiveImagingMode('optical');
      }
      setIsResultsModalOpen(true);
    }
  }, [inspectedRecord]);

  // Sync incoming GIS target scan location from Ocean GIS Map & auto-run scan
  useEffect(() => {
    if (targetScanLocation) {
      setLocationName(targetScanLocation.locationName);
      setCoordinates({ lat: targetScanLocation.lat, lng: targetScanLocation.lng });

      // Match preset or assign an appropriate side-scan sonar image for these coordinates
      const locLower = targetScanLocation.locationName.toLowerCase();
      let matchedPreset = ALL_PRESETS.find(
        (p) =>
          locLower.includes(p.name.toLowerCase()) ||
          p.locationName.toLowerCase().includes(locLower)
      );

      if (!matchedPreset) {
        const hash = Math.abs(Math.round(targetScanLocation.lat * 17 + targetScanLocation.lng * 23));
        const sonarPresets = ALL_PRESETS.filter((p) => p.mode === 'sonar');
        matchedPreset = sonarPresets[hash % sonarPresets.length] || ALL_PRESETS[0];
      }

      if (matchedPreset) {
        setActiveImagingMode(matchedPreset.mode);
        setSelectedPresetId(matchedPreset.id);
        setSelectedImage(matchedPreset.url);
      }

      const scanId = targetScanLocation.scanId || Date.now();
      if (targetScanLocation.autoScan && lastProcessedScanIdRef.current !== scanId) {
        lastProcessedScanIdRef.current = scanId;
        const imgToScan = matchedPreset?.url || selectedImage;
        setTimeout(() => {
          executeScanForLocation(
            targetScanLocation.locationName,
            targetScanLocation.lat,
            targetScanLocation.lng,
            imgToScan
          );
        }, 350);
      }
    }
  }, [targetScanLocation]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert image URL to base64 for server processing
  const urlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setSelectedImage(optimizedDataUrl);
        } else {
          setSelectedImage(event.target?.result as string);
        }

        setLocationName(`Survey Field Scan #${Math.floor(100 + Math.random() * 900)}`);
        setAnalysisResult(null);
        setCoordinates({
          lat: +(18 + (Math.random() * 10 - 5)).toFixed(4),
          lng: +(76 + (Math.random() * 15 - 7)).toFixed(4),
        });
        setErrorMessage(null);
        soundEngine.playUiClick();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const executeScanForLocation = async (
    targetLocName: string,
    targetLat: number,
    targetLng: number,
    imgToScan: string
  ) => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    soundEngine.ensureContext();
    soundEngine.startScanningSound();

    try {
      let base64Data = imgToScan;
      if (!imgToScan.startsWith('data:')) {
        base64Data = await urlToBase64(imgToScan);
      }

      const res = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          imageUrl: imgToScan,
          locationName: targetLocName,
          lat: targetLat,
          lng: targetLng,
          imagingMode: activeImagingMode,
        }),
      });

      const data = await res.json();
      if (data.success && data.detection) {
        setAnalysisResult(data.detection);
        onDetectionAdded(data.detection);
        setIsResultsModalOpen(true);

        soundEngine.stopScanningSound();
        if (data.detection.objectCount > 0) {
          soundEngine.playDebrisDetectionChime();
          if (data.detection.pollutionSeverity.score >= 70) {
            setTimeout(() => soundEngine.playCriticalWarningAlert(), 600);
          }
        } else {
          soundEngine.playSuccessSound();
        }
      } else {
        throw new Error(data.error || 'Failed to complete vision analysis');
      }
    } catch (err: any) {
      soundEngine.stopScanningSound();
      console.error('Detection error:', err);
      setErrorMessage(err.message || 'Detection failed. Please check network and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runDetection = async () => {
    await executeScanForLocation(locationName, coordinates.lat, coordinates.lng, selectedImage);
  };

  // Color helper matching Slides 1 & 4
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Fishing Gear':
        return { border: 'border-rose-400', bg: 'bg-rose-500/20', text: 'text-rose-300' };
      case 'Plastic':
        return { border: 'border-cyan-400', bg: 'bg-cyan-500/20', text: 'text-cyan-300' };
      case 'Metal':
        return { border: 'border-amber-400', bg: 'bg-amber-500/20', text: 'text-amber-300' };
      case 'Rubber':
        return { border: 'border-purple-400', bg: 'bg-purple-500/20', text: 'text-purple-300' };
      default:
        return { border: 'border-emerald-400', bg: 'bg-emerald-500/20', text: 'text-emerald-300' };
    }
  };

  const getSeverityStyle = (level: string) => {
    switch (level) {
      case 'Severe':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'High':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'Moderate':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  // Filtered presets based on mode
  const currentPresets = ALL_PRESETS.filter((p) => p.mode === activeImagingMode);

  return (
    <div className="space-y-8">
      {/* 5-Step Pipeline Banner (Directly from Slide 4 & Slide 5) */}
      <div className="ocean-glass-card rounded-2xl p-4 border border-cyan-500/30 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-bold text-white tracking-wide uppercase">
              DeepScan AI 5-Step Sonar Workflow
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-300 font-mono text-[11px]">Autonomous SSS Pipeline</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Automating Seabed Debris Detection via YOLOv8 & OpenCV
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 text-[11px]">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-0.5">1. Sonar Input</span>
            <span className="text-slate-400">Side-scan seabed waterfall</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-0.5">2. Preprocessing</span>
            <span className="text-slate-400">OpenCV CLAHE & noise reduction</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-cyan-400/40 bg-cyan-950/20">
            <span className="text-cyan-300 font-bold block mb-0.5">3. YOLOv8 Detection</span>
            <span className="text-slate-300">Neural bounding box classification</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-0.5">4. AI Localization</span>
            <span className="text-slate-400">Slant-range bathymetric GPS</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-0.5">5. Actionable Results</span>
            <span className="text-slate-400">Ecological dispatch dossier</span>
          </div>
        </div>
      </div>

      {/* Target Scan Location Banner (Locked from Ocean GIS Map) */}
      {targetScanLocation && (
        <div className="ocean-glass-card rounded-2xl p-4 border border-cyan-400/50 bg-cyan-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shrink-0">
              <Compass className="w-5 h-5 animate-pulse text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-semibold">
                  GIS Coordinate Target Locked
                </span>
                {isAnalyzing ? (
                  <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Scanning Seabed at Coordinates...
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Target Coordinates Scanned
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white mt-1">
                {locationName}
              </h3>
              <p className="text-xs font-mono text-cyan-300">
                Lat: {coordinates.lat.toFixed(4)}°N · Lng: {coordinates.lng.toFixed(4)}°E
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => executeScanForLocation(locationName, coordinates.lat, coordinates.lng, selectedImage)}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-md hover:from-cyan-300 hover:to-teal-300 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-Scan Coordinates</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Top Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Acoustic Sonar & Marine Debris Studio</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Detecting underwater ghost fishing nets, benthic plastics, and submerged metals where optical visibility fails
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => {
                setActiveImagingMode('sonar');
                const firstSonar = ALL_PRESETS.find((p) => p.mode === 'sonar');
                if (firstSonar) {
                  setSelectedPresetId(firstSonar.id);
                  setSelectedImage(firstSonar.url);
                  setLocationName(firstSonar.locationName);
                  setCoordinates({ lat: firstSonar.lat, lng: firstSonar.lng });
                }
                soundEngine.playUiClick();
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeImagingMode === 'sonar'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Side-Scan Sonar (SSS)</span>
            </button>
            <button
              onClick={() => {
                setActiveImagingMode('optical');
                const firstOpt = ALL_PRESETS.find((p) => p.mode === 'optical');
                if (firstOpt) {
                  setSelectedPresetId(firstOpt.id);
                  setSelectedImage(firstOpt.url);
                  setLocationName(firstOpt.locationName);
                  setCoordinates({ lat: firstOpt.lat, lng: firstOpt.lng });
                }
                soundEngine.playUiClick();
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeImagingMode === 'optical'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Optical Camera (ROV)</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            Upload Scan
          </button>

          <button
            onClick={runDetection}
            disabled={isAnalyzing}
            className={`px-5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
              isAnalyzing
                ? 'bg-cyan-500/40 text-cyan-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 hover:from-cyan-300 hover:to-teal-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running YOLOv8 Model...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Execute DeepScan AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dataset Sample Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-medium tracking-wide uppercase">
            {activeImagingMode === 'sonar'
              ? 'Seabed Acoustic Sonar Datasets (Indian Coastlines & Hotspots)'
              : 'Optical Camera Survey Presets'}
          </span>
          <span className="font-mono text-cyan-400 text-[11px]">
            {activeImagingMode === 'sonar' ? 'Acoustic Frequency: 450-900 kHz' : 'RGB High-Definition'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {currentPresets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedPresetId(preset.id);
                  setSelectedImage(preset.url);
                  setLocationName(preset.locationName);
                  setCoordinates({ lat: preset.lat, lng: preset.lng });
                  setErrorMessage(null);
                  soundEngine.playUiClick();
                  const existing = recentDetections.find(
                    (d) => d.imageUrl === preset.url || d.location?.name === preset.locationName
                  );
                  setAnalysisResult(existing || null);
                }}
                className={`p-3 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'ocean-glass-card border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold text-white truncate">{preset.name}</div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {preset.category} · {preset.locationName.split('(')[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Image & Bounding Box Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="ocean-glass-card rounded-2xl overflow-hidden border border-slate-800 relative">
            
            {/* Viewport Control Bar */}
            <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                {activeImagingMode === 'sonar' ? (
                  <Radio className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Camera className="w-4 h-4 text-cyan-400" />
                )}
                <span className="text-slate-200 font-medium truncate max-w-[180px] sm:max-w-xs">
                  {locationName}
                </span>
                <span className="text-slate-600">·</span>
                <span className="font-mono text-[11px] tabular-nums">
                  {coordinates.lat.toFixed(4)}°N, {coordinates.lng.toFixed(4)}°E
                </span>
              </div>

              {/* OpenCV Preprocessing Filter Selector (Matching Slide 4 & 5) */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono text-slate-400">OpenCV Preprocess:</span>
                <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setOpencvFilter('raw')}
                    className={`px-2 py-0.5 rounded ${
                      opencvFilter === 'raw' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Raw
                  </button>
                  <button
                    onClick={() => setOpencvFilter('clahe')}
                    className={`px-2 py-0.5 rounded ${
                      opencvFilter === 'clahe' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                    title="Contrast-Limited Adaptive Histogram Equalization"
                  >
                    CLAHE
                  </button>
                  <button
                    onClick={() => setOpencvFilter('shadow')}
                    className={`px-2 py-0.5 rounded ${
                      opencvFilter === 'shadow' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                    title="Acoustic Shadow Contrast Enhancement"
                  >
                    Shadow
                  </button>
                </div>

                <button
                  onClick={() => setShowBoxes(!showBoxes)}
                  className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors ${
                    showBoxes
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Boxes</span>
                </button>
              </div>
            </div>

            {/* Canvas Viewport with Applied OpenCV Filter Simulation */}
            <div className="relative aspect-[16/10] bg-slate-950 flex items-center justify-center overflow-hidden select-none">
              <img
                src={selectedImage}
                alt={locationName}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-all duration-300 ${
                  activeImagingMode === 'sonar'
                    ? opencvFilter === 'clahe'
                      ? 'contrast-150 brightness-110 saturate-0'
                      : opencvFilter === 'shadow'
                      ? 'contrast-200 brightness-95 grayscale'
                      : 'contrast-110 saturate-50'
                    : ''
                }`}
              />

              {/* Sonar Acoustic Grid Overlay */}
              {activeImagingMode === 'sonar' && (
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-cyan-950/10 to-slate-950/40 border border-cyan-500/20">
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-cyan-400/80 bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                    SSS 450 kHz · Slant-Range Corrected
                  </div>
                </div>
              )}

              {/* Dynamic Bounding Box Overlays */}
              {showBoxes &&
                analysisResult?.detectedObjects?.map((obj) => {
                  const [ymin, xmin, ymax, xmax] = obj.box_2d;
                  const top = `${(ymin / 1000) * 100}%`;
                  const left = `${(xmin / 1000) * 100}%`;
                  const width = `${((xmax - xmin) / 1000) * 100}%`;
                  const height = `${((ymax - ymin) / 1000) * 100}%`;

                  const color = getCategoryColor(obj.category);
                  const isHovered = hoveredBoxId === obj.id;

                  return (
                    <div
                      key={obj.id}
                      onMouseEnter={() => setHoveredBoxId(obj.id)}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      style={{ top, left, width, height }}
                      className={`absolute border-2 ${color.border} ${
                        isHovered ? 'bg-cyan-400/25 z-10 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : color.bg
                      } transition-all cursor-pointer`}
                    >
                      <div
                        className={`absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide whitespace-nowrap bg-slate-950/90 ${color.text} border border-current shadow-md`}
                      >
                        {obj.label} · {(obj.confidence * 100).toFixed(0)}%
                        {obj.acousticShadowScore && ` · Shdw ${(obj.acousticShadowScore * 100).toFixed(0)}%`}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer Summary Bar */}
            <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">
                {analysisResult?.detectedObjects?.length || 0} Targets Identified · YOLOv8 Inference
              </span>
              <span className="text-slate-500 text-[11px]">
                {activeImagingMode === 'sonar'
                  ? 'Acoustic Backscatter & Shadow Segmentation'
                  : 'RGB Optical Inspection Pipeline'}
              </span>
            </div>
          </div>

          {/* Detected Objects List (Matching Categories from Slides: Fishing Net, Plastic, Metal) */}
          <div className="ocean-glass-card rounded-2xl p-5 border border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center justify-between">
              <span>Detected Targets & Acoustic Profile</span>
              <span className="text-xs font-mono text-slate-400 font-normal">
                Class Confidence & Material
              </span>
            </h2>

            {analysisResult?.detectedObjects && analysisResult.detectedObjects.length > 0 ? (
              <div className="space-y-2">
                {analysisResult.detectedObjects.map((item: DetectedItem) => {
                  const color = getCategoryColor(item.category);
                  const isHovered = hoveredBoxId === item.id;
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredBoxId(item.id)}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                        isHovered
                          ? 'bg-slate-800/80 border-cyan-400/60'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${color.border.replace('border-', 'bg-')}`} />
                        <div>
                          <div className="text-xs font-semibold text-white">{item.label}</div>
                          <div className="text-[11px] text-slate-400">
                            {item.material} · Est. {item.estimatedWeightKg} kg
                            {item.acousticShadowScore && (
                              <span className="ml-2 text-cyan-300 font-mono">
                                (Shadow Profile: {(item.acousticShadowScore * 100).toFixed(0)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-medium text-cyan-300 tabular-nums">
                          {(item.confidence * 100).toFixed(1)}% conf
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">{item.category}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Zero synthetic debris or ghost gear detected. Acoustic backscatter within nominal baseline.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Severity, Cleanup Plan, & Degradation Timeline (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {!analysisResult ? (
            <div className="ocean-glass-card rounded-2xl p-7 border border-cyan-500/30 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Image Loaded & Ready for AI Scan</h3>
                <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Click below to execute YOLOv8 and Gemini vision analysis. DeepScan AI will detect marine debris, calculate pollution index, and compute recovery protocols.
                </p>
              </div>
              <button
                onClick={runDetection}
                disabled={isAnalyzing}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Image...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Execute DeepScan AI on this Image</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              {/* Pollution Severity Score Card */}
              <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Pollution Severity Analysis
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-md border font-semibold ${getSeverityStyle(
                      analysisResult?.pollutionSeverity?.level || 'Low'
                    )}`}
                  >
                    {analysisResult?.pollutionSeverity?.level || 'Low'} Severity
                  </span>
                </div>

                {/* Score display */}
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-4xl font-extrabold font-mono text-white tabular-nums">
                    {analysisResult?.pollutionSeverity?.score ?? 10}
                  </span>
                  <span className="text-sm text-slate-400 font-mono">/ 100 Pollution Index</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mb-4 border border-slate-800">
                  <div
                    className={`h-full transition-all duration-700 ${
                      (analysisResult?.pollutionSeverity?.score ?? 0) >= 75
                        ? 'bg-rose-500'
                        : (analysisResult?.pollutionSeverity?.score ?? 0) >= 50
                        ? 'bg-amber-400'
                        : 'bg-cyan-400'
                    }`}
                    style={{ width: `${analysisResult?.pollutionSeverity?.score ?? 10}%` }}
                  />
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
                  {analysisResult?.pollutionSeverity?.reasoning ||
                    'Baseline clean oceanic sample. Zero synthetic targets detected across seabed scan.'}
                </p>
              </div>

              {/* Interactive Polymer Degradation Timeline */}
              <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Environmental Lifespan & Degradation</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-300 font-bold">
                    {analysisResult?.marineEcosystemImpact?.degradationTimeEstimate || '450+ Years'}
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Degradation trajectory for synthetic polymers and fishing nets in marine seawater:
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center justify-between font-semibold text-rose-300 text-[11px]">
                      <span>Stage 1 (0 - 5 Years): Macro-Entanglement</span>
                      <span>Active Lethal Phase</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Intact ghost gillnets and rigid plastics continuously trap pelagic fish, dolphins, and turtles.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center justify-between font-semibold text-amber-300 text-[11px]">
                      <span>Stage 2 (5 - 50 Years): Photo-Oxidation</span>
                      <span>Embrittlement</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Solar UV radiation and wave turbulence shatter polymers into jagged brittle fragments.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center justify-between font-semibold text-cyan-300 text-[11px]">
                      <span>Stage 3 (50 - 200+ Years): Microplastics</span>
                      <span>Trophic Toxicity</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Fragmentation into particles &lt;5mm ingested by zooplankton, entering commercial fish stock.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cleanup Priority & Logistics Recommendation */}
              <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <span>Maritime Intervention Protocol</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-300">
                    {analysisResult?.cleanupPriority?.priority || 'Routine'}
                  </span>
                </div>

                <div className="text-xs space-y-3">
                  <div className="flex items-start justify-between py-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Response Window:</span>
                    <span className="text-white font-medium">
                      {analysisResult?.cleanupPriority?.timeframe || 'Standard patrol'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1.5">Recommended Equipment:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(analysisResult?.cleanupPriority?.equipmentRecommended) ? (
                        analysisResult.cleanupPriority.equipmentRecommended.map((eq, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px]"
                          >
                            {eq}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px]">
                          {analysisResult?.cleanupPriority?.equipmentRecommended || 'Autonomous surface interceptor'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-slate-400 block mb-1">Operational Action Plan:</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      {analysisResult?.cleanupPriority?.actionPlan ||
                        'Maintain periodic automated acoustic sweeps to monitor seasonal debris accumulation.'}
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setIsDossierModalOpen(true)}
                    className="text-xs px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold hover:from-cyan-400 hover:to-teal-300 flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open Dispatch Dossier</span>
                  </button>

                  <button
                    onClick={() => setIsResultsModalOpen(true)}
                    className="text-xs px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-all"
                    title="View full results breakdown"
                  >
                    <span>View Report</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Official Maritime Incident Dispatch Dossier Modal (Printable for HackIndia) */}
      {isDossierModalOpen && analysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Dossier Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-[10px] font-mono font-bold">
                    DeepScan AI · Maritime Incident Response Division
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  Maritime Environmental Incident Dispatch Dossier
                </h2>
                <p className="text-xs font-mono text-cyan-400 mt-0.5">
                  Report ID: {analysisResult.id} · Timestamp: {new Date(analysisResult.timestamp).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setIsDossierModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Incident Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="font-semibold text-white truncate block">{analysisResult.location.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">GPS Coordinates</span>
                <span className="font-mono text-cyan-300">
                  {analysisResult.location.latitude.toFixed(4)}°N, {analysisResult.location.longitude.toFixed(4)}°E
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Pollution Index</span>
                <span className={`font-mono font-bold ${
                  analysisResult.pollutionSeverity.score >= 70 ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {analysisResult.pollutionSeverity.score} / 100 ({analysisResult.pollutionSeverity.level})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Action Window</span>
                <span className="font-medium text-white">{analysisResult.cleanupPriority.timeframe}</span>
              </div>
            </div>

            {/* Target Inventory Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Identified Debris Inventory (YOLOv8 & OpenCV)
              </h4>
              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 text-[11px]">
                    <tr>
                      <th className="p-2.5">Label</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Confidence</th>
                      <th className="p-2.5">Est. Weight</th>
                      <th className="p-2.5">Material</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                    {analysisResult.detectedObjects.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 font-medium text-white">{item.label}</td>
                        <td className="p-2.5 text-cyan-300">{item.category}</td>
                        <td className="p-2.5 font-mono">{(item.confidence * 100).toFixed(0)}%</td>
                        <td className="p-2.5 font-mono">{item.estimatedWeightKg} kg</td>
                        <td className="p-2.5 text-slate-400 text-[11px]">{item.material}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommended Equipment & Protocol */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-200">
                <span>Intervention Protocol:</span>
                <span className="text-cyan-400 font-mono">{analysisResult.cleanupPriority.priority}</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {analysisResult.cleanupPriority.actionPlan}
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5">
                {analysisResult.cleanupPriority.equipmentRecommended.map((eq, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-cyan-800/60 text-[10px]"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Print / Save PDF Dossier</span>
              </button>

              <button
                onClick={() => setIsDossierModalOpen(false)}
                className="px-5 py-2 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Instant Vision Detection Results Modal (Opens automatically upon scan execution) */}
      {isResultsModalOpen && analysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">AI Vision Analysis Complete</h2>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-semibold">
                      {activeImagingMode === 'sonar' ? 'Acoustic Sonar' : 'Optical RGB'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {locationName} · {coordinates.lat.toFixed(4)}°N, {coordinates.lng.toFixed(4)}°E
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsResultsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">Debris Found</span>
                <span className="text-xl font-bold font-mono text-cyan-300">
                  {analysisResult.detectedObjects?.length || 0} {(analysisResult.detectedObjects?.length || 0) === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">Pollution Score</span>
                <span className={`text-xl font-bold font-mono ${
                  analysisResult.pollutionSeverity?.level === 'Severe'
                    ? 'text-rose-400'
                    : analysisResult.pollutionSeverity?.level === 'High'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {analysisResult.pollutionSeverity?.score ?? 0}/100
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">Total Dry Mass</span>
                <span className="text-xl font-bold font-mono text-white">
                  {(analysisResult.detectedObjects || []).reduce((acc, o) => acc + (o.estimatedWeightKg || 0), 0).toFixed(1)} kg
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">Action Urgency</span>
                <span className="text-sm font-bold text-cyan-400 truncate block mt-0.5">
                  {analysisResult.cleanupPriority?.priority || 'Routine'}
                </span>
              </div>
            </div>

            {/* Forensic Object Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Identified Marine Debris Items
              </span>
              {analysisResult.detectedObjects && analysisResult.detectedObjects.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {analysisResult.detectedObjects.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{item.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.material} · Est. {item.estimatedWeightKg} kg
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono font-medium">
                          {(item.confidence * 100).toFixed(0)}% confidence
                        </span>
                        <div className="text-[10px] text-slate-500 uppercase mt-0.5">{item.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                  Clean baseline seabed — zero synthetic debris or fishing gear detected.
                </div>
              )}
            </div>

            {/* Ecological Impact & Plan */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Degradation Lifespan:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {analysisResult.marineEcosystemImpact?.degradationTimeEstimate || 'N/A'}
                </span>
              </div>
              <div className="text-slate-300 leading-relaxed text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <strong className="text-white block mb-0.5">Intervention Action Plan:</strong>
                {analysisResult.cleanupPriority?.actionPlan || 'Nominal baseline monitoring.'}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsResultsModalOpen(false);
                    setIsDossierModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Full Dispatch Dossier</span>
                </button>
                {onNavigateToArchive && (
                  <button
                    onClick={() => {
                      setIsResultsModalOpen(false);
                      onNavigateToArchive();
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <span>View in Records & Analytics</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsResultsModalOpen(false)}
                className="px-5 py-2 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                Inspect on Interactive Canvas
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
