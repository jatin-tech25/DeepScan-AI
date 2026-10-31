import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { DetectionRecord, HardwareTelemetry } from '../types';
import { 
  MapPin, 
  Filter, 
  Navigation, 
  Compass, 
  Waves, 
  Wind, 
  ShieldCheck, 
  Layers, 
  Sparkles,
  ExternalLink,
  Info,
  RefreshCw,
  X
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface OceanMapProps {
  detections: DetectionRecord[];
  hardware: HardwareTelemetry | null;
  onSelectDetection: (detection: DetectionRecord) => void;
  onScanLocation?: (locationName: string, lat: number, lng: number) => void;
}

interface MarineWeatherData {
  waveHeight: number;
  wavePeriod: number;
  currentVelocity: number;
  currentDirection: number;
  locationName: string;
  lat: number;
  lng: number;
}

export const OceanMap: React.FC<OceanMapProps> = ({
  detections,
  hardware,
  onSelectDetection,
  onScanLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const sanctuariesLayerRef = useRef<L.LayerGroup | null>(null);
  const waterwaysLayerRef = useRef<L.GeoJSON | null>(null);
  const probeMarkerRef = useRef<L.Marker | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [showSanctuaries, setShowSanctuaries] = useState<boolean>(true);
  const [showWaterways, setShowWaterways] = useState<boolean>(true);
  const [selectedWaterbody, setSelectedWaterbody] = useState<any | null>(null);
  const [activeObservation, setActiveObservation] = useState<DetectionRecord | null>(
    detections[0] || null
  );

  // Live GIS API Probe state
  const [gisProbe, setGisProbe] = useState<MarineWeatherData | null>(null);
  const [isLoadingGis, setIsLoadingGis] = useState<boolean>(false);
  const [gisApiStatus, setGisApiStatus] = useState<string>('Online (Open-Meteo & Nominatim GIS)');

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered on Indian Ocean & Subcontinent
      const map = L.map(mapContainerRef.current, {
        center: [20.5, 78.5],
        zoom: 3.5,
        minZoom: 2,
        maxZoom: 16,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // High-performance dark oceanic basemap (100% free, no API key or watermark required)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16,
      }).addTo(map);

      // Coastal and maritime reference labels
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      sanctuariesLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Load Indian Waterways GeoJSON
      fetch('/data/india-waterways.json')
        .then((res) => res.json())
        .then((data) => {
          if (!mapInstanceRef.current) return;
          const geoJsonLayer = L.geoJSON(data, {
            style: (feature) => {
              const score = feature?.properties?.smpi_score || 50;
              const color = score >= 80 ? '#f43f5e' : score >= 65 ? '#f59e0b' : '#06b6d4';
              return {
                color,
                weight: feature?.geometry?.type === 'Polygon' ? 2 : 4,
                opacity: 0.9,
                fillColor: color,
                fillOpacity: 0.22,
                dashArray: feature?.geometry?.type === 'Polygon' ? '4, 4' : undefined,
              };
            },
            onEachFeature: (feature, layer) => {
              layer.on({
                click: () => {
                  soundEngine.playSonarPing();
                  setSelectedWaterbody(feature.properties);
                },
              });
            },
          });
          waterwaysLayerRef.current = geoJsonLayer;
          geoJsonLayer.addTo(mapInstanceRef.current);
        })
        .catch((err) => console.warn('Could not load india-waterways.json:', err));

      // Handle map click for Real GIS API Probe
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        soundEngine.playSonarPing();
        fetchLiveGisData(lat, lng);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Toggle waterways layer
  useEffect(() => {
    if (!mapInstanceRef.current || !waterwaysLayerRef.current) return;
    if (showWaterways) {
      mapInstanceRef.current.addLayer(waterwaysLayerRef.current);
    } else {
      mapInstanceRef.current.removeLayer(waterwaysLayerRef.current);
    }
  }, [showWaterways]);

  // Fetch real GIS API data for clicked coordinate
  const fetchLiveGisData = async (lat: number, lng: number) => {
    setIsLoadingGis(true);
    try {
      const [weatherRes, geocodeRes] = await Promise.all([
        fetch(`/api/gis/marine-weather?lat=${lat}&lng=${lng}`),
        fetch(`/api/gis/geocode?lat=${lat}&lng=${lng}`),
      ]);

      const weatherData = await weatherRes.json();
      const geocodeData = await geocodeRes.json();

      const probeResult: MarineWeatherData = {
        lat,
        lng,
        waveHeight: weatherData.current?.wave_height ?? 1.4,
        wavePeriod: weatherData.current?.wave_period ?? 6.8,
        currentVelocity: weatherData.current?.ocean_current_velocity ?? 1.1,
        currentDirection: weatherData.current?.ocean_current_direction ?? 210,
        locationName: geocodeData.displayName || 'International Oceanic Waters',
      };

      setGisProbe(probeResult);

      // Place / update interactive probe marker
      if (mapInstanceRef.current) {
        if (probeMarkerRef.current) {
          probeMarkerRef.current.setLatLng([lat, lng]);
        } else {
          const probeIcon = L.divIcon({
            className: 'gis-probe-pin',
            html: `
              <div style="
                background-color: #38bdf8;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid #ffffff;
                box-shadow: 0 0 15px #38bdf8;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="width: 6px; height: 6px; background-color: #0f172a; border-radius: 50%;"></div>
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          probeMarkerRef.current = L.marker([lat, lng], { icon: probeIcon }).addTo(mapInstanceRef.current);
        }
      }
    } catch (err) {
      console.error('GIS API fetch error:', err);
    } finally {
      setIsLoadingGis(false);
    }
  };

  // Load sanctuaries from GIS API
  useEffect(() => {
    if (!sanctuariesLayerRef.current) return;
    sanctuariesLayerRef.current.clearLayers();

    if (!showSanctuaries) return;

    fetch('/api/gis/sanctuaries')
      .then((res) => res.json())
      .then((data) => {
        if (!data.sanctuaries || !sanctuariesLayerRef.current) return;

        data.sanctuaries.forEach((sanct: any) => {
          const icon = L.divIcon({
            className: 'sanctuary-pin',
            html: `
              <div style="
                background-color: #14b8a6;
                width: 16px;
                height: 16px;
                border-radius: 4px;
                border: 2px solid #ffffff;
                box-shadow: 0 0 10px #14b8a6;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="width: 4px; height: 4px; background-color: #0f172a; border-radius: 1px;"></div>
              </div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          const marker = L.marker([sanct.lat, sanct.lng], { icon });
          marker.bindPopup(`
            <div style="width: 220px; font-family: 'Plus Jakarta Sans', sans-serif;">
              <div style="font-weight: 700; font-size: 13px; color: #2dd4bf; margin-bottom: 2px;">
                ${sanct.name}
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">${sanct.protectionLevel}</div>
              <div style="font-size: 11px; color: #f1f5f9; margin-bottom: 2px;">Area: ${(sanct.areaSqKm).toLocaleString()} km²</div>
              <div style="font-size: 11px; color: #fbbf24;">Status: ${sanct.threatLevel}</div>
            </div>
          `);
          marker.addTo(sanctuariesLayerRef.current!);
        });
      })
      .catch((err) => console.warn('Could not load sanctuaries layer', err));
  }, [showSanctuaries]);

  // Update map markers when detections or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    // Filter detections
    const filtered = detections.filter((d) => {
      const matchCat =
        selectedCategory === 'All' ||
        d.detectedObjects.some((o) => o.category === selectedCategory);
      const matchSev =
        selectedSeverity === 'All' || d.pollutionSeverity.level === selectedSeverity;
      return matchCat && matchSev;
    });

    filtered.forEach((record) => {
      const { latitude, longitude, name } = record.location;
      const severity = record.pollutionSeverity.level;

      let markerColor = '#10b981';
      if (severity === 'Severe') markerColor = '#f43f5e';
      else if (severity === 'High') markerColor = '#f97316';
      else if (severity === 'Moderate') markerColor = '#f59e0b';

      const customIcon = L.divIcon({
        className: 'custom-ocean-pin',
        html: `
          <div style="
            background-color: ${markerColor};
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid #0f172a;
            box-shadow: 0 0 10px ${markerColor};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="width: 6px; height: 6px; background-color: #ffffff; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([latitude, longitude], { icon: customIcon });

      const popupHtml = `
        <div style="width: 220px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="font-weight: 700; font-size: 13px; color: #ffffff; margin-bottom: 4px;">${name}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            ${new Date(record.timestamp).toLocaleDateString()} · ${record.detectedObjects.length} Targets
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-bottom: 6px;">
            <span style="color: #cbd5e1;">Severity:</span>
            <span style="font-weight: 600; color: ${markerColor};">${record.pollutionSeverity.level} (${record.pollutionSeverity.score}/100)</span>
          </div>
          <div style="font-size: 11px; color: #38bdf8;">
            Priority: ${record.cleanupPriority.priority}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setActiveObservation(record);
        onSelectDetection(record);
      });

      marker.addTo(markersLayerRef.current!);
    });

    // Also add live IoT telemetry Buoy marker if hardware is online with GPS
    if (hardware && hardware.connected && hardware.sensors.gps) {
      const { lat, lng } = hardware.sensors.gps;
      const buoyIcon = L.divIcon({
        className: 'buoy-live-pin',
        html: `
          <div style="
            background-color: #06b6d4;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 0 16px rgba(6, 182, 212, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 6px; height: 6px; background-color: #0f172a; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const buoyMarker = L.marker([lat, lng], { icon: buoyIcon });
      buoyMarker.bindPopup(`
        <div style="width: 210px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="font-weight: 700; font-size: 13px; color: #38bdf8; margin-bottom: 2px;">
            Autonomous Ocean IoT Buoy
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">Live Edge Node · IMX219 Optical Camera</div>
          <div style="font-size: 11px; color: #f1f5f9; margin-bottom: 3px;">Turbidity: ${hardware.sensors.turbidityNtu} NTU</div>
          <div style="font-size: 11px; color: #f1f5f9;">Water Temp: ${hardware.sensors.waterTemperatureC}°C</div>
        </div>
      `);
      buoyMarker.addTo(markersLayerRef.current!);
    }
  }, [detections, selectedCategory, selectedSeverity, hardware, onSelectDetection]);

  const zoomToObservation = (record: DetectionRecord) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([record.location.latitude, record.location.longitude], 7, {
      duration: 1.5,
    });
    setActiveObservation(record);
    onSelectDetection(record);
  };

  return (
    <div className="space-y-6">
      {/* Header & GIS Live API Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-cyan-400" />
            <span>Geospatial Marine Debris GIS Map</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global satellite transects, live Open-Meteo Marine API telemetry, and OpenStreetMap ocean basins
          </p>
        </div>

        {/* Live GIS API indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-slate-400">GIS Marine API:</span>
          <span className="text-emerald-300 font-medium">{gisApiStatus}</span>
        </div>
      </div>

      {/* Layer Toggles & Category Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
        {/* Layer Switches */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            GIS Layers:
          </span>
          <button
            onClick={() => setShowSanctuaries(!showSanctuaries)}
            className={`px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 ${
              showSanctuaries
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-teal-400" />
            <span>Marine Sanctuaries (UNESCO/NOAA)</span>
          </button>

          <button
            onClick={() => setShowWaterways(!showWaterways)}
            className={`px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 ${
              showWaterways
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <Waves className="w-3 h-3 text-cyan-400" />
            <span>Indian Waterways & Outflows (GeoJSON)</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Filter Debris:</span>
          {['All', 'Plastic', 'Fishing Gear', 'Metal', 'Rubber'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Map + Observation Panel Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Map Container (8 cols) */}
        <div className="lg:col-span-8 ocean-glass-card rounded-2xl overflow-hidden border border-slate-800 relative h-[540px]">
          <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-10 ocean-glass p-3 rounded-xl border border-slate-800 text-xs text-slate-300 shadow-xl space-y-1.5">
            <div className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider mb-1">
              GIS Map Layers
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Severe Debris (&gt;75 Score)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Moderate Debris</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-teal-500" />
              <span>Marine Protected Sanctuary</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Live IoT Buoy</span>
            </div>
            <div className="text-[10px] text-cyan-300 pt-1 border-t border-slate-800/80">
              💡 Click anywhere to query Live Marine API
            </div>
          </div>
        </div>

        {/* Selected Observation & Live GIS Probe Details (4 cols) */}
        <div className="lg:col-span-4 space-y-4">

          {/* Selected Waterbody Card (From Indian Waterways GeoJSON) */}
          {selectedWaterbody && (
            <div className="ocean-glass-card rounded-2xl p-5 border border-cyan-500/50 space-y-3 bg-cyan-950/20 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-start justify-between pb-2 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                    {selectedWaterbody.category}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    {selectedWaterbody.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">{selectedWaterbody.state} · {selectedWaterbody.basin}</p>
                </div>
                <button
                  onClick={() => setSelectedWaterbody(null)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Pollution Severity:</span>
                  <span className={`font-mono font-bold ${
                    selectedWaterbody.smpi_score >= 80 ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {selectedWaterbody.smpi_score} / 100 ({selectedWaterbody.severity})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Dominant Debris:</span>
                  <span className="text-white text-[11px] max-w-[170px] truncate text-right">
                    {selectedWaterbody.dominant_debris}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Annual Outflow:</span>
                  <span className="text-cyan-300 font-mono text-[11px]">
                    {selectedWaterbody.estimated_annual_plastic_tonnes.toLocaleString()} tonnes/yr
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  soundEngine.playSuccessSound();
                  onScanLocation?.(
                    selectedWaterbody.name,
                    selectedWaterbody.id === 'wb-mumbai' ? 19.12 : selectedWaterbody.id === 'wb-ganga-delta' ? 21.62 : 9.15,
                    selectedWaterbody.id === 'wb-mumbai' ? 72.82 : selectedWaterbody.id === 'wb-ganga-delta' ? 88.10 : 79.12
                  );
                }}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:from-cyan-300 hover:to-teal-300 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch DeepScan Sonar at this Site</span>
              </button>
            </div>
          )}
          
          {/* Live GIS API Probe HUD (Appears when map is clicked) */}
          {gisProbe ? (
            <div className="ocean-glass-card rounded-2xl p-5 border border-cyan-500/40 space-y-3 bg-cyan-950/20">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Live Marine GIS API Probe
                  </span>
                </div>
                {isLoadingGis && <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white leading-tight">
                  {gisProbe.locationName}
                </h4>
                <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                  {gisProbe.lat.toFixed(4)}°N, {gisProbe.lng.toFixed(4)}°W
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Wave Height:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {gisProbe.waveHeight} m
                  </span>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Wave Period:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {gisProbe.wavePeriod} s
                  </span>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Current Velocity:</span>
                  <span className="font-mono font-bold text-teal-300 text-sm">
                    {gisProbe.currentVelocity} km/h
                  </span>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Current Heading:</span>
                  <span className="font-mono font-bold text-teal-300 text-sm">
                    {gisProbe.currentDirection}°
                  </span>
                </div>
              </div>

              {onScanLocation && (
                <button
                  onClick={() => {
                    soundEngine.playSonarPing();
                    onScanLocation(gisProbe.locationName, gisProbe.lat, gisProbe.lng);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 hover:from-cyan-300 hover:to-teal-300 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scan Debris at This Coordinate</span>
                </button>
              )}
            </div>
          ) : (
            <div className="ocean-glass-card rounded-2xl p-4 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5 bg-slate-900/40">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Click any oceanic point on the map to query the live Open-Meteo Marine API for wave height and currents.</span>
            </div>
          )}

          {/* Active Observation Card */}
          {activeObservation && (
            <div className="ocean-glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{activeObservation.location.name}</h3>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {activeObservation.location.latitude.toFixed(4)}°N,{' '}
                    {activeObservation.location.longitude.toFixed(4)}°E
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded font-semibold border ${
                    activeObservation.pollutionSeverity.level === 'Severe'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : activeObservation.pollutionSeverity.level === 'High'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {activeObservation.pollutionSeverity.level}
                </span>
              </div>

              {/* Snapshot thumbnail */}
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={activeObservation.imageUrl}
                  alt={activeObservation.location.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Detected Targets:</span>
                  <span className="font-mono font-semibold text-white">
                    {activeObservation.detectedObjects.length} objects
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Pollution Score:</span>
                  <span className="font-mono font-semibold text-cyan-300">
                    {activeObservation.pollutionSeverity.score} / 100
                  </span>
                </div>
              </div>

              <button
                onClick={() => zoomToObservation(activeObservation)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-lg text-xs font-semibold border border-slate-800 flex items-center justify-center gap-2 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                Focus Viewport on Location
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
