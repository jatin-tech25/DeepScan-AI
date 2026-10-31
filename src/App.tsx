import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { DetectionStudio } from './components/DetectionStudio';
import { OceanMap } from './components/OceanMap';
import { HardwareTelemetryView } from './components/HardwareTelemetry';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { EducationalSection } from './components/EducationalSection';
import { GroundedOceanIntel } from './components/GroundedOceanIntel';
import { Footer } from './components/Footer';
import { FloatingChatbot } from './components/FloatingChatbot';
import { SoundSettingsModal } from './components/SoundSettingsModal';
import { DetectionRecord, HardwareTelemetry } from './types';
import { soundEngine } from './services/soundEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'detection' | 'map' | 'hardware' | 'analytics'>('home');
  const [isSoundModalOpen, setIsSoundModalOpen] = useState<boolean>(false);
  const [detections, setDetections] = useState<DetectionRecord[]>([]);
  const [hardware, setHardware] = useState<HardwareTelemetry | null>(null);
  const [isTogglingHardware, setIsTogglingHardware] = useState<boolean>(false);
  const [targetScanLocation, setTargetScanLocation] = useState<{
    locationName: string;
    lat: number;
    lng: number;
    autoScan?: boolean;
    scanId?: number;
  } | null>(null);

  // Tab switch with UI acoustic feedback
  const handleTabSwitch = (tab: 'home' | 'detection' | 'map' | 'hardware' | 'analytics') => {
    soundEngine.playUiClick();
    setActiveTab(tab);
  };

  // Fetch initial history and hardware state from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [histRes, sensRes] = await Promise.all([
          fetch('/api/history'),
          fetch('/api/sensors'),
        ]);

        if (histRes.ok) {
          const histData = await histRes.json();
          if (histData.data) setDetections(histData.data);
        }

        if (sensRes.ok) {
          const sensData = await sensRes.json();
          if (sensData.data) setHardware(sensData.data);
        }
      } catch (err) {
        console.error('Failed to fetch initial telemetry/history:', err);
      }
    };

    fetchData();

    // Poll hardware telemetry every 6 seconds to update live dials
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/sensors');
        if (res.ok) {
          const sensData = await res.json();
          if (sensData.data) setHardware(sensData.data);
        }
      } catch {
        // Ignore polling error
      }
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Hardware connection toggle handler
  const handleToggleHardware = async () => {
    setIsTogglingHardware(true);
    try {
      const next = !hardware?.connected;
      const res = await fetch('/api/sensors/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connected: next }),
      });

      if (res.ok) {
        const data = await res.json();
        setHardware((prev) => (prev ? { ...prev, connected: data.connected } : null));
        if (data.connected) {
          soundEngine.playSuccessSound();
        } else {
          soundEngine.playCriticalWarningAlert();
        }
      }
    } catch (err) {
      console.error('Failed to toggle hardware:', err);
    } finally {
      setIsTogglingHardware(false);
    }
  };

  // Add new detection from detection studio into state
  const handleDetectionAdded = (newRecord: DetectionRecord) => {
    setDetections((prev) => [newRecord, ...prev]);
  };

  // Delete observation
  const handleDeleteDetection = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDetections((prev) => prev.filter((d) => d.id !== id));
        soundEngine.playNotificationSound();
      }
    } catch (err) {
      console.error('Failed to delete detection record:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white relative">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabSwitch}
        onOpenSoundModal={() => {
          soundEngine.playUiClick();
          setIsSoundModalOpen(true);
        }}
        hardwareConnected={hardware?.connected ?? false}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {activeTab === 'home' && (
          <div className="space-y-16">
            <HeroSection
              onStartDetection={() => handleTabSwitch('detection')}
              onExploreDashboard={() => handleTabSwitch('analytics')}
              onOpenHardware={() => handleTabSwitch('hardware')}
              detections={detections}
            />

            {/* Google Search & Maps Grounded Ocean Intelligence */}
            <GroundedOceanIntel />

            {/* Educational Section directly accessible on homepage */}
            <EducationalSection />
          </div>
        )}

        {activeTab === 'detection' && (
          <DetectionStudio
            onDetectionAdded={handleDetectionAdded}
            recentDetections={detections}
            targetScanLocation={targetScanLocation}
          />
        )}

        {activeTab === 'map' && (
          <OceanMap
            detections={detections}
            hardware={hardware}
            onSelectDetection={() => {}}
            onScanLocation={(locationName, lat, lng) => {
              setTargetScanLocation({
                locationName,
                lat,
                lng,
                autoScan: true,
                scanId: Date.now(),
              });
              handleTabSwitch('detection');
            }}
          />
        )}

        {activeTab === 'hardware' && (
          <HardwareTelemetryView
            telemetry={hardware}
            onToggleConnection={handleToggleHardware}
            isToggling={isTogglingHardware}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-12">
            <AnalyticsDashboard
              detections={detections}
              hardware={hardware}
              onSelectDetection={() => handleTabSwitch('detection')}
              onDeleteDetection={handleDeleteDetection}
              onNavigateToScan={() => handleTabSwitch('detection')}
            />

            {/* Grounded Ocean Intelligence tool in Analytics */}
            <GroundedOceanIntel />
          </div>
        )}
      </main>

      {/* Global Floating Multilingual Chatbot (Persistent across all views) */}
      <FloatingChatbot />

      {/* Sound Settings Modal */}
      <SoundSettingsModal
        isOpen={isSoundModalOpen}
        onClose={() => setIsSoundModalOpen(false)}
      />

      {/* Footer */}
      <Footer
        setActiveTab={handleTabSwitch}
        onOpenSoundModal={() => setIsSoundModalOpen(true)}
      />
    </div>
  );
}
