import React from 'react';
import { BookOpen, ShieldAlert, Waves, CheckCircle2, AlertOctagon, HeartHandshake } from 'lucide-react';

export const EducationalSection: React.FC = () => {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
          Environmental Science & Impact
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Marine Debris Science & Ocean Conservation
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Understanding the lifespans, ecological impacts, and cleanup strategies for oceanic waste
        </p>
      </div>

      {/* 3 Core Educational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Ghost Fishing Gear */}
        <div className="ocean-glass-card rounded-2xl overflow-hidden border border-slate-800 flex flex-col">
          <div className="aspect-video w-full bg-slate-950 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80"
              alt="Marine ecosystem underwater with coral"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-mono text-rose-400 font-semibold uppercase">
                Highest Lethality Hazard
              </span>
              <h3 className="text-base font-bold text-white mt-1">Ghost Fishing Gear</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                Abandoned, lost, or discarded commercial gillnets drift unchecked through pelagic zones for decades, trapping whales, dolphins, sea turtles, and pelagic fish in an endless cycle of mortality.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Lifetime: 600+ Years</span>
              <span className="text-rose-300 font-medium">Critical Response</span>
            </div>
          </div>
        </div>

        {/* Card 2: Plastic Ocean Gyres */}
        <div className="ocean-glass-card rounded-2xl overflow-hidden border border-slate-800 flex flex-col">
          <div className="aspect-video w-full bg-slate-950 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=800&q=80"
              alt="Floating ocean plastic debris"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                Subtropical Convergence
              </span>
              <h3 className="text-base font-bold text-white mt-1">Oceanic Garbage Gyres</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                Atmospheric trade winds and oceanic currents concentrate floating plastics into five major gyres. Sun exposure and wave action break bottles and packaging into toxic microplastics that enter the marine food chain.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Lifetime: 450+ Years</span>
              <span className="text-cyan-300 font-medium">Containment Booms</span>
            </div>
          </div>
        </div>

        {/* Card 3: Chemical & Rubber Leaching */}
        <div className="ocean-glass-card rounded-2xl overflow-hidden border border-slate-800 flex flex-col">
          <div className="aspect-video w-full bg-slate-950 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=800&q=80"
              alt="Coastal ocean pollution and waste"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-mono text-amber-400 font-semibold uppercase">
                Benthic Habitat Threat
              </span>
              <h3 className="text-base font-bold text-white mt-1">Rubber Tires & Heavy Debris</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                Discarded vehicle tires and synthetic rubber release zinc, heavy metals, and 6PPD-quinone into seagrass beds and coral reefs, stunting coral polyp reproduction and killing benthic marine life.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Lifetime: Indefinite</span>
              <span className="text-amber-300 font-medium">Lift-Bag Extraction</span>
            </div>
          </div>
        </div>

      </div>

      {/* Ocean Cleanup & Protection Matrix */}
      <div className="ocean-glass-card rounded-2xl p-6 lg:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center gap-2.5">
          <HeartHandshake className="w-5 h-5 text-teal-400" />
          <h3 className="text-lg font-bold text-white">Recommended Marine Recovery Best Practices</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
          <div className="space-y-3">
            <div className="font-semibold text-white text-sm">1. Target Identification & Verification</div>
            <p className="leading-relaxed">
              Always correlate visual optical detections with turbidity readings. High turbidity combined with geometric edge contours indicates fresh synthetic waste run-off that should be intercepted prior to dispersal into deep waters.
            </p>
            <div className="font-semibold text-white text-sm pt-2">2. Gentle Lift-Bag Deployment</div>
            <p className="leading-relaxed">
              For heavy rubber or metal debris resting on sensitive coral reefs, never drag recovery grapples across the ocean floor. Scuba retrieval crews should use pneumatic lift bags to hoist debris vertically.
            </p>
          </div>

          <div className="space-y-3">
            <div className="font-semibold text-white text-sm">3. Marine Life De-tangling Protocols</div>
            <p className="leading-relaxed">
              When encountering active ghost gillnets, inspect immediately for entangled marine life (sea turtles, rays, small sharks). Use blunt-nosed emergency shears to release living organisms before winch retrieval.
            </p>
            <div className="font-semibold text-white text-sm pt-2">4. Responsible Shore Disposal & Upcycling</div>
            <p className="leading-relaxed">
              Retrieved ocean plastic and nylon netting should be cataloged into the Deep Scan database and delivered to certified circular recyclers to be converted into industrial recycled polymers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
