# 🌊 Deep Scan AI

> **AI-Powered Marine Debris Detection & Ocean Monitoring System**  
> *Autonomous computer vision, edge IoT telemetry, real-time oceanographic GIS mapping, and voice-enabled multilingual environmental intelligence.*

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/Frontend-React_19_%7C_TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Backend-Express_%7C_Node.js-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Vision_&_LLM-Google_Gemini_3.1_Flash_Lite-8E75C2?logo=google&logoColor=white)](https://ai.google.dev/)
[![GIS](https://img.shields.io/badge/Mapping-Leaflet_%7C_Open--Meteo-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Hardware](https://img.shields.io/badge/Edge_Hardware-Raspberry_Pi_4_%7C_Arduino_Mega-C51A4A?logo=raspberry-pi&logoColor=white)](https://www.raspberrypi.com/)

---

## 📌 Repository Description (for GitHub About section)
```text
AI-Powered Marine Debris Detection & Ocean Monitoring System. Combines multimodal computer vision (YOLO/Gemini), IoT telemetry (Raspberry Pi/Arduino sensor array), live GIS ocean mapping, Web Audio acoustics, and a voice-enabled multilingual AI oceanographic assistant.
```
*(260 / 350 characters)*

---

## 📑 Table of Contents
1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [System Architecture](#-system-architecture)
4. [Hardware & Sensor Node Specification](#-hardware--sensor-node-specification)
5. [Tech Stack](#-tech-stack)
6. [API Endpoints](#-api-endpoints)
7. [Installation & Getting Started](#-installation--getting-started)
8. [Environment Variables](#-environment-variables)
9. [Audio & Sonar Acoustic Engine](#-audio--sonar-acoustic-engine)
10. [Detection Taxonomy](#-detection-taxonomy)
11. [License & Acknowledgments](#-license--acknowledgments)

---

## 🌊 Overview

**Deep Scan AI** is an end-to-end maritime environmental observation platform engineered to combat marine plastic pollution, detect ghost fishing gear, and monitor delicate coastal and marine protected areas (MPAs). 

By uniting **edge-capable computer vision models (YOLO / Gemini 3.1 Flash Lite)** with an **IoT hardware sensor node (Raspberry Pi 4 + Arduino Mega 2560)**, Deep Scan AI delivers instant debris bounding-box classification, live water quality telemetry (Turbidity, Water Temperature, TDS, pH), real-time oceanic GIS mapping (live wave heights, swell direction, sea surface temperatures via Open-Meteo), and an interactive oceanographic AI assistant grounded with Google Search.

---

## ✨ Key Features

### 👁️ 1. Multimodal AI Marine Debris Detection
- **Precise 2D Bounding Boxes**: Normalized coordinates `[ymin, xmin, ymax, xmax]` overlaid in real time on high-resolution marine imagery and video streams.
- **Debris Classification Taxonomy**: Plastic beverage bottles, plastic bags/wrappers, ghost fishing nets & ropes, abandoned tires, derelict metal drums/cans, Styrofoam containers, and microplastic aggregations.
- **Truthful Baseline Analysis**: Evaluates healthy marine life and clean coral ecosystems honestly without hallucinating false-positive debris.
- **Forensic Breakdown**: Classifies material composition, estimated environmental degradation timeline (e.g., 450 years for PET plastics), marine life entanglement risk, and cleanup urgency rating.

### 📡 2. Edge IoT Telemetry & Sensor Gateway
- **Live In-Situ Telemetry**: Real-time measurement of Water Turbidity (NTU), Water Temperature (°C), Total Dissolved Solids (TDS ppm), and pH levels.
- **Dual-Board Architecture**:
  - **Arduino Mega 2560**: Low-level 10-bit analog-to-digital sensor sampling, median filtering, and calibration offsets.
  - **Raspberry Pi 4 Model B**: Edge gateway running inference, camera frame acquisition, and telemetry relay via 4G-LTE or LoRaWAN.
- **Sensor Calibration Mode**: Live zero-point tare and slope calibration controls for turbidity and temperature probes directly from the UI.

### 🗺️ 3. Live Oceanic GIS & Environmental Mapping
- **Interactive Geospatial Map**: Leaflet-powered GIS interface with nautical coordinate markers, customizable tile layers, and high-risk pollution clusters.
- **Live Open-Meteo Marine Weather API**: Live fetch of oceanic wave heights (m), swell periods (s), sea surface temperatures (°C), and ocean surface currents.
- **OpenStreetMap Nominatim Reverse Geocoding**: Converts maritime coordinates into localized port, bay, coastal municipality, and EEZ zone names.
- **Global Marine Protected Areas (MPAs)**: Pre-mapped sanctuaries (e.g., Great Barrier Reef, Galápagos, Papahānaumokuākea, Pelagos Marine Mammal Sanctuary) with proximity warnings.

### 🔊 4. Web Audio API Acoustic Sonar Engine
- **Active Sonar Sweep**: Submersible frequency-swept sine wave ping (800 Hz -> 1200 Hz with exponential decay) reflecting maritime radar/sonar acoustics.
- **Marine Debris Detection Chime**: Dual-tone pentatonic chime (523 Hz -> 659 Hz) triggered strictly upon genuine debris discovery.
- **Critical Environmental Alarm**: Dual-oscillator pulsating warning tone for severe pollution alerts or sensor threshold breaches (turbidity > 50 NTU).
- **Sub-Bass Ocean Ambience**: Procedurally generated pink-noise wave surf filtered through a low-pass bi-quad filter with independent volume control.

### 🤖 5. Voice-Enabled Oceanographic AI Chatbot
- **Multilingual Support**: English, Hindi (हिन्दी), Spanish (Español), French (Français), Chinese (中文), Arabic (العربية), German, and Japanese.
- **Google Search Grounding**: Fetches up-to-date maritime treaties (e.g., UN Global Plastics Treaty), ocean cleanup initiatives, and regional conservation status.
- **Speech Synthesis & Speech Recognition**: Web Speech API integration for hands-free maritime field operations with mute/unmute and voice speed controls.

---

## 🏗️ System Architecture

```text
               +-------------------------------------------------------+
               |                  Field Sensor Node                    |
               |                                                       |
               |   [Water Turbidity Probe]   [DS18B20 Temp Probe]      |
               |              \                 /                      |
               |               v               v                       |
               |             Arduino Mega 2560 (ADC/Sampling)          |
               |                           |                           |
               |              UART / USB Serial Bridge                 |
               |                           v                           |
               |          Raspberry Pi 4B (Edge Gateway)               |
               |        [Sony IMX477 HQ Camera via CSI]                |
               |        [SIM7600 4G LTE / LoRaWAN HAT]                 |
               +---------------------------+---------------------------+
                                           |
                                 HTTPS / WebSocket
                                           v
               +-------------------------------------------------------+
               |                  Deep Scan AI Server                  |
               |                                                       |
               |   Express.js REST Proxy on Node.js / Vite             |
               |   ├── /api/detect (Gemini 3.1 Flash Lite Vision)      |
               |   ├── /api/sensors (Telemetry streaming & calibration)|
               |   ├── /api/gis/* (Open-Meteo & Nominatim Geocoding)   |
               |   └── /api/chat (Grounding Search + Conversational)   |
               +---------------------------+---------------------------+
                                           |
                                    REST / JSON
                                           v
               +-------------------------------------------------------+
               |              Client Dashboard (React 19)              |
               |                                                       |
               |  • Interactive Ocean Canvas with Bounding Boxes       |
               |  • Leaflet GIS Map with Live Marine Weather           |
               |  • Chart.js In-situ Sensor Telemetry Graphs           |
               |  • Web Audio Synthesizer Engine (Waves & Sonar)       |
               |  • Voice-Enabled Multilingual Assistant Floating Dock |
               +-------------------------------------------------------+
```

---

## 🔌 Hardware & Sensor Node Specification

### 1. Arduino Mega 2560 Pinout & Wiring

| Sensor / Module | Signal Type | Arduino Pin | Operating Voltage | Notes |
|:---|:---|:---|:---|:---|
| **Turbidity Sensor (Gravity Analog)** | Analog Output | `A0` | 5.0V DC | 0 to 4.5V (Clean: ~4.1V, Opaque: < 2.5V) |
| **DS18B20 Waterproof Temp Probe** | 1-Wire Digital | `D2` | 3.3V - 5.0V | Requires 4.7kΩ pull-up resistor to VCC |
| **Analog pH Sensor (E-201-C)** | Analog Output | `A1` | 5.0V DC | Range: 0 - 14 pH (Offset calibrated in software)|
| **Analog TDS Meter** | Analog Output | `A2` | 3.3V - 5.0V | 0 - 1000 ppm range |
| **Status Indicator LED (Green/Red)** | Digital Output | `D12`, `D13` | 5.0V DC | Visual beacon for system status |
| **Serial to Raspberry Pi** | UART / USB | `TX0/RX0` or USB | 5.0V DC | 115200 Baud rate |

### 2. Raspberry Pi 4 Model B Configuration
- **Processor**: Broadcom BCM2711, Quad-core Cortex-A72 (ARM v8) 64-bit SoC @ 1.5GHz.
- **Camera Module**: Sony IMX477 12.3-megapixel High Quality Camera with C/CS-mount 6mm wide-angle lens (connected via 15-pin CSI ribbon cable).
- **Network Telemetry**: SIMCom SIM7600G-H 4G LTE HAT via GPIO header or Waveshare SX1262 LoRa HAT (868/915 MHz) for long-range offshore mesh communication.
- **Power Delivery**: 12V marine battery bank stepped down to 5.1V 3.5A via high-efficiency DC-DC buck converter.

---

## 💻 Tech Stack

- **Frontend Core**: React 19, TypeScript, Vite 8, Motion (Framer Motion)
- **Styling & UI**: Tailwind CSS v4, Lucide React icons, Glassmorphism aesthetic
- **Charts & Data Viz**: Chart.js 4, React-ChartJS-2
- **Geospatial Mapping**: Leaflet 1.9, OpenStreetMap, Open-Meteo Marine Weather API, Nominatim Geocoding API
- **AI & Computer Vision**: Google GenAI SDK (`@google/genai`), Gemini 3.1 Flash Lite multimodal model
- **Audio Engine**: Native Web Audio API (Synthesized oscillators, bi-quad filters, noise buffers)
- **Backend & Proxy**: Express.js 4, Node.js, `tsx`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/detect` | Accepts base64 encoded images or videos, returns classified objects with normalized bounding boxes, severity, and ecological risk metrics. |
| `GET` | `/api/sensors` | Retrieves real-time simulated or hardware-connected telemetry (turbidity, temperature, TDS, pH, battery, GPS). |
| `POST` | `/api/sensors/calibrate` | Sets calibration zero-offsets and calibration factors for environmental sensors. |
| `GET` | `/api/gis/marine-weather` | Fetches live oceanic wave height, swell period, and sea surface temperature from Open-Meteo for any latitude/longitude. |
| `GET` | `/api/gis/geocode` | Reverse geocodes oceanic coordinates into human-readable locations via Nominatim. |
| `GET` | `/api/gis/sanctuaries` | Returns spatial coordinates, descriptions, and protection statuses for major Marine Protected Areas. |
| `POST` | `/api/chat` | Multilingual conversational ocean intelligence with Google Search grounding. |
| `GET` | `/api/debris-records` | Fetches historical catalog of detected marine debris incidents. |
| `POST` | `/api/cleanup-alert` | Dispatches priority cleanup alerts to coastal authorities and cleanup vessels. |

---

## 🚀 Installation & Getting Started

### Prerequisites
- **Node.js** >= 20.x
- **npm** or **bun**
- A **Google Gemini API Key** (Get one at [Google AI Studio](https://aistudio.google.com/))

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/deep-scan-ai.git
cd deep-scan-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and provide your Gemini API key:
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
PORT=3000
```

### 4. Start Development Server
```bash
npm run dev
```
The application will launch at: `http://localhost:3000`

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 🎵 Audio & Sonar Acoustic Engine

The audio system is powered by the browser's native **Web Audio API**, completely eliminating the need for bulky external audio files while ensuring zero-latency sound synthesis:

- **Ocean Ambient Waves**: Pink noise generator routed through a dynamically modulated low-pass filter (cutoff 250 Hz -> 600 Hz) to simulate ocean surge.
- **Active Sonar Sweep**: Sine wave oscillator swept from 800 Hz to 1200 Hz with exponential gain decay.
- **Debris Ping**: Dual resonant sine tones (523.25 Hz & 659.25 Hz) mimicking underwater acoustic beacons.
- **Critical Alarm**: Square wave dual-oscillator siren (880 Hz / 440 Hz alternating) for emergency warnings.
- **Accessibility & Controls**: Master mute, individual channel sliders, and non-intrusive sound cues with visual fallback toasts.

---

## 🏷️ Detection Taxonomy

| Class Name | Common Marine Debris Examples | Typical Degradation Period | Ecological Impact |
|:---|:---|:---|:---|
| `plastic_bottle` | Single-use PET water/soda bottles | 450 Years | Microplastic shedding, turtle ingestion |
| `plastic_bag` | Polyethylene bags, snack packaging | 20 - 50 Years | Marine mammal asphyxiation |
| `fishing_net` | Monofilament nets, ghost ropes, lines | 600+ Years | Fatal ghost fishing & reef smothering |
| `tire` | Automotive rubber tires used as fenders | Indefinite (> 1000 Years) | Toxic zinc & heavy metal leaching |
| `metal_waste` | Aluminum beverage cans, steel fuel drums | 50 - 200 Years | Chemical corrosion, benthic disruption |
| `styrofoam` | Expanded polystyrene buoys, food containers | 500+ Years | Fragmented pellet ingestion by seabirds |
| `clean_marine_life` | Coral reefs, fish, sea turtles, dolphins | N/A | Healthy ecosystem benchmark |

---

## 🛡️ Security, Privacy & Reliability

- **Zero Client-Side Secret Leakage**: The Google Gemini API key is strictly maintained server-side in `server.ts` and never passed to the browser bundle.
- **Graceful Error Handling & Fallbacks**: If the inference server encounters network throttling or offline states, the UI transitions gracefully with clear visual explanations.
- **Input Sanitization**: Base64 payloads are verified for valid image MIME formats prior to dispatching to the multimodal pipeline.

---

## 📄 License

Distributed under the **Apache License 2.0**. See `LICENSE` for more information.

---

## 🤝 Acknowledgments
- **Google AI Studio** & Google DeepMind for Gemini 3.1 Flash Lite multimodal intelligence.
- **Open-Meteo** for free, high-resolution global marine weather forecasts and ocean wave models.
- **OpenStreetMap** & **Nominatim** for global geospatial coordinates and geographic reverse geocoding.
- Ocean conservation workers, marine biologists, and cleanup fleets worldwide protecting our seas. 🌊
