<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;

class RedisGeoService
{
    const GEO_KEY = 'haze:reports:geo';
    const OFFICIAL_STATIONS_CACHE_KEY = 'haze:official:stations';
    const CACHE_TTL_SECONDS = 3600; // 1 hour government update cadence

    /**
     * Store report coordinates in Redis Geospatial Sorted Set.
     */
    public function addReportLocation(int|string $reportId, float $lng, float $lat): void
    {
        Redis::geoadd(self::GEO_KEY, $lng, $lat, (string) $reportId);
    }

    /**
     * Retrieve report IDs within radius (km) using Redis GEORADIUS or GEOSEARCH.
     */
    public function findNearbyReportIds(float $lng, float $lat, float $radiusKm = 50): array
    {
        // Redis GEOSEARCH command in Redis 6.2+ or GEORADIUS
        $members = Redis::geosearch(
            self::GEO_KEY,
            [
                'fromlonlat' => [$lng, $lat],
                'byradius' => [$radiusKm, 'km'],
                'withdist' => true
            ]
        );

        if (empty($members)) {
            return [];
        }

        return array_map(function ($entry) {
            return is_array($entry) ? $entry[0] : $entry;
        }, $members);
    }

    /**
     * Cache official AQI readings with 1-hour expiration.
     */
    public function cacheOfficialStations(array $stations): void
    {
        Redis::setex(self::OFFICIAL_STATIONS_CACHE_KEY, self::CACHE_TTL_SECONDS, json_encode($stations));
    }

    /**
     * Retrieve cached official stations.
     */
    public function getCachedOfficialStations(): ?array
    {
        $cached = Redis::get(self::OFFICIAL_STATIONS_CACHE_KEY);
        return $cached ? json_decode($cached, true) : null;
    }
}
