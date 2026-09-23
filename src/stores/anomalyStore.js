import { defineStore } from 'pinia';
import { aqiService } from '@/src/services/api/index.js';

export const useAnomalyStore = defineStore('anomalies', {
  state: () => ({
    clusters: [],
    activeCluster: null,
    epsKm: 8.5,
    minSamples: 2,
    isLoading: false,
    lastClustered: null
  }),

  getters: {
    totalClusters: (state) => state.clusters.length,
    criticalAnomalies: (state) => state.clusters.filter(c => c.is_anomaly || c.discrepancy >= 30),
    maxDiscrepancy: (state) => {
      if (!state.clusters.length) return 0;
      return Math.max(...state.clusters.map(c => Math.abs(c.discrepancy || 0)));
    }
  },

  actions: {
    async computeClusters(reports = [], stations = []) {
      this.isLoading = true;
      try {
        const result = await aqiService.fetchAnomalies(this.epsKm, this.minSamples);
        this.clusters = Array.isArray(result) ? result : (result.anomalies || []);
        this.lastClustered = new Date().toISOString();
      } catch (err) {
        console.error('Failed to compute DBSCAN anomalies:', err);
      } finally {
        this.isLoading = false;
      }
    },

    setParams(eps, samples) {
      if (eps) this.epsKm = Number(eps);
      if (samples) this.minSamples = Number(samples);
    },

    selectCluster(cluster) {
      this.activeCluster = cluster;
    }
  }
});
