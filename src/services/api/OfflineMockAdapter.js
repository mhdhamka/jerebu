import { INITIAL_REPORTS } from '@/src/data/initialReports.js';
import { OFFICIAL_STATIONS } from '@/src/data/officialStations.js';
import { fastapiEngine } from '@/src/services/fastapiEngine.js';
import { sanitizeReport } from '@/src/utils/security.js';

const STORAGE_KEY = 'jerebu_local_reports';

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const dLat = (lat2 - lat1) * Math.PI / 180.0;
  const dLon = (lon2 - lon1) * Math.PI / 180.0;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180.0) * Math.cos(lat2 * Math.PI / 180.0) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class OfflineMockAdapter {
  constructor() {
    this.reports = this._loadInitialReports();
    this.stations = [...OFFICIAL_STATIONS];
  }

  _loadInitialReports() {
    let stored = [];
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) stored = JSON.parse(raw);
      } catch (e) {
        console.warn('Failed to parse localStorage reports:', e);
      }
    }
    
    // Combine INITIAL_REPORTS with stored reports
    const combined = [...INITIAL_REPORTS, ...stored];
    const map = new Map();
    combined.forEach(r => {
      // Normalize camelCase to snake_case compatibility
      const normalized = {
        ...r,
        area_name: r.area_name || r.areaName,
        areaName: r.areaName || r.area_name,
        estimated_aqi: r.estimated_aqi || r.estimatedAqi,
        estimatedAqi: r.estimatedAqi || r.estimated_aqi,
        visibility_meters: r.visibility_meters || r.visibilityMeters,
        visibilityMeters: r.visibilityMeters || r.visibility_meters,
        smell_level: r.smell_level || r.smellLevel,
        smellLevel: r.smellLevel || r.smell_level,
        smell_score: r.smell_score || r.smellScore || 3,
        smellScore: r.smellScore || r.smell_score || 3,
        trust_weight: r.trust_weight || r.trustScore || 1.0,
        trustScore: r.trustScore || r.trust_weight || 1.0,
        panic_score: r.panic_score || r.panicScore || 50,
        panicScore: r.panicScore || r.panic_score || 50,
        upvotes: r.upvotes || 1,
        created_at: r.created_at || r.timestamp || new Date().toISOString(),
        timestamp: r.timestamp || r.created_at || new Date().toISOString()
      };
      map.set(normalized.id, sanitizeReport(normalized));
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)
    );
  }

  _persistLocalReports() {
    if (typeof localStorage === 'undefined') return;
    try {
      const initialIds = new Set(INITIAL_REPORTS.map(r => r.id));
      const userAdded = this.reports.filter(r => !initialIds.has(r.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userAdded));
    } catch (e) {
      console.warn('Failed to persist reports to localStorage:', e);
    }
  }

  async fetchReports() {
    return [...this.reports];
  }

  async fetchNearbyReports(lat, lng, radiusKm = 50) {
    return this.reports.filter(r => {
      const dist = haversineKm(lat, lng, r.lat, r.lng);
      return dist <= radiusKm;
    });
  }

  async createReport(reportData) {
    const visibility = reportData.visibility_meters || reportData.visibilityMeters || 1000;
    const smell = reportData.smell_score || reportData.smellScore || 3;
    
    // Calculate estimate if missing
    let baseAqi = 75;
    if (visibility <= 300) baseAqi = 240;
    else if (visibility <= 600) baseAqi = 195;
    else if (visibility <= 1000) baseAqi = 160;
    else if (visibility <= 2000) baseAqi = 120;
    if (smell >= 4) baseAqi += 25;

    const estimatedAqi = reportData.estimated_aqi || reportData.estimatedAqi || baseAqi;

    // Run client NLP panic evaluation
    const panicAnalysis = fastapiEngine.analyzeDistressText(
      reportData.description || '',
      reportData.symptoms || [],
      visibility,
      smell
    );

    const now = new Date().toISOString();
    const newReport = sanitizeReport({
      id: reportData.id || `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reporterName: reportData.reporterName || 'Citizen Contributor',
      reporterRole: reportData.reporterRole || 'Community Reporter',
      reporterType: 'verified_citizen',
      trustScore: reportData.trustScore || reportData.trust_weight || 1.2,
      trust_weight: reportData.trust_weight || reportData.trustScore || 1.2,
      areaName: reportData.areaName || reportData.area_name,
      area_name: reportData.area_name || reportData.areaName,
      city: reportData.city || 'Sarawak',
      region: reportData.region || 'Sarawak',
      lat: Number(reportData.lat),
      lng: Number(reportData.lng),
      visibilityMeters: visibility,
      visibility_meters: visibility,
      visibilityLabel: `${visibility}m visibility`,
      smellLevel: reportData.smellLevel || reportData.smell_level || 'Noticeable',
      smell_level: reportData.smell_level || reportData.smellLevel || 'Noticeable',
      smellScore: smell,
      smell_score: smell,
      estimatedAqi,
      estimated_aqi: estimatedAqi,
      symptoms: reportData.symptoms || [],
      description: reportData.description || '',
      timestamp: now,
      created_at: now,
      verified: true,
      upvotes: 1,
      panicScore: panicAnalysis.panicScore,
      panic_score: panicAnalysis.panicScore,
      panicTier: panicAnalysis.panicTier,
      panicTriggerWords: panicAnalysis.detectedTriggers
    });

    this.reports.unshift(newReport);
    this._persistLocalReports();
    return newReport;
  }

  async upvoteReport(reportId) {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) throw new Error('Report not found');
    report.upvotes = (report.upvotes || 0) + 1;
    report.trustScore = Math.min(3.0, Number(((report.trustScore || 1.0) + 0.1).toFixed(1)));
    report.trust_weight = report.trustScore;
    this._persistLocalReports();
    return {
      status: 'success',
      upvotes: report.upvotes,
      trust_weight: report.trust_weight
    };
  }

  async fetchStations() {
    return [...this.stations];
  }

  async fetchAnomalies(epsKm = 8.5, minSamples = 2) {
    return fastapiEngine.clusterReports(this.reports, this.stations, epsKm, minSamples);
  }

  async analyzePanic(text, symptoms = [], visibilityMeters = 2000, smellScore = 3) {
    return fastapiEngine.analyzeDistressText(text, symptoms, visibilityMeters, smellScore);
  }
}
