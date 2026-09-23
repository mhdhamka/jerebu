/**
 * Anti-Spoofing & Consensus Attestation Reputation Engine
 * Validates GPS accuracy, detects telemetry anomalies, and evaluates peer consensus
 * without relying on centralized or untrusted single reports.
 */

import { calculateDistanceKm } from '../data/sarawakLocations.js';

export class ReputationEngine {
  constructor() {
    this.sessionLocations = [];
    this.MAX_VELOCITY_KMH = 180; // Impossible ground speed threshold
    this.MAX_REASONABLE_ACCURACY_M = 400; // Acceptable browser GPS accuracy radius
  }

  /**
   * Validates client GPS metadata for spoofing indicators.
   * @param {Object} coords { lat, lng, accuracy }
   * @param {number} timestamp
   * @returns {Object} validation result
   */
  validateGpsIntegrity(coords, timestamp = Date.now()) {
    const flags = [];
    let isPlausible = true;
    let confidenceDeduction = 0;

    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
      return {
        isValid: false,
        isPlausible: false,
        flags: ['INVALID_COORDINATES'],
        confidenceScore: 0
      };
    }

    // 1. Boundary check for Southeast Asia / Borneo regional bounds
    if (coords.lat < -11.0 || coords.lat > 10.0 || coords.lng < 95.0 || coords.lng > 141.0) {
      flags.push('OUT_OF_REGION_BOUNDS');
      isPlausible = false;
      confidenceDeduction += 50;
    }

    // 2. GPS accuracy radius verification
    if (typeof coords.accuracy === 'number') {
      if (coords.accuracy > 1000) {
        flags.push('LOW_GPS_ACCURACY');
        confidenceDeduction += 30;
      } else if (coords.accuracy > this.MAX_REASONABLE_ACCURACY_M) {
        flags.push('MODERATE_GPS_ACCURACY');
        confidenceDeduction += 15;
      }
    }

    // 3. Teleportation / high-velocity movement check
    if (this.sessionLocations.length > 0) {
      const last = this.sessionLocations[this.sessionLocations.length - 1];
      const timeDiffHours = Math.max(0.001, (timestamp - last.timestamp) / (1000 * 3600));
      const distKm = calculateDistanceKm(coords.lat, coords.lng, last.lat, last.lng);
      const velocity = distKm / timeDiffHours;

      if (velocity > this.MAX_VELOCITY_KMH && distKm > 20) {
        flags.push('IMPOSSIBLE_VELOCITY');
        isPlausible = false;
        confidenceDeduction += 60;
      }
    }

    // Record location into session history (max 10 entries)
    this.sessionLocations.push({
      lat: coords.lat,
      lng: coords.lng,
      timestamp
    });
    if (this.sessionLocations.length > 10) {
      this.sessionLocations.shift();
    }

    const confidenceScore = Math.max(0, Math.min(100, 100 - confidenceDeduction));

    return {
      isValid: true,
      isPlausible,
      accuracy: coords.accuracy || null,
      flags,
      confidenceScore
    };
  }

  /**
   * Evaluates consensus across neighboring reports within radius and time window.
   * @param {Object} targetReport 
   * @param {Array} allReports 
   * @param {number} radiusKm (default: 6.0km)
   * @param {number} timeWindowMinutes (default: 90 min)
   * @returns {Object} consensus attestation
   */
  evaluateConsensus(targetReport, allReports = [], radiusKm = 6.0, timeWindowMinutes = 90) {
    if (!targetReport || !Array.isArray(allReports)) {
      return {
        status: 'single_source',
        corroborationCount: 1,
        trustMultiplier: 1.0,
        consensusScore: 40,
        label: 'SINGLE SOURCE'
      };
    }

    const targetTime = targetReport.created_at ? new Date(targetReport.created_at).getTime() : Date.now();
    const targetAqi = Number(targetReport.estimatedAqi || targetReport.estimated_aqi || 100);

    // Filter peers within radius and temporal threshold
    const peers = allReports.filter(r => {
      if (String(r.id) === String(targetReport.id)) return false;
      if (typeof r.lat !== 'number' || typeof r.lng !== 'number') return false;

      const d = calculateDistanceKm(targetReport.lat, targetReport.lng, r.lat, r.lng);
      if (d > radiusKm) return false;

      const peerTime = r.created_at ? new Date(r.created_at).getTime() : Date.now();
      const diffMin = Math.abs(targetTime - peerTime) / (1000 * 60);
      return diffMin <= timeWindowMinutes;
    });

    const corroborationCount = peers.length + 1;

    // Check AQI reading similarity (peers within +-35 AQI points)
    const similarPeers = peers.filter(p => {
      const pAqi = Number(p.estimatedAqi || p.estimated_aqi || 100);
      return Math.abs(pAqi - targetAqi) <= 35;
    });

    // Check odor or symptom alignment
    const targetSmell = (targetReport.smellLevel || targetReport.smell_level || '').toLowerCase();
    const odorAligned = peers.filter(p => {
      const pSmell = (p.smellLevel || p.smell_level || '').toLowerCase();
      return pSmell === targetSmell && targetSmell !== 'none';
    });

    let status = 'single_source';
    let label = 'SINGLE SOURCE';
    let trustMultiplier = 1.0;
    let consensusScore = Math.min(60, 30 + peers.length * 10);

    if (similarPeers.length >= 2 || (peers.length >= 2 && odorAligned.length >= 1)) {
      status = 'consensus_verified';
      label = `CONSENSUS VERIFIED [${corroborationCount} SOURCES]`;
      trustMultiplier = Math.min(2.5, 1.5 + (similarPeers.length * 0.3));
      consensusScore = Math.min(100, 70 + similarPeers.length * 10);
    } else if (peers.length >= 3 && similarPeers.length === 0) {
      // Disagreeing peers within tight radius -> divergence anomaly
      status = 'conflicting';
      label = 'CONFLICTING LOCAL READINGS';
      trustMultiplier = 0.8;
      consensusScore = 45;
    }

    // Generate deterministic verification signature
    const hashSeed = `${targetReport.id}_${corroborationCount}_${targetAqi}`;
    let hash = 0;
    for (let i = 0; i < hashSeed.length; i++) {
      hash = ((hash << 5) - hash) + hashSeed.charCodeAt(i);
      hash |= 0;
    }
    const attestationHash = 'attest_' + Math.abs(hash).toString(16).padStart(8, '0');

    return {
      status,
      label,
      corroborationCount,
      peersInRadius: peers.length,
      similarPeersCount: similarPeers.length,
      trustMultiplier: Number(trustMultiplier.toFixed(2)),
      consensusScore,
      attestationHash
    };
  }

  /**
   * Annotates a list of reports with consensus metadata.
   */
  annotateReports(reports = []) {
    return reports.map(r => {
      const consensus = this.evaluateConsensus(r, reports);
      return {
        ...r,
        consensusStatus: consensus.status,
        consensusLabel: consensus.label,
        corroborationCount: consensus.corroborationCount,
        consensusScore: consensus.consensusScore,
        attestationHash: consensus.attestationHash,
        effectiveTrustScore: Number(((r.trustScore || r.trust_weight || 1.0) * consensus.trustMultiplier).toFixed(2))
      };
    });
  }
}

export const reputationEngine = new ReputationEngine();
