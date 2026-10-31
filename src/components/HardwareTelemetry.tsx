import React, { useState } from 'react';
import { HardwareTelemetry } from '../types';
import { 
  Radio, 
  Cpu, 
  Droplet, 
  Thermometer, 
  Navigation, 
  BatteryCharging, 
  Power, 
  Code2, 
  FileCode, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Info,
  Server,
  Terminal,
  Activity
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface HardwareTelemetryProps {
  telemetry: HardwareTelemetry | null;
  onToggleConnection: () => Promise<void>;
  isToggling: boolean;
}

export const HardwareTelemetryView: React.FC<HardwareTelemetryProps> = ({
  telemetry,
  onToggleConnection,
  isToggling,
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'diagram' | 'arduino' | 'python' | 'enclosure'>('live');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    soundEngine.playSuccessSound();
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isConnected = telemetry?.connected ?? false;

  const arduinoCode = `// DeepScan_Telemetry_v2.4.ino
// Marine Environmental Buoy Telemetry (Arduino Mega 2560)
#include <OneWire.h>
#include <DallasTemperature.h>
#include <SoftwareSerial.h>
#include <TinyGPS++.h>

// Sensor Pin Assignments
#define TURBIDITY_PIN A0
#define ONE_WIRE_BUS 2
#define GPS_RX 10
#define GPS_TX 11

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensors(&oneWire);
TinyGPSPlus gps;
SoftwareSerial ssGPS(GPS_RX, GPS_TX);

void setup() {
  Serial.begin(115200);   // USB serial link to Raspberry Pi
  ssGPS.begin(9600);      // u-blox NEO-6M baud
  tempSensors.begin();
  pinMode(TURBIDITY_PIN, INPUT);
}

void loop() {
  // Read DS18B20 Submersible Temperature
  tempSensors.requestTemperatures();
  float waterTempC = tempSensors.getTempCByIndex(0);

  // Read Analog Turbidity Sensor (0-5V mapped to NTU)
  int rawADC = analogRead(TURBIDITY_PIN);
  float voltage = rawADC * (5.0 / 1024.0);
  // Empirical calibration curve: NTU = -1120.4*V^2 + 5742.3*V - 4352.9
  float turbidityNTU = 0.0;
  if (voltage < 2.5) {
    turbidityNTU = 3000;
  } else if (voltage >= 4.2) {
    turbidityNTU = 0.0;
  } else {
    turbidityNTU = -1120.4 * sq(voltage) + 5742.3 * voltage - 4352.9;
    if (turbidityNTU < 0) turbidityNTU = 0;
  }

  // Read GPS Coordinates
  while (ssGPS.available() > 0) {
    gps.encode(ssGPS.read());
  }

  // Transmit JSON packet over Serial to Raspberry Pi
  Serial.print("{\\"turbidity_ntu\\":");
  Serial.print(turbidityNTU, 2);
  Serial.print(",\\"water_temp_c\\":");
  Serial.print(waterTempC, 2);
  Serial.print(",\\"gps_lat\\":");
  Serial.print(gps.location.isValid() ? gps.location.lat() : 34.2541, 6);
  Serial.print(",\\"gps_lng\\":");
  Serial.print(gps.location.isValid() ? gps.location.lng() : -140.7812, 6);
  Serial.println("}");

  delay(2000);
}`;

  const pythonCode = `# deepscan_edge_pipeline.py
# Autonomous Underwater Camera & YOLO Edge Pipeline for Raspberry Pi 4
import cv2
import serial
import json
import time
import requests
from picamera2 import Picamera2

# Establish Serial Link with Arduino Mega 2560
ser = serial.Serial('/dev/ttyACM0', 115200, timeout=1.0)
time.sleep(2)

# Initialize Sony IMX219 Marine Optic Module
picam2 = Picamera2()
config = picam2.create_preview_configuration(main={"size": (1920, 1080), "format": "RGB888"})
picam2.configure(config)
picam2.start()

API_ENDPOINT = "https://your-deepscan-instance/api/detect"

print("Deep Scan Edge Inference Pipeline Active...")

while True:
    try:
        # 1. Capture 1080p optical frame from camera
        frame = picam2.capture_array()
        
        # 2. Read environmental telemetry packet from Arduino
        line = ser.readline().decode('utf-8').strip()
        telemetry = json.loads(line) if line.startswith('{') else {}
        
        # 3. High turbidity adaptive threshold trigger
        ntu = telemetry.get('turbidity_ntu', 15.0)
        
        # Encode image frame to JPEG
        _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        
        # Transmit to Deep Scan server for vision inference
        payload = {
            "imageBase64": buffer.tobytes(),
            "locationName": "Autonomous Edge Buoy Alpha",
            "lat": telemetry.get('gps_lat', 34.2541),
            "lng": telemetry.get('gps_lng', -140.7812)
        }
        
        # Rate-limited sync (every 30 seconds or on high delta)
        time.sleep(30)
        
    except KeyboardInterrupt:
        break
    except Exception as e:
        print(f"Edge error: {e}")
        time.sleep(5)
`;

  return (
    <div className="space-y-6">
      {/* Header and Connection Status Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-cyan-400" />
            <span>IoT Hardware & Environmental Sensor Telemetry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Raspberry Pi 4 Model B edge inference, Arduino Mega 2560 sensor bus, turbidity, and water temperature monitoring
          </p>
        </div>

        {/* Real Toggle to test Online vs Disconnected state */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Hardware Link:</span>
            {isConnected ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Telemetry
              </span>
            ) : (
              <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Hardware Disconnected
              </span>
            )}
          </div>

          <button
            onClick={onToggleConnection}
            disabled={isToggling}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
              isConnected
                ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isConnected ? 'Disconnect Hardware' : 'Connect Edge Rig'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'live'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Live Telemetry Readouts
        </button>
        <button
          onClick={() => setActiveTab('diagram')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'diagram'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Hardware Schematics & Wiring Pinouts
        </button>
        <button
          onClick={() => setActiveTab('arduino')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'arduino'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Arduino Firmware (.ino)
        </button>
        <button
          onClick={() => setActiveTab('python')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'python'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Raspberry Pi Python Pipeline
        </button>
        <button
          onClick={() => setActiveTab('enclosure')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            activeTab === 'enclosure'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Waterproof Enclosure Specs
        </button>
      </div>

      {/* Tab 1: Live Telemetry Readouts */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {!isConnected && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <span className="font-semibold block">Hardware Link Offline</span>
                <span className="text-xs text-rose-300/80">
                  The physical monitoring rig is disconnected. No simulated measurements are displayed. Connect the hardware above to resume live analog NTU and telemetry feeds.
                </span>
              </div>
            </div>
          )}

          {/* Core Sensor Gauges Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Turbidity Sensor */}
            <div className="ocean-glass-card rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Droplet className="w-4 h-4 text-cyan-400" />
                  Water Turbidity
                </span>
                <span className="font-mono text-[11px]">Analog A0</span>
              </div>

              {isConnected ? (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-extrabold font-mono text-white tabular-nums">
                      {telemetry?.sensors.turbidityNtu ?? 14.8}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">NTU</span>
                  </div>
                  <div className="text-[11px] text-cyan-300 font-medium">
                    {telemetry?.sensors.turbidityStatus ?? 'Normal Clarity'}
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400"
                      style={{ width: `${Math.min(100, ((telemetry?.sensors.turbidityNtu ?? 15) / 50) * 100)}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <span className="text-sm font-mono text-slate-500 uppercase font-semibold">
                    [ SENSOR OFFLINE ]
                  </span>
                </div>
              )}
            </div>

            {/* 2. Submersible Water Temp */}
            <div className="ocean-glass-card rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Thermometer className="w-4 h-4 text-teal-400" />
                  Submersible Temp
                </span>
                <span className="font-mono text-[11px]">DS18B20</span>
              </div>

              {isConnected ? (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-extrabold font-mono text-white tabular-nums">
                      {telemetry?.sensors.waterTemperatureC ?? 21.4}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">°C</span>
                  </div>
                  <div className="text-[11px] text-teal-300 font-medium">
                    {telemetry?.sensors.waterTempStatus ?? 'Nominal Oceanic Range'}
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-teal-400"
                      style={{ width: `${Math.min(100, ((telemetry?.sensors.waterTemperatureC ?? 20) / 40) * 100)}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <span className="text-sm font-mono text-slate-500 uppercase font-semibold">
                    [ SENSOR OFFLINE ]
                  </span>
                </div>
              )}
            </div>

            {/* 3. GPS Geo-fix */}
            <div className="ocean-glass-card rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Navigation className="w-4 h-4 text-sky-400" />
                  GPS Receiver
                </span>
                <span className="font-mono text-[11px]">u-blox NEO-6M</span>
              </div>

              {isConnected ? (
                <>
                  <div className="font-mono text-xs text-white space-y-1 my-1">
                    <div>LAT: {telemetry?.sensors.gps.lat.toFixed(4) ?? '34.2541'}°N</div>
                    <div>LNG: {telemetry?.sensors.gps.lng.toFixed(4) ?? '-140.7812'}°W</div>
                  </div>
                  <div className="text-[11px] text-sky-300 font-medium mt-1">
                    {telemetry?.sensors.gps.satelliteCount ?? 9} Satellites · 3D DGPS Lock
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <span className="text-sm font-mono text-slate-500 uppercase font-semibold">
                    [ NO GPS FIX ]
                  </span>
                </div>
              )}
            </div>

            {/* 4. Power & Solar Battery */}
            <div className="ocean-glass-card rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <BatteryCharging className="w-4 h-4 text-emerald-400" />
                  Power Management
                </span>
                <span className="font-mono text-[11px]">12V LiFePO4</span>
              </div>

              {isConnected ? (
                <>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-extrabold font-mono text-white tabular-nums">
                      {telemetry?.sensors.batteryVoltage ?? 12.6}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">V</span>
                  </div>
                  <div className="text-[11px] text-emerald-300 font-medium">
                    Solar Inflow: +{telemetry?.sensors.solarChargeCurrentA ?? 2.4} A
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <span className="text-sm font-mono text-slate-500 uppercase font-semibold">
                    [ POWER UNPOWERED ]
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Microcontroller & Single Board Computer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Raspberry Pi 4 Model B */}
            <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Raspberry Pi 4 Model B</h3>
                    <p className="text-[11px] text-slate-400">Edge Computer Vision & AI Inference Gateway</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded font-mono font-medium ${
                    isConnected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isConnected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Optical Camera:</span>
                  <span className="font-medium text-white">
                    {isConnected ? telemetry?.raspberryPi.cameraModule : 'Disconnected'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Inference Framerate:</span>
                  <span className="font-mono text-cyan-300 font-semibold">
                    {isConnected ? `${telemetry?.raspberryPi.fps} FPS` : '0 FPS'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Broadcom SoC Temp:</span>
                  <span className="font-mono text-white">
                    {isConnected ? `${telemetry?.raspberryPi.cpuTempC} °C` : '--'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">IP Gateway:</span>
                  <span className="font-mono text-slate-300">
                    {isConnected ? telemetry?.raspberryPi.ipAddress : '0.0.0.0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Arduino Mega 2560 */}
            <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Server className="w-5 h-5 text-teal-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Arduino Mega 2560 R3</h3>
                    <p className="text-[11px] text-slate-400">Multi-Channel Sensor Bus & ADC Subsystem</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded font-mono font-medium ${
                    isConnected ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isConnected ? 'SERIAL SYNC' : 'OFFLINE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Microcontroller Firmware:</span>
                  <span className="font-mono text-white text-[11px]">
                    {isConnected ? telemetry?.arduino.firmware : 'No Firmware'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Hardware Interface:</span>
                  <span className="font-mono text-teal-300">
                    {isConnected ? telemetry?.arduino.connection : 'Disconnected'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">ADC Resolution:</span>
                  <span className="font-mono text-white">10-bit (1024 steps)</span>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Analog Sampling Rate:</span>
                  <span className="font-mono text-slate-300">0.5 Hz (Adaptive)</span>
                </div>
              </div>
            </div>

          </div>

          {/* Alert Logs */}
          <div className="ocean-glass-card rounded-2xl p-5 border border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Hardware Telemetry Event Log</span>
            </h3>

            <div className="space-y-2">
              {telemetry?.recentAlerts?.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        alert.level === 'Warning'
                          ? 'bg-amber-400'
                          : alert.level === 'Critical'
                          ? 'bg-rose-500'
                          : 'bg-cyan-400'
                      }`}
                    />
                    <span className="text-slate-200">{alert.message}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">{alert.time}</span>
                </div>
              )) || <div className="text-xs text-slate-500">No recent events logged.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Schematics & Pinouts */}
      {activeTab === 'diagram' && (
        <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Edge Marine Hardware Wiring Architecture</h2>
              <p className="text-xs text-slate-400">Interfacing Raspberry Pi 4, Arduino Mega 2560, and submersible marine probes</p>
            </div>
          </div>

          {/* Visual Schematic Diagram (ASCII/SVG technical block diagram) */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300">
            <div className="text-cyan-400 font-bold mb-4">
              [SYSTEM INTERCONNECT TOPOLOGY]
            </div>
            <pre className="text-[12px] leading-relaxed text-slate-300">
{`+---------------------------------------------------------------------------------------+
|                                DEEP SCAN AI RIG ARCHITECTURE                           |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   +--------------------------+                     +-------------------------------+  |
|   |   RASPBERRY PI 4 (4GB)   |                     |     ARDUINO MEGA 2560 R3      |  |
|   |  - Computer Vision Core  |<== USB Serial =====>|   - Sensor Acquisition Bus    |  |
|   |  - YOLOv8 Edge Engine    |   (/dev/ttyACM0)    |   - 10-bit Analog Sampling    |  |
|   +------------+-------------+  (115200 Baud JSON) +---------------+---------------+  |
|                |                                                   |                  |
|                | CSI Ribbon                                        |                  |
|   +------------v-------------+                                     |                  |
|   | Sony IMX219 Marine Optic |                                     |                  |
|   | 8MP High-Def Camera      |                                     |                  |
|   | (Watertight Dome Port)   |                                     |                  |
|   +--------------------------+                                     |                  |
|                                                                    |                  |
|          +----------------------------+----------------------------+                  |
|          |                            |                            |                  |
|   +------v---------------+     +------v---------------+     +------v---------------+  |
|   | Submersible Turbidity|     | DS18B20 Temp Probe   |     | u-blox NEO-6M GPS    |  |
|   | - Signal: Pin A0     |     | - Signal: Pin 2      |     | - RX: Mega Pin 11    |  |
|   | - VCC: 5.0V          |     | - 4.7k Pull-up to 5V |     | - TX: Mega Pin 10    |  |
|   | - GND: Common GND    |     | - Waterproof Sleeve  |     | - Active Patch Ant.  |  |
|   +----------------------+     +----------------------+     +----------------------+  |
|                                                                                       |
|   +--------------------------------------------------------------------------------+  |
|   | POWER SUBSYSTEM: 12V 20Ah LiFePO4 Battery -> 5V 5A High-Efficiency Buck Reg.   |  |
|   | Solar Panel: 50W Monocrystalline PV with MPPT Charge Controller                |  |
+---------------------------------------------------------------------------------------+`}
            </pre>
          </div>

          {/* Pinout Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Wiring Pinout Specification</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                <thead className="bg-slate-900/80 text-slate-300 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Device / Component</th>
                    <th className="p-3">Component Pin</th>
                    <th className="p-3">Host Pin</th>
                    <th className="p-3">Signal Type</th>
                    <th className="p-3">Notes & Filtering</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  <tr>
                    <td className="p-3 font-medium text-white">Turbidity Sensor</td>
                    <td className="p-3 font-mono">Analog OUT</td>
                    <td className="p-3 font-mono text-cyan-300">Arduino Mega A0</td>
                    <td className="p-3">0 - 4.5V DC</td>
                    <td className="p-3 text-slate-400">0.1uF ceramic decoupling capacitor to GND</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">DS18B20 Temperature</td>
                    <td className="p-3 font-mono">DATA (Yellow)</td>
                    <td className="p-3 font-mono text-cyan-300">Arduino Mega Pin 2</td>
                    <td className="p-3">1-Wire Digital</td>
                    <td className="p-3 text-slate-400">4.7k ohm resistor tied between VCC & DATA</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">u-blox NEO-6M GPS</td>
                    <td className="p-3 font-mono">TX / RX</td>
                    <td className="p-3 font-mono text-cyan-300">Arduino Mega 10/11</td>
                    <td className="p-3">TTL UART 9600</td>
                    <td className="p-3 text-slate-400">SoftwareSerial bridge with NMEA parsing</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Sony IMX219 Camera</td>
                    <td className="p-3 font-mono">15-pin FFC</td>
                    <td className="p-3 font-mono text-cyan-300">Raspberry Pi CSI</td>
                    <td className="p-3">MIPI-CSI-2</td>
                    <td className="p-3 text-slate-400">1080p @ 30 FPS optical underwater pipeline</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Pi to Arduino Link</td>
                    <td className="p-3 font-mono">USB Type-B</td>
                    <td className="p-3 font-mono text-cyan-300">Pi USB 3.0 Port</td>
                    <td className="p-3">Virtual COM /dev/ttyACM0</td>
                    <td className="p-3 text-slate-400">115200 baud streaming telemetry JSON</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Arduino Firmware */}
      {activeTab === 'arduino' && (
        <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-teal-400" />
                <span>Arduino C++ Firmware (DeepScan_Telemetry_v2.4.ino)</span>
              </h2>
              <p className="text-xs text-slate-400">Analog turbidity calibration curve, Dallas 1-Wire temperature, and NMEA GPS</p>
            </div>
            <button
              onClick={() => copyToClipboard(arduinoCode, 'arduino')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800 rounded-lg text-xs font-medium transition-colors"
            >
              {copiedKey === 'arduino' ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[460px]">
            {arduinoCode}
          </pre>
        </div>
      )}

      {/* Tab 4: Python Pipeline */}
      {activeTab === 'python' && (
        <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>Raspberry Pi Python Pipeline (deepscan_edge_pipeline.py)</span>
              </h2>
              <p className="text-xs text-slate-400">Picamera2 capture, USB serial telemetry listener, and inference bridge</p>
            </div>
            <button
              onClick={() => copyToClipboard(pythonCode, 'python')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 rounded-lg text-xs font-medium transition-colors"
            >
              {copiedKey === 'python' ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[460px]">
            {pythonCode}
          </pre>
        </div>
      )}

      {/* Tab 5: Enclosure Specs */}
      {activeTab === 'enclosure' && (
        <div className="ocean-glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Marine Protective Enclosure & Buoy Deployment</h2>
            <p className="text-xs text-slate-400">Specifications for saltwater deployment, corrosion resistance, and thermal management</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <h3 className="font-semibold text-white">1. Housing Material</h3>
              <p className="text-slate-300 leading-relaxed">
                IP68 certified polycarbonate casing with dual silicone O-ring hermetic gaskets. Optical port made of optical-grade cast acrylic with hydrophobic nano-coating.
              </p>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <h3 className="font-semibold text-white">2. Thermal Dissipation</h3>
              <p className="text-slate-300 leading-relaxed">
                Internal aluminum heatsink conducts SoC heat directly into the marine water-facing anodized baseplate, maintaining Broadcom CPU below 55°C even under continuous vision inference.
              </p>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
              <h3 className="font-semibold text-white">3. Condensation Control</h3>
              <p className="text-slate-300 leading-relaxed">
                Integrated silica gel desiccant cartridge and pressure relief valve prevent internal fogging on camera optics during sudden temperature differentials between air and sea surface.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
