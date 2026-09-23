<div align="center">

# JerebuAQI
> Real-Time Crowdsourced Haze Intelligence, NASA Satellite Hotspot Telemetry & Atmospheric Drift Modeling

[![Vue 3](https://img.shields.io/badge/Frontend-Vue%203.5%20%7C%20Vite-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Leaflet](https://img.shields.io/badge/GIS-Leaflet%201.9-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/AI%20Engine-FastAPI%20Python-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Redis](https://img.shields.io/badge/In--Memory-Redis%20GeoSpatial-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![NASA FIRMS](https://img.shields.io/badge/Satellite-NASA%20FIRMS%20VIIRS-FC3D21?style=for-the-badge&logo=nasa&logoColor=white)](https://firms.modaps.eosdis.nasa.gov/)
[![Open-Meteo](https://img.shields.io/badge/Weather-Open--Meteo%20GFS-0284C7?style=for-the-badge&logo=openmeteo&logoColor=white)](https://open-meteo.com/)

<p align="center">
  <b>An environmental intelligence platform bridging official government air quality monitoring with neighborhood ground-truth observations, real-time satellite fire detection, and live aerodynamic wind dispersion across Sarawak, Malaysia, and Borneo.</b>
</p>

[Open Live Web App](https://mhdhamka.github.io/jerebu/) · [Architecture](#system-architecture) · [MOE SOP Guide](#moe-calculator) · [NASA FIRMS](#nasa-firms) · [Wind & Drift](#wind-drift) · [⚡ Reality Check](#reality-check) · [🧪 API Sandbox](#api-sandbox) · [💻 Quickstart](#quickstart)

</div>

---

<a id="persona-selector"></a>
## Interactive Persona & Scenario Selector

<details open>
<summary><b>👉 Choose your operational persona to jump directly to relevant documentation</b></summary>
<br>

| Role | Primary Objective | Direct Documentation Link | Live Web App Tool |
| :--- | :--- | :--- | :---: |
| **School Administrator / Teacher** | Check immediate MOE school closure triggers (AQI > 200) and outdoor activity bans (AQI > 100). | [MOE School Closure Calculator](#moe-calculator) | [Open Live MOE SOP ↗](https://mhdhamka.github.io/jerebu/) |
| **Disaster Responder / Resident** | Inspect neighborhood air quality, odor spikes, visibility, and verify reality check divergences. | [Reality Check Divergence Engine](#reality-check) | [Open Live Ground Feed ↗](https://mhdhamka.github.io/jerebu/) |
| **Atmospheric Scientist / Meteorologist** | Track NASA VIIRS/MODIS fire radiative power (FRP) and Open-Meteo wind dispersion vectors. | [Wind Drift & Satellite Telemetry](#wind-drift) | [Open NASA Hotspots ↗](https://mhdhamka.github.io/jerebu/) |
| **Full-Stack / DevOps Engineer** | Review Redis geospatial sets, FastAPI DBSCAN clustering, and run local curl sandbox commands. | [System Architecture & Local Setup](#system-architecture) | [Open API Sandbox ↗](#api-sandbox) |

</details>

---

<a id="smoke-corridor"></a>
## Transboundary Atmospheric Smoke Corridor

```text
========================================================================================
                      BORNEO & SARAWAK TRANSBOUNDARY HAZE RADAR
========================================================================================

          [ South China Sea ]
                                                        ▲
                                                       / \  N (0°)
                                                        │
                      ~~~~~~ Wind Vectors ~~~~~~►      ─┼─
                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~►      │
                                                        ▼
         [ West Sarawak ]
         • Kuching (Target: AQI 155 - Unhealthy)
           ▲
            \   ◄── [ Prevailing Southwest Monsoon (215° Azimuth) ]
             \      ◄── Smoke Plume Transit: ~12.0 Hours @ 15 km/h
              \
    ───────────┴───────────────────────────────────────────── [ Border ]
    [ West Kalimantan, Indonesia ]
     🔥 Sanggau Peat Fires (FRP: 420 MW | VIIRS 375m)
     🔥 Ketapang Hotspot Cluster (FRP: 680 MW | MODIS 1km)
     🔥 Sampit / Kotawaringin Peat Belt (Transboundary Influx)

========================================================================================
```

---

<a id="system-architecture" name="system-architecture"></a>
## System Architecture & Topological Flow

> **Interactive Architecture Flow:** Review the full ingestion and analytical topology below, or [launch the live application ↗](https://mhdhamka.github.io/jerebu/) to observe real-time telemetry processing in action.

<details open>
<summary><b>Click to expand the 4-Tier Distributed Architecture Diagram</b></summary>
<br>

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        JEREBUAQI DISTRIBUTED HYBRID TOPOLOGY                           │
└────────────────────────────────────────────────────────────────────────────────────────┘

    [ DATA INGESTION FEEDS ]
    ┌────────────────────────┐    ┌────────────────────────┐    ┌──────────────────────┐
    │   Crowdsourced Ground  │    │   NASA FIRMS NRT       │    │    Open-Meteo GFS    │
    │ Observations & Photos  │    │ VIIRS 375m & MODIS 1km │    │ 10m Wind & Azimuth   │
    └───────────┬────────────┘    └───────────┬────────────┘    └──────────┬───────────┘
                │                             │                            │
                ▼                             ▼                            ▼
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                   PROXY & HIGH-PERFORMANCE INGESTION ENGINE                      │
    │  • Geospatial Hash Grid Indexing (Spatial Partitioning)                          │
    │  • Redis In-Memory Geospatial Sorted Sets (GEOADD / GEORADIUS)                   │
    │  • 5-Minute Intelligent Multi-Source Cache & Rate Limiting                       │
    └─────────────────────────────────────────┬────────────────────────────────────────┘
                                              ▼
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                     ANALYTICS & COMPUTATIONAL SERVICES                           │
    │                                                                                  │
    │  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌──────────────────┐  │
    │  │ FastAPI (Python 3.13)   │  │ Divergence Engine       │  │ MOE Malaysia SOP │  │
    │  │ • Scikit-learn DBSCAN   │  │ • Reality Check Delta   │  │ • School Closure │  │
    │  │ • NLP Panic Weighting   │  │ • Sensor Elevation Bias │  │ • KKM Health SOP │  │
    │  └─────────────────────────┘  └─────────────────────────┘  └──────────────────┘  │
    └─────────────────────────────────────────┬────────────────────────────────────────┘
                                              ▼
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │               REACTIVE PRESENTATION LAYER (VUE 3.5 + LEAFLET + TAILWIND)         │
    │  • Fluid Animated Wind Streamlines with CSS Dash-Offset Keyframes                │
    │  • Pulsing Thermal Radiation Halos & Directional Smoke Plume Cones               │
    │  • Interactive Map Click Location Pinning & Instant HTML5 Social Card Generator  │
    └──────────────────────────────────────────────────────────────────────────────────┘
```

</details>

---

<a id="moe-calculator" name="moe-calculator"></a>
## Interactive MOE Malaysia School Action Calculator

> **Live SOP Interactive Tool:** Try the live interactive MOE School SOP Calculator across all Sarawak monitoring stations inside the [Live Web App ↗](https://mhdhamka.github.io/jerebu/).

Under the **Ministry of Education Malaysia (KPM) Circular Ref: Surat Pekeliling Ikhtisas Bil. 1/2019**, clear statutory triggers govern school activities during transboundary haze:

<details open>
<summary><b>Click to expand the Official MOE / MOH Action SOP Matrix</b></summary>
<br>

| AQI Band | Official Status | KPM School Action | KKM Health & Mask Guidelines | Real-Time Platform Trigger |
| :---: | :---: | :--- | :--- | :---: |
| **0 – 50** | 🟢 **Good** | Standard school hours; all outdoor sports, assemblies, and physical education (PJK) fully permitted. | Normal activities; no protective equipment required. | Regular Polling |
| **51 – 100** | 🟡 **Moderate** | Normal classes continue. Teachers monitor students with known asthma or respiratory conditions. | Sensitive individuals monitor breathing; minimize extreme physical exhaustion. | Hourly Sync |
| **101 – 200** | 🟠 **Unhealthy** | **MANDATORY SUSPENSION** of all outdoor physical education, co-curricular sports days, and open-air assemblies. Students stay in classrooms. | General public reduces prolonged outdoor exposure. High-risk groups wear 3-ply surgical or N95 masks. | `OUTDOOR HALTED` |
| **201 – 300** | 🟣 **Very Unhealthy** | **IMMEDIATE SCHOOL CLOSURE**. Principals are authorized to immediately order closure without prior state approval and shift to online learning (PdPR). | Avoid all outdoor presence. N95/KN95 respirators mandatory for essential outdoor trips. Air purifiers active. | `FULL CLOSURE TRIGGER` |
| **> 300** | 🟤 **Hazardous** | All educational institutions, kindergartens, and tuition centers shut down. Emergency staff work from home. | Severe health risk for all demographics. Stay strictly in air-filtered indoor environments. | `EMERGENCY HAZARDOUS` |

</details>

<details open>
<summary><b>Interactive Scenario Simulator (Click any scenario below to test outcomes)</b></summary>
<br>

* **Scenario A: Official AQI 42 (Kuching City Center)**
  * *Status:* 🟢 **Good**
  * *Action:* Normal school operations. Full outdoor sports and morning assemblies permitted.
* **Scenario B: Official AQI 128 (Sri Aman Sports Complex)**
  * *Status:* 🟠 **Unhealthy**
  * *Action:* ⚠️ **Outdoor Activities Halted**. Physical education moved to indoor classrooms. High-risk students monitored.
* **Scenario C: Official AQI 165, Ground Truth Reports 215 (Senadin, Miri Peat Fire)**
  * *Status:* 🟣 **Very Unhealthy Divergence**
  * *Action:* 🚨 **School Closure Trigger (PdPR)**. Even if official elevated station lags, verified crowdsourced ground reading $\ge 200$ triggers immediate administrative caution.

</details>

<details>
<summary><b>Mathematical Formula for School Closure Decision Trigger</b></summary>
<br>

$$\text{Decision} = \begin{cases} 
\text{Immediate School Closure (PdPR)}, & \max(\text{AQI}_{\text{official}}, \text{AQI}_{\text{ground\_truth}}) \ge 200 \\
\text{Halt All Outdoor Activities}, & 100 < \max(\text{AQI}_{\text{official}}, \text{AQI}_{\text{ground\_truth}}) < 200 \\
\text{Normal Operations}, & \max(\text{AQI}_{\text{official}}, \text{AQI}_{\text{ground\_truth}}) \le 100 
\end{cases}$$

> *Key Innovation:* JerebuAQI checks both government monitoring sensors and verified crowdsourced clusters. If localized ground smoke exceeds 200 while elevated sensors still lag at 160, the warning indicator proactively flags a closure risk.

</details>

---

<a id="nasa-firms" name="nasa-firms"></a>
## NASA FIRMS Active Fire Satellite Overlay

> **Live Satellite Heatmap:** Toggle active VIIRS (375m) and MODIS (1km) thermal fire detections with real-time Fire Radiative Power (MW) directly on the [Live Interactive Map ↗](https://mhdhamka.github.io/jerebu/).

JerebuAQI ingests Near-Real-Time active fire data directly from **NASA EOSDIS FIRMS (Fire Information for Resource Management System)**.

<details open>
<summary><b>Click to expand the Satellite Sensor Comparison & Detection Pipeline</b></summary>
<br>

```text
┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
│ Metric / Feature          │ VIIRS (S-NPP / NOAA-20)   │ MODIS (Terra / Aqua)      │
├───────────────────────────┼───────────────────────────┼───────────────────────────┤
│ Spatial Resolution        │ 375 meters per pixel      │ 1 kilometer per pixel     │
│ Peak Sensitivity          │ Small & smoldering peat   │ Major blazing forest fires│
│ Fire Radiative Power (MW) │ Calculated (0.1 - 1500 MW)│ Calculated (5 - 3000 MW)  │
│ Brightness Temp Channel   │ 4-micron (I4 channel)     │ 4-micron & 11-micron      │
│ Refresh Cadence           │ ~12 hours (Day/Night pass)│ ~12 hours (Terra + Aqua)  │
└───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

#### Satellite Thermal Telemetry Fields
* **Fire Radiative Power (FRP):** Expressed in Megawatts (MW). Represents the rate of radiant heat output from the combustion zone, directly proportional to biomass consumed and smoke emission volume.
* **Brightness Temperature ($T_b$):** Measured in Kelvin (K). Peat fires typically range from 310 K to 370 K, whereas intense open canopy burns exceed 420 K.
* **Transboundary Origin Flag:** Automatically flags fires located below latitude 1.0°N in Indonesian Kalimantan as transboundary origins.

</details>

---

<a id="wind-drift" name="wind-drift"></a>
## Open-Meteo Live Wind Vectors & Smoke Drift Modeling

> **Live Wind Vectors:** View animated wind streamlines and aerodynamic smoke drift cones directly on the [Live Interactive Leaflet Map ↗](https://mhdhamka.github.io/jerebu/).

Wind conditions dictate whether peat fire emissions disperse harmlessly into ocean waters or funnel into the Kuching-Samarahan-Sri Aman corridor.

<details open>
<summary><b>Click to expand the Aerodynamic Smoke Drift Calculation & Formulas</b></summary>
<br>

### Plume Drift Velocity & Transit Formula

The downwind travel time $T_{\text{transit}}$ from an active fire coordinate $(Lat_f, Lng_f)$ to a populated target $(Lat_t, Lng_t)$ is modeled as:

$$D = 2R \arcsin \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}$$

$$T_{\text{transit}} = \frac{D}{V_{\text{wind\_speed}}}$$

#### Example Transit Scenarios:
* **West Kalimantan to Kuching ($D \approx 180\text{ km}$):**
  * At wind speed $15\text{ km/h}$: Arrival time $\approx \mathbf{12.0\text{ hours}}$
  * At wind speed $25\text{ km/h}$: Arrival time $\approx \mathbf{7.2\text{ hours}}$
* **Prevailing Southwest Monsoon Trajectory:** Wind azimuth between **$180^\circ$ and $250^\circ$** blows directly toward Southern Sarawak, channeling particulate matter inland.

</details>

---

<a id="reality-check" name="reality-check"></a>
## Ground Truth "Reality Check" Divergence Engine

> **Live Divergence Inspector:** Discover why official rooftop stations diverge from real-time ground-level smoke by opening the [Live Reality Check Modal in the App ↗](https://mhdhamka.github.io/jerebu/).

Why do official government AQI readings sometimes show **Moderate (75 AQI)** while people on the street smell acrid burning smoke and report stinging eyes?

<details open>
<summary><b>Click to expand the Divergence Breakdown & Scientific Causes</b></summary>
<br>

```text
                [ NOCTURNAL THERMAL INVERSION LAYER ]
                
   Elevation: ~25-40m  ┌──────────────────────────────────────────────┐
                       │  Official Elevated Sensor Intake (AQI: ~85)  │  <-- Clear air above
   ════════════════════╪══════════════════════════════════════════════╪═════════════════════
                       │  Trapped Inversion Ceiling (Cold Air Cap)    │
   Elevation: 0-5m     │                                              │
                       │  Heavy Ground-Level Smoke (AQI: ~170)        │  <-- Ground truth!
                       │  • Acrid Peat Odor                           │
                       │  • Visibility < 1.0 km                       │
                       │  • Stinging Eyes & Throat                    │
   ════════════════════╧══════════════════════════════════════════════╧═════════════════════
```

### Key Reasons for Sensor Divergence:
1. **Intake Height Bias:** Many official stations sit on multi-story government rooftops or coastal clearings away from street canyons.
2. **Atmospheric Inversion:** During evening hours, radiant cooling traps dense particulate matter within a 20-meter ground envelope beneath warmer air.
3. **Hourly Running Averages:** APIMS indices often apply moving averages (e.g., 24-hour calculations), muting sudden afternoon smoke spikes that citizen reports catch instantaneously.

</details>

---

<a id="dbscan-clustering" name="dbscan-clustering"></a>
## FastAPI DBSCAN Spatial Clustering & NLP Panic Scoring

<details>
<summary><b>Click to expand the AI & Data Science Implementation Details</b></summary>
<br>

### DBSCAN Spatial Hyperparameters:
* **$\varepsilon$ (Epsilon):** $15\text{ km}$ maximum distance between neighboring ground observations.
* **$MinPts$ (Minimum Samples):** $3$ reports required to form a confirmed micro-climate smoke cluster.
* **Metric:** Haversine great-circle distance matrix computed via `scikit-learn`.

### Contributor Trust Weighting:
Each submitted report is scored based on user credential tier:
$$\text{Weight}(u) = \begin{cases}
2.5\times, & \text{Certified Environmental Officer / Station Operator} \\
1.8\times, & \text{Community Air Warden (Phone Verified)} \\
1.2\times, & \text{Photo Evidence Attached} \\
1.0\times, & \text{Standard Resident} \\
0.8\times, & \text{Anonymous Contributor}
\end{cases}$$

</details>

---

<a id="api-sandbox" name="api-sandbox"></a>
## Interactive API Sandbox & cURL Recipes

> **Local API Playground:** You can test every live endpoint locally using your terminal or API client. Click on any section below to copy ready-to-run cURL commands:

<details open>
<summary><b>1. NASA FIRMS Active Hotspots Endpoint (VIIRS & MODIS)</b></summary>
<br>

```bash
# Fetch all active fire hotspots with FRP, brightness temp, and transboundary tags
curl -s "http://localhost:3000/api/firms/hotspots?sensor=all&confidence=high" | jq .

# Fetch only high-resolution VIIRS (375m) detections
curl -s "http://localhost:3000/api/firms/hotspots?sensor=viirs&refresh=true" | jq .
```

<details>
<summary><b>View Sample JSON Response Payload</b></summary>

```json
{
  "success": true,
  "cached": true,
  "cacheAgeSeconds": 42,
  "data": {
    "totalCount": 8,
    "highConfidenceCount": 6,
    "transboundaryCount": 5,
    "totalFRP": 1420,
    "hotspots": [
      {
        "id": "FIRMS_VIIRS_12382",
        "lat": -2.468,
        "lng": 112.9434,
        "frp": 319.5,
        "brightness": 348.6,
        "confidence": "high",
        "confidenceScore": 85,
        "acqDate": "2026-09-22",
        "acqTime": "06:29 UTC",
        "satellite": "VIIRS NOAA-20",
        "instrument": "VIIRS (375m)",
        "sensorType": "VIIRS",
        "areaName": "Kotawaringin / Sampit Peat Belt",
        "region": "Central Kalimantan",
        "country": "Indonesia",
        "isTransboundary": true,
        "distanceToKuchingKm": 480
      }
    ]
  }
}
```
</details>
</details>

<details>
<summary><b>2. Open-Meteo Live Wind Vectors Endpoint</b></summary>
<br>

```bash
# Get current 10-meter wind speed, azimuth, and monsoon classification
curl -s "http://localhost:3000/api/wind/live" | jq .
```

<details>
<summary><b>View Sample JSON Response Payload</b></summary>

```json
{
  "speedKmh": 16.2,
  "directionDeg": 218,
  "directionLabel": "Southwest (SW)",
  "monsoonSeason": "Southwest Monsoon (Haze Propagation Season)",
  "gustsKmh": 24.5,
  "dispersionRisk": "High Transboundary Drift to Southern Sarawak",
  "updatedAt": "Live Open-Meteo GFS"
}
```
</details>
</details>

<details>
<summary><b>3. Live Ground-Truth Report Submission</b></summary>
<br>

```bash
# Submit a citizen ground observation with GPS coordinates
curl -X POST "http://localhost:3000/api/reports" \
  -H "Content-Type: application/json" \
  -d '{
    "areaName": "Tabuan Jaya, Kuching",
    "lat": 1.528,
    "lng": 110.372,
    "aqiEstimate": 165,
    "visibility": "< 1.0 km",
    "odor": "Strong Burning Peat",
    "symptoms": ["Stinging eyes", "Throat irritation"]
  }' | jq .
```
</details>

---

<a id="quickstart" name="quickstart"></a>
## Local Development Quickstart

<details open>
<summary><b>Frontend Setup (Vue 3 + Vite)</b></summary>
<br>

```bash
# 1. Clone the repository
git clone https://github.com/mhdhamka/jerebu.git
cd jerebu

# 2. Install dependencies
npm install

# 3. Start development server on port 3000
npm run dev

# 4. Open in browser:
# http://localhost:3000
```

</details>

<details>
<summary><b>Backend Setup (FastAPI Python Engine)</b></summary>
<br>

```bash
cd backend/fastapi
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

</details>

---

<a id="feature-matrix" name="feature-matrix"></a>
## Comprehensive Feature Verification Matrix

| Feature Module | Telemetry Source | Visual Animation |
| :--- | :--- | :--- |
| **Interactive Leaflet Haze Map** | OpenStreetMap / CartoDB Dark | Smooth Pan, Smooth Zoom, Bounds Fit |
| **Flowing Wind Streamlines** | Open-Meteo GFS (10m) | CSS Dash-Offset `@keyframes wind-flow` |
| **NASA FIRMS Active Fire Layer** | VIIRS (375m) & MODIS (1km) | Multi-ring `@keyframes thermal-flare` |
| **Smoke Drift Dispersion Plumes** | Wind Vector Trajectory Model | Directional Polygons & `@keyframes smoke-drift-wave` |
| **MOE School SOP Action Hub** | KPM Bil. 1/2019 Circular | Live Trigger Modal & AQI Badges |
| **Reality Check Divergence** | Official vs Citizen Reports | Expanding Sonar Echo `@keyframes radar-echo` |
| **DBSCAN Anomaly Clustering** | Scikit-Learn Spatial Density | Density Halos & Noise Filtering |
| **Social Share Card Generator** | HTML5 Canvas Rendering | Instant PNG Generation & Web Share API |
| **Interactive Live App Experience** | Vue 3.5 + Leaflet 1.9 | Real-Time Telemetry & Instant Sync |

---

<a id="contributing" name="contributing"></a>
## Contributing

Contributions, feedback, and regional sensor integrations are warmly welcomed!
1. Fork the Project (`https://github.com/mhdhamka/jerebu/fork`)
2. Create your Feature Branch (`git checkout -b feature/NewTelemetryFeed`)
3. Commit your Changes (`git commit -m 'Add support for additional air quality sensor'`)
4. Push to the Branch (`git push origin feature/NewTelemetryFeed`)
5. Open a Pull Request

---

## License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <br>
  <sub>Engineered with precision for the health and safety of Sarawak and Southeast Asian communities.</sub>
  <br>
  <b>Developed & Maintained by <a href="https://github.com/mhdhamka">mdhamka</a></b>
</div>
