/**
 * Redis Engine Emulation
 * Acts as cache for official government AQI data (hourly TTL)
 * and manages geospatial index (GEOADD, GEORADIUS/GEOSEARCH) for high-speed map queries.
 */

class RedisStore {
  constructor() {
    this.cache = new Map();
    this.geoIndex = new Map(); // key: memberId -> { lng, lat, data }
    this.logs = [];
    this.stats = {
      commandsExecuted: 0,
      hits: 0,
      misses: 0,
      geoQueries: 0,
      keysCount: 0
    };
  }

  logCommand(cmd, args, latencyMs, resultSummary) {
    const entry = {
      id: 'cmd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      command: cmd,
      args: args,
      latency: latencyMs.toFixed(2) + 'ms',
      result: resultSummary
    };
    this.logs.unshift(entry);
    if (this.logs.length > 50) this.logs.pop();
    this.stats.commandsExecuted++;
  }

  // SETEX key seconds value
  setEx(key, ttlSeconds, value) {
    const start = performance.now();
    const expireAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expireAt, ttlSeconds });
    this.stats.keysCount = this.cache.size + this.geoIndex.size;
    const elapsed = performance.now() - start;
    this.logCommand('SETEX', `${key} ${ttlSeconds}s`, elapsed + 0.35, 'OK (Cached)');
    return 'OK';
  }

  // GET key
  get(key) {
    const start = performance.now();
    const item = this.cache.get(key);
    const elapsed = performance.now() - start;
    if (!item) {
      this.stats.misses++;
      this.logCommand('GET', key, elapsed + 0.2, '(nil) Cache Miss');
      return null;
    }
    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.logCommand('GET', key, elapsed + 0.2, '(expired)');
      return null;
    }
    this.stats.hits++;
    this.logCommand('GET', key, elapsed + 0.15, `Hit (${JSON.stringify(item.value).length} bytes)`);
    return item.value;
  }

  // GEOADD key longitude latitude member
  geoAdd(key, lng, lat, member, data = {}) {
    const start = performance.now();
    this.geoIndex.set(member, { lng, lat, data, addedAt: Date.now() });
    this.stats.keysCount = this.cache.size + this.geoIndex.size;
    const elapsed = performance.now() - start;
    this.logCommand('GEOADD', `${key} ${lng.toFixed(4)} ${lat.toFixed(4)} ${member}`, elapsed + 0.4, '1');
    return 1;
  }

  // GEORADIUS / GEOSEARCH key lng lat radiusUnit
  geoRadius(key, centerLng, centerLat, radiusKm) {
    const start = performance.now();
    this.stats.geoQueries++;
    const results = [];

    for (const [member, item] of this.geoIndex.entries()) {
      const distKm = calculateHaversineKm(centerLat, centerLng, item.lat, item.lng);
      if (distKm <= radiusKm) {
        results.push({
          member,
          distanceKm: parseFloat(distKm.toFixed(2)),
          coordinates: [item.lng, item.lat],
          data: item.data
        });
      }
    }

    results.sort((a, b) => a.distanceKm - b.distanceKm);
    const elapsed = performance.now() - start;
    this.logCommand('GEORADIUS', `${key} [${centerLng.toFixed(3)}, ${centerLat.toFixed(3)}] ${radiusKm}km`, elapsed + 0.8, `${results.length} members found`);
    return results;
  }

  // Clear all
  flush() {
    this.cache.clear();
    this.geoIndex.clear();
    this.logCommand('FLUSHDB', '', 0.5, 'OK');
  }
}

// Distance helper
function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const redis = new RedisStore();
