<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AQIReportController;
use App\Http\Controllers\StationController;

/*
|--------------------------------------------------------------------------
| API Routes - Jerebu Watch
|--------------------------------------------------------------------------
| Laravel endpoints handling crowdsourced haze ground truth reports,
| official APIMS/NEA station syncing, Redis geospatial caching,
| and webhook dispatch to Python FastAPI DBSCAN aggregator.
*/

Route::prefix('v1')->group(function () {
    // Official Government AQI Stations (Cached in Redis)
    Route::get('/stations', [StationController::class, 'index']);
    Route::post('/stations/sync', [StationController::class, 'syncGovernmentApis']);

    // Crowdsourced Ground Truth Reports
    Route::get('/reports', [AQIReportController::class, 'index']);
    Route::get('/reports/geosearch', [AQIReportController::class, 'searchByRadius']);
    Route::post('/reports', [AQIReportController::class, 'store']);
    Route::post('/reports/{id}/upvote', [AQIReportController::class, 'upvote']);

    // FastAPI Anomaly Detection Proxy / Webhook
    Route::get('/anomalies', [AQIReportController::class, 'getFastApiAnomalies']);
});
