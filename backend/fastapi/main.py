from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
from sklearn.cluster import DBSCAN
import math
import time

app = FastAPI(
    title="Jerebu Watch - Data Aggregator & Anomaly Detector",
    description="Python FastAPI engine for clustering crowdsourced haze reports and detecting localized spikes missing from official stations.",
    version="1.0.0"
)

class UserReportModel(BaseModel):
    id: str
    lat: float
    lng: float
    estimated_aqi: int
    trust_weight: float = 1.0
    visibility_meters: int
    smell_score: int
    area_name: Optional[str] = "Unknown"

class StationModel(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    aqi: int

class ClusterRequest(BaseModel):
    reports: List[UserReportModel]
    official_stations: List[StationModel]
    eps_km: float = 8.5
    min_samples: int = 2

class SentimentRequest(BaseModel):
    text: str
    symptoms: List[str] = []
    visibility_meters: int = 2000
    smell_score: int = 3

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Jerebu Watch AI Engine (FastAPI + DBSCAN + NLP)"}

@app.post("/api/ai/dbscan-cluster")
def detect_anomalies(payload: ClusterRequest):
    """
    Ingests reports from Laravel and official stations.
    Uses DBSCAN (Density-Based Spatial Clustering) with Haversine metric
    to identify dense clusters of ground truth reports indicating localized spikes.
    """
    if not payload.reports:
        return {"anomalies": [], "clusters_count": 0}

    # Convert coordinates to radians for Haversine metric
    coords = np.array([[math.radians(r.lat), math.radians(r.lng)] for r in payload.reports])
    
    # Earth radius in kilometers = 6371.0
    # eps in radians = eps_km / 6371.0
    eps_radians = payload.eps_km / 6371.0

    db = DBSCAN(eps=eps_radians, min_samples=payload.min_samples, metric='haversine')
    labels = db.fit_predict(coords)

    unique_labels = set(labels)
    clusters = []

    for label in unique_labels:
        if label == -1:
            # Noise points (isolated reports)
            continue

        cluster_indices = [i for i, l in enumerate(labels) if l == label]
        cluster_reports = [payload.reports[i] for i in cluster_indices]

        # Calculate weighted centroid and average AQI
        total_trust = sum(r.trust_weight for r in cluster_reports)
        avg_lat = sum(r.lat for r in cluster_reports) / len(cluster_reports)
        avg_lng = sum(r.lng for r in cluster_reports) / len(cluster_reports)
        weighted_aqi = round(sum(r.estimated_aqi * r.trust_weight for r in cluster_reports) / total_trust)

        # Find nearest official station
        nearest_station = None
        min_dist = float('inf')

        for st in payload.official_stations:
            dist = haversine_km(avg_lat, avg_lng, st.lat, st.lng)
            if dist < min_dist:
                min_dist = dist
                nearest_station = st

        # Compare ground truth vs official station
        discrepancy = (weighted_aqi - nearest_station.aqi) if nearest_station else weighted_aqi
        is_localized_spike = discrepancy >= 30 or weighted_aqi >= 150

        clusters.append({
            "cluster_id": int(label),
            "centroid": {"lat": avg_lat, "lng": avg_lng},
            "report_count": len(cluster_reports),
            "ground_truth_aqi": weighted_aqi,
            "nearest_station": {
                "name": nearest_station.name if nearest_station else "None",
                "official_aqi": nearest_station.aqi if nearest_station else None,
                "distance_km": round(min_dist, 2)
            } if nearest_station else None,
            "discrepancy": discrepancy,
            "is_anomaly": is_localized_spike,
            "confidence_score": min(99, 60 + len(cluster_reports) * 10)
        })

    return {
        "status": "success",
        "clusters_detected": len(clusters),
        "anomalies": clusters
    }

@app.post("/api/ai/sentiment-panic")
def analyze_panic(payload: SentimentRequest):
    """
    Performs NLP sentiment analysis on citizen haze reports.
    Extracts urgency terms, respiratory complaints, and panic tier.
    """
    text = payload.text.lower()
    keywords = {
        "sesak nafas": 20, "cannot breathe": 20, "pedih mata": 15, "choking": 18,
        "bau hangit": 12, "tak nampak jalan": 15, "sekolah tutup": 15, "darurat": 22,
        "semput": 16, "abu": 10, "ash": 10, "peat fire": 14
    }

    detected = [kw for kw in keywords if kw in text]
    base_score = sum(keywords[kw] for kw in detected)

    # Add physical urgency factors
    if payload.visibility_meters < 400:
        base_score += 30
    elif payload.visibility_meters < 1000:
        base_score += 15

    base_score += payload.smell_score * 5
    base_score += len(payload.symptoms) * 8

    panic_score = min(100, max(15, round(base_score * 0.7)))

    tier = "Calm"
    if panic_score > 75:
        tier = "Critical Emergency"
    elif panic_score > 55:
        tier = "High Distress"
    elif panic_score > 35:
        tier = "Moderate Concern"

    return {
        "panic_score": panic_score,
        "panic_tier": tier,
        "detected_triggers": detected,
        "analyzed_at": time.time()
    }

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
