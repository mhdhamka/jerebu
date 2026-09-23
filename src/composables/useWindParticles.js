import L from 'leaflet';

export function useWindParticles() {
  function renderWindGrid(layer, windData) {
    if (!layer) return;
    layer.clearLayers();

    const wind = windData || { speedKmh: 14.5, directionDeg: 215, directionLabel: 'SW' };
    const blowTowardDeg = ((wind.directionDeg || 215) + 180) % 360;

    // Grid coordinates across Borneo & transboundary sea corridor
    const minLat = 1.0, maxLat = 4.6, stepLat = 0.9;
    const minLng = 109.8, maxLng = 115.2, stepLng = 1.1;

    for (let lat = minLat; lat <= maxLat; lat += stepLat) {
      for (let lng = minLng; lng <= maxLng; lng += stepLng) {
        const localVar = Math.sin(lat * 4) * 6;
        const angle = (blowTowardDeg + localVar) % 360;

        const vectorHtml = `
          <div class="pointer-events-none flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 opacity-75 hover:opacity-100 transition-opacity">
            <div style="transform: rotate(${angle}deg);" class="transition-transform duration-700">
              <svg class="w-7 h-7 text-sky-500 dark:text-sky-400 drop-shadow-sm" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19V5m0 0l-4 4m4-4l4 4" />
              </svg>
            </div>
            <div class="text-[9px] font-mono font-bold text-sky-700 dark:text-sky-300 bg-white/85 dark:bg-slate-900/85 px-1 py-0.2 rounded shadow-xs border border-sky-300/40 whitespace-nowrap">
              ${wind.speedKmh} km/h
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: vectorHtml,
          className: 'custom-wind-vector-pin',
          iconSize: [0, 0]
        });

        const marker = L.marker([lat, lng], { icon, interactive: false });
        layer.addLayer(marker);
      }
    }
  }

  return {
    renderWindGrid
  };
}
