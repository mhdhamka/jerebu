
# Jerebu  

> Crowdsourced Air Quality & Haze Tracker

A community-driven, full-stack web application designed to track air quality and haze incidents across Southeast Asia, specifically inspired by the recurring haze affecting Sarawak, Malaysia, Borneo, and neighboring Kalimantan fire zones. 

Official air quality monitoring stations can often be sparse or slow to reflect hyper-localized conditions. **Jerebu** solves this by empowering citizens to contribute real-time, ground-truth reports while leveraging advanced geospatial indexing and AI-driven anomaly detection.

---

## Key Features

* **Interactive Haze Map:** A dynamic frontend interface displaying live official stations and crowdsourced pins.
* **Hyper-local Ground-Truth Reporting:** Users can submit reports detailing visibility levels, burning smells, symptoms, and descriptive accounts of local conditions.
* **AI Sentiment & Panic Analysis:** Python FastAPI backend evaluates citizen reports using natural language processing to gauge community distress and urgency tiers.
* **Geospatial Anomaly Detection:** Utilizes machine learning clustering algorithms (DBSCAN via scikit-learn) to identify localized pollution spikes that official government monitoring stations might miss.
* **Lightning-Fast Geospatial Lookups:** Employs Redis geospatial indexing for sub-millisecond radius searches of user reports.
* **Trusted Reporter Weighting:** Laravel backend manages user accounts, applying trust weightings to reports to ensure data reliability.

---

## The Technology Stack

* **Frontend:** Vue.js / Vite (interactive map interface, dynamic report forms, and dashboard).
* **Backend API & Management:** Laravel (handles user accounts, historical data storage, official APIMS/NEA station synchronization, and proxying).
* **In-Memory Store & Cache:** Redis (caches hourly government AQI data and manages geospatial sorted sets for rapid spatial queries).
* **AI & Data Science Engine:** Python FastAPI, scikit-learn, and NumPy (handles DBSCAN spatial clustering and NLP sentiment panic scoring).

---

## Getting Started Locally

To run the complete Jerebu Watch stack locally, you will need to run the frontend and your chosen backend services concurrently across separate terminal windows.

### 1. Frontend Setup (Vue.js)
```bash
# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev

```

### 2. Backend Services

#### Option A: FastAPI AI Engine

```bash
cd backend/fastapi
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

```

#### Option B: Laravel API Gateway

```bash
cd backend/laravel
composer install
php artisan serve --port=8001

```

---

## Project Architecture

```text
jerebu/
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
├── bun.lock               # Bun package manager lockfile
├── index.html             # HTML entry point for Vite/Vue
├── metadata.json          # Project metadata configuration
├── package-lock.json      # NPM package manager lockfile
├── package.json           # Frontend dependencies and scripts
├── README.md              # Project documentation
└── vite.config.js         # Vite bundler configuration
```

---


