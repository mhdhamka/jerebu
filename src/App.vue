<template>
  <div :class="['flex flex-col h-screen w-screen overflow-hidden font-sans select-none transition-colors duration-300', isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900']">
    
    <!-- Top Nav Command Bar -->
    <TopNavbar
      :official-count="stationStore.stations.length"
      :report-count="reportStore.reports.length"
      :anomaly-count="anomalyClusters.length"
      :active-user="activeUser"
      :is-dbscan-open="isRightPanelOpen && activeRightTab === 'dbscan'"
      :is-console-open="isRightPanelOpen && activeRightTab === 'console'"
      :is-dark="isDark"
      :max-aqi="maxAqi"
      @toggle-theme="toggleTheme"
      @toggle-dbscan="toggleRightPanel('dbscan')"
      @toggle-console="toggleRightPanel('console')"
      @open-report-modal="openReportModal"
      @open-export-modal="isExportModalOpen = true"
      @open-sync-modal="openSyncModal"
      @open-forecast-modal="openForecastModal(null)"
      @open-moe-modal="openMoeModal(null)"
      @open-divergence-modal="isDivergenceModalOpen = true"
      @open-notification-modal="isNotificationModalOpen = true"
      @switch-user="handleSwitchUser"
      @select-location="handleSearchLocationSelected"
      @toast="showToast"
    />

    <!-- Offline Queue Status Banner -->
    <div
      v-if="reportStore.pendingOfflineCount > 0 || isOffline"
      class="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-between z-40 shadow-sm"
    >
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-slate-950 animate-pulse"></span>
        <span v-if="isOffline">Working in Offline Mode.</span>
        <span v-if="reportStore.pendingOfflineCount > 0">
          {{ reportStore.pendingOfflineCount }} report(s) saved in local IndexedDB. Will auto-sync when back online.
        </span>
      </div>
      <button
        v-if="!isOffline && reportStore.pendingOfflineCount > 0"
        @click="handleManualSyncOffline"
        class="px-2.5 py-0.5 rounded-lg bg-slate-950 text-white text-[11px] font-mono hover:bg-slate-900 cursor-pointer"
      >
        Sync Now
      </button>
    </div>

    <!-- Main Workspace Layout (3-Column Interactive Grid) -->
    <main class="flex-1 flex min-w-0 min-h-0 w-full overflow-hidden relative">
      
      <!-- Left Sidebar: Live Community Feed Drawer -->
      <aside
        :class="[
          'transition-all duration-300 ease-in-out z-30 shrink-0 h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden flex flex-col min-h-0',
          isLeftFeedVisible ? 'w-full sm:w-88 max-w-full border-r border-slate-200/80 dark:border-slate-800/80 shadow-lg' : 'w-0 border-r-0 pointer-events-none'
        ]"
      >
        <ReportFeed
          :reports="reportStore.reports"
          :show-close-button="true"
          @close="isLeftFeedVisible = false"
          @upvote="handleUpvote"
          @share="handleShareReport"
        />
      </aside>

      <!-- Center Section: Interactive Leaflet Map & Overlays (Strictly respects bounds) -->
      <section class="flex-1 min-w-0 min-h-0 w-full h-full relative bg-slate-100 dark:bg-slate-950 overflow-hidden">
        <HazeMap
          ref="hazeMapRef"
          :official-stations="stationStore.stations"
          :reports="reportStore.reports"
          :anomaly-clusters="anomalyClusters"
          :hotspots="hotspotStore.allHotspots"
          :wind-data="liveWindData"
          :divergences="stationStore.divergences"
          :is-picking-location="isPickingLocation"
          :is-dark="isDark"
          :is-left-feed-visible="isLeftFeedVisible"
          @toggle-feed="isLeftFeedVisible = !isLeftFeedVisible"
          @location-selected="handleLocationPicked"
          @cancel-pick="isPickingLocation = false"
          @share-report="handleShareReport"
          @report-at-location="handleReportAtLocation"
          @open-sync-modal="openSyncModal"
          @open-forecast-modal="openForecastModal"
          @open-moe-modal="openMoeModal"
          @toast="showToast"
          @refresh-firms="handleFirmsRefreshed"
        />

        <!-- Floating Action Button (FAB) -->
        <div class="absolute bottom-6 right-6 z-[420]">
          <button
            type="button"
            @click="openReportModal"
            class="group relative flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-full shadow-2xl shadow-orange-500/40 border border-orange-300/30 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 select-none overflow-hidden"
            title="Report haze in your neighborhood (Press 'R')"
          >
            <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform"></div>
            <svg class="relative w-5 h-5 text-white transform group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
            </svg>
          </button>
        </div>
      </section>

      <!-- Right Sidebar: DBSCAN Anomaly Engine Console -->
      <aside
        :class="[
          'transition-all duration-300 ease-in-out z-30 shrink-0 h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden flex flex-col min-h-0',
          isRightPanelOpen ? 'w-full sm:w-96 max-w-full border-l border-slate-200/80 dark:border-slate-800/80 shadow-lg' : 'w-0 border-l-0 pointer-events-none'
        ]"
      >
        <DBSCANAnomalyPanel
          :active-tab="activeRightTab"
          :anomaly-clusters="anomalyClusters"
          :reports="reportStore.reports"
          :official-stations="stationStore.stations"
          :live-wind-data="liveWindData"
          @close="isRightPanelOpen = false; activeRightTab = null"
          @switch-tab="activeRightTab = $event"
          @recalculate="handleRecalculateDBSCAN"
          @toast="showToast"
        />
      </aside>
    </main>

    <!-- Modals -->
    <ReportModal
      v-if="isReportModalOpen"
      :is-open="isReportModalOpen"
      :active-user="activeUser"
      :initial-coords="pickedCoords"
      :initial-area-name="pickedAreaName"
      :is-picking-location="isPickingLocation"
      @close="isReportModalOpen = false"
      @start-picker="startMapPicker"
      @submit="handleSubmitReport"
      @toast="showToast"
    />

    <SocialShareModal
      v-if="!!sharingReport"
      :is-open="!!sharingReport"
      :report="sharingReport"
      @close="sharingReport = null"
      @toast="showToast"
    />

    <AqiHistoryExportModal
      v-if="isExportModalOpen"
      :is-open="isExportModalOpen"
      :reports="reportStore.reports"
      :official-stations="stationStore.stations"
      :anomalies="anomalyClusters"
      @close="isExportModalOpen = false"
      @downloaded="handleExportDownloaded"
    />

    <LiveAqiSyncModal
      v-if="isSyncModalOpen"
      :is-open="isSyncModalOpen"
      :official-stations="stationStore.stations"
      @close="isSyncModalOpen = false"
      @station-updated="handleStationUpdated"
      @sync-all="handleSyncAllStations"
      @toast="showToast"
    />

    <AqiForecastModal
      v-if="isForecastModalOpen"
      :is-open="isForecastModalOpen"
      :station-id="forecastStationId"
      :official-stations="stationStore.stations"
      @close="isForecastModalOpen = false"
      @toast="showToast"
    />

    <MoeAdvisoryModal
      v-if="isMoeModalOpen"
      :is-open="isMoeModalOpen"
      :station-id="moeStationId"
      :official-stations="stationStore.stations"
      @close="isMoeModalOpen = false"
      @toast="showToast"
    />

    <DivergenceModal
      v-if="isDivergenceModalOpen"
      :is-open="isDivergenceModalOpen"
      :divergences="stationStore.divergences"
      :official-stations="stationStore.stations"
      @close="isDivergenceModalOpen = false"
      @toast="showToast"
    />

    <NotificationSettingsModal
      v-if="isNotificationModalOpen"
      :is-open="isNotificationModalOpen"
      :official-stations="stationStore.stations"
      @close="isNotificationModalOpen = false"
      @toast="showToast"
    />

    <!-- Toast Notification Banner -->
    <transition name="toast-slide">
      <div
        v-if="toastMessage"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] bg-slate-900/90 dark:bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl font-medium text-xs flex items-center gap-3 border border-slate-700/80 backdrop-blur-xl"
      >
        <div class="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30">
          <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="tracking-wide">{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import TopNavbar from './components/TopNavbar.vue';
import HazeMap from './components/HazeMap.vue';
import ReportModal from './components/ReportModal.vue';
import SocialShareModal from './components/SocialShareModal.vue';
import DBSCANAnomalyPanel from './components/DBSCANAnomalyPanel.vue';
import ReportFeed from './components/ReportFeed.vue';
import AqiHistoryExportModal from './components/AqiHistoryExportModal.vue';
import LiveAqiSyncModal from './components/LiveAqiSyncModal.vue';
import AqiForecastModal from './components/AqiForecastModal.vue';
import MoeAdvisoryModal from './components/MoeAdvisoryModal.vue';
import DivergenceModal from './components/DivergenceModal.vue';
import NotificationSettingsModal from './components/NotificationSettingsModal.vue';

// Pinia Stores
import { useReportStore } from '@/src/stores/reportStore.js';
import { useStationStore } from '@/src/stores/stationStore.js';
import { useHotspotStore } from '@/src/stores/hotspotStore.js';
import { useAnomalyStore } from '@/src/stores/anomalyStore.js';

// Services
import { laravel } from './services/laravelApi.js';
import { liveAqiSync } from './services/liveAqiSyncService.js';
import { windService } from './services/windVectorService.js';
import { pushService } from './services/pushNotificationService.js';
import { offlineQueueService } from './services/offlineQueueService.js';
import { geofenceAlertService } from './services/geofenceAlertService.js';

const reportStore = useReportStore();
const stationStore = useStationStore();
const hotspotStore = useHotspotStore();
const anomalyStore = useAnomalyStore();

const liveWindData = ref(windService.getWindData());
const isOffline = ref(!offlineQueueService.isOnline());

// Panel & modal state
const isLeftFeedVisible = ref(false); 
const isRightPanelOpen = ref(false); 
const activeRightTab = ref(null); 
const hazeMapRef = ref(null);

// Ensure map continuously adjusts size smoothly during sidebar expand/collapse transitions
watch([isLeftFeedVisible, isRightPanelOpen], () => {
  let count = 0;
  const interval = setInterval(() => {
    if (hazeMapRef.value?.invalidateSize) {
      hazeMapRef.value.invalidateSize();
    }
    count++;
    if (count > 7) clearInterval(interval);
  }, 50);
});

function handleSearchLocationSelected(loc) {
  if (hazeMapRef.value?.handleLocationSelected) {
    hazeMapRef.value.handleLocationSelected(loc);
  }
} 

const isReportModalOpen = ref(false);
const isExportModalOpen = ref(false);
const isSyncModalOpen = ref(false);
const isForecastModalOpen = ref(false);
const forecastStationId = ref(null);
const isMoeModalOpen = ref(false);
const moeStationId = ref(null);
const isDivergenceModalOpen = ref(false);
const isNotificationModalOpen = ref(false);

const sharingReport = ref(null);
const isPickingLocation = ref(false);
const pickedCoords = ref({ lat: 4.450, lng: 114.020 });
const pickedAreaName = ref('');
const toastMessage = ref('');

const activeUser = ref(laravel.activeUser);
const isDark = ref(false);

const anomalyClusters = computed(() => {
  return anomalyStore.clusters.length > 0 ? anomalyStore.clusters : laravel.computeAnomalies();
});

const maxAqi = computed(() => {
  if (!stationStore.stations.length) return 142;
  return Math.max(...stationStore.stations.map(s => s.aqi || 0));
});

function initTheme() {
  const saved = localStorage.getItem('jerebu-theme');
  if (saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  } else {
    isDark.value = false;
    document.documentElement.classList.remove('dark');
  }
}

function toggleTheme() {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('jerebu-theme', 'dark');
    showToast('Switched to High-Contrast Dark Mode');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('jerebu-theme', 'light');
    showToast('Switched to Light Mode');
  }
}

function openForecastModal(stationId = null) {
  forecastStationId.value = stationId;
  isForecastModalOpen.value = true;
}

function openMoeModal(stationId = null) {
  moeStationId.value = stationId;
  isMoeModalOpen.value = true;
}

const handleKeydown = (e) => {
  if ((e.key === 'r' || e.key === 'R') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) {
    if (!isReportModalOpen.value && !isPickingLocation.value) {
      e.preventDefault();
      openReportModal();
    }
  }
};

watch([() => stationStore.stations, () => reportStore.reports], () => {
  stationStore.updateDivergences(reportStore.reports);
}, { deep: true });

onMounted(async () => {
  initTheme();

  // Load stores in parallel
  await Promise.all([
    stationStore.fetchStations(),
    reportStore.fetchReports(),
    hotspotStore.fetchLiveHotspots(false)
  ]);

  stationStore.updateDivergences(reportStore.reports);
  anomalyStore.computeClusters(reportStore.reports, stationStore.stations);

  // Background live wind update from Open-Meteo
  windService.fetchLiveWind().then(w => {
    if (w) liveWindData.value = w;
  });

  // Background PWA push service setup
  pushService.init();

  // Online / offline listeners
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('keydown', handleKeydown);

  // Setup auto-sync callback when connection returns
  offlineQueueService.setupAutoSync(async () => {
    const synced = await reportStore.syncOfflineQueue();
    if (synced > 0) {
      showToast(`Automatically synced ${synced} queued report(s) to server.`);
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  window.removeEventListener('keydown', handleKeydown);
});

function handleOnline() {
  isOffline.value = false;
  showToast('Network online. Synchronizing data...');
}

function handleOffline() {
  isOffline.value = true;
  showToast('Network offline. Reports will queue in local storage.');
}

async function handleManualSyncOffline() {
  const synced = await reportStore.syncOfflineQueue();
  showToast(`Synced ${synced} offline report(s).`);
}

function toggleRightPanel(tab) {
  if (isRightPanelOpen.value && activeRightTab.value === tab) {
    isRightPanelOpen.value = false;
    activeRightTab.value = null;
  } else {
    activeRightTab.value = tab;
    isRightPanelOpen.value = true;
  }
}

function handleSwitchUser(user) {
  activeUser.value = user;
  laravel.setActiveUser(user);
  showToast(`Active reporter switched to ${user.name} (${user.trustWeight}x weight)`);
}

function openReportModal() {
  pickedAreaName.value = '';
  isReportModalOpen.value = true;
  isPickingLocation.value = false;
}

function handleReportAtLocation({ areaName, lat, lng }) {
  pickedCoords.value = { lat, lng };
  pickedAreaName.value = areaName || '';
  isReportModalOpen.value = true;
  isPickingLocation.value = false;
  showToast(`Reporting haze for ${areaName || 'selected location'}`);
}

function startMapPicker() {
  isReportModalOpen.value = false;
  isPickingLocation.value = true;
}

function handleLocationPicked(coords) {
  pickedCoords.value = coords;
  isPickingLocation.value = false;
  isReportModalOpen.value = true;
  showToast(`Selected map coordinates: ${coords.lat}, ${coords.lng}`);
}

function handleFirmsRefreshed(res) {
  if (res && res.hotspots) {
    hotspotStore.allHotspots = res.hotspots;
  }
}

async function handleSubmitReport(formData) {
  try {
    await reportStore.submitReport(formData);
    isReportModalOpen.value = false;
    stationStore.updateDivergences(reportStore.reports);
    anomalyStore.computeClusters(reportStore.reports, stationStore.stations);
    showToast('Ground report published & indexed.');
  } catch (err) {
    showToast(`Report queued: ${err.message || 'Saved offline'}`);
  }
}

async function handleUpvote(reportId) {
  await reportStore.upvoteReport(reportId);
  showToast('Helpful report upvoted.');
}

function handleShareReport(report) {
  sharingReport.value = report;
}

function handleExportDownloaded(payload) {
  showToast(`Downloaded CSV: ${payload.filename} (${payload.rowCount} records)`);
}

function openSyncModal() {
  isSyncModalOpen.value = true;
}

function handleStationUpdated({ stationId, updatedData }) {
  stationStore.updateStationAqi(stationId, updatedData.aqi, updatedData.status);
}

async function handleSyncAllStations() {
  showToast('Synchronizing all 10 Sarawak stations with live open atmospheric sensors...');
  try {
    for (const st of stationStore.stations) {
      if (st.region === 'Sarawak') {
        const live = await liveAqiSync.fetchOpenStationFeed({
          lat: st.lat,
          lng: st.lng,
          city: st.city,
          stationName: st.name
        });
        stationStore.updateStationAqi(st.id, live.aqi, live.status);
      }
    }
    showToast('All Sarawak monitoring stations updated with live feed data!');
  } catch (err) {
    showToast(`Sync failed: ${err.message}`);
  }
}

function handleRecalculateDBSCAN({ epsKm, minSamples }) {
  anomalyStore.setParams(epsKm, minSamples);
  anomalyStore.computeClusters(reportStore.reports, stationStore.stations);
  showToast(`DBSCAN re-clustered with eps=${epsKm}km, min_samples=${minSamples}`);
}

function showToast(msg) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = '';
    }
  }, 3500);
}
</script>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px) scale(0.95);
}
</style>
