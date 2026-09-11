<?php

namespace App\Http\Controllers;

use App\Models\UserReport;
use App\Services\RedisGeoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redis;

class AQIReportController extends Controller
{
    protected RedisGeoService $geoService;

    public function __construct(RedisGeoService $geoService)
    {
        $this->geoService = $geoService;
    }

    /**
     * List recent crowdsourced ground-truth reports.
     */
    public function index(Request $request)
    {
        $reports = UserReport::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $reports
        ]);
    }

    /**
     * Query reports within radius using Redis Geospatial index (GEORADIUS).
     */
    public function searchByRadius(Request $request)
    {
        $request->validate([
            'lng' => 'required|numeric',
            'lat' => 'required|numeric',
            'radius_km' => 'nullable|numeric|max:200'
        ]);

        $lng = (float) $request->input('lng');
        $lat = (float) $request->input('lat');
        $radiusKm = (float) ($request->input('radius_km') ?? 50);

        // Fetch member IDs from Redis GEO index in sub-millisecond time
        $memberIds = $this->geoService->findNearbyReportIds($lng, $lat, $radiusKm);

        $reports = UserReport::whereIn('id', $memberIds)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'meta' => [
                'radius_km' => $radiusKm,
                'redis_geo_hits' => count($memberIds)
            ],
            'data' => $reports
        ]);
    }

    /**
     * Store new ground truth report.
     * Evaluates trusted reporter weighting, indexes into Redis, and pings FastAPI.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'area_name' => 'required|string|max:150',
            'city' => 'nullable|string|max:100',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'visibility_meters' => 'required|integer|min:50|max:20000',
            'smell_level' => 'required|string',
            'smell_score' => 'required|integer|between:1,5',
            'symptoms' => 'nullable|array',
            'description' => 'required|string|max:1000'
        ]);

        $user = $request->user();
        $trustWeight = $user ? $user->trust_weight : 1.0;

        // Estimate local AQI based on visibility and burning smell
        $estimatedAqi = $this->estimateAqi($validated['visibility_meters'], $validated['smell_score']);

        // Dispatch text to Python FastAPI NLP sentiment analyzer
        $fastApiResponse = Http::timeout(3)->post(config('services.fastapi.url') . '/api/ai/sentiment-panic', [
            'text' => $validated['description'],
            'symptoms' => $validated['symptoms'] ?? [],
            'visibility_meters' => $validated['visibility_meters'],
            'smell_score' => $validated['smell_score']
        ]);

        $panicScore = $fastApiResponse->successful() ? $fastApiResponse->json('panic_score', 50) : 50;

        $report = UserReport::create([
            'user_id' => $user?->id,
            'area_name' => $validated['area_name'],
            'city' => $validated['city'] ?? 'Southeast Asia',
            'lat' => $validated['latitude'],
            'lng' => $validated['longitude'],
            'visibility_meters' => $validated['visibility_meters'],
            'smell_level' => $validated['smell_level'],
            'smell_score' => $validated['smell_score'],
            'estimated_aqi' => $estimatedAqi,
            'symptoms' => $validated['symptoms'] ?? [],
            'description' => $validated['description'],
            'trust_weight' => $trustWeight,
            'panic_score' => $panicScore,
            'upvotes' => 1
        ]);

        // Push directly to Redis Geospatial Index (GEOADD)
        $this->geoService->addReportLocation($report->id, (float)$report->lng, (float)$report->lat);

        return response()->json([
            'status' => 'created',
            'data' => $report
        ], 201);
    }

    protected function estimateAqi(int $visibilityMeters, int $smellScore): int
    {
        $base = 75;
        if ($visibilityMeters <= 300) $base = 240;
        elseif ($visibilityMeters <= 600) $base = 195;
        elseif ($visibilityMeters <= 1000) $base = 160;
        elseif ($visibilityMeters <= 2000) $base = 120;

        if ($smellScore >= 4) $base += 25;
        return min(400, $base);
    }
}
