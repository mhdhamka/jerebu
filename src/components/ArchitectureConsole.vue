<template>
  <div class="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none transition-colors duration-200">
    
    <!-- Header -->
    <div class="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-mono font-bold text-xs shadow-xs">
          API
        </div>
        <div>
          <div class="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Stack & Architecture Console</div>
          <div class="text-sm font-bold text-slate-900 dark:text-white">Laravel • Redis • FastAPI • Vue.js</div>
        </div>
      </div>
      <button
        @click="$emit('close')"
        class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'flex-1 py-2.5 px-3 font-semibold text-center transition-colors border-b-2 cursor-pointer',
          activeTab === tab.id
            ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-900'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab 1: Live Redis Geospatial & Cache Inspector -->
    <div v-if="activeTab === 'redis'" class="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
      <div class="grid grid-cols-3 gap-2">
        <div class="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
          <div class="text-[10px] uppercase text-slate-400 dark:text-slate-400 font-bold">Redis Keys</div>
          <div class="text-lg font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5">{{ redisStats.keysCount }}</div>
        </div>
        <div class="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
          <div class="text-[10px] uppercase text-slate-400 dark:text-slate-400 font-bold">Cache Hits</div>
          <div class="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{{ redisStats.hits }}</div>
        </div>
        <div class="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
          <div class="text-[10px] uppercase text-slate-400 dark:text-slate-400 font-bold">Geo Searches</div>
          <div class="text-lg font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">{{ redisStats.geoQueries }}</div>
        </div>
      </div>

      <!-- Redis Active Keys Explainer -->
      <div class="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
        <div class="font-bold text-slate-700 dark:text-slate-200">Active Redis Structures:</div>
        <div class="space-y-1.5 font-mono text-[11px]">
          <div class="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
            <span class="text-orange-600 dark:text-orange-400 font-semibold">haze:reports:geo</span>
            <span class="text-slate-400 dark:text-slate-400 text-[10px]">GEO (Sorted Set / Geohash)</span>
          </div>
          <div class="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
            <span class="text-emerald-600 dark:text-emerald-400 font-semibold">haze:official:stations</span>
            <span class="text-slate-400 dark:text-slate-400 text-[10px]">STRING (TTL: 3600s hourly)</span>
          </div>
        </div>
      </div>

      <!-- Live Redis Command Feed -->
      <div class="flex-1 flex flex-col">
        <div class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2 flex items-center justify-between">
          <span>Live Redis Command Stream</span>
          <span class="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            CONNECTED
          </span>
        </div>
        <div class="space-y-1.5 font-mono text-[11px] overflow-y-auto max-h-[340px]">
          <div
            v-for="log in redisLogs"
            :key="log.id"
            class="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
          >
            <div class="truncate mr-2">
              <span class="text-orange-600 dark:text-orange-400 font-bold mr-2">{{ log.command }}</span>
              <span class="text-slate-600 dark:text-slate-300">{{ log.args }}</span>
            </div>
            <div class="text-slate-400 dark:text-slate-400 whitespace-nowrap text-[10px]">
              {{ log.latency }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Laravel REST API Activity -->
    <div v-if="activeTab === 'laravel'" class="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
      <div class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <strong class="text-slate-900 dark:text-white">Laravel Responsibilities:</strong> User authentication, reporter reputation weighting (e.g. clinic doctors get 2.8x multiplier), Eloquent model persistence, and proxying requests to FastAPI.
      </div>

      <!-- Active Users Weighted Table -->
      <div>
        <div class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2">
          Reputation Weighting System
        </div>
        <div class="space-y-1.5 text-xs">
          <div
            v-for="user in trustedUsers"
            :key="user.id"
            class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
          >
            <div>
              <div class="font-bold text-slate-800 dark:text-slate-200">{{ user.name }}</div>
              <div class="text-[11px] text-slate-400 dark:text-slate-400">{{ user.role }}</div>
            </div>
            <div class="text-right">
              <span class="font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                {{ user.trustWeight }}x Weight
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Laravel HTTP Logs -->
      <div class="flex-1 flex flex-col">
        <div class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2">
          Recent Laravel Controller Invocations
        </div>
        <div class="space-y-1.5 font-mono text-[11px] overflow-y-auto max-h-[280px]">
          <div
            v-for="log in laravelLogs"
            :key="log.id"
            class="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800"
          >
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-1.5">
                <span class="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 font-bold text-[10px]">{{ log.method }}</span>
                <span class="text-slate-800 dark:text-slate-200">{{ log.endpoint }}</span>
              </div>
              <span class="text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">{{ log.status }} OK</span>
            </div>
            <div class="text-[10px] text-slate-400 dark:text-slate-400 truncate font-sans">{{ log.payload }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Python FastAPI Service Logs -->
    <div v-if="activeTab === 'fastapi'" class="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
      <div class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <strong class="text-blue-600 dark:text-blue-400">FastAPI ML Pipeline:</strong> Runs scikit-learn DBSCAN clustering on spatial coordinates and NLP panic sentiment classification on Bahasa Melayu / English citizen report text.
      </div>

      <!-- FastAPI Endpoints & Method Call Logs -->
      <div class="flex-1 flex flex-col">
        <div class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2">
          FastAPI Request & Inference Feed
        </div>
        <div class="space-y-2 font-mono text-[11px] overflow-y-auto max-h-[380px]">
          <div
            v-for="log in fastapiLogs"
            :key="log.id"
            class="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[10px]">{{ log.method }}</span>
                <span class="text-slate-800 dark:text-slate-200 font-bold">{{ log.endpoint }}</span>
              </div>
              <span class="text-slate-400 dark:text-slate-400 text-[10px]">{{ log.duration }}</span>
            </div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{{ log.details }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 4: Genuine Source Code Files Viewer -->
    <div v-if="activeTab === 'code'" class="flex-1 flex flex-col p-4 overflow-hidden">
      <!-- File Selector Dropdown -->
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold text-slate-500 dark:text-slate-400">Backend Implementation Files:</span>
        <select
          v-model="selectedFile"
          class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 px-2.5 py-1 font-mono cursor-pointer focus:outline-none focus:border-orange-500"
        >
          <option value="laravel_routes">laravel/routes/api.php</option>
          <option value="laravel_controller">laravel/app/Http/Controllers/AQIReportController.php</option>
          <option value="redis_service">laravel/app/Services/RedisGeoService.php</option>
          <option value="fastapi_main">fastapi/main.py (DBSCAN + NLP)</option>
        </select>
      </div>

      <!-- Code Box -->
      <div class="flex-1 bg-slate-900 rounded-2xl p-3.5 overflow-y-auto font-mono text-[11px] text-slate-200 leading-relaxed shadow-sm">
        <pre class="whitespace-pre-wrap">{{ currentCodeContent }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { TRUSTED_USERS } from '../data/initialReports.js';

const props = defineProps({
  redisLogs: { type: Array, default: () => [] },
  redisStats: { type: Object, default: () => ({}) },
  laravelLogs: { type: Array, default: () => [] },
  fastapiLogs: { type: Array, default: () => [] }
});

defineEmits(['close']);

const activeTab = ref('redis');
const selectedFile = ref('fastapi_main');
const trustedUsers = TRUSTED_USERS;

const tabs = [
  { id: 'redis', label: 'Redis GEO' },
  { id: 'laravel', label: 'Laravel' },
  { id: 'fastapi', label: 'FastAPI' },
  { id: 'code', label: 'Source Code' }
];

const codeSnippets = {
  fastapi_main: `from fastapi import FastAPI
from sklearn.cluster import DBSCAN
import numpy as np

app = FastAPI(title="Jerebu Watch AI Engine")

@app.post("/api/ai/dbscan-cluster")
def detect_anomalies(payload: ClusterRequest):
    coords = np.array([[math.radians(r.lat), math.radians(r.lng)] for r in payload.reports])
    eps_radians = payload.eps_km / 6371.0 # Haversine metric
    
    db = DBSCAN(eps=eps_radians, min_samples=payload.min_samples, metric='haversine')
    labels = db.fit_predict(coords)
    
    # Identifies clusters where ground-truth AQI exceeds sparse official stations!
    ...`,
  laravel_routes: `<?php
use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\AQIReportController;

Route::prefix('v1')->group(function () {
    Route::get('/stations', [StationController::class, 'index']);
    Route::get('/reports/geosearch', [AQIReportController::class, 'searchByRadius']);
    Route::post('/reports', [AQIReportController::class, 'store']);
});`,
  laravel_controller: `<?php
namespace App\\Http\\Controllers;

use App\\Models\\UserReport;
use App\\Services\\RedisGeoService;

class AQIReportController extends Controller {
    public function store(Request $request) {
        $trustWeight = $request->user()?->trust_weight ?? 1.0;
        $report = UserReport::create([...]);
        
        // Push immediately into Redis GEO Sorted Set
        $this->geoService->addReportLocation($report->id, $report->lng, $report->lat);
        return response()->json(['status' => 'created', 'data' => $report], 201);
    }
}`,
  redis_service: `<?php
namespace App\\Services;
use Illuminate\\Support\\Facades\\Redis;

class RedisGeoService {
    const GEO_KEY = 'haze:reports:geo';

    public function addReportLocation($reportId, float $lng, float $lat): void {
        Redis::geoadd(self::GEO_KEY, $lng, $lat, (string)$reportId);
    }

    public function findNearbyReportIds(float $lng, float $lat, float $radiusKm = 50): array {
        return Redis::geosearch(self::GEO_KEY, [
            'fromlonlat' => [$lng, $lat],
            'byradius' => [$radiusKm, 'km']
        ]);
    }
}`
};

const currentCodeContent = computed(() => {
  return codeSnippets[selectedFile.value] || '';
});
</script>
