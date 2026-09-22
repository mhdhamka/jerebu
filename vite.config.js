import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vite';

let firmsCache = {
  timestamp: 0,
  data: null
};

function getHotspotRegion(lat, lng) {
  if (lat >= 1.05 && lat <= 1.45 && lng >= 111.1 && lng <= 111.9) return { areaName: 'Sri Aman Peat Buffer', region: 'Sarawak', country: 'Malaysia', isTransboundary: false };
  if (lat >= 1.3 && lat <= 1.6 && lng >= 110.4 && lng <= 110.9) return { areaName: 'Samarahan / Asajaya Peatland', region: 'Sarawak', country: 'Malaysia', isTransboundary: false };
  if (lat >= 4.3 && lat <= 4.7 && lng >= 113.9 && lng <= 114.25) return { areaName: 'Kuala Baram Peat Swamp (Miri)', region: 'Sarawak', country: 'Malaysia', isTransboundary: false };
  if (lat >= 2.0 && lat <= 2.8 && lng >= 111.5 && lng <= 112.5) return { areaName: 'Mukah / Sibu Peat Forest', region: 'Sarawak', country: 'Malaysia', isTransboundary: false };
  if (lat >= 2.8 && lat <= 3.5 && lng >= 112.8 && lng <= 113.8) return { areaName: 'Bintulu Coastal Peat Corridor', region: 'Sarawak', country: 'Malaysia', isTransboundary: false };
  if (lat >= 0.5 && lat <= 1.8 && lng >= 108.8 && lng <= 110.2) return { areaName: 'Sambas / Singkawang Peat Basin', region: 'West Kalimantan', country: 'Indonesia', isTransboundary: true };
  if (lat >= -0.8 && lat <= 0.4 && lng >= 109.0 && lng <= 110.5) return { areaName: 'Pontianak / Kubu Raya Peatland', region: 'West Kalimantan', country: 'Indonesia', isTransboundary: true };
  if (lat >= -2.5 && lat <= -0.8 && lng >= 109.8 && lng <= 111.5) return { areaName: 'Ketapang Peat Forest', region: 'West Kalimantan', country: 'Indonesia', isTransboundary: true };
  if (lat >= -3.5 && lat <= -1.0 && lng >= 111.5 && lng <= 114.0) return { areaName: 'Kotawaringin / Sampit Peat Belt', region: 'Central Kalimantan', country: 'Indonesia', isTransboundary: true };
  if (lng < 105.0) return { areaName: 'Riau / Sumatra Peat Basin', region: 'Sumatra', country: 'Indonesia', isTransboundary: true };
  if (lat < 1.0) return { areaName: 'West Kalimantan Border Peatland', region: 'West Kalimantan', country: 'Indonesia', isTransboundary: true };
  return { areaName: 'Borneo Interior Corridor', region: 'Sarawak / Border', country: 'Malaysia', isTransboundary: false };
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function liveSyncPlugin() {
  return {
    name: 'live-sync-proxy-plugin',
    configureServer(server) {
      // NASA FIRMS Live Fire Hotspots Endpoint
      server.middlewares.use('/api/firms/hotspots', async (req, res) => {
        const urlObj = new URL(req.url, 'http://localhost:3000');
        const minFrp = parseFloat(urlObj.searchParams.get('min_frp') || '2');
        const sensorFilter = urlObj.searchParams.get('sensor') || 'all'; // 'all', 'viirs', 'modis'
        const confidenceFilter = urlObj.searchParams.get('confidence') || 'all'; // 'all', 'high'
        const forceRefresh = urlObj.searchParams.get('refresh') === 'true';
        const userMapKey = urlObj.searchParams.get('map_key') || process.env.NASA_FIRMS_MAP_KEY || '';

        res.setHeader('Content-Type', 'application/json');

        const now = Date.now();
        // 5-minute cache
        if (!forceRefresh && firmsCache.data && (now - firmsCache.timestamp) < 300000 && !userMapKey) {
          let list = firmsCache.data.hotspots;
          if (sensorFilter !== 'all') {
            list = list.filter(h => (h.sensorType || '').toLowerCase() === sensorFilter.toLowerCase());
          }
          if (confidenceFilter === 'high') {
            list = list.filter(h => h.confidence === 'high' || (h.confidenceScore && h.confidenceScore >= 80));
          }
          return res.end(JSON.stringify({
            success: true,
            cached: true,
            cacheAgeSeconds: Math.round((now - firmsCache.timestamp) / 1000),
            data: {
              ...firmsCache.data,
              hotspots: list,
              totalCount: list.length,
              highConfidenceCount: list.filter(h => h.confidence === 'high').length,
              transboundaryCount: list.filter(h => h.isTransboundary).length,
              totalFRP: Math.round(list.reduce((sum, h) => sum + (h.frp || 0), 0))
            }
          }));
        }

        try {
          const results = [];
          const feedsToFetch = [];

          // If user provided a NASA FIRMS MAP_KEY, query NASA FIRMS API directly
          if (userMapKey) {
            const bbox = '108,-3,116,5'; // Borneo & transboundary corridor
            if (sensorFilter === 'all' || sensorFilter === 'viirs') {
              feedsToFetch.push({
                url: `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${userMapKey}/VIIRS_SNPP_NRT/${bbox}/1`,
                type: 'VIIRS',
                satellite: 'VIIRS Suomi-NPP',
                instrument: 'VIIRS (375m)'
              });
              feedsToFetch.push({
                url: `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${userMapKey}/VIIRS_NOAA20_NRT/${bbox}/1`,
                type: 'VIIRS',
                satellite: 'VIIRS NOAA-20',
                instrument: 'VIIRS (375m)'
              });
            }
            if (sensorFilter === 'all' || sensorFilter === 'modis') {
              feedsToFetch.push({
                url: `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${userMapKey}/MODIS_NRT/${bbox}/1`,
                type: 'MODIS',
                satellite: 'MODIS Terra/Aqua',
                instrument: 'MODIS (1km)'
              });
            }
          } else {
            // Free Near-Real-Time Southeast Asia feeds from NASA FIRMS
            if (sensorFilter === 'all' || sensorFilter === 'viirs') {
              feedsToFetch.push({
                url: 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_SouthEast_Asia_24h.csv',
                type: 'VIIRS',
                satellite: 'VIIRS Suomi-NPP',
                instrument: 'VIIRS (375m)'
              });
              feedsToFetch.push({
                url: 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_SouthEast_Asia_24h.csv',
                type: 'VIIRS',
                satellite: 'VIIRS NOAA-20',
                instrument: 'VIIRS (375m)'
              });
            }
            if (sensorFilter === 'all' || sensorFilter === 'modis') {
              feedsToFetch.push({
                url: 'https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_SouthEast_Asia_24h.csv',
                type: 'MODIS',
                satellite: 'MODIS Terra/Aqua',
                instrument: 'MODIS (1km)'
              });
            }
          }

          // Fetch feeds concurrently with 8-second timeout
          const responses = await Promise.allSettled(
            feedsToFetch.map(async (feed) => {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 8000);
              try {
                const response = await fetch(feed.url, {
                  signal: controller.signal,
                  headers: { 'Accept': 'text/csv,text/plain,*/*' }
                });
                clearTimeout(timeoutId);
                if (!response.ok) return { feed, text: null };
                const text = await response.text();
                return { feed, text };
              } catch (err) {
                clearTimeout(timeoutId);
                return { feed, text: null };
              }
            })
          );

          let rowCount = 0;
          for (const resItem of responses) {
            if (resItem.status !== 'fulfilled' || !resItem.value.text) continue;
            const { feed, text } = resItem.value;
            const lines = text.trim().split('\n');
            if (lines.length < 2) continue;

            const header = lines[0].split(',').map(h => h.trim());
            const latIdx = header.indexOf('latitude');
            const lngIdx = header.indexOf('longitude');
            const frpIdx = header.indexOf('frp');
            const brightIdx = header.indexOf(feed.type === 'VIIRS' ? 'bright_ti4' : 'brightness');
            const confIdx = header.indexOf('confidence');
            const dateIdx = header.indexOf('acq_date');
            const timeIdx = header.indexOf('acq_time');
            const dayNightIdx = header.indexOf('daynight');

            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              const cols = line.split(',');
              const lat = parseFloat(cols[latIdx]);
              const lng = parseFloat(cols[lngIdx]);

              // Focus on Borneo Corridor (Sarawak, Sabah, Brunei, West/Central/East Kalimantan)
              // and Sumatra transboundary zones: Lat -3.5 to 5.2, Lng 108.0 to 118.0
              if (isNaN(lat) || isNaN(lng)) continue;
              if (lat < -3.5 || lat > 5.2 || lng < 108.0 || lng > 118.0) continue;

              const frp = frpIdx >= 0 ? parseFloat(cols[frpIdx]) || 0 : 0;
              if (frp < minFrp) continue;

              const rawConf = confIdx >= 0 ? cols[confIdx] : 'nominal';
              let confLevel = 'nominal';
              let confScore = 75;

              if (feed.type === 'VIIRS') {
                if (rawConf === 'h' || rawConf === 'high') {
                  confLevel = 'high';
                  confScore = 95;
                } else if (rawConf === 'l' || rawConf === 'low') {
                  confLevel = 'low';
                  confScore = 40;
                }
              } else {
                // MODIS confidence is 0-100
                const numConf = parseInt(rawConf, 10);
                if (!isNaN(numConf)) {
                  confScore = numConf;
                  confLevel = numConf >= 80 ? 'high' : numConf >= 40 ? 'nominal' : 'low';
                }
              }

              if (confidenceFilter === 'high' && confLevel !== 'high') continue;

              const brightness = brightIdx >= 0 ? parseFloat(cols[brightIdx]) || 320 : 320;
              const acqDate = dateIdx >= 0 ? cols[dateIdx] : new Date().toISOString().split('T')[0];
              const rawTime = timeIdx >= 0 ? cols[timeIdx] : '1200';
              const formattedTime = rawTime.length === 4
                ? `${rawTime.slice(0, 2)}:${rawTime.slice(2, 4)} UTC`
                : `${rawTime} UTC`;
              const dayNight = dayNightIdx >= 0 && cols[dayNightIdx] === 'D' ? 'Day Pass' : 'Night Pass';

              const regionInfo = getHotspotRegion(lat, lng);
              const distToKuching = calculateDistanceKm(lat, lng, 1.5533, 110.3592);

              results.push({
                id: `FIRMS_${feed.type}_${rowCount++}`,
                lat: Number(lat.toFixed(4)),
                lng: Number(lng.toFixed(4)),
                frp: Math.round(frp * 10) / 10,
                brightness: Math.round(brightness * 10) / 10,
                confidence: confLevel,
                confidenceScore: confScore,
                acqDate,
                acqTime: formattedTime,
                dayNight,
                satellite: feed.satellite,
                instrument: feed.instrument,
                sensorType: feed.type,
                areaName: regionInfo.areaName,
                region: regionInfo.region,
                country: regionInfo.country,
                isTransboundary: regionInfo.isTransboundary,
                distanceToKuchingKm: distToKuching,
                smokeDriftHeading: regionInfo.isTransboundary ? 'North-Northeast towards Sarawak' : 'Local Peat Dispersion'
              });
            }
          }

          // Sort by FRP (Fire Radiative Power) descending
          results.sort((a, b) => b.frp - a.frp);

          // Limit to top 250 highest intensity hotspots for peak Leaflet performance
          const topResults = results.slice(0, 250);

          const payload = {
            hotspots: topResults,
            totalFound: results.length,
            displayedCount: topResults.length,
            highConfidenceCount: results.filter(h => h.confidence === 'high').length,
            transboundaryCount: results.filter(h => h.isTransboundary).length,
            totalFRP: Math.round(results.reduce((sum, h) => sum + h.frp, 0)),
            lastUpdated: new Date().toISOString(),
            dataSource: userMapKey ? 'NASA FIRMS API (Custom Map Key)' : 'NASA FIRMS Near Real-Time Feed (VIIRS & MODIS)'
          };

          if (!userMapKey) {
            firmsCache = {
              timestamp: now,
              data: payload
            };
          }

          return res.end(JSON.stringify({
            success: true,
            cached: false,
            data: payload
          }));
        } catch (err) {
          // If network error, return cached data if available
          if (firmsCache.data) {
            return res.end(JSON.stringify({
              success: true,
              cached: true,
              warning: 'Returned cached FIRMS data due to upstream network issue.',
              data: firmsCache.data
            }));
          }
          res.statusCode = 500;
          return res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });

      // Endpoint to scrape or fetch IQAir page
      server.middlewares.use('/api/sync/iqair-scrape', async (req, res) => {
        const urlObj = new URL(req.url, 'http://localhost:3000');
        const targetUrl = urlObj.searchParams.get('url') || 'https://www.iqair.com/air-quality/malaysia/sarawak/kuching';

        try {
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });

          const html = await response.text();
          res.setHeader('Content-Type', 'application/json');

          if (response.status === 429 || html.includes('Vercel Security Checkpoint') || html.includes('cf-browser-verification')) {
            return res.end(JSON.stringify({
              success: false,
              securityCheckpoint: true,
              status: response.status,
              message: 'Target page protected by Vercel/Cloudflare security challenge.'
            }));
          }

          const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
          if (nextDataMatch) {
            const nextData = JSON.parse(nextDataMatch[1]);
            const pageProps = nextData.props?.pageProps || {};
            const current = pageProps.current || pageProps.station || pageProps.airQuality;
            return res.end(JSON.stringify({
              success: true,
              data: {
                source: 'Option 3: IQAir Scraper Proxy',
                city: 'Kuching',
                aqi: current?.pollution?.aqius || 160,
                pm25: current?.pollution?.pm25 || 68.3,
                weather: {
                  tempC: current?.weather?.tp || 25,
                  humidity: current?.weather?.hu || 96,
                  windKmh: current?.weather?.ws ? Math.round(current?.weather?.ws * 3.6) : 4
                },
                attribution: 'Department of Environment of Malaysia',
                timestamp: new Date().toISOString()
              }
            }));
          }

          return res.end(JSON.stringify({
            success: false,
            message: 'Unable to parse __NEXT_DATA__ payload from HTML.'
          }));
        } catch (err) {
          res.statusCode = 500;
          return res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    base: '/', 
    plugins: [vue(), tailwindcss(), liveSyncPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});