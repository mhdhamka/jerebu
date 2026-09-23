import L from 'leaflet';
import { escapeText } from '@/src/utils/security.js';
import { firmsService } from '@/src/services/nasaFirmsService.js';

export function useFirmsCanvasLayer() {
  /**
   * Consolidate dense raw satellite detections into authoritative regional fire complexes
   * to avoid screen clutter and overlapping duplicate cones.
   */
  function clusterNearbyHotspots(list, radiusKm = 25) {
    if (!list || list.length === 0) return [];
    if (list.length <= 8) return list;

    // Sort by FRP descending so strongest fires become primary cluster anchors
    const sorted = [...list].sort((a, b) => (Number(b.frp) || 0) - (Number(a.frp) || 0));
    const clusters = [];
    const assigned = new Set();

    for (let i = 0; i < sorted.length; i++) {
      if (assigned.has(i)) continue;
      const center = sorted[i];
      assigned.add(i);

      let totalFrp = Number(center.frp) || 20;
      let count = 1;

      for (let j = i + 1; j < sorted.length; j++) {
        if (assigned.has(j)) continue;
        const other = sorted[j];
        const dist = firmsService.calculateDistanceKm(center.lat, center.lng, other.lat, other.lng);
        if (dist <= radiusKm) {
          assigned.add(j);
          count++;
          totalFrp += (Number(other.frp) || 15);
        }
      }

      clusters.push({
        ...center,
        frp: Math.round(Number(center.frp) || (totalFrp / count)),
        totalFrp: Math.round(totalFrp),
        clusterCount: count
      });
    }

    // Keep top regional hotspots for clean, non-cluttered display
    return clusters.slice(0, 12);
  }

  function renderFirmsHotspots(layer, hotspots = [], windData = null) {
    if (!layer) return;
    layer.clearLayers();

    const activeHotspots = clusterNearbyHotspots(hotspots);
    const wind = windData || { speedKmh: 14.5, directionDeg: 215, directionLabel: 'SW' };

    for (const h of activeHotspots) {
      const isHigh = h.confidence === 'high' || (h.confidenceScore && h.confidenceScore >= 80);
      const isViirs = (h.sensorType || '').toLowerCase() === 'viirs' || (h.satellite || '').includes('VIIRS');
      const frp = Math.round(Number(h.frp) || (isHigh ? 45 : 36));
      const resolution = isViirs ? '375m' : '1km';

      // 1. Calculate plume trajectory cone and vector
      const trajectory = firmsService.calculateSmokeTrajectory(h, wind, 75);

      // 2. Base radial fire boundary ring (matching Image 1)
      const baseHalo = L.circle([h.lat, h.lng], {
        radius: 10000,
        color: '#f97316',
        weight: 1.5,
        fillColor: '#ea580c',
        fillOpacity: 0.18,
        dashArray: null
      });

      // 3. Smoke plume dispersion cone polygon (matching Image 1)
      const plumePolygon = L.polygon(trajectory.plumePolygon, {
        color: '#ea580c',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#f97316',
        fillOpacity: 0.16
      });

      // 4. Center drift axis line (matching Image 1)
      const centerLine = L.polyline([trajectory.start, trajectory.end], {
        color: '#ea580c',
        weight: 2.5,
        dashArray: '6, 6',
        opacity: 0.85
      });

      // 5. Signature FRP Circular Badge & MW Tag Marker (matching Image 1)
      const iconHtml = `
        <div class="flex flex-col items-center group cursor-pointer -translate-y-4" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.45));">
          <div style="background: radial-gradient(circle at 35% 35%, #ff2d55 0%, #dc2626 55%, #7f1d1d 100%); width: 40px; height: 40px; border-radius: 50%; border: 3px solid #0f172a; display: flex; align-items: center; justify-content: center; color: #ffffff; font-family: 'Space Mono', monospace; font-weight: 800; font-size: 14px; box-shadow: 0 0 14px rgba(220, 38, 38, 0.7);">
            ${frp}
          </div>
          <div style="background-color: #0f172a; color: #ffffff; border: 1.5px solid #334155;" class="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold mt-1 flex items-center gap-1 whitespace-nowrap shadow-md">
            <span>${frp}</span>
            <span class="text-orange-400 font-extrabold">MW</span>
            <span class="text-slate-400 font-medium">${resolution}</span>
          </div>
        </div>
      `;

      const marker = L.marker([h.lat, h.lng], {
        icon: L.divIcon({
          html: iconHtml,
          className: 'custom-firms-hotspot-pin',
          iconSize: [80, 64],
          iconAnchor: [40, 20]
        })
      });

      // Sanitized HTML popup
      const safeArea = escapeText(h.areaName || 'Peat Corridor');
      const safeCountry = escapeText(h.country || 'Borneo');
      const safeSatellite = escapeText(h.satellite || (isViirs ? 'VIIRS 375m' : 'MODIS 1km'));
      const estHours = trajectory.estimatedArrivalHours || 4;

      const popupHtml = `
        <div class="p-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 rounded-2xl border border-rose-200 dark:border-rose-900/70 shadow-2xl min-w-[270px] text-xs">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
            <span class="text-[10px] uppercase font-bold tracking-wider text-rose-500">Active Satellite Fire Source</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${isHigh ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}">
              ${isHigh ? 'High Confidence' : 'Nominal'}
            </span>
          </div>

          <div class="font-bold text-sm text-slate-900 dark:text-white mb-0.5">${safeArea}</div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">${safeCountry} &bull; ${safeSatellite}</div>

          <div class="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 rounded-xl p-2.5 mb-3 space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-slate-500">Fire Radiative Power:</span>
              <span class="font-mono font-bold text-rose-600 dark:text-rose-400">${frp} MW</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Smoke Drift Heading:</span>
              <span class="font-mono font-bold text-orange-600">~${estHours}h towards ${escapeText(wind.directionLabel || 'NE')}</span>
            </div>
            ${h.clusterCount > 1 ? `
            <div class="flex justify-between border-t border-rose-200/50 dark:border-rose-800/50 pt-1 text-[10px] text-slate-400">
              <span>Cluster Detections:</span>
              <span class="font-mono font-semibold">${h.clusterCount} satellite fire pixels</span>
            </div>
            ` : ''}
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn-focus-hotspot-drift flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold text-center cursor-pointer transition-all"
              data-lat="${h.lat}"
              data-lng="${h.lng}"
              data-end-lat="${trajectory.end[0]}"
              data-end-lng="${trajectory.end[1]}"
            >
              Zoom Drift
            </button>
            <button
              type="button"
              class="btn-report-at-hotspot flex-1 py-1.5 px-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-lg text-[11px] font-bold text-center cursor-pointer shadow-sm transition-all"
              data-loc-name="${safeArea}"
              data-lat="${h.lat}"
              data-lng="${h.lng}"
            >
              Report Here
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 300 });

      // Add to layer in correct z-order: base halo -> plume polygon -> center line -> marker pin
      layer.addLayer(baseHalo);
      layer.addLayer(plumePolygon);
      layer.addLayer(centerLine);
      layer.addLayer(marker);
    }
  }

  return {
    renderFirmsHotspots
  };
}
