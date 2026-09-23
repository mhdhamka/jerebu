import { defineStore } from 'pinia';
import { aqiService } from '@/src/services/api/index.js';
import { DivergenceService } from '@/src/services/divergenceService.js';

const divergenceEngine = new DivergenceService();

export const useStationStore = defineStore('stations', {
  state: () => ({
    stations: [],
    selectedStation: null,
    divergences: [],
    isLoading: false,
    lastSync: null
  }),

  getters: {
    totalStations: (state) => state.stations.length,
    criticalStations: (state) => state.stations.filter(s => (s.aqi || 0) >= 150),
    activeDivergencesCount: (state) => state.divergences.length
  },

  actions: {
    async fetchStations() {
      this.isLoading = true;
      try {
        const data = await aqiService.fetchStations();
        this.stations = data || [];
        this.lastSync = new Date().toISOString();
      } catch (err) {
        console.error('Failed to fetch official stations:', err);
      } finally {
        this.isLoading = false;
      }
    },

    updateDivergences(reports = []) {
      if (!this.stations.length || !reports.length) {
        this.divergences = [];
        return;
      }
      this.divergences = divergenceEngine.detectDivergences(this.stations, reports, 35);
    },

    selectStation(station) {
      this.selectedStation = station;
    },

    updateStationAqi(stationId, newAqi, status) {
      const st = this.stations.find(s => s.id === stationId);
      if (st) {
        st.aqi = newAqi;
        if (status) st.status = status;
        st.lastUpdated = new Date().toISOString();
      }
    }
  }
});
