<div align="center">

# Jerebu  

> Crowdsourced Air Quality & Haze Tracker

[Documentation](./assets/docs) · [Live Demo](https://mhdhamka.github.io/jerebu/) · [Report Bug](https://github.com/mhdhamka/jerebu/issues) · [Request Feature](https://github.com/mhdhamka/jerebu/issues)

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

Made with ❤️ by mdhamka

</div>