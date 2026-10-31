export interface DetectedItem {
  id: string;
  label: string;
  category: 'Plastic' | 'Fishing Gear' | 'Metal' | 'Rubber' | 'Other Debris';
  confidence: number;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  material: string;
  estimatedWeightKg: number;
  acousticShadowScore?: number; // 0-1 indicator of height off seabed in Sonar
}

export interface DetectionRecord {
  id: string;
  timestamp: string;
  imageUrl: string;
  imagingMode?: 'Sonar' | 'Optical';
  sonarMetadata?: {
    frequencyKhz: number;
    seabedDepthM: number;
    sonarType: 'Side-Scan Sonar (SSS)' | 'Forward-Looking Sonar (FLS)' | 'Multibeam Bathymetry';
    preprocessingPipeline: string[];
  };
  source: 'Upload' | 'Autonomous Buoy' | 'Field Camera' | 'Satellite/Drone' | 'Side-Scan Sonar Towfish';
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  detectedObjects: DetectedItem[];
  objectCount: number;
  pollutionSeverity: {
    level: 'Low' | 'Moderate' | 'High' | 'Severe';
    score: number; // 0 - 100
    reasoning: string;
  };
  cleanupPriority: {
    priority: 'Routine' | 'Priority' | 'Critical Response';
    timeframe: string;
    equipmentRecommended: string[];
    actionPlan: string;
  };
  marineEcosystemImpact: {
    entanglementRisk: 'Low' | 'Medium' | 'High' | 'Critical';
    ingestionHazard: string;
    degradationTimeEstimate: string;
  };
  sensorContext?: {
    turbidityNtu: number;
    waterTempC: number;
    waterClarity: 'Clear' | 'Slightly Turbid' | 'High Turbidity';
  };
}

export interface HardwareTelemetry {
  connected: boolean;
  lastUpdated: string;
  raspberryPi: {
    model: string;
    ipAddress: string;
    cpuTempC: number;
    cpuUsagePercent: number;
    ramUsagePercent: number;
    cameraModule: string;
    fps: number;
    status: string;
  };
  arduino: {
    model: string;
    firmware: string;
    connection: string;
    status: string;
  };
  sensors: {
    turbidityNtu: number;
    turbidityStatus: string;
    waterTemperatureC: number;
    waterTempStatus: string;
    gps: {
      lat: number;
      lng: number;
      satelliteCount: number;
      fix: string;
      module: string;
    };
    batteryVoltage: number;
    solarChargeCurrentA: number;
  };
  recentAlerts: {
    id: string;
    time: string;
    level: 'Info' | 'Warning' | 'Critical';
    message: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  language?: string;
  audioUrl?: string;
}

export interface SoundSettings {
  masterMuted: boolean;
  masterVolume: number; // 0 - 1
  ambienceEnabled: boolean;
  ambienceVolume: number;
  scanningEnabled: boolean;
  detectionChimeEnabled: boolean;
  warningAlertEnabled: boolean;
  successSoundEnabled: boolean;
  notificationEnabled: boolean;
  voicePlaybackEnabled: boolean;
}

export type SupportedLanguage = 
  | 'English'
  | 'Hindi (हिंदी)'
  | 'Spanish (Español)'
  | 'French (Français)'
  | 'Arabic (العربية)'
  | 'Chinese (中文)'
  | 'Bengali (বাংলা)'
  | 'Tamil (தமிழ்)'
  | 'German (Deutsch)'
  | 'Japanese (日本語)';
