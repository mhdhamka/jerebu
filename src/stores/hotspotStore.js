import { defineStore } from 'pinia';
import { NasaFirmsService } from '@/src/services/nasaFirmsService.js';

const firmsInstance = new NasaFirmsService();

export const useHotspotStore = defineStore('hotspots', {
  state: () => ({
    allHotspots: firmsInstance.hotspots || [],
    isLoading: false,
    sensorFilter: 'all', // 'all', 'viirs', 'modis'
    confidenceFilter: 'all', // 'all', 'high'
    minFrp: 2,
    onlyTransboundary: false,
    userMapKey: '',
    selectedHotspot: null,
    lastUpdated: firmsInstance.meta.lastUpdated || new Date().toISOString()
  }),

  getters: {
    filteredHotspots: (state) => {
      let list = state.allHotspots;

      if (state.sensorFilter !== 'all') {
        const sensor = state.sensorFilter.toLowerCase();
        list = list.filter(h => 
          (h.sensorType || '').toLowerCase() === sensor ||
          (sensor === 'viirs' && (h.satellite || '').includes('VIIRS')) ||
          (sensor === 'modis' && (h.satellite || '').includes('MODIS'))
        );
      }

      if (state.confidenceFilter === 'high') {
        list = list.filter(h => h.confidence === 'high' || (h.confidenceScore && h.confidenceScore >= 80));
      }

      if (state.minFrp > 0) {
        list = list.filter(h => (h.frp || 0) >= state.minFrp);
      }

      if (state.onlyTransboundary) {
        list = list.filter(h => h.isTransboundary);
      }

      return list;
    },

    stats: (state) => {
      const list = state.allHotspots;
      return {
        totalFound: list.length,
        displayedCount: list.length,
        highConfidenceCount: list.filter(h => h.confidence === 'high').length,
        transboundaryCount: list.filter(h => h.isTransboundary).length,
        totalFRP: Math.round(list.reduce((sum, h) => sum + (h.frp || 0), 0)),
        lastUpdated: state.lastUpdated
      };
    }
  },

  actions: {
    async fetchLiveHotspots(forceRefresh = false) {
      this.isLoading = true;
      try {
        const result = await firmsInstance.fetchLiveHotspots({
          mapKey: this.userMapKey,
          forceRefresh
        });
        if (result && result.hotspots) {
          this.allHotspots = result.hotspots;
          this.lastUpdated = new Date().toISOString();
        }
      } catch (err) {
        console.warn('FIRMS fetch failed, keeping current hotspots:', err);
      } finally {
        this.isLoading = false;
      }
    },

    setSensorFilter(sensor) {
      this.sensorFilter = sensor;
    },

    setConfidenceFilter(conf) {
      this.confidenceFilter = conf;
    },

    setMinFrp(val) {
      this.minFrp = Number(val);
    },

    setTransboundaryOnly(val) {
      this.onlyTransboundary = !!val;
    },

    setMapKey(key) {
      this.userMapKey = key;
    },

    selectHotspot(h) {
      this.selectedHotspot = h;
    }
  }
});
