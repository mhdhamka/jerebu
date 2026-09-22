/**
 * NASA FIRMS (Fire Information for Resource Management System) Service
 * Fetches and manages active fire detections from VIIRS and MODIS satellites.
 * Directly visualizes wildfire & peatland fire sources driving transboundary haze.
 */

import { INITIAL_NASA_HOTSPOTS } from '../data/nasaHotspots.js';

export class NasaFirmsService {
  constructor() {
    this.hotspots = [...INITIAL_NASA_HOTSPOTS];
    this.meta = {
      totalFound: INITIAL_NASA_HOTSPOTS.length,
      displayedCount: INITIAL_NASA_HOTSPOTS.length,
      highConfidenceCount: INITIAL_NASA_HOTSPOTS.filter(h => h.confidence === 'high').length,
      transboundaryCount: INITIAL_NASA_HOTSPOTS.filter(h => h.isTransboundary).length,
      totalFRP: Math.round(INITIAL_NASA_HOTSPOTS.reduce((s, h) => s + (h.frp || 0), 0)),
      lastUpdated: new Date().toISOString(),
      dataSource: 'NASA FIRMS Satellite Archive (VIIRS & MODIS)'
    };
    this.isLoading = false;
    this.lastError = null;
    this.selectedSensor = 'all'; // 'all', 'viirs', 'modis'
    this.confidenceLevel = 'all'; // 'all', 'high'
    this.minFrpThreshold = 2; // MW
  }

  getHotspots(filters = {}) {
    let list = [...this.hotspots];

    const sensor = filters.sensor || this.selectedSensor;
    if (sensor && sensor !== 'all') {
      list = list.filter(h => (h.sensorType || '').toLowerCase() === sensor.toLowerCase() ||
        (sensor === 'viirs' && (h.satellite || '').includes('VIIRS')) ||
        (sensor === 'modis' && (h.satellite || '').includes('MODIS')));
    }

    const conf = filters.confidence || this.confidenceLevel;
    if (conf === 'high') {
      list = list.filter(h => h.confidence === 'high' || (h.confidenceScore && h.confidenceScore >= 80));
    }

    const minFrp = filters.minFrp !== undefined ? filters.minFrp : this.minFrpThreshold;
    if (minFrp > 0) {
      list = list.filter(h => (h.frp || 0) >= minFrp);
    }

    if (filters.onlyTransboundary) {
      list = list.filter(h => h.isTransboundary);
    }

    return list;
  }

  getStats() {
    const list = this.hotspots;
    const viirsCount = list.filter(h => (h.sensorType === 'VIIRS' || (h.satellite || '').includes('VIIRS'))).length;
    const modisCount = list.filter(h => (h.sensorType === 'MODIS' || (h.satellite || '').includes('MODIS'))).length;
    const highConf = list.filter(h => h.confidence === 'high').length;
    const transboundary = list.filter(h => h.isTransboundary).length;
    const totalFrp = Math.round(list.reduce((sum, h) => sum + (h.frp || 0), 0));

    // Nearest hotspot to Kuching center
    let nearest = null;
    let minD = Infinity;
    for (const h of list) {
      const d = h.distanceToKuchingKm !== undefined
        ? h.distanceToKuchingKm
        : this.calculateDistanceKm(1.5533, 110.3592, h.lat, h.lng);
      if (d < minD) {
        minD = d;
        nearest = { ...h, distanceToKuchingKm: d };
      }
    }

    return {
      total: list.length,
      viirsCount,
      modisCount,
      highConfidenceCount: highConf,
      transboundaryCount: transboundary,
      totalFRP: totalFrp,
      nearestHotspot: nearest,
      lastUpdated: this.meta.lastUpdated,
      dataSource: this.meta.dataSource,
      isLoading: this.isLoading
    };
  }

  getHighConfidenceCount() {
    return this.hotspots.filter(h => h.confidence === 'high').length;
  }

  getTotalFRP() {
    return Math.round(this.hotspots.reduce((sum, h) => sum + (h.frp || 0), 0));
  }

  // User Map Key Management
  getMapKey() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('nasa_firms_map_key') || '';
  }

  setMapKey(key) {
    if (typeof window === 'undefined') return;
    const trimmed = (key || '').trim();
    if (trimmed) {
      localStorage.setItem('nasa_firms_map_key', trimmed);
    } else {
      localStorage.removeItem('nasa_firms_map_key');
    }
  }

  /**
   * Fetches real-time fire hotspot detections from NASA FIRMS API & Near-Real-Time feeds
   */
  async fetchLiveHotspots(options = {}) {
    this.isLoading = true;
    this.lastError = null;

    const sensor = options.sensor || this.selectedSensor;
    const confidence = options.confidence || this.confidenceLevel;
    const minFrp = options.minFrp !== undefined ? options.minFrp : this.minFrpThreshold;
    const forceRefresh = options.refresh ?? true;
    const mapKey = options.mapKey !== undefined ? options.mapKey : this.getMapKey();

    const queryParams = new URLSearchParams({
      sensor,
      confidence,
      min_frp: String(minFrp),
      refresh: String(forceRefresh)
    });

    if (mapKey) {
      queryParams.set('map_key', mapKey);
    }

    try {
      const response = await fetch(`/api/firms/hotspots?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to reach FIRMS service`);
      }

      const json = await response.json();
      if (json.success && json.data?.hotspots && Array.isArray(json.data.hotspots)) {
        if (json.data.hotspots.length > 0) {
          this.hotspots = json.data.hotspots;
          this.meta = {
            totalFound: json.data.totalFound,
            displayedCount: json.data.displayedCount,
            highConfidenceCount: json.data.highConfidenceCount,
            transboundaryCount: json.data.transboundaryCount,
            totalFRP: json.data.totalFRP,
            lastUpdated: json.data.lastUpdated,
            dataSource: json.data.dataSource
          };
        }
        this.isLoading = false;
        return {
          success: true,
          hotspots: this.hotspots,
          meta: this.meta,
          cached: json.cached
        };
      } else {
        throw new Error(json.error || 'Empty or invalid response from FIRMS API');
      }
    } catch (err) {
      console.warn('NASA FIRMS Live fetch warning, using static fallback:', err.message);
      this.lastError = err.message;
      this.isLoading = false;

      // Retain or fallback to INITIAL_NASA_HOTSPOTS
      if (this.hotspots.length === 0) {
        this.hotspots = [...INITIAL_NASA_HOTSPOTS];
      }

      return {
        success: false,
        warning: 'Showing verified baseline satellite detections.',
        error: err.message,
        hotspots: this.hotspots,
        meta: this.meta
      };
    }
  }

  // Calculate hotspots within radius of coordinates (e.g. Kuching)
  getHotspotsNear(lat, lng, radiusKm = 250) {
    return this.hotspots.filter(h => {
      const d = this.calculateDistanceKm(lat, lng, h.lat, h.lng);
      return d <= radiusKm;
    }).sort((a, b) => {
      const distA = this.calculateDistanceKm(lat, lng, a.lat, a.lng);
      const distB = this.calculateDistanceKm(lat, lng, b.lat, b.lng);
      return distA - distB;
    });
  }

  /**
   * Calculates smoke plume trajectory and downwind impact vector
   */
  calculateSmokeTrajectory(hotspot, windData = null, lengthKm = 75) {
    const windDeg = windData?.directionDeg ?? 215; // default Southwest monsoon
    const windSpeed = windData?.speedKmh ?? 14;

    // Wind blows towards (windDeg + 180) % 360
    const driftAzimuth = (windDeg + 180) % 360;
    const driftRad = (driftAzimuth * Math.PI) / 180;

    // Calculate plume end coordinates
    const endLat = hotspot.lat + (lengthKm / 111) * Math.cos(driftRad);
    const endLng = hotspot.lng + (lengthKm / (111 * Math.cos(hotspot.lat * Math.PI / 180))) * Math.sin(driftRad);

    // Calculate dispersion cone edges (approx 15 degree lateral dispersion angle)
    const coneAngleRad = (15 * Math.PI) / 180;
    const leftRad = driftRad - coneAngleRad;
    const rightRad = driftRad + coneAngleRad;

    const leftLat = hotspot.lat + (lengthKm * 0.85 / 111) * Math.cos(leftRad);
    const leftLng = hotspot.lng + (lengthKm * 0.85 / (111 * Math.cos(hotspot.lat * Math.PI / 180))) * Math.sin(leftRad);

    const rightLat = hotspot.lat + (lengthKm * 0.85 / 111) * Math.cos(rightRad);
    const rightLng = hotspot.lng + (lengthKm * 0.85 / (111 * Math.cos(hotspot.lat * Math.PI / 180))) * Math.sin(rightRad);

    const hoursToSarawak = Math.round((hotspot.distanceToKuchingKm || 80) / Math.max(windSpeed, 5));

    return {
      start: [hotspot.lat, hotspot.lng],
      end: [endLat, endLng],
      plumePolygon: [
        [hotspot.lat, hotspot.lng],
        [leftLat, leftLng],
        [endLat, endLng],
        [rightLat, rightLng]
      ],
      driftAzimuth,
      windSpeedKmh: windSpeed,
      estimatedArrivalHours: hoursToSarawak
    };
  }

  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }
}

export const firmsService = new NasaFirmsService();
