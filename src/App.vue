<template>
  <div :class="['flex flex-col h-screen w-screen overflow-hidden font-sans select-none transition-colors duration-300', isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900']">
    
    <!-- Top Nav Command Bar -->
    <TopNavbar
      :official-count="officialStations.length"
      :report-count="reports.length"
      :anomaly-count="activeAnomalyCount"
      :active-user="activeUser"
      :is-dbscan-open="isRightPanelOpen && activeRightTab === 'dbscan'"
      :is-console-open="isRightPanelOpen && activeRightTab === 'console'"
      :is-dark="isDark"
      @toggle-theme="toggleTheme"
      @toggle-dbscan="toggleRightPanel('dbscan')"
      @toggle-console="toggleRightPanel('console')"
      @open-report-modal="openReportModal"
      @switch-user="handleSwitchUser"
    />

    <!-- Main Workspace Layout (3-Column Interactive Grid) -->
    <main class="flex-1 flex overflow-hidden relative">
      
      <!-- Left Sidebar: Live Community Feed Drawer -->
      <aside
        :class="[
          'transition-all duration-300 ease-in-out z-30 shrink-0 h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden',
          isLeftFeedVisible ? 'w-full sm:w-88 border-r border-slate-200/80 dark:border-slate-800/80' : 'w-0 border-r-0'
        ]"
      >
        <ReportFeed
          :reports="reports"
          :show-close-button="true"
          @close="isLeftFeedVisible = false"
          @upvote="handleUpvote"
          @share="handleShareReport"
        />
      </aside>

      <!-- Center Section: Interactive Leaflet Map & Overlays -->
      <section class="flex-1 relative bg-slate-100 dark:bg-slate-950 overflow-hidden h-full">
        
        <!-- Toggle Feed Pill (Visible when feed is collapsed on desktop) -->
        <button
          v-if="!isLeftFeedVisible"
          @click="isLeftFeedVisible = true"
          class="absolute top-4 left-4 z-[400] px-3.5 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 shadow-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 group"
        >
          <span>Open Feed</span>
        </button>

        <HazeMap
          :official-stations="officialStations"
          :reports="reports"
          :anomaly-clusters="anomalyClusters"
          :is-picking-location="isPickingLocation"
          :is-dark="isDark"
          @location-selected="handleLocationPicked"
          @cancel-pick="isPickingLocation = false"
          @share-report="handleShareReport"
          @report-at-location="handleReportAtLocation"
          @toast="showToast"
        />

        <!-- Modern Glowing Floating Action Button (FAB) -->
        <div class="absolute bottom-6 right-6 z-[420]">
          <button
            type="button"
            @click="openReportModal"
            class="group relative flex items-center gap-3.5 px-6 py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-2xl shadow-orange-500/40 border border-orange-300/30 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 select-none overflow-hidden"
            title="Report haze in your neighborhood (Press 'R')"
          >
            <!-- Ambient Light Sweep Animation -->
            <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform"></div>

            <div class="relative flex items-center justify-center">
              <span class="absolute inline-flex h-full w-full rounded-xl bg-white/40 animate-ping opacity-75"></span>
              <span class="relative w-9 h-9 rounded-xl bg-white/25 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <svg class="w-4 h-4 text-white transform group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
                </svg>
              </span>
            </div>
            
            <div class="flex flex-col text-left">
              <span class="tracking-wider leading-none text-white font-black text-xs uppercase flex items-center gap-2">
                <span>Report Haze</span>
                <span class="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px] font-mono font-bold text-orange-100 border border-white/10">R</span>
              </span>
              <span class="text-[10px] text-orange-100 font-medium leading-tight mt-1 opacity-90">Submit Ground Truth</span>
            </div>
          </button>
        </div>
      </section>

      <!-- Right Sidebar: DBSCAN Anomaly Engine Console -->
      <aside
        v-if="isRightPanelOpen && activeRightTab === 'dbscan'"
        class="transition-all duration-300 ease-in-out z-30 shrink-0 h-full border-l border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl w-full sm:w-88 absolute lg:relative right-0 top-0 shadow-2xl lg:shadow-none"
      >
        <DBSCANAnomalyPanel
          :anomalies="anomalyClusters"
          @close="isRightPanelOpen = false; activeRightTab = null"
          @recalculate-dbscan="handleRecalculateDBSCAN"
        />
      </aside>
    </main>

    <!-- Modals & Feedback Overlays -->
    <ReportModal
      v-if="isReportModalOpen"
      :active-user="activeUser"
      :initial-coords="pickedCoords"
      :initial-area-name="pickedAreaName"
      @close="isReportModalOpen = false"
      @submit-report="handleSubmitReport"
      @request-map-pick="startMapPicker"
    />

    <SocialShareModal
      v-if="sharingReport"
      :report="sharingReport"
      @close="sharingReport = null"
    />

    <!-- Modern Glass Toast Notification Banner -->
    <transition name="toast-slide">
      <div
        v-if="toastMessage"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] bg-slate-900/90 dark:bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl font-medium text-xs flex items-center gap-3 border border-slate-700/80 backdrop-blur-xl"
      >
        <div class="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30">✓</div>
        <span class="tracking-wide">{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import TopNavbar from './components/TopNavbar.vue';
import HazeMap from './components/HazeMap.vue';
import ReportModal from './components/ReportModal.vue';
import SocialShareModal from './components/SocialShareModal.vue';
import DBSCANAnomalyPanel from './components/DBSCANAnomalyPanel.vue';
import ReportFeed from './components/ReportFeed.vue';

import { laravel } from './services/laravelApi.js';
import { redis } from './services/redisStore.js';
import { fastapi } from './services/fastapiEngine.js';

const officialStations = ref([]);
const reports = ref([]);
const anomalyClusters = ref([]);

// Default closed state on boot for both sidebars
const isLeftFeedVisible = ref(false); 
const isRightPanelOpen = ref(false); 
const activeRightTab = ref(null); 

const isReportModalOpen = ref(false);
const sharingReport = ref(null);
const isPickingLocation = ref(false);
const pickedCoords = ref({ lat: 4.450, lng: 114.020 });
const pickedAreaName = ref('');
const toastMessage = ref('');

const activeUser = ref(laravel.activeUser);
const isDark = ref(false);

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

const activeAnomalyCount = computed(() => {
  return anomalyClusters.value.filter(a => a.isAnomaly).length;
});

const handleKeydown = (e) => {
  if ((e.key === 'r' || e.key === 'R') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) {
    if (!isReportModalOpen.value && !isPickingLocation.value) {
      e.preventDefault();
      openReportModal();
    }
  }
};

onMounted(async () => {
  initTheme();

  officialStations.value = await laravel.getOfficialStations();
  reports.value = await laravel.getReports();
  anomalyClusters.value = laravel.computeAnomalies();

  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

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

async function handleSubmitReport(formData) {
  await laravel.submitReport(formData);
  reports.value = await laravel.getReports();
  anomalyClusters.value = laravel.computeAnomalies();
  isReportModalOpen.value = false;
  showToast('Ground report published & indexed into Redis GEO.');
}

function handleUpvote(reportId) {
  laravel.upvoteReport(reportId);
  showToast('Helpful report upvoted.');
}

function handleShareReport(report) {
  sharingReport.value = report;
}

function handleRecalculateDBSCAN({ epsKm, minSamples }) {
  anomalyClusters.value = laravel.computeAnomalies(epsKm, minSamples);
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