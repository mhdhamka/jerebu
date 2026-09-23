import L from 'leaflet';
import { ref, shallowRef } from 'vue';

export function useLeafletMap() {
  const map = shallowRef(null);
  const layers = shallowRef({
    official: null,
    reports: null,
    anomalies: null,
    hotspots: null,
    wind: null,
    divergence: null
  });

  let tileLayerInstance = null;
  let resizeObserver = null;

  function initMap(containerId, options = {}) {
    if (map.value) return map.value;

    const defaultOptions = {
      center: [4.450, 114.020],
      zoom: 12,
      zoomControl: false,
      preferCanvas: true,
      attributionControl: true,
      ...options
    };

    const mapInstance = L.map(containerId, defaultOptions);
    L.control.zoom({ position: 'bottomleft' }).addTo(mapInstance);

    // Create and attach dedicated layer groups
    layers.value = {
      official: L.layerGroup().addTo(mapInstance),
      reports: L.layerGroup().addTo(mapInstance),
      anomalies: L.layerGroup().addTo(mapInstance),
      hotspots: L.layerGroup().addTo(mapInstance),
      wind: L.layerGroup().addTo(mapInstance),
      divergence: L.layerGroup().addTo(mapInstance)
    };

    map.value = mapInstance;

    // Attach ResizeObserver to container to guarantee map strictly adapts to layout bounds
    const containerEl = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (containerEl && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (map.value) {
          map.value.invalidateSize({ debounceMoveend: true });
        }
      });
      resizeObserver.observe(containerEl);
    }

    return mapInstance;
  }

  function setTileLayer(type = 'default', isDark = false) {
    if (!map.value) return;

    if (tileLayerInstance) {
      map.value.removeLayer(tileLayerInstance);
      tileLayerInstance = null;
    }

    if (type === 'satellite') {
      tileLayerInstance = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 18
        }
      ).addTo(map.value);
    } else {
      // 100% Free OpenStreetMap - No API key required, no watermarks, full global coverage
      tileLayerInstance = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
          maxZoom: 19
        }
      ).addTo(map.value);
    }

    if (tileLayerInstance.bringToBack) {
      tileLayerInstance.bringToBack();
    }
  }

  function syncLayerVisibility(filters) {
    if (!map.value || !layers.value) return;

    const manage = (layer, visible) => {
      if (!layer) return;
      if (visible && !map.value.hasLayer(layer)) {
        map.value.addLayer(layer);
      } else if (!visible && map.value.hasLayer(layer)) {
        map.value.removeLayer(layer);
      }
    };

    manage(layers.value.official, filters.official);
    manage(layers.value.reports, filters.community);
    manage(layers.value.anomalies, filters.anomalies);
    manage(layers.value.hotspots, filters.hotspots);
    manage(layers.value.wind, filters.wind);
    manage(layers.value.divergence, filters.divergence);
  }

  function flyToLocation(lat, lng, zoom = 14) {
    if (!map.value) return;
    map.value.flyTo([lat, lng], zoom, { duration: 1.4 });
  }

  function invalidateSize(animate = false) {
    if (map.value) {
      map.value.invalidateSize({ animate, debounceMoveend: true });
    }
  }

  function destroyMap() {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (map.value) {
      map.value.remove();
      map.value = null;
    }
    tileLayerInstance = null;
  }

  return {
    map,
    layers,
    initMap,
    setTileLayer,
    syncLayerVisibility,
    flyToLocation,
    invalidateSize,
    destroyMap
  };
}
