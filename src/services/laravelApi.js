/**
 * Laravel API Service Emulation & Live Backend Connector
 * Acts as the core backend layer:
 * - Manages user accounts & weighted credibility scoring
 * - Stores historical report data
 * - Integrates with official government API endpoints for AQI
 * - Caches official data in Redis and pushes geo-coordinates to Redis GEO index
 * - Triggers FastAPI DBSCAN anomaly clustering on new reports
 */

import { OFFICIAL_STATIONS } from '../data/officialStations.js';
import { INITIAL_REPORTS, TRUSTED_USERS } from '../data/initialReports.js';
import { redis } from './redisStore.js';
import { fastapi } from './fastapiEngine.js';

// Base URL configuration for Render backend vs Localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://jerebu.onrender.com';

class LaravelApiService {
  constructor() {
    this.reports = [...INITIAL_REPORTS];
    this.stations = [...OFFICIAL_STATIONS];
    this.users = [...TRUSTED_USERS];
    this.activeUser = this.users[2]; // Default to Ahmad Zaki (Verified Resident)
    this.logs = [];

    // Initialize Redis cache & geo-index
    this._bootstrapRedis();
  }

  _bootstrapRedis() {
    // Cache official stations with 3600s TTL
    redis.setEx('haze:official:stations', 3600, this.stations);

    // Populate Redis Geospatial index for all initial reports
    for (const r of this.reports) {
      redis.geoAdd('haze:reports:geo', r.lng, r.lat, r.id, {
        area: r.areaName,
        visibility: r.visibilityMeters,
        smell: r.smellLevel,
        aqi: r.estimatedAqi,
        trust: r.trustScore
      });
    }
  }

  log(endpoint, method, status, durationMs, payloadSummary) {
    const entry = {
      id: 'lar_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      endpoint,
      method,
      status,
      duration: durationMs.toFixed(1) + 'ms',
      payload: payloadSummary
    };
    this.logs.unshift(entry);
    if (this.logs.length > 40) this.logs.pop();
  }

  setActiveUser(user) {
    this.activeUser = user;
    this.log('/api/v1/auth/switch-user', 'POST', 200, 1.1, `Active reporter set to "${user.name}" (Weight: ${user.trustWeight}x)`);
  }

  // GET /api/v1/stations
  async getOfficialStations(forceRefresh = false) {
    const start = performance.now();
    let stations = null;

    if (!forceRefresh) {
      stations = redis.get('haze:official:stations');
    }

    if (!stations) {
      // Option to fetch live from Render backend, falling back to mock state
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/stations`);
        if (response.ok) {
          stations = await response.json();
        }
      } catch (err) {
        console.warn('Backend fetch failed, using fallback stations:', err);
      }

      if (!stations) {
        stations = [...this.stations];
      }

      redis.setEx('haze:official:stations', 3600, stations);
    }

    const elapsed = performance.now() - start;
    this.log('/api/v1/stations', 'GET', 200, elapsed + 1.4, `Retrieved ${stations.length} official stations`);
    return stations;
  }

  // PATCH /api/v1/stations/:id
  updateStationData(stationId, updatedFields) {
    const idx = this.stations.findIndex(s => s.id === stationId);
    if (idx !== -1) {
      this.stations[idx] = { ...this.stations[idx], ...updatedFields };
      redis.setEx('haze:official:stations', 3600, [...this.stations]);
      this.log(`/api/v1/stations/${stationId}`, 'PATCH', 200, 1.2, `Updated station "${this.stations[idx].name}" to AQI ${updatedFields.aqi} (${updatedFields.status || 'Updated'})`);
      return { ...this.stations[idx] };
    }
    return null;
  }

  // GET /api/v1/reports
  async getReports() {
    const start = performance.now();
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/reports`);
      if (response.ok) {
        const remoteReports = await response.json();
        if (Array.isArray(remoteReports) && remoteReports.length > 0) {
          this.reports = remoteReports;
        }
      }
    } catch (err) {
      console.warn('Backend fetch reports failed, using local collection state:', err);
    }

    const elapsed = performance.now() - start;
    this.log('/api/v1/reports', 'GET', 200, elapsed + 1.2, `Retrieved ${this.reports.length} crowdsourced ground truth reports`);
    return [...this.reports];
  }

  // GET /api/v1/reports/geosearch
  async getReportsByRadius(lng, lat, radiusKm = 50) {
    const start = performance.now();
    // Query through Redis GEO index
    const geoResults = redis.geoRadius('haze:reports:geo', lng, lat, radiusKm);
    const memberIds = new Set(geoResults.map(g => g.member));
    const matchingReports = this.reports.filter(r => memberIds.has(r.id));
    const elapsed = performance.now() - start;
    this.log('/api/v1/reports/geosearch', 'GET', 200, elapsed + 1.8, `Redis GEORADIUS returned ${matchingReports.length} reports within ${radiusKm}km`);
    return matchingReports;
  }

  // POST /api/v1/reports
  async submitReport(formData) {
    const start = performance.now();
    const user = this.activeUser || this.users[3];

    // Estimate AQI based on qualitative intensity, visibility, and smell
    let baseAqi = 100;
    if (formData.intensityScore) {
      baseAqi = formData.intensityScore;
    } else {
      if (formData.visibilityMeters <= 300) baseAqi = 240;
      else if (formData.visibilityMeters <= 600) baseAqi = 195;
      else if (formData.visibilityMeters <= 1000) baseAqi = 160;
      else if (formData.visibilityMeters <= 2000) baseAqi = 120;
      else baseAqi = 75;

      if (formData.smellScore >= 4) baseAqi += 25;
    }

    // Run FastAPI NLP sentiment analysis
    const sentiment = fastapi.analyzeSentiment(
      formData.description,
      formData.symptoms,
      formData.visibilityMeters,
      formData.smellScore
    );

    const newReport = {
      id: 'rep_' + Date.now().toString().slice(-6),
      reporterName: user.name,
      reporterRole: user.role,
      reporterType: user.type,
      trustScore: user.trustWeight,
      areaName: formData.areaName || 'Reported Location',
      city: formData.city || 'Local District',
      region: formData.region || 'Southeast Asia',
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
      intensityLevel: formData.intensityLevel || 'unhealthy',
      intensityLabel: formData.intensityLabel || 'Unhealthy',
      visibilityMeters: formData.visibilityMeters,
      visibilityLabel: formData.visibilityLabel,
      smellLevel: formData.smellLevel,
      smellScore: formData.smellScore,
      estimatedAqi: baseAqi,
      symptoms: [...(formData.symptoms || [])],
      description: formData.description,
      timestamp: 'Just now',
      verified: user.trustWeight >= 1.5,
      upvotes: 1,
      panicScore: sentiment.panicScore,
      sentimentAnalysis: sentiment
    };

    // Attempt to sync with Render FastAPI/Laravel backend endpoint via POST
    try {
      await fetch(`${API_BASE_URL}/api/v1/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReport),
      });
    } catch (err) {
      console.warn('Backend sync failed, storing locally:', err);
    }

    // Store in memory collection
    this.reports.unshift(newReport);

    // Push into Redis Geospatial Index immediately
    redis.geoAdd('haze:reports:geo', newReport.lng, newReport.lat, newReport.id, {
      area: newReport.areaName,
      visibility: newReport.visibilityMeters,
      smell: newReport.smellLevel,
      aqi: newReport.estimatedAqi,
      trust: newReport.trustScore
    });

    const elapsed = performance.now() - start;
    this.log(
      '/api/v1/reports',
      'POST',
      201,
      elapsed + 2.4,
      `UserReport created #${newReport.id} by "${user.name}" (trust: ${user.trustWeight}x, GEOADD indexed, panic: ${sentiment.panicScore}%)`
    );

    return newReport;
  }

  // Upvote report
  async upvoteReport(id) {
    const rep = this.reports.find(r => r.id === id);
    if (rep) {
      rep.upvotes++;
      try {
        await fetch(`${API_BASE_URL}/api/v1/reports/${id}/upvote`, {
          method: 'POST'
        });
      } catch (err) {
        console.warn('Backend upvote sync failed:', err);
      }
      this.log(`/api/v1/reports/${id}/upvote`, 'POST', 200, 1.0, `Report upvoted. Current votes: ${rep.upvotes}`);
    }
  }

  // Trigger FastAPI DBSCAN Anomaly detection on current data
  computeAnomalies(epsKm = 9.0, minSamples = 2) {
    return fastapi.runDBSCAN(this.reports, this.stations, epsKm, minSamples);
  }
}

export const laravel = new LaravelApiService();