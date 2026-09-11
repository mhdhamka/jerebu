from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
import numpy as np
from sklearn.cluster import DBSCAN
import math
import time

app = FastAPI(
    title="Jerebu Watch - Data Aggregator & Anomaly Detector",
    description="Python FastAPI engine for clustering crowdsourced haze reports and detecting localized spikes missing from official stations.",
    version="1.1.0"
)

# --- Enhanced Models with Validation ---
class UserReportModel(BaseModel):
    id: str
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    estimated_aqi: int = Field(..., ge=0, le=500)
    trust_weight: float = Field(default=1.0, ge=0.1, le=5.0)
    visibility_meters: int = Field(..., ge=0)
    smell_score: int = Field(..., ge=1, le=5)
    area_name: Optional[str] = "Unknown"

    @field_validator('estimated_aqi')
    def validate_aqi(cls, v):
        if v > 500:
            return 500
        return v

class StationModel(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    aqi: int = Field(..., ge=0)

class ClusterRequest(BaseModel):
    reports: List[UserReportModel]
    official_stations: List[StationModel]
    eps_km: float = Field(default=8.5, gt=0)
    min_samples: int = Field(default=2, ge=1)

class SentimentRequest(BaseModel):
    text: str = Field(..., min_strip_whitespace=True)
    symptoms: List[str] = []
    visibility_meters: int = Field(default=2000, ge=0)
    smell_score: int = Field(default=3, ge=1, le=5)


# --- Utility Functions ---

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth surface."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


# --- Endpoints ---

@app.get("/")
def health_check() -> Dict[str, Any]:
    return {
        "status": "ok", 
        "service": "Jerebu Watch AI Engine (FastAPI + DBSCAN + NLP)",
        "version": "1.1.0",
        "timestamp": time.time()
    }

@app.post("/api/ai/dbscan-cluster")
def detect_anomalies(payload: ClusterRequest) -> Dict[str, Any]:
    """
    Ingests reports and official stations. Uses DBSCAN with Haversine metric
    to cluster crowdsourced observations and flag micro-climate spikes.
    """
    if not payload.reports:
        return {"status": "success", "clusters_detected": 0, "anomalies": []}

    try:
        # Convert coordinates to radians for Haversine metric
        coords = np.array([[math.radians(r.lat), math.radians(r.lng)] for r in payload.reports])
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

            total_trust = sum(r.trust_weight for r in cluster_reports)
            if total_trust == 0:
                total_trust = 1.0 # Prevent division by zero

            avg_lat = sum(r.lat for r in cluster_reports) / len(cluster_reports)
            avg_lng = sum(r.lng for r in cluster_reports) / len(cluster_reports)
            
            # Weighted average AQI calculation based on trust weights
            weighted_aqi = round(sum(r.estimated_aqi * r.trust_weight for r in cluster_reports) / total_trust)

            # Find nearest official station
            nearest_station = None
            min_dist = float('inf')

            for st in payload.official_stations:
                dist = haversine_km(avg_lat, avg_lng, st.lat, st.lng)
                if dist < min_dist:
                    min_dist = dist
                    nearest_station = st

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

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DBSCAN clustering execution failed: {str(e)}"
        )

@app.post("/api/ai/sentiment-panic")
def analyze_panic(payload: SentimentRequest) -> Dict[str, Any]:
    """
    Performs NLP text mining and symptom analysis to categorize public distress levels.
    """
    text = payload.text.lower()
    
    # Expanded bilingual trigger keyword lexicon (English & Bahasa Malaysia)
    keywords = {
        "sesak nafas": 20, "cannot breathe": 20, "pedih mata": 15, "choking": 18,
        "bau hangit": 12, "tak nampak jalan": 15, "sekolah tutup": 15, "darurat": 22,
        "semput": 16, "abu": 10, "ash": 10, "peat fire": 14, "jerebu teruk": 18,
        "terbuka": 12, "terbakar": 16, "coughing": 14, "batuk": 14
    }

    detected = [kw for kw in keywords if kw in text]
    base_score = sum(keywords[kw] for kw in detected)

    # Physical environmental urgency modifiers
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
        "status": "success",
        "panic_score": panic_score,
        "panic_tier": tier,
        "detected_triggers": detected,
        "analyzed_at": time.time()
    }