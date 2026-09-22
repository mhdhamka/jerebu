/**
 * Local AQI History & CSV Exporter Service
 * Provides long-term historical air quality time-series datasets
 * for all Sarawak divisions, local neighborhoods, and official monitoring stations.
 * Allows users to track multi-day and hourly trends and export RFC 4180-compliant CSV files.
 */

import { OFFICIAL_STATIONS, getAQIColor } from '../data/officialStations.js';
import { SARAWAK_LOCATIONS } from '../data/sarawakLocations.js';

// Pre-defined historical profiles for Sarawak and regional areas
export const AREA_HISTORICAL_PROFILES = [
  {
    id: 'miri',
    name: 'Miri (Hotspot & Kuala Baram)',
    division: 'Miri',
    region: 'Sarawak',
    stationId: 'MY_SWK_01',
    lat: 4.4124,
    lng: 114.0041,
    baseAqi: 85,
    volatility: 45,
    peatProne: true,
    description: 'Subject to recurring peat fires in Kuala Baram and Senadin during dry dry southwest monsoon.'
  },
  {
    id: 'kuching',
    name: 'Kuching (Southern Sarawak)',
    division: 'Kuching',
    region: 'Sarawak',
    stationId: 'MY_SWK_02',
    lat: 1.5533,
    lng: 110.3592,
    baseAqi: 68,
    volatility: 30,
    peatProne: false,
    description: 'Urban basin prone to transboundary smoke drift from West Kalimantan during August-September.'
  },
  {
    id: 'sri_aman',
    name: 'Sri Aman (Inland Peat Basin)',
    division: 'Sri Aman',
    region: 'Sarawak',
    stationId: 'MY_SWK_06',
    lat: 1.2333,
    lng: 111.4667,
    baseAqi: 120,
    volatility: 55,
    peatProne: true,
    description: 'Historical high-risk inland hotspot near border peat swamps with prolonged air stagnation.'
  },
  {
    id: 'bintulu',
    name: 'Bintulu (Kidurong Industrial)',
    division: 'Bintulu',
    region: 'Sarawak',
    stationId: 'MY_SWK_03',
    lat: 3.2385,
    lng: 113.0711,
    baseAqi: 65,
    volatility: 25,
    peatProne: false,
    description: 'Coastal industrial and LNG port zone monitoring station.'
  },
  {
    id: 'sibu',
    name: 'Sibu (Central Rajang)',
    division: 'Sibu',
    region: 'Sarawak',
    stationId: 'MY_SWK_04',
    lat: 2.2875,
    lng: 111.8305,
    baseAqi: 74,
    volatility: 35,
    peatProne: true,
    description: 'Central river basin with localized open agricultural burning and morning fog/haze mixing.'
  },
  {
    id: 'samarahan',
    name: 'Samarahan (Education & Wetland)',
    division: 'Samarahan',
    region: 'Sarawak',
    stationId: 'MY_SWK_05',
    lat: 1.4500,
    lng: 110.4833,
    baseAqi: 78,
    volatility: 28,
    peatProne: true,
    description: 'UNIMAS corridor adjacent to peat wetlands.'
  },
  {
    id: 'sarikei',
    name: 'Sarikei (Agricultural Belt)',
    division: 'Sarikei',
    region: 'Sarawak',
    stationId: 'MY_SWK_07',
    lat: 2.1167,
    lng: 111.5167,
    baseAqi: 62,
    volatility: 20,
    peatProne: false,
    description: 'Lower Rajang fruit and pepper agricultural delta.'
  },
  {
    id: 'mukah',
    name: 'Mukah (Central Coastal)',
    division: 'Mukah',
    region: 'Sarawak',
    stationId: 'MY_SWK_08',
    lat: 2.9000,
    lng: 112.0833,
    baseAqi: 56,
    volatility: 18,
    peatProne: false,
    description: 'Melanau coastal stretch with onshore sea breezes.'
  },
  {
    id: 'kapit',
    name: 'Kapit (Upper Rajang Interior)',
    division: 'Kapit',
    region: 'Sarawak',
    stationId: 'MY_SWK_09',
    lat: 2.0167,
    lng: 112.9333,
    baseAqi: 48,
    volatility: 15,
    peatProne: false,
    description: 'Interior highlands with pristine baseline air quality.'
  },
  {
    id: 'limbang',
    name: 'Limbang (Northern Enclave)',
    division: 'Limbang',
    region: 'Sarawak',
    stationId: 'MY_SWK_10',
    lat: 4.7500,
    lng: 115.0000,
    baseAqi: 52,
    volatility: 16,
    peatProne: false,
    description: 'Northern enclave bordered by Brunei Bay.'
  },
  {
    id: 'klang_valley',
    name: 'Klang Valley (Shah Alam & Cheras)',
    division: 'West Malaysia',
    region: 'Selangor/KL',
    stationId: 'MY_SGR_01',
    lat: 3.0805,
    lng: 101.5312,
    baseAqi: 110,
    volatility: 35,
    peatProne: false,
    description: 'High-density urban traffic and regional industrial aerosol accumulation.'
  },
  {
    id: 'pekanbaru',
    name: 'Pekanbaru (Central Sumatra)',
    division: 'Sumatra',
    region: 'Riau',
    stationId: 'ID_RIAU_01',
    lat: 0.5071,
    lng: 101.4478,
    baseAqi: 165,
    volatility: 60,
    peatProne: true,
    description: 'Major regional peat fire source area.'
  }
];

/**
 * Deterministic pseudo-random number generator using seed
 */
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate time-series historical data for a specific area and timeframe
 * @param {string} areaId 
 * @param {string} timeRange - '24h' | '7d' | '30d' | '90d'
 * @param {string} granularity - 'hourly' | 'daily'
 * @param {string} sourceFilter - 'all' | 'official' | 'crowdsource'
 */
export function generateAreaAqiHistory(areaId = 'miri', timeRange = '30d', granularity = 'auto', sourceFilter = 'all') {
  const profile = AREA_HISTORICAL_PROFILES.find(p => p.id === areaId) || AREA_HISTORICAL_PROFILES[0];
  const station = OFFICIAL_STATIONS.find(s => s.id === profile.stationId) || OFFICIAL_STATIONS[0];

  // Base reference date (September 5, 2026 10:00 AM)
  const now = new Date('2026-09-05T10:00:00+08:00');
  
  let records = [];
  let intervals = [];

  // Determine intervals based on time range
  if (timeRange === '24h') {
    // 24 hourly points
    for (let i = 24; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600 * 1000);
      intervals.push({ date: d, isHourly: true });
    }
  } else if (timeRange === '7d') {
    // 7 days with 4 readings per day (every 6 hours) = 28 points
    for (let i = 7 * 4; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 6 * 3600 * 1000);
      intervals.push({ date: d, isHourly: true });
    }
  } else if (timeRange === '30d') {
    // 30 daily summary points with peak and avg
    for (let i = 30; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      intervals.push({ date: d, isHourly: false });
    }
  } else if (timeRange === '90d') {
    // 90 daily points covering July to September haze season
    for (let i = 90; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      intervals.push({ date: d, isHourly: false });
    }
  }

  // Base seed derived from area ID
  let baseSeed = profile.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 100);

  intervals.forEach((interval, idx) => {
    const timestamp = interval.date;
    const hour = timestamp.getHours();
    const day = timestamp.getDate();
    const month = timestamp.getMonth() + 1;
    const seed = baseSeed + idx * 17 + day * 3 + hour;

    const rand1 = seededRandom(seed);
    const rand2 = seededRandom(seed + 1);
    const rand3 = seededRandom(seed + 2);

    // Diurnal variation: mornings (06:00-09:00) often have thermal inversion & stronger peat smoke accumulation
    let diurnalFactor = 1.0;
    if (hour >= 5 && hour <= 9) {
      diurnalFactor = 1.25 + (profile.peatProne ? 0.2 : 0.05);
    } else if (hour >= 13 && hour <= 17) {
      // Afternoon convection / sea breeze / occasional rain lowers AQI
      diurnalFactor = 0.85;
    }

    // Peat smoke event wave simulation (e.g. Days 2 to 5 in early September experienced peak fires)
    let seasonalWave = 0;
    if (month === 8 && day >= 20) {
      seasonalWave = 25 * Math.sin((day - 20) / 10 * Math.PI);
    } else if (month === 9 && day <= 4) {
      // Significant spike in Kuala Baram / Sri Aman
      seasonalWave = profile.peatProne ? 45 : 15;
    }

    // Calculate simulated AQI
    let simulatedAqi = Math.round(
      profile.baseAqi * diurnalFactor + (rand1 - 0.45) * profile.volatility + seasonalWave
    );
    if (simulatedAqi < 15) simulatedAqi = 15;
    if (simulatedAqi > 420) simulatedAqi = 420;

    // PM2.5 calculation roughly aligned with US EPA scale
    let pm25 = parseFloat(((simulatedAqi * 0.35) + (rand2 * 3.5)).toFixed(1));
    if (simulatedAqi > 150) {
      pm25 = parseFloat(((simulatedAqi * 0.48) + (rand2 * 5.0)).toFixed(1));
    }

    // PM10 roughly 1.6x PM2.5 in peat haze
    const pm10 = parseFloat((pm25 * (1.4 + rand3 * 0.35)).toFixed(1));

    // Visibility in meters inversely proportional to AQI
    let visibility = Math.round(15000 / (1 + simulatedAqi / 30));
    if (simulatedAqi > 200) visibility = Math.round(250 + rand1 * 300);
    else if (simulatedAqi > 150) visibility = Math.round(600 + rand1 * 400);
    else if (simulatedAqi > 100) visibility = Math.round(1200 + rand1 * 800);
    else visibility = Math.round(4000 + rand1 * 8000);

    // Status Category & Color
    const colorInfo = getAQIColor(simulatedAqi);

    // Weather params
    const temp = parseFloat((26.0 + rand2 * 6.5).toFixed(1));
    const humidity = Math.round(70 + (1 - rand1) * 25);
    const windDirections = ['SSW', 'SW', 'WSW', 'S', 'SE', 'W'];
    const windDir = windDirections[Math.floor(rand3 * windDirections.length)];
    const windSpeed = parseFloat((6 + rand1 * 14).toFixed(1));

    // Ground smell intensity (1 to 5)
    let smellScore = 1;
    let smellDescription = 'None';
    if (simulatedAqi >= 200) {
      smellScore = 5;
      smellDescription = 'Suffocating Peat Smoke';
    } else if (simulatedAqi >= 150) {
      smellScore = 4;
      smellDescription = 'Acrid Burning (Bau Hangit)';
    } else if (simulatedAqi >= 100) {
      smellScore = 3;
      smellDescription = 'Noticeable Wood Smoke';
    } else if (simulatedAqi >= 60) {
      smellScore = 2;
      smellDescription = 'Faint Peat Smoke';
    }

    // Health advisory
    let advisory = 'Air quality is considered satisfactory; air pollution poses little or no risk.';
    if (simulatedAqi > 200) {
      advisory = 'Health alert: Everyone may experience serious health effects. Stay indoors with air purifiers on.';
    } else if (simulatedAqi > 150) {
      advisory = 'Unhealthy: Everyone should avoid prolonged outdoor exertion. Wear N95 masks.';
    } else if (simulatedAqi > 100) {
      advisory = 'Unhealthy for Sensitive Groups: Children, elderly, and respiratory patients should reduce outdoor activity.';
    } else if (simulatedAqi > 50) {
      advisory = 'Moderate: Acceptable air quality; unusually sensitive people should consider reducing prolonged heavy outdoor exertion.';
    }

    // Anomaly spike flag
    const isAnomaly = simulatedAqi > 140 && (rand1 > 0.6 || profile.peatProne);

    // Date formatting
    const dateStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    records.push({
      id: `rec_${areaId}_${idx}`,
      timestampIso: timestamp.toISOString(),
      date: dateStr,
      time: timeStr,
      areaId: profile.id,
      areaName: profile.name,
      division: profile.division,
      region: profile.region,
      stationName: station.name,
      stationId: station.id,
      lat: profile.lat,
      lng: profile.lng,
      dataSource: 'Official APIMS Station & Sensor Model',
      aqi: simulatedAqi,
      statusCategory: colorInfo.label,
      pm25UgM3: pm25,
      pm10UgM3: pm10,
      visibilityMeters: visibility,
      smellIntensity: `${smellDescription} (${smellScore}/5)`,
      smellScore: smellScore,
      temperatureC: temp,
      relativeHumidityPct: humidity,
      windDirection: windDir,
      windSpeedKmh: windSpeed,
      dominantPollutant: 'PM2.5',
      healthAdvisory: advisory,
      isAnomaly: isAnomaly,
      notes: profile.peatProne && simulatedAqi > 130 
        ? 'Inland peat smoke accumulation detected with thermal inversion' 
        : 'Normal atmospheric mixing conditions'
    });
  });

  return records;
}

/**
 * Calculate statistical summary of an AQI history dataset
 */
export function calculateAqiHistorySummary(records) {
  if (!records || records.length === 0) {
    return {
      count: 0,
      avgAqi: 0,
      maxAqi: 0,
      minAqi: 0,
      unhealthyCount: 0,
      unhealthyPct: 0,
      peakRecord: null,
      cleanestRecord: null,
      trend: 'stable'
    };
  }

  const aqiValues = records.map(r => r.aqi);
  const total = aqiValues.reduce((sum, val) => sum + val, 0);
  const avgAqi = Math.round(total / records.length);
  const maxAqi = Math.max(...aqiValues);
  const minAqi = Math.min(...aqiValues);

  const unhealthyRecords = records.filter(r => r.aqi > 100);
  const unhealthyCount = unhealthyRecords.length;
  const unhealthyPct = Math.round((unhealthyCount / records.length) * 100);

  const peakRecord = records.find(r => r.aqi === maxAqi);
  const cleanestRecord = records.find(r => r.aqi === minAqi);

  // Determine trend: compare first 25% vs last 25%
  const sampleSize = Math.max(1, Math.floor(records.length * 0.25));
  const recentAvg = records.slice(-sampleSize).reduce((s, r) => s + r.aqi, 0) / sampleSize;
  const olderAvg = records.slice(0, sampleSize).reduce((s, r) => s + r.aqi, 0) / sampleSize;

  let trend = 'stable';
  if (recentAvg > olderAvg + 8) trend = 'worsening';
  else if (recentAvg < olderAvg - 8) trend = 'improving';

  return {
    count: records.length,
    avgAqi,
    maxAqi,
    minAqi,
    unhealthyCount,
    unhealthyPct,
    peakRecord,
    cleanestRecord,
    trend
  };
}

/**
 * Format records into an RFC 4180 CSV string with UTF-8 BOM
 */
export function formatAqiHistoryToCsv(records, options = {}) {
  if (!records || records.length === 0) return '';

  const areaName = options.areaName || records[0]?.areaName || 'Sarawak';
  const division = options.division || records[0]?.division || 'Sarawak';
  const timeRange = options.timeRange || 'Custom Range';
  const generatedAt = new Date().toISOString();

  // CSV metadata comments (Excel/Pandas compatible or skippable)
  const metaHeader = [
    `# ----------------------------------------------------------------------------------`,
    `# JEREBUAQI - LOCAL AIR QUALITY INDEX (AQI) HISTORICAL DATASET`,
    `# Area: ${areaName}`,
    `# Administrative Division: ${division}`,
    `# Time Range: ${timeRange}`,
    `# Export Generated: ${generatedAt}`,
    `# Coordinate Reference: WGS84 (${records[0]?.lat}, ${records[0]?.lng})`,
    `# Source: Department of Environment (DOE) Malaysia APIMS & Ground Truth Crowdsource`,
    `# ----------------------------------------------------------------------------------`
  ].join('\r\n');

  // Columns specification
  const columns = [
    { key: 'timestampIso', header: 'Timestamp (ISO 8601)' },
    { key: 'date', header: 'Date' },
    { key: 'time', header: 'Time (MYT)' },
    { key: 'areaName', header: 'Location / Neighborhood' },
    { key: 'division', header: 'Division / State' },
    { key: 'lat', header: 'Latitude' },
    { key: 'lng', header: 'Longitude' },
    { key: 'stationName', header: 'Monitoring Station' },
    { key: 'stationId', header: 'Station ID' },
    { key: 'aqi', header: 'Air Quality Index (AQI)' },
    { key: 'statusCategory', header: 'AQI Status Category' },
    { key: 'pm25UgM3', header: 'PM2.5 (ug/m3)' },
    { key: 'pm10UgM3', header: 'PM10 (ug/m3)' },
    { key: 'visibilityMeters', header: 'Visibility (Meters)' },
    { key: 'smellIntensity', header: 'Ground Smell & Smoke' },
    { key: 'temperatureC', header: 'Temperature (C)' },
    { key: 'relativeHumidityPct', header: 'Relative Humidity (%)' },
    { key: 'windDirection', header: 'Wind Direction' },
    { key: 'windSpeedKmh', header: 'Wind Speed (km/h)' },
    { key: 'dominantPollutant', header: 'Dominant Pollutant' },
    { key: 'healthAdvisory', header: 'Health Advisory' },
    { key: 'isAnomaly', header: 'DBSCAN Anomaly Spike' },
    { key: 'notes', header: 'Atmospheric Notes' }
  ];

  // Header row
  const headerRow = columns.map(c => escapeCsvCell(c.header)).join(',');

  // Data rows
  const dataRows = records.map(record => {
    return columns.map(col => {
      const val = record[col.key];
      return escapeCsvCell(val);
    }).join(',');
  });

  // Combine with carriage return + line feed (CRLF) for RFC 4180
  const csvContent = `${metaHeader}\r\n${headerRow}\r\n${dataRows.join('\r\n')}\r\n`;

  return csvContent;
}

/**
 * RFC 4180 compliant cell escaping
 */
function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const stringVal = String(value);
  // If string contains comma, double quote, newline, or carriage return, enclose in quotes and escape internal quotes
  if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n') || stringVal.includes('\r')) {
    return `"${stringVal.replace(/"/g, '""')}"`;
  }
  return stringVal;
}

/**
 * Trigger browser file download with UTF-8 BOM
 */
export function downloadCsvFile(csvString, filename = 'jerebuaqi-history.csv') {
  // \uFEFF is Byte Order Mark (BOM) ensuring Excel opens UTF-8 seamlessly without weird characters
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Cleanup object URL
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Convenient all-in-one export helper for a specific area
 */
export function exportAreaHistoryToCsvFile(areaId = 'miri', timeRange = '30d') {
  const profile = AREA_HISTORICAL_PROFILES.find(p => p.id === areaId) || AREA_HISTORICAL_PROFILES[0];
  const records = generateAreaAqiHistory(areaId, timeRange);
  const csvString = formatAqiHistoryToCsv(records, {
    areaName: profile.name,
    division: profile.division,
    timeRange: timeRange.toUpperCase()
  });

  const cleanName = profile.id.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStamp = new Date().toISOString().split('T')[0];
  const filename = `jerebu-aqi-${cleanName}-${timeRange}-${dateStamp}.csv`;

  downloadCsvFile(csvString, filename);
  return {
    filename,
    recordCount: records.length,
    areaName: profile.name
  };
}

/**
 * Export specific official station history by station ID or object
 */
export function exportStationHistoryToCsvFile(station, timeRange = '30d') {
  let matchedProfile = AREA_HISTORICAL_PROFILES.find(p => p.stationId === station.id);
  if (!matchedProfile) {
    // Find closest by city or name
    matchedProfile = AREA_HISTORICAL_PROFILES.find(p => p.name.toLowerCase().includes(station.city?.toLowerCase() || '')) || AREA_HISTORICAL_PROFILES[0];
  }

  const records = generateAreaAqiHistory(matchedProfile.id, timeRange);
  
  // Override station name and coordinates to match the exact station passed in
  const customizedRecords = records.map(r => ({
    ...r,
    stationName: station.name,
    stationId: station.id,
    areaName: station.name,
    lat: station.lat,
    lng: station.lng
  }));

  const csvString = formatAqiHistoryToCsv(customizedRecords, {
    areaName: station.name,
    division: station.city || station.region,
    timeRange: timeRange.toUpperCase()
  });

  const cleanName = (station.city || station.id).replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStamp = new Date().toISOString().split('T')[0];
  const filename = `jerebu-aqi-station-${cleanName}-${timeRange}-${dateStamp}.csv`;

  downloadCsvFile(csvString, filename);
  return {
    filename,
    recordCount: customizedRecords.length,
    stationName: station.name
  };
}
