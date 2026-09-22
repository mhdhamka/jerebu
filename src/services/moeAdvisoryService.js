/**
 * MOE (Ministry of Education) & MOH (Ministry of Health) Malaysia
 * National Haze Action Plan & School Advisory Guidelines
 */

export const MOE_HAZE_LEVELS = {
  GOOD: {
    range: [0, 50],
    level: 'Good',
    schoolAction: 'Normal School Operations',
    schoolColor: 'emerald',
    schoolBadge: 'All Activities Permitted',
    sportsAllowed: true,
    assembliesAllowed: true,
    closureTrigger: false,
    mohGuideline: 'Air quality is satisfactory. Ideal for all outdoor exercises and activities.',
    maskRecommendation: 'None required'
  },
  MODERATE: {
    range: [51, 100],
    level: 'Moderate',
    schoolAction: 'Precautionary Monitoring',
    schoolColor: 'amber',
    schoolBadge: 'Precautionary Awareness',
    sportsAllowed: true,
    assembliesAllowed: true,
    closureTrigger: false,
    mohGuideline: 'Acceptable air quality. Individuals with asthma or respiratory allergies should carry required medication.',
    maskRecommendation: 'Optional for sensitive groups'
  },
  UNHEALTHY_SENSITIVE: {
    range: [101, 150],
    level: 'Unhealthy for Sensitive Groups',
    schoolAction: 'Cease Outdoor PE & Sports (MOE Mandate)',
    schoolColor: 'orange',
    schoolBadge: 'Outdoor Sports Banned',
    sportsAllowed: false,
    assembliesAllowed: false,
    closureTrigger: false,
    mohGuideline: 'Children, elderly, and individuals with heart/lung disease must avoid prolonged strenuous outdoor activity.',
    maskRecommendation: 'Surgical mask or 3-ply advised outdoors'
  },
  UNHEALTHY: {
    range: [151, 200],
    level: 'Unhealthy',
    schoolAction: 'Mandatory Indoor Confinement for Students',
    schoolColor: 'red',
    schoolBadge: 'Indoor Confinement Only',
    sportsAllowed: false,
    assembliesAllowed: false,
    closureTrigger: false,
    mohGuideline: 'General public must reduce prolonged outdoor exertion. Sensitive groups must remain strictly indoors with air filtration.',
    maskRecommendation: 'N95 / KN95 Respirator strongly advised outdoors'
  },
  VERY_UNHEALTHY: {
    range: [201, 300],
    level: 'Very Unhealthy',
    schoolAction: 'MOE School Closure Trigger (>200 AQI)',
    schoolColor: 'purple',
    schoolBadge: 'School Closure Mandate',
    sportsAllowed: false,
    assembliesAllowed: false,
    closureTrigger: true,
    mohGuideline: 'Active health hazard. General population must avoid outdoor activities. Children and high-risk groups remain strictly isolated in filtered environments.',
    maskRecommendation: 'Mandatory N95 Respirator for any necessary exposure'
  },
  HAZARDOUS: {
    range: [301, 999],
    level: 'Hazardous / Emergency',
    schoolAction: 'National Disaster State & Complete School Shutdown',
    schoolColor: 'rose',
    schoolBadge: 'Disaster Shutdown Mandate',
    sportsAllowed: false,
    assembliesAllowed: false,
    closureTrigger: true,
    mohGuideline: 'State emergency. Everyone should avoid all outdoor physical exertion; severe health danger to public.',
    maskRecommendation: 'Mandatory N95/FFP2 Respirator'
  }
};

export function getMoeAdvisory(aqi) {
  const num = Number(aqi) || 0;
  if (num <= 50) return MOE_HAZE_LEVELS.GOOD;
  if (num <= 100) return MOE_HAZE_LEVELS.MODERATE;
  if (num <= 150) return MOE_HAZE_LEVELS.UNHEALTHY_SENSITIVE;
  if (num <= 200) return MOE_HAZE_LEVELS.UNHEALTHY;
  if (num <= 300) return MOE_HAZE_LEVELS.VERY_UNHEALTHY;
  return MOE_HAZE_LEVELS.HAZARDOUS;
}
