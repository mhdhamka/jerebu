import { defineStore } from 'pinia';
import { aqiService } from '@/src/services/api/index.js';
import { offlineQueueService } from '@/src/services/offlineQueueService.js';
import { sanitizeReport } from '@/src/utils/security.js';
import { reputationEngine } from '@/src/services/reputationEngine.js';

export const useReportStore = defineStore('reports', {
  state: () => ({
    reports: [],
    isLoading: false,
    isSubmitting: false,
    selectedReport: null,
    filter: 'all', // 'all', 'consensus_verified', 'high_distress', 'verified', 'transboundary'
    upvotedIds: new Set(),
    pendingOfflineCount: 0,
    lastUpdated: null,
    searchQuery: '',
    latestGpsCheck: null
  }),

  getters: {
    totalReports: (state) => state.reports.length,
    filteredReports: (state) => {
      let list = state.reports;

      if (state.filter === 'consensus_verified') {
        list = list.filter(r => r.consensusStatus === 'consensus_verified' || (r.corroborationCount && r.corroborationCount >= 2));
      } else if (state.filter === 'high_distress') {
        list = list.filter(r => (r.panicScore || r.panic_score || 0) >= 60 || (r.estimatedAqi || r.estimated_aqi || 0) >= 150);
      } else if (state.filter === 'verified') {
        list = list.filter(r => r.verified || (r.trustScore || r.trust_weight || 1.0) >= 1.2);
      } else if (state.filter === 'transboundary') {
        list = list.filter(r => (r.city || '').toLowerCase().includes('kalimantan') || (r.areaName || r.area_name || '').toLowerCase().includes('border') || (r.description || '').toLowerCase().includes('kalimantan'));
      }

      if (state.searchQuery.trim()) {
        const q = state.searchQuery.toLowerCase();
        list = list.filter(r => 
          (r.areaName || r.area_name || '').toLowerCase().includes(q) ||
          (r.city || '').toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q)
        );
      }

      return list;
    },
    criticalReportsCount: (state) => {
      return state.reports.filter(r => (r.estimatedAqi || r.estimated_aqi || 0) >= 150 || (r.panicScore || r.panic_score || 0) >= 70).length;
    },
    consensusVerifiedCount: (state) => {
      return state.reports.filter(r => r.consensusStatus === 'consensus_verified').length;
    }
  },

  actions: {
    async fetchReports() {
      this.isLoading = true;
      try {
        const rawReports = await aqiService.fetchReports();
        const sanitized = (rawReports || []).map(r => sanitizeReport(r));
        // Run consensus evaluation engine across all reports
        this.reports = reputationEngine.annotateReports(sanitized);
        this.lastUpdated = new Date().toISOString();
        await this.checkPendingOffline();
      } catch (err) {
        console.error('Failed to load reports in reportStore:', err);
      } finally {
        this.isLoading = false;
      }
    },

    async submitReport(reportData) {
      this.isSubmitting = true;
      try {
        // Pre-flight anti-spoofing and GPS integrity check
        if (reportData.lat && reportData.lng) {
          const gpsCheck = reputationEngine.validateGpsIntegrity({
            lat: reportData.lat,
            lng: reportData.lng,
            accuracy: reportData.gpsAccuracy || 25
          });
          this.latestGpsCheck = gpsCheck;
          if (!gpsCheck.isValid) {
            throw new Error(`Location integrity failure: ${gpsCheck.flags.join(', ')}`);
          }
        }

        const created = await aqiService.createReport(reportData);
        const sanitized = sanitizeReport(created);
        
        // Add to state if not duplicate
        const exists = this.reports.some(r => r.id === sanitized.id);
        if (!exists) {
          this.reports.unshift(sanitized);
        }
        
        // Re-annotate consensus across current reports
        this.reports = reputationEngine.annotateReports(this.reports);

        await this.checkPendingOffline();
        return sanitized;
      } catch (err) {
        console.error('Report submission failed:', err);
        throw err;
      } finally {
        this.isSubmitting = false;
      }
    },

    async upvoteReport(reportId) {
      if (this.upvotedIds.has(reportId)) return;
      this.upvotedIds.add(reportId);

      const target = this.reports.find(r => r.id === reportId);
      if (target) {
        target.upvotes = (target.upvotes || 0) + 1;
        target.trustScore = Math.min(3.0, Number(((target.trustScore || target.trust_weight || 1.0) + 0.1).toFixed(1)));
        target.trust_weight = target.trustScore;
        this.reports = reputationEngine.annotateReports(this.reports);
      }

      try {
        await aqiService.upvoteReport(reportId);
      } catch (err) {
        console.warn('Background upvote failed:', err);
      }
    },

    async checkPendingOffline() {
      this.pendingOfflineCount = await offlineQueueService.getPendingCount();
    },

    async syncOfflineQueue() {
      const synced = await aqiService.flushOfflineQueue();
      await this.checkPendingOffline();
      if (synced > 0) {
        await this.fetchReports();
      }
      return synced;
    },

    setFilter(filterName) {
      this.filter = filterName;
    },

    setSearchQuery(q) {
      this.searchQuery = q;
    },

    selectReport(report) {
      this.selectedReport = report;
    }
  }
});
