import L from 'leaflet';
import { escapeText } from '@/src/utils/security.js';

export function useAnomalyLayers() {
  function renderAnomalies(layer, clusters = [], isDark = false) {
    if (!layer) return;
    layer.clearLayers();

    const areaBg = isDark ? '#0f172a' : 'rgba(255, 255, 255, 0.95)';
    const areaText = isDark ? '#f8fafc' : '#1e293b';
    const areaBorder = isDark ? '#334155' : '#e2e8f0';

    for (const anomaly of clusters) {
      if (!anomaly.is_anomaly && !anomaly.isAnomaly && (anomaly.discrepancy || 0) < 25) continue;

      const center = anomaly.centroid
        ? [anomaly.centroid.lat, anomaly.centroid.lng]
        : (anomaly.center || [1.5, 110.3]);

      const radiusMeters = anomaly.radiusMeters || 8500;
      const discrepancy = anomaly.discrepancy ?? 35;
      const safeArea = escapeText(anomaly.area || anomaly.area_name || (anomaly.nearest_station?.name ? `Cluster near ${anomaly.nearest_station.name}` : 'Peatland Spike Zone'));
      const reportCount = anomaly.report_count || anomaly.reportCount || 3;
      const groundTruthAqi = anomaly.ground_truth_aqi || anomaly.groundTruthAqi || 160;
      const nearestName = escapeText(anomaly.nearest_station?.name || anomaly.nearestStation?.name || 'DOE Station');
      const nearestAqi = anomaly.nearest_station?.official_aqi ?? anomaly.nearestStation?.aqi ?? 'N/A';

      const outerCircle = L.circle(center, {
        radius: radiusMeters,
        color: '#ea580c',
        fillColor: '#f97316',
        fillOpacity: isDark ? 0.25 : 0.18,
        weight: 2,
        dashArray: '6, 6'
      });

      const innerCircle = L.circle(center, {
        radius: Math.max(Math.round(radiusMeters * 0.45), 750),
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: isDark ? 0.40 : 0.30,
        weight: 2
      });

      const popupHtml = `
        <div class="p-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 rounded-2xl border border-orange-200 dark:border-orange-800/80 shadow-2xl min-w-[270px] text-xs">
          <div class="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2 text-orange-600 dark:text-orange-400">
            <span class="text-[10px] font-black uppercase tracking-wider">DBSCAN Smoke Spike Detected</span>
          </div>
          <div class="text-sm font-bold text-slate-900 dark:text-white mb-0.5">${safeArea}</div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">${reportCount} citizen reports confirm intense smoke concentration.</div>

          <div class="bg-orange-50/80 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/60 rounded-xl p-2.5 mb-2 space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-slate-500">Citizen Weighted AQI:</span>
              <span class="font-mono font-bold text-orange-900 dark:text-orange-300">${groundTruthAqi}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Nearest Gov Station:</span>
              <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">${nearestName} (${nearestAqi})</span>
            </div>
            <div class="flex justify-between border-t border-orange-200/60 dark:border-orange-800/60 pt-1 font-bold">
              <span class="text-orange-900 dark:text-orange-300">Station Blindspot:</span>
              <span class="font-mono text-red-600 dark:text-red-400">+${discrepancy} AQI</span>
            </div>
          </div>
        </div>
      `;

      outerCircle.bindPopup(popupHtml);
      innerCircle.bindPopup(popupHtml);

      const centerIcon = L.divIcon({
        className: 'custom-anomaly-pin',
        html: `
          <div class="flex flex-col items-center pointer-events-none -translate-x-1/2 -translate-y-1/2">
            <div class="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 pointer-events-auto"></div>
            <div class="relative -mt-8 px-2 py-0.5 rounded-lg bg-slate-900/90 text-white font-mono text-[9px] font-bold shadow-lg border border-slate-700 flex items-center gap-1.5 whitespace-nowrap pointer-events-auto">
              <span>SPIKE +${discrepancy} AQI</span>
            </div>
            <div style="background-color: ${areaBg}; color: ${areaText}; border: 1px solid ${areaBorder};" class="text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs mt-1 whitespace-nowrap pointer-events-auto">
              ${safeArea}
            </div>
          </div>
        `,
        iconSize: [0, 0]
      });

      const centerMarker = L.marker(center, { icon: centerIcon });
      centerMarker.bindPopup(popupHtml);

      layer.addLayer(outerCircle);
      layer.addLayer(innerCircle);
      layer.addLayer(centerMarker);
    }
  }

  return {
    renderAnomalies
  };
}
