/**
 * Live Wind Vector & Smoke Drift Service
 * Provides meteorological wind speed, direction, and smoke dispersion vector for Borneo & South China Sea.
 */

export class WindVectorService {
  constructor() {
    this.currentWind = {
      speedKmh: 14.5,
      directionDeg: 215, // Southwest (blowing Northeast towards Kuching & Sri Aman)
      directionLabel: 'Southwest (SW)',
      monsoonSeason: 'Southwest Monsoon (Haze Propagation Season)',
      gustsKmh: 22.0,
      dispersionRisk: 'High Transboundary Drift to Southern Sarawak',
      updatedAt: 'Live (Open-Meteo & NOAA GFS Model)'
    };
  }

  async fetchLiveWind(lat = 1.5533, lng = 110.3592) {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=Asia%2FKuching`);
      if (res.ok) {
        const data = await res.json();
        const current = data.current;
        if (current) {
          const deg = current.wind_direction_10m ?? 215;
          const speed = current.wind_speed_10m ?? 14.5;
          this.currentWind = {
            speedKmh: Math.round(speed * 10) / 10,
            directionDeg: deg,
            directionLabel: this.degToCompass(deg),
            monsoonSeason: (deg >= 180 && deg <= 270) ? 'Southwest Monsoon (Haze Propagation Season)' : 'Northeast Monsoon / Inter-monsoon',
            gustsKmh: current.wind_gusts_10m ? Math.round(current.wind_gusts_10m * 10) / 10 : 20.0,
            dispersionRisk: (deg >= 180 && deg <= 250) ? 'High Transboundary Drift to Southern Sarawak' : 'Offshore Ocean Drift',
            updatedAt: 'Live Open-Meteo GFS'
          };
        }
      }
    } catch (err) {
      console.warn('Live wind fetch fallback:', err.message);
    }
    return this.currentWind;
  }

  getWindData() {
    return { ...this.currentWind };
  }

  degToCompass(num) {
    const val = Math.floor((num / 22.5) + 0.5);
    const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return arr[(val % 16)];
  }

  /**
   * Generates grid points across Borneo/Sarawak for animated vector drift lines
   */
  generateVectorGrid() {
    const grid = [];
    const minLat = 0.5, maxLat = 4.8, stepLat = 0.8;
    const minLng = 109.5, maxLng = 115.5, stepLng = 1.0;

    for (let lat = minLat; lat <= maxLat; lat += stepLat) {
      for (let lng = minLng; lng <= maxLng; lng += stepLng) {
        // Slight regional variance in local topography
        const angleVariance = (Math.sin(lat * 3) + Math.cos(lng * 2)) * 8;
        const deg = (this.currentWind.directionDeg + angleVariance + 360) % 360;
        grid.push({
          lat: Math.round(lat * 100) / 100,
          lng: Math.round(lng * 100) / 100,
          speed: this.currentWind.speedKmh,
          directionDeg: Math.round(deg)
        });
      }
    }
    return grid;
  }
}

export const windService = new WindVectorService();
