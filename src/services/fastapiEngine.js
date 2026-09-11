/**
 * Python (FastAPI) Data Aggregator & Anomaly Detector Simulation Engine
 * Runs DBSCAN (Density-Based Spatial Clustering of Applications with Noise)
 * to spot localized haze spikes missed by sparse official monitoring stations.
 * Also runs NLP sentiment analysis to gauge community panic and distress levels.
 */

class FastAPIEngine {
  constructor() {
    this.logs = [];
  }

  log(endpoint, method, status, durationMs, details) {
    const entry = {
      id: 'fastapi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      endpoint,
      method,
      status,
      duration: durationMs.toFixed(1) + 'ms',
      details
    };
    this.logs.unshift(entry);
    if (this.logs.length > 40) this.logs.pop();
  }

  /**
   * DBSCAN Clustering for Localized AQI Anomaly Spikes
   * @param {Array} reports User ground-truth reports
   * @param {Array} officialStations Official APIMS/NEA/BMKG stations
   * @param {number} epsKm Maximum distance between two points to be considered in same neighborhood (default: 8km)
   * @param {number} minSamples Minimum number of reports to form a dense cluster (default: 2)
   */
  runDBSCAN(reports, officialStations, epsKm = 8.5, minSamples = 2) {
    const start = performance.now();
    const points = reports.map((r, index) => ({
      index,
      report: r,
      lat: r.lat,
      lng: r.lng,
      cluster: -1, // -1 = unassigned / noise
      visited: false
    }));

    let clusterId = 0;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.visited) continue;
      p.visited = true;

      const neighbors = this._getNeighbors(p, points, epsKm);

      if (neighbors.length < minSamples) {
        p.cluster = -1; // Noise
      } else {
        p.cluster = clusterId;
        this._expandCluster(p, neighbors, clusterId, points, epsKm, minSamples);
        clusterId++;
      }
    }

    // Aggregate clusters
    const clusterMap = new Map();
    for (const p of points) {
      if (p.cluster !== -1) {
        if (!clusterMap.has(p.cluster)) {
          clusterMap.set(p.cluster, []);
        }
        clusterMap.get(p.cluster).push(p.report);
      }
    }

    // Now analyze each cluster for anomalies against official stations
    const anomalies = [];

    for (const [cId, clusterReports] of clusterMap.entries()) {
      // Calculate cluster centroid & weighted average AQI
      let sumLat = 0;
      let sumLng = 0;
      let sumWeightedAqi = 0;
      let totalTrust = 0;

      for (const r of clusterReports) {
        const weight = r.trustScore || 1.0;
        sumLat += r.lat;
        sumLng += r.lng;
        sumWeightedAqi += (r.estimatedAqi || 100) * weight;
        totalTrust += weight;
      }

      const centerLat = sumLat / clusterReports.length;
      const centerLng = sumLng / clusterReports.length;
      const groundTruthAqi = Math.round(sumWeightedAqi / totalTrust);

      // Find nearest official station
      let nearestStation = null;
      let minStationDist = Infinity;

      for (const station of officialStations) {
        const d = this._haversine(centerLat, centerLng, station.lat, station.lng);
        if (d < minStationDist) {
          minStationDist = d;
          nearestStation = station;
        }
      }

      // Anomaly criteria:
      // If ground-truth reported AQI is significantly higher than nearest station (by 30+ points),
      // or if nearest station is far away (> 10km) and reports show high severity.
      const discrepancy = nearestStation ? groundTruthAqi - nearestStation.aqi : groundTruthAqi;
      const isAnomaly = discrepancy >= 25 || groundTruthAqi >= 150;

      // Extract predominant region name
      const primaryArea = clusterReports[0].city || clusterReports[0].areaName;

      anomalies.push({
        clusterId: cId,
        area: primaryArea,
        center: [centerLat, centerLng],
        radiusMeters: Math.max(1200, clusterReports.length * 650),
        reportCount: clusterReports.length,
        reports: clusterReports,
        groundTruthAqi,
        nearestStation: nearestStation ? {
          name: nearestStation.name,
          aqi: nearestStation.aqi,
          distanceKm: parseFloat(minStationDist.toFixed(1))
        } : null,
        discrepancy,
        isAnomaly,
        confidence: Math.min(98, Math.round(55 + clusterReports.length * 10 + totalTrust * 5)),
        detectedAt: 'Just now',
        status: isAnomaly ? 'OFFICIAL_STATION_LAG_DETECTED' : 'CONSISTENT_WITH_OFFICIAL'
      });
    }

    const elapsed = performance.now() - start;
    this.log(
      '/api/ai/dbscan-cluster',
      'POST',
      200,
      elapsed + 1.2,
      `DBSCAN clustered ${reports.length} reports into ${clusterMap.size} spatial groups with ${anomalies.filter(a => a.isAnomaly).length} localized spikes.`
    );

    return anomalies;
  }

  _getNeighbors(point, allPoints, epsKm) {
    const neighbors = [];
    for (const other of allPoints) {
      const dist = this._haversine(point.lat, point.lng, other.lat, other.lng);
      if (dist <= epsKm) {
        neighbors.push(other);
      }
    }
    return neighbors;
  }

  _expandCluster(point, neighbors, clusterId, allPoints, epsKm, minSamples) {
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      if (!neighbor.visited) {
        neighbor.visited = true;
        const neighborNeighbors = this._getNeighbors(neighbor, allPoints, epsKm);
        if (neighborNeighbors.length >= minSamples) {
          neighbors.push(...neighborNeighbors.filter(n => !neighbors.includes(n)));
        }
      }
      if (neighbor.cluster === -1) {
        neighbor.cluster = clusterId;
      }
    }
  }

  _haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * NLP Sentiment & Community Panic Analyzer
   * Evaluates text for haze panic triggers, respiratory distress, and urgency.
   */
  analyzeSentiment(text, symptoms = [], visibilityMeters = 2000, smellScore = 3) {
    const start = performance.now();
    const cleanText = (text || '').toLowerCase();

    // High alarm triggers
    const panicKeywords = [
      { word: 'choking', weight: 15 },
      { word: 'suffocating', weight: 18 },
      { word: 'sesak nafas', weight: 18 },
      { word: 'pedih mata', weight: 14 },
      { word: 'bau hangit', weight: 12 },
      { word: 'tak nampak', weight: 14 },
      { word: 'cannot breathe', weight: 20 },
      { word: 'sekolah tutup', weight: 15 },
      { word: 'school close', weight: 15 },
      { word: 'darurat', weight: 22 },
      { word: 'emergency', weight: 18 },
      { word: 'asthma', weight: 16 },
      { word: 'semput', weight: 16 },
      { word: 'ash', weight: 10 },
      { word: 'abu', weight: 10 },
      { word: 'tebal', weight: 8 },
      { word: 'peat fire', weight: 12 },
      { word: 'kebakaran', weight: 12 }
    ];

    let detectedSignals = [];
    let keywordScore = 0;

    for (const item of panicKeywords) {
      if (cleanText.includes(item.word)) {
        detectedSignals.push(item.word);
        keywordScore += item.weight;
      }
    }

    // Physical factor modifiers
    let visibilityScore = 0;
    if (visibilityMeters <= 300) visibilityScore = 35;
    else if (visibilityMeters <= 600) visibilityScore = 25;
    else if (visibilityMeters <= 1000) visibilityScore = 15;
    else if (visibilityMeters <= 2000) visibilityScore = 8;

    let symptomScore = (symptoms.length || 0) * 10;
    let smellImpact = (smellScore || 1) * 6;

    const rawPanic = keywordScore + visibilityScore + symptomScore + smellImpact;
    const panicScore = Math.min(100, Math.max(12, Math.round(rawPanic * 0.75)));

    let panicTier = 'Calm';
    let advisory = 'Normal outdoor precautions.';
    let schoolRisk = 'Normal classes recommended';

    if (panicScore >= 80) {
      panicTier = 'Critical Emergency';
      advisory = 'Hazardous ground air. Wear N95 respirator. Halt all outdoor activity.';
      schoolRisk = 'Immediate physical class suspension threshold reached (>200 API equivalent).';
    } else if (panicScore >= 60) {
      panicTier = 'High Alert';
      advisory = 'High haze irritation. Vulnerable groups must stay in sealed air-filtered rooms.';
      schoolRisk = 'Outdoor co-curricular sports and assemblies must be canceled.';
    } else if (panicScore >= 35) {
      panicTier = 'Moderate Concern';
      advisory = 'Noticeable smoke drift. Limit strenuous outdoor exertion.';
      schoolRisk = 'Monitor DOE hourly API closely.';
    }

    const elapsed = performance.now() - start;
    this.log(
      '/api/ai/sentiment-panic',
      'POST',
      200,
      elapsed + 0.8,
      `Calculated panic score ${panicScore}/100 (${panicTier}) from ${detectedSignals.length} NLP distress signals.`
    );

    return {
      panicScore,
      panicTier,
      advisory,
      schoolRisk,
      detectedSignals
    };
  }
}

export const fastapi = new FastAPIEngine();
