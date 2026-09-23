import { HttpBackendAdapter } from './HttpBackendAdapter.js';
import { OfflineMockAdapter } from './OfflineMockAdapter.js';
import { offlineQueueService } from '@/src/services/offlineQueueService.js';

class AqiRepository {
  constructor() {
    this.httpAdapter = new HttpBackendAdapter();
    this.offlineAdapter = new OfflineMockAdapter();
    this.activeMode = 'auto'; // 'auto', 'http', 'offline'
    this.isServerReachable = null;

    // Listen for online events to flush pending IndexedDB reports
    offlineQueueService.setupAutoSync(() => this.flushOfflineQueue());
  }

  async checkServerHealth() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.httpAdapter.baseUrl}/`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      this.isServerReachable = res.ok;
      return res.ok;
    } catch {
      this.isServerReachable = false;
      return false;
    }
  }

  async fetchReports() {
    if (this.activeMode === 'offline' || !offlineQueueService.isOnline()) {
      return await this.offlineAdapter.fetchReports();
    }

    try {
      const reports = await this.httpAdapter.fetchReports();
      this.isServerReachable = true;
      return reports;
    } catch (err) {
      this.isServerReachable = false;
      return await this.offlineAdapter.fetchReports();
    }
  }

  async fetchNearbyReports(lat, lng, radiusKm = 50) {
    if (this.activeMode === 'offline' || !offlineQueueService.isOnline()) {
      return await this.offlineAdapter.fetchNearbyReports(lat, lng, radiusKm);
    }
    try {
      return await this.httpAdapter.fetchNearbyReports(lat, lng, radiusKm);
    } catch {
      return await this.offlineAdapter.fetchNearbyReports(lat, lng, radiusKm);
    }
  }

  async createReport(reportData) {
    // If offline or network call fails, enqueue to IndexedDB for resilience
    if (!offlineQueueService.isOnline() || this.activeMode === 'offline') {
      const enqueued = await offlineQueueService.enqueueReport(reportData);
      const localReport = await this.offlineAdapter.createReport(reportData);
      return {
        ...localReport,
        isOfflineQueued: true,
        tempId: enqueued.tempId
      };
    }

    try {
      const report = await this.httpAdapter.createReport(reportData);
      // Keep offline mirror in sync
      await this.offlineAdapter.createReport(report);
      return report;
    } catch (err) {
      console.warn('Network report submission failed. Storing in resilient IndexedDB offline queue:', err);
      const enqueued = await offlineQueueService.enqueueReport(reportData);
      const localReport = await this.offlineAdapter.createReport(reportData);
      return {
        ...localReport,
        isOfflineQueued: true,
        tempId: enqueued.tempId
      };
    }
  }

  async upvoteReport(reportId) {
    try {
      if (offlineQueueService.isOnline() && this.activeMode !== 'offline') {
        const res = await this.httpAdapter.upvoteReport(reportId);
        await this.offlineAdapter.upvoteReport(reportId).catch(() => {});
        return res;
      }
    } catch {
      // Fallback
    }
    return await this.offlineAdapter.upvoteReport(reportId);
  }

  async fetchStations() {
    try {
      if (offlineQueueService.isOnline() && this.activeMode !== 'offline') {
        return await this.httpAdapter.fetchStations();
      }
    } catch {
      // fallback
    }
    return await this.offlineAdapter.fetchStations();
  }

  async fetchAnomalies(epsKm = 8.5, minSamples = 2) {
    try {
      if (offlineQueueService.isOnline() && this.activeMode !== 'offline') {
        const res = await this.httpAdapter.fetchAnomalies(epsKm, minSamples);
        if (res && res.anomalies) return res.anomalies;
      }
    } catch {
      // fallback
    }
    return await this.offlineAdapter.fetchAnomalies(epsKm, minSamples);
  }

  async analyzePanic(text, symptoms, visibility, smell) {
    try {
      if (offlineQueueService.isOnline() && this.activeMode !== 'offline') {
        return await this.httpAdapter.analyzePanic(text, symptoms, visibility, smell);
      }
    } catch {
      // fallback
    }
    return await this.offlineAdapter.analyzePanic(text, symptoms, visibility, smell);
  }

  /**
   * Flushes any reports queued while offline in remote peatland areas
   */
  async flushOfflineQueue() {
    const pending = await offlineQueueService.getPendingReports();
    if (!pending || pending.length === 0) return 0;

    let synced = 0;
    for (const report of pending) {
      try {
        const { tempId, status, createdAt, retryCount, isOfflineQueued, ...cleanData } = report;
        await this.httpAdapter.createReport(cleanData);
        await offlineQueueService.removePendingReport(tempId);
        synced++;
      } catch (err) {
        console.warn(`Retry failed for offline report ${report.tempId}:`, err);
      }
    }
    return synced;
  }
}

export const aqiService = new AqiRepository();
export default aqiService;
