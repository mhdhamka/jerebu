/**
 * HttpBackendAdapter
 * Connects directly to the consolidated FastAPI async backend engine.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export class HttpBackendAdapter {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async fetchReports() {
    const res = await fetch(`${this.baseUrl}/api/v1/reports`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch reports`);
    const json = await res.json();
    return json.data || [];
  }

  async fetchNearbyReports(lat, lng, radiusKm = 50) {
    const res = await fetch(`${this.baseUrl}/api/v1/reports/geosearch?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Geospatial query failed`);
    const json = await res.json();
    return json.data || [];
  }

  async createReport(reportData) {
    const res = await fetch(`${this.baseUrl}/api/v1/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(reportData)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to submit report`);
    const json = await res.json();
    return json.data;
  }

  async upvoteReport(reportId) {
    const res = await fetch(`${this.baseUrl}/api/v1/reports/${reportId}/upvote`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to upvote report`);
    return await res.json();
  }

  async fetchStations() {
    const res = await fetch(`${this.baseUrl}/api/v1/stations`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch stations`);
    const json = await res.json();
    return json.data || [];
  }

  async fetchAnomalies(epsKm = 8.5, minSamples = 2) {
    const res = await fetch(`${this.baseUrl}/api/v1/anomalies?eps_km=${epsKm}&min_samples=${minSamples}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to compute anomalies`);
    return await res.json();
  }

  async analyzePanic(text, symptoms = [], visibilityMeters = 2000, smellScore = 3) {
    const res = await fetch(`${this.baseUrl}/api/ai/sentiment-panic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        symptoms,
        visibility_meters: visibilityMeters,
        smell_score: smellScore
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to analyze panic`);
    return await res.json();
  }
}
