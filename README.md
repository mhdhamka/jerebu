<div align="center">

# JerebuAQI

> Crowdsourced Air Quality & Haze Tracker

[Documentation](./backend/notebooks/) · [Live Demo](https://mhdhamka.github.io/jerebu/) · [Report Bug](https://github.com/mhdhamka/jerebu/issues) · [Request Feature](https://github.com/mhdhamka/jerebu/issues)

![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-API-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Geospatial-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Scikit-learn](https://img.shields.io/badge/Scikit--learn-DBSCAN-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)

</div>

---

# Overview

A community-driven, full-stack web application designed to track air quality and haze incidents across Southeast Asia, specifically inspired by the recurring haze affecting Sarawak, Malaysia, Borneo, and neighboring Kalimantan fire zones. 

Official air quality monitoring stations can often be sparse or slow to reflect hyper-localized conditions. **JerebuAQI** solves this by empowering citizens to contribute real-time, ground-truth reports while leveraging advanced geospatial indexing and AI-driven anomaly detection.

---

## Key Features

* **Interactive Haze Map:** Dynamic frontend displaying live official stations, crowdsourced citizen reports, satellite fire hotspots, and animated wind trajectories.
* **NASA FIRMS Active Hotspots Layer:** Real-time satellite fire detection overlay (VIIRS S-NPP / NOAA-20 & MODIS Terra/Aqua) with Fire Radiative Power (MW), brightness temperature (K), and transboundary smoke drift vectors from Kalimantan peat fires into Sarawak.
* **Live Wind Vector & Smoke Drift Animation :** Meteorological wind stream vectors powered by NOAA GFS and Open-Meteo showing prevailing monsoon winds (e.g., Southwest Monsoon haze propagation into Kuching, Samarahan, and Sri Aman).
* **24-Hour & 7-Day Air Quality Forecast Curve:** Interactive hourly air quality projections with peak warning windows, PM2.5/PM10 pollutant breakdowns, and day-by-day trajectory curves.
* **MOE Malaysia School Action & Health Advisory:** Official Ministry of Education (KPM/MOE) SOP tracking: outdoor activities suspended at AQI > 100, full school closures triggered at AQI > 200, N95 mask guidelines, and vulnerable group recommendations.
* **Ground Truth "Reality Check" Divergence Engine:** Quantifies the delta between stationary government sensors and neighborhood citizen reports to highlight sensor lag, humidity inversions, and local blindspots.
* **PWA Offline Mode & Web Push Alerts:** Service Worker offline caching for air quality advisories and configurable browser push notifications when local AQI exceeds safety thresholds.
* **Live IQAir & APIMS Sync Hub:** Live integration modal fetching real-time PM2.5 and AQI data for Kuching, Samarahan, Sri Aman, Sibu, Bintulu, and Miri.
* **Hyper-local Ground-Truth Reporting:** Citizens submit reports with visibility distances, burning odors, acute symptoms, and photos.
* **Geospatial Anomaly Detection (DBSCAN):** Identifies localized smoke clusters using density-based spatial clustering to catch micro-climate spikes missed by official stations.
* **Social Sharing Card Generator:** Instant HTML5 Canvas card generator for sharing air quality alerts to WhatsApp, Telegram, X, and Facebook.

---

## The Technology Stack

| Component | Technology | Description & Responsibilities |
| :--- | :--- | :--- |
| **Frontend** | Vue.js / Vite | Interactive map interface, dynamic report forms, and user dashboard. |
| **Backend API & Management** | Laravel | Handles user accounts, historical data storage, official APIMS/NEA station synchronization, and proxying. |
| **In-Memory Store & Cache** | Redis | Caches hourly government AQI data and manages geospatial sorted sets for rapid spatial queries. |
| **AI & Data Science Engine** | Python FastAPI, scikit-learn, NumPy | Handles DBSCAN spatial clustering and NLP sentiment panic scoring. |

---

## Getting Started Locally

To run the complete Jerebu stack locally, you will need to run the frontend and your chosen backend services concurrently across separate terminal windows.

### 1. Frontend Setup (Vue.js)
```bash
# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev

```

### 2. Backend Services

#### FastAPI AI Engine

```bash
cd backend/fastapi
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

```

---

## Project Architecture

```text
JerebuAQI/
├── backend/
│   ├── fastapi/           # Python AI Engine (DBSCAN clustering, NLP sentiment analysis)
│   └── laravel/           # Laravel API gateway, controllers, and Redis services
├── src/                   # Vue.js frontend application
│   ├── components/        # UI components (Map, modals, panels, navigation)
│   ├── data/              # Static dataset files and initialization records
│   ├── services/          # API clients and data service connectors
│   ├── utils/             # Helper utilities (image generation, etc.)
│   ├── App.vue            # Root Vue component
│   ├── index.css          # Global CSS styles
│   └── main.js            # Frontend application entry point
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── index.html             # HTML entry point for Vite/Vue
├── package-lock.json      # NPM package manager lockfile
├── package.json           # Frontend dependencies and scripts
├── README.md              # Project documentation
└── vite.config.js         # Vite bundler configuration
```

---

# Contributing

Contributions are always welcome! If you'd like to improve this project, please follow these steps:

* Fork the Repository
* Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
* Commit your Changes (`git commit -m "add: some amazing feature"`)
* Push to the Branch (`git push origin feature/AmazingFeature`)
* Open a Pull Request

---

# License

This project is released under the MIT License.

Feel free to learn from, fork, and improve upon this project.

---

<div align="center">

If you found this project interesting, consider giving it a star!

Developed & Maintained by mdhamka

</div>
