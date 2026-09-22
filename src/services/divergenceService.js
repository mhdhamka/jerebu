/**
 * Ground Truth "Reality Check" (Crowd vs. Official Sensor Divergence Engine)
 * Automatically detects discrepancies between official government stations and
 * ground-level resident reports within a given radius.
 */

export class DivergenceService {
  /**
   * Scans official stations and community reports for localized divergence anomalies.
   * @param {Array} officialStations 
   * @param {Array} reports 
   * @param {Number} radiusKm 
   * @returns {Array} divergenceAlerts
   */
  detectDivergences(officialStations = [], reports = [], radiusKm = 30) {
    const alerts = [];

    if (!Array.isArray(officialStations) || !Array.isArray(reports)) {
      return alerts;
    }

    for (const station of officialStations) {
      if (!station || typeof station.lat !== 'number' || typeof station.lng !== 'number') {
        continue;
      }

      // Find reports within radius
      const nearbyReports = reports.filter(rep => {
        if (!rep || typeof rep.lat !== 'number' || typeof rep.lng !== 'number') return false;
        const d = this.haversineDistance(station.lat, station.lng, rep.lat, rep.lng);
        return d <= radiusKm;
      });

      if (nearbyReports.length < 1) continue;

      // Calculate citizen perceived average AQI
      const citizenAqis = nearbyReports.map(r => Number(r.aqi || r.estimatedAqi) || this.estimateAqiFromReport(r));
      const avgCitizenAqi = Math.round(citizenAqis.reduce((a, b) => a + b, 0) / citizenAqis.length);
      const officialAqi = Number(station.aqi) || 0;
      const delta = avgCitizenAqi - officialAqi;

      // Divergence threshold (delta >= 25 AQI points difference)
      if (Math.abs(delta) >= 25) {
        const isCitizenHigher = delta > 0;
        const lowVisCount = nearbyReports.filter(r => 
          (r.visibility && r.visibility.includes('<')) || 
          (r.visibilityKm && r.visibilityKm < 1.0) ||
          (r.visibilityMeters && r.visibilityMeters < 1000)
        ).length;
        const odorCount = nearbyReports.filter(r => 
          (r.odor && r.odor !== 'None') || 
          (r.smellLevel && r.smellLevel !== 'None') ||
          (r.description && (r.description.toLowerCase().includes('smell') || r.description.toLowerCase().includes('bau'))) ||
          (r.comment && (r.comment.toLowerCase().includes('smell') || r.comment.toLowerCase().includes('bau')))
        ).length;

        alerts.push({
          id: `DIV_${station.id}`,
          stationId: station.id,
          stationName: station.name,
          city: station.city,
          lat: station.lat,
          lng: station.lng,
          officialAqi,
          officialStatus: station.status || 'Active',
          avgCitizenAqi,
          citizenAqi: avgCitizenAqi,
          delta: Math.abs(delta),
          deltaAqi: Math.abs(delta),
          isDivergent: true,
          direction: isCitizenHigher ? 'UNDERREPORTING' : 'OVERREPORTING',
          severity: Math.abs(delta) > 60 ? 'CRITICAL' : 'HIGH',
          nearbyCount: nearbyReports.length,
          lowVisCount,
          odorCount,
          radiusKm,
          probableCauses: isCitizenHigher ? [
            'Official APIMS station reporting lag (typically 1–2 hour processing delay)',
            'Localized peat smoke plume trapped in residential river basin / valley',
            'Ground-level smoke inversion not reaching elevated tower sensors'
          ] : [
            'Localized open burning extinguished recently',
            'Strong local sea breeze clearing valley ahead of station'
          ],
          summary: isCitizenHigher
            ? `Station reports ${officialAqi} (${station.status || 'Active'}), but ${nearbyReports.length} nearby residents report heavy smoke averaging ~${avgCitizenAqi} AQI (${odorCount} reporting pungent burning odor).`
            : `Station reports ${officialAqi}, but nearby resident readings average lower at ~${avgCitizenAqi}.`,
          reason: isCitizenHigher
            ? `Ground-level smoke trapped in residential areas. ${nearbyReports.length} citizen reports average ~${avgCitizenAqi} AQI.`
            : `Station reports higher readings while localized ground reports indicate clearing conditions.`,
          timestamp: new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
        });
      }
    }

    return alerts.sort((a, b) => b.delta - a.delta);
  }

  /**
   * Alias for detectDivergences for backward/forward compatibility
   */
  calculateDivergence(officialStations = [], reports = [], radiusKm = 30) {
    return this.detectDivergences(officialStations, reports, radiusKm);
  }

  estimateAqiFromReport(r) {
    if (r.aqi) return Number(r.aqi);
    if (r.estimatedAqi) return Number(r.estimatedAqi);

    // Estimate from visibility and odor if explicit AQI was omitted
    let est = 75;
    if (r.visibility === '<500m' || (r.visibilityKm && r.visibilityKm <= 0.5) || (r.visibilityMeters && r.visibilityMeters <= 500)) est += 80;
    else if (r.visibility === '<1km' || (r.visibilityKm && r.visibilityKm <= 1.0) || (r.visibilityMeters && r.visibilityMeters <= 1000)) est += 50;
    else if (r.visibility === '1-3km' || (r.visibilityMeters && r.visibilityMeters <= 3000)) est += 25;

    if (r.odor === 'Strong Burning' || r.odor === 'Heavy Peat Smolder' || (r.smellScore && r.smellScore >= 4)) est += 35;
    else if (r.odor === 'Moderate Smoke' || (r.smellScore && r.smellScore >= 2)) est += 15;

    return Math.min(350, est);
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
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

export const divergenceEngine = new DivergenceService();
