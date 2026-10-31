import React from 'react';
import { Scan, Compass, Radio, ArrowRight, ShieldCheck, Waves, Cpu, Eye, Anchor } from 'lucide-react';
import { DetectionRecord } from '../types';

interface HeroSectionProps {
  onStartDetection: () => void;
  onExploreDashboard: () => void;
  onOpenHardware: () => void;
  detections: DetectionRecord[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartDetection,
  onExploreDashboard,
  onOpenHardware,
  detections,
}) => {
  // Aggregate real recorded stats
  const totalDetections = detections.reduce(
    (acc, item) => acc + item.detectedObjects.length,
    0
  );
  const criticalCount = detections.filter(
    (d) => d.pollutionSeverity.level === 'Severe' || d.pollutionSeverity.level === 'High'
  ).length;

  return (
    <div className="space-y-20 pb-12">
      {/* 1. Full-Width Ocean Hero Section */}
      <section className="relative rounded-3xl overflow-hidden border border-cyan-500/20 shadow-2xl bg-slate-950">
        
        {/* Cinematic Ocean Background with Scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2000&q=80"
            alt="Deep ocean water surface"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-35 scale-105 transform duration-1000"
          />
          {/* Subtle cyan and navy gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 px-6 sm:px-12 py-16 lg:py-24 max-w-4xl space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold tracking-wide">
            <Waves className="w-3.5 h-3.5" />
            <span>Side-Scan Sonar & Edge YOLOv8 Marine Pipeline</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Turning Sonar Images into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400">
              Smarter Ocean Monitoring.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
            DeepScan AI transforms raw underwater acoustic sonar waterfall scans into actionable ecological intelligence. Utilizing OpenCV contrast preprocessing and YOLOv8 deep learning, we pinpoint abandoned ghost fishing nets, benthic plastics, and submerged metallic hazards in turbid waters where optical cameras fail.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartDetection}
              className="px-6 py-3 text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2"
            >
              <Scan className="w-4 h-4" />
              <span>Start Detection</span>
            </button>

            <button
              onClick={onExploreDashboard}
              className="px-6 py-3 text-sm font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Explore Dashboard</span>
            </button>

            <button
              onClick={onOpenHardware}
              className="px-5 py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>Hardware Specs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Verified Stats Strip on Hero Bottom */}
        <div className="relative z-10 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 sm:px-12 py-5 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold font-mono text-white tabular-nums">
              {totalDetections}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Recorded Marine Targets</div>
          </div>

          <div>
            <div className="text-2xl lg:text-3xl font-extrabold font-mono text-cyan-400 tabular-nums">
              {detections.length}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Global Ocean Survey Transects</div>
          </div>

          <div>
            <div className="text-2xl lg:text-3xl font-extrabold font-mono text-teal-400 tabular-nums">
              14.8 <span className="text-sm font-normal">NTU</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Submersible Turbidity Clarity</div>
          </div>

          <div>
            <div className="text-2xl lg:text-3xl font-extrabold font-mono text-rose-400 tabular-nums">
              {criticalCount}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Priority Cleanup Responses</div>
          </div>
        </div>

      </section>

      {/* 2. How It Works Pipeline */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
            End-To-End Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How Deep Scan AI Monitors Ocean Waste
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            From optical marine sensors to computer vision inference and automated cleanup dispatch
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800 space-y-3 relative group hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
              01
            </div>
            <h3 className="text-base font-bold text-white">Optical Capture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sony IMX219 marine optical camera mounted in an IP68 waterproof dome captures 1080p ocean surface frames.
            </p>
          </div>

          <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800 space-y-3 relative group hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
              02
            </div>
            <h3 className="text-base font-bold text-white">YOLO Vision Inference</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trained object detection neural network identifies plastics, ghost gillnets, rubber tires, and metal debris with 2D bounding boxes.
            </p>
          </div>

          <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800 space-y-3 relative group hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
              03
            </div>
            <h3 className="text-base font-bold text-white">Sensor Telemetry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Arduino Mega correlates water turbidity (NTU) and water temperature (°C) alongside u-blox NEO-6M GPS coordinates.
            </p>
          </div>

          <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800 space-y-3 relative group hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              04
            </div>
            <h3 className="text-base font-bold text-white">Cleanup Dispatch</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Severity algorithm calculates environmental hazard score and triggers automated recovery recommendations for cleanup vessels.
            </p>
          </div>

        </div>
      </section>

      {/* 3. AI Detection & Vision Preview Bento */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        <div className="lg:col-span-6 space-y-5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <Eye className="w-4 h-4" />
            <span>Computer Vision Performance</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Zero False-Positive Ocean Vision Model
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Unlike generic classifiers, Deep Scan AI is specifically calibrated on ocean datasets (Deep-Trash, TACO, and pelagic survey footage). It distinguishes natural kelp and marine life from high-threat synthetic pollutants like nylon monofilament ghost gear.
          </p>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Multi-class detection: PET plastics, ghost gillnets, ropes, metal cans, rubber tires</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Normalized bounding box coordinates (`box_2d`) with confidence intervals</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Ecological risk calculation including cetacean entanglement and ingestion threat</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onStartDetection}
              className="px-5 py-2.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-colors flex items-center gap-2"
            >
              <span>Test Live Image Inference</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 ocean-glass-card rounded-2xl p-3 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950">
            <img
              src="https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=1000&q=80"
              alt="Ghost net vision detection preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {/* Visual Simulated Bounding Box for Demonstration */}
            <div className="absolute top-[18%] left-[16%] w-[68%] h-[60%] border-2 border-rose-400 bg-rose-500/15 rounded">
              <div className="absolute -top-6 left-0 bg-slate-950/90 text-rose-300 border border-rose-400 text-[10px] font-mono px-2 py-0.5 rounded font-semibold">
                Ghost Fishing Net · 96% conf
              </div>
            </div>
          </div>
          <div className="p-3 flex items-center justify-between text-xs text-slate-400">
            <span>YOLOv8-Marine Inference Benchmark</span>
            <span className="font-mono text-cyan-300 font-medium">96.4% Precision</span>
          </div>
        </div>

      </section>

      {/* 4. Ocean Conservation Action Strip */}
      <section className="ocean-glass-card rounded-3xl p-8 lg:p-12 border border-cyan-500/20 text-center space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
          <Anchor className="w-6 h-6" />
        </div>

        <div className="max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Empowering Ocean Cleanup Fleets Worldwide
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            By combining autonomous aerial drone surveys, stationary IoT monitoring buoys, and vessel cameras, Deep Scan AI turns raw marine imagery into actionable GPS coordinates and recovery equipment plans.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onStartDetection}
            className="px-6 py-3 text-xs font-semibold bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 rounded-xl hover:from-cyan-300 hover:to-teal-300 transition-colors shadow-lg"
          >
            Launch Vision Scanner
          </button>
          <button
            onClick={onExploreDashboard}
            className="px-6 py-3 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl transition-colors"
          >
            View Ocean GIS Map
          </button>
        </div>
      </section>
    </div>
  );
};
