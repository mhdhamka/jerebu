from fastapi import FastAPI, HTTPException, status, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
import numpy as np
from sklearn.cluster import DBSCAN
import math
import time
import os
import uuid
import datetime

# Optional Redis support with graceful fallback
try:
    import redis.asyncio as aioredis
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False

app = FastAPI(
    title="JerebuAQI Consolidated Backend Engine",
    description="Unified async Python FastAPI service providing crowdsourced report ingestion, Redis geospatial indexing, official station synchronization, DBSCAN micro-climate clustering, and bilingual NLP panic scoring.",
    version="2.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = None

@app.on_event("startup")
async def startup_event():
    global redis_client
    if HAS_REDIS:
        try:
            redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
            await redis_client.ping()
            print(f"Connected successfully to Redis at {REDIS_URL}")
        except Exception as e:
            print(f"Redis not available ({e}), falling back to in-memory geospatial index.")
            redis_client = None

@app.on_event("shutdown")
async def shutdown_event():
    global redis_client
    if redis_client:
        await redis_client.close()

# --- Domain Models ---
class UserReportModel(BaseModel):
    id: Optional[str] = None
    area_name: str = Field(..., max_length=150)
    city: Optional[str] = "Southeast Asia"
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    visibility_meters: int = Field(..., ge=10, le=25000)
    smell_level: str = "moderate"
    smell_score: int = Field(..., ge=1, le=5)
    estimated_aqi: Optional[int] = None
    trust_weight: float = Field(default=1.0, ge=0.1, le=5.0)
    panic_score: Optional[int] = 50
    symptoms: List[str] = []
    description: str = Field(..., max_length=1000)
    upvotes: int = 1
    created_at: Optional[str] = None

    @field_validator('estimated_aqi')
    def validate_aqi(cls, v):
        if v is not None and v > 500:
            return 500
        return v

class StationModel(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    aqi: int = Field(..., ge=0)
    status: Optional[str] = "Moderate"
    state: Optional[str] = "Sarawak"
    country: Optional[str] = "Malaysia"
    last_updated: Optional[str] = None

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

# --- In-Memory Stores (with Redis acceleration when available) ---
REPORTS_DB: Dict[str, dict] = {}
STATIONS_DB: Dict[str, dict] = {
    "DOE_MY_KCH_01": {
        "id": "DOE_MY_KCH_01", "name": "Kuching DOE Station", "lat": 1.5533, "lng": 110.3592,
        "aqi": 112, "status": "Unhealthy for Sensitive Groups", "state": "Sarawak", "country": "Malaysia",
        "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat()
    },
    "DOE_MY_SAM_01": {
        "id": "DOE_MY_SAM_01", "name": "Kota Samarahan DOE Station", "lat": 1.4589, "lng": 110.4502,
        "aqi": 118, "status": "Unhealthy for Sensitive Groups", "state": "Sarawak", "country": "Malaysia",
        "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat()
    },
    "DOE_MY_SA_01": {
        "id": "DOE_MY_SA_01", "name": "Sri Aman DOE Station", "lat": 1.2378, "lng": 111.4622,
        "aqi": 164, "status": "Unhealthy", "state": "Sarawak", "country": "Malaysia",
        "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat()
    },
    "BMKG_ID_PTK_01": {
        "id": "BMKG_ID_PTK_01", "name": "Pontianak BMKG Station", "lat": -0.0263, "lng": 109.3425,
        "aqi": 182, "status": "Unhealthy", "state": "West Kalimantan", "country": "Indonesia",
        "last_updated": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
}

# Pre-seed initial sample reports for testing
INITIAL_REPORTS = [
    {
        "id": "rep_init_01", "area_name": "Uni-Central, Kota Samarahan", "city": "Kota Samarahan",
        "lat": 1.4520, "lng": 110.4420, "visibility_meters": 650, "smell_level": "heavy acrid",
        "smell_score": 4, "estimated_aqi": 195, "trust_weight": 1.5, "panic_score": 78,
        "symptoms": ["Eye irritation", "Coughing"], "description": "Smell of burning peat is suffocating here near the secondary forest. Horizon completely greyed out.",
        "upvotes": 14, "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    },
    {
        "id": "rep_init_02", "area_name": "Jalan Stutong Baru, Kuching", "city": "Kuching",
        "lat": 1.5120, "lng": 110.3850, "visibility_meters": 800, "smell_level": "moderate burnt",
        "smell_score": 3, "estimated_aqi": 162, "trust_weight": 1.2, "panic_score": 62,
        "symptoms": ["Dry throat"], "description": "Visible fine ash settling on car windshields since this afternoon. Wind blowing from Kalimantan border.",
        "upvotes": 9, "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    },
    {
        "id": "rep_init_03", "area_name": "Batu Lintang, Kuching", "city": "Kuching",
        "lat": 1.5312, "lng": 110.3475, "visibility_meters": 1100, "smell_level": "moderate burnt",
        "smell_score": 3, "estimated_aqi": 148, "trust_weight": 1.0, "panic_score": 54,
        "symptoms": [], "description": "Hazy outlines of Mount Santubong barely visible across the river.",
        "upvotes": 6, "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
]

for r in INITIAL_REPORTS:
    REPORTS_DB[r["id"]] = r

# --- Utility Functions ---
def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_aqi_estimate(visibility_meters: int, smell_score: int) -> int:
    base = 75
    if visibility_meters <= 300:
        base = 240
    elif visibility_meters <= 600:
        base = 195
    elif visibility_meters <= 1000:
        base = 160
    elif visibility_meters <= 2000:
        base = 120
    if smell_score >= 4:
        base += 25
    return min(400, base)

def nlp_panic_scoring(text: str, symptoms: List[str], visibility_meters: int, smell_score: int) -> tuple[int, str, List[str]]:
    text_lower = text.lower()
    keywords = {
        "sesak nafas": 20, "cannot breathe": 20, "pedih mata": 15, "choking": 18,
        "bau hangit": 12, "tak nampak jalan": 15, "sekolah tutup": 15, "darurat": 22,
        "semput": 16, "abu": 10, "ash": 10, "peat fire": 14, "jerebu teruk": 18,
        "terbuka": 12, "terbakar": 16, "coughing": 14, "batuk": 14
    }
    detected = [kw for kw in keywords if kw in text_lower]
    base_score = sum(keywords[kw] for kw in detected)

    if visibility_meters < 400:
        base_score += 30
    elif visibility_meters < 1000:
        base_score += 15

    base_score += smell_score * 5
    base_score += len(symptoms) * 8
    panic_score = min(100, max(15, round(base_score * 0.7)))

    tier = "Calm"
    if panic_score > 75:
        tier = "Critical Emergency"
    elif panic_score > 55:
        tier = "High Distress"
    elif panic_score > 35:
        tier = "Moderate Concern"

    return panic_score, tier, detected


# --- Endpoints ---

@app.get("/")
def health_check() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "JerebuAQI Consolidated Backend Engine",
        "version": "2.0.0",
        "features": [
            "Crowdsourced Reports CRUD",
            "Redis Geospatial Indexing (GEOADD/GEOSEARCH)",
            "DBSCAN Spatial Micro-Climate Clustering",
            "Bilingual NLP Panic & Sentiment Analysis",
            "Official Station Sync"
        ],
        "redis_connected": redis_client is not None,
        "active_reports": len(REPORTS_DB),
        "official_stations": len(STATIONS_DB),
        "timestamp": time.time()
    }

# 1. Reports Index & Geospatial Query
@app.get("/api/v1/reports")
def list_reports(limit: int = 100) -> Dict[str, Any]:
    sorted_reports = sorted(
        REPORTS_DB.values(),
        key=lambda r: r.get("created_at", ""),
        reverse=True
    )[:limit]
    return {"status": "success", "data": sorted_reports}

@app.get("/api/v1/reports/geosearch")
async def search_nearby_reports(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lng: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(50.0, ge=1.0, le=500.0)
) -> Dict[str, Any]:
    nearby_reports = []
    
    # Check via Redis if connected
    if redis_client:
        try:
            # geosearch by member coordinates
            hits = await redis_client.geosearch(
                "jerebu:geo:reports",
                longitude=lng,
                latitude=lat,
                radius=radius_km,
                unit="km"
            )
            for rep_id in hits:
                if rep_id in REPORTS_DB:
                    nearby_reports.append(REPORTS_DB[rep_id])
        except Exception:
            redis_client_fallback = True

    # Fallback to haversine calculation
    if not nearby_reports:
        for r in REPORTS_DB.values():
            dist = haversine_km(lat, lng, r["lat"], r["lng"])
            if dist <= radius_km:
                nearby_reports.append(r)

    nearby_reports.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    return {
        "status": "success",
        "meta": {
            "radius_km": radius_km,
            "center": {"lat": lat, "lng": lng},
            "hits": len(nearby_reports)
        },
        "data": nearby_reports
    }

# 2. Store Report & NLP Pipeline
@app.post("/api/v1/reports", status_code=status.HTTP_201_CREATED)
async def create_report(payload: UserReportModel) -> Dict[str, Any]:
    rep_id = payload.id or f"rep_{uuid.uuid4().hex[:10]}"
    estimated_aqi = payload.estimated_aqi or calculate_aqi_estimate(payload.visibility_meters, payload.smell_score)
    panic_score, _, _ = nlp_panic_scoring(payload.description, payload.symptoms, payload.visibility_meters, payload.smell_score)
    created_at = payload.created_at or datetime.datetime.now(datetime.timezone.utc).isoformat()

    record = {
        "id": rep_id,
        "area_name": payload.area_name,
        "city": payload.city,
        "lat": payload.lat,
        "lng": payload.lng,
        "visibility_meters": payload.visibility_meters,
        "smell_level": payload.smell_level,
        "smell_score": payload.smell_score,
        "estimated_aqi": estimated_aqi,
        "trust_weight": payload.trust_weight,
        "panic_score": panic_score,
        "symptoms": payload.symptoms,
        "description": payload.description,
        "upvotes": payload.upvotes,
        "created_at": created_at
    }

    REPORTS_DB[rep_id] = record

    # Index into Redis Geospatial store if available
    if redis_client:
        try:
            await redis_client.geoadd("jerebu:geo:reports", (payload.lng, payload.lat, rep_id))
        except Exception as e:
            print(f"Redis geoadd warning: {e}")

    return {
        "status": "created",
        "data": record
    }

@app.post("/api/v1/reports/{report_id}/upvote")
def upvote_report(report_id: str) -> Dict[str, Any]:
    if report_id not in REPORTS_DB:
        raise HTTPException(status_code=404, detail="Report not found")
    report = REPORTS_DB[report_id]
    report["upvotes"] = report.get("upvotes", 0) + 1
    # Increment trust weight with upvotes up to 3.0
    report["trust_weight"] = min(3.0, report.get("trust_weight", 1.0) + 0.1)
    return {
        "status": "success",
        "upvotes": report["upvotes"],
        "trust_weight": report["trust_weight"]
    }

# 3. Official Stations
@app.get("/api/v1/stations")
def get_stations() -> Dict[str, Any]:
    return {
        "status": "success",
        "data": list(STATIONS_DB.values()),
        "count": len(STATIONS_DB)
    }

@app.post("/api/v1/stations/sync")
def sync_stations(payload: List[StationModel]) -> Dict[str, Any]:
    for st in payload:
        record = st.model_dump()
        record["last_updated"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        STATIONS_DB[st.id] = record
    return {
        "status": "success",
        "synced_count": len(payload),
        "total_stations": len(STATIONS_DB)
    }

# 4. DBSCAN Clustering & Anomaly Detection
@app.get("/api/v1/anomalies")
def get_anomalies(eps_km: float = 8.5, min_samples: int = 2) -> Dict[str, Any]:
    reports_list = [UserReportModel(**r) for r in REPORTS_DB.values()]
    stations_list = [StationModel(**s) for s in STATIONS_DB.values()]
    return run_dbscan_clustering(reports_list, stations_list, eps_km, min_samples)

@app.post("/api/ai/dbscan-cluster")
def detect_anomalies_post(payload: ClusterRequest) -> Dict[str, Any]:
    return run_dbscan_clustering(payload.reports, payload.official_stations, payload.eps_km, payload.min_samples)

def run_dbscan_clustering(reports: List[UserReportModel], stations: List[StationModel], eps_km: float, min_samples: int) -> Dict[str, Any]:
    if not reports:
        return {"status": "success", "clusters_detected": 0, "anomalies": []}

    try:
        coords = np.array([[math.radians(r.lat), math.radians(r.lng)] for r in reports])
        eps_radians = eps_km / 6371.0

        db = DBSCAN(eps=eps_radians, min_samples=min_samples, metric='haversine')
        labels = db.fit_predict(coords)

        unique_labels = set(labels)
        clusters = []

        for label in unique_labels:
            if label == -1:
                continue

            cluster_indices = [i for i, l in enumerate(labels) if l == label]
            cluster_reports = [reports[i] for i in cluster_indices]

            total_trust = sum(r.trust_weight for r in cluster_reports) or 1.0
            avg_lat = sum(r.lat for r in cluster_reports) / len(cluster_reports)
            avg_lng = sum(r.lng for r in cluster_reports) / len(cluster_reports)
            
            weighted_aqi = round(sum(r.estimated_aqi * r.trust_weight for r in cluster_reports) / total_trust)

            nearest_station = None
            min_dist = float('inf')

            for st in stations:
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
            detail=f"DBSCAN clustering failed: {str(e)}"
        )

# 5. NLP Sentiment & Panic Endpoint
@app.post("/api/ai/sentiment-panic")
def analyze_panic(payload: SentimentRequest) -> Dict[str, Any]:
    score, tier, detected = nlp_panic_scoring(
        payload.text, payload.symptoms, payload.visibility_meters, payload.smell_score
    )
    return {
        "status": "success",
        "panic_score": score,
        "panic_tier": tier,
        "detected_triggers": detected,
        "analyzed_at": time.time()
    }

# 6. Anti-Spoofing & Consensus Reputation Endpoint (Feature 8)
class ReputationEvalRequest(BaseModel):
    report_id: Optional[str] = None
    lat: float
    lng: float
    accuracy_meters: Optional[float] = None
    estimated_aqi: int
    smell_level: Optional[str] = "moderate"
    radius_km: float = 6.0
    time_window_minutes: int = 90

@app.post("/api/v1/reputation/evaluate")
def evaluate_reputation(req: ReputationEvalRequest) -> Dict[str, Any]:
    # Check regional boundary
    out_of_bounds = req.lat < -11.0 or req.lat > 10.0 or req.lng < 95.0 or req.lng > 141.0
    accuracy_ok = (req.accuracy_meters or 50) <= 500

    # Peer consensus search in in-memory reports
    peers = []
    for r in IN_MEMORY_REPORTS:
        if req.report_id and r.get("id") == req.report_id:
            continue
        dist = haversine_km(req.lat, req.lng, r["lat"], r["lng"])
        if dist <= req.radius_km:
            peers.append(r)

    corroboration_count = len(peers) + 1
    similar_peers = [p for p in peers if abs(p["estimated_aqi"] - req.estimated_aqi) <= 35]

    if out_of_bounds:
        consensus_status = "spoof_flagged"
        label = "REJECTED: OUT OF BOUNDS"
        trust_multiplier = 0.0
        confidence = 0
    elif not accuracy_ok:
        consensus_status = "suspicious"
        label = "UNVERIFIED: LOW GPS ACCURACY"
        trust_multiplier = 0.5
        confidence = 40
    elif len(similar_peers) >= 2:
        consensus_status = "consensus_verified"
        label = f"CONSENSUS VERIFIED [{corroboration_count} SOURCES]"
        trust_multiplier = min(2.5, 1.5 + len(similar_peers) * 0.3)
        confidence = min(99, 70 + len(similar_peers) * 10)
    else:
        consensus_status = "single_source"
        label = "SINGLE SOURCE"
        trust_multiplier = 1.0
        confidence = 55

    return {
        "status": "success",
        "consensus_status": consensus_status,
        "label": label,
        "corroboration_count": corroboration_count,
        "peers_in_radius": len(peers),
        "similar_peers_count": len(similar_peers),
        "trust_multiplier": round(trust_multiplier, 2),
        "confidence_score": confidence,
        "evaluated_at": datetime.datetime.utcnow().isoformat() + "Z"
    }

# 7. Common Alerting Protocol (CAP v1.2) XML & GeoJSON Feeds (Feature 7)
@app.get("/api/v1/alerts/feed.json")
def get_alerts_feed() -> Dict[str, Any]:
    alerts = []
    now_iso = datetime.datetime.utcnow().isoformat() + "Z"

    # Scan official stations for warnings
    for st in OFFICIAL_STATIONS:
        if st["aqi"] >= 200:
            alerts.append({
                "id": f"alert_{st['id']}_moe",
                "urgency": "Immediate",
                "severity": "Severe",
                "event": "MOE School Closure Trigger",
                "headline": f"[MOE CLOSURE ALERT] {st['name']} crossed 200 AQI",
                "description": f"Air Quality Index reached {st['aqi']}. Immediate suspension of physical classes and sports under Ministry of Education guidelines.",
                "area": st["name"],
                "coordinates": {"lat": st["lat"], "lng": st["lng"]},
                "aqi": st["aqi"],
                "timestamp": now_iso
            })
        elif st["aqi"] >= 150:
            alerts.append({
                "id": f"alert_{st['id']}_unhealthy",
                "urgency": "Expected",
                "severity": "Moderate",
                "event": "Unhealthy Air Quality Exposure",
                "headline": f"[HAZE ALERT] {st['name']} at {st['aqi']} AQI",
                "description": f"Elevated particulate haze concentrations. N95 respirators advised for sensitive individuals.",
                "area": st["name"],
                "coordinates": {"lat": st["lat"], "lng": st["lng"]},
                "aqi": st["aqi"],
                "timestamp": now_iso
            })

    return {
        "feed": "JerebuAQI Active Emergency Alerts",
        "version": "1.0",
        "generated_at": now_iso,
        "alert_count": len(alerts),
        "alerts": alerts
    }

@app.get("/api/v1/alerts/cap.xml")
def get_cap_xml_feed():
    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    xml_items = []

    for st in OFFICIAL_STATIONS:
        if st["aqi"] >= 150:
            xml_items.append(f"""  <info>
    <category>Env</category>
    <event>Transboundary Haze Alert</event>
    <urgency>{'Immediate' if st['aqi'] >= 200 else 'Expected'}</urgency>
    <severity>{'Severe' if st['aqi'] >= 200 else 'Moderate'}</severity>
    <certainty>Observed</certainty>
    <eventCode>
      <valueName>AQI</valueName>
      <value>{st['aqi']}</value>
    </eventCode>
    <headline>[HAZE ALERT] {st['name']} recorded {st['aqi']} AQI</headline>
    <description>Particulate matter PM2.5 reached {st.get('pm25', 55)} ug/m3. Outdoor activities restricted.</description>
    <area>
      <areaDesc>{st['name']}</areaDesc>
      <circle>{st['lat']},{st['lng']},25.0</circle>
    </area>
  </info>""")

    joined_info = "\n".join(xml_items) if xml_items else "  <!-- No active alerts above threshold -->"
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>JEREBU-FEED-{int(time.time())}</identifier>
  <sender>jerebu-aqi-ops@alert.gov.my</sender>
  <sent>{now_iso}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
{joined_info}
</alert>"""
    return Response(content=xml_content, media_type="application/xml")

class WebhookTestRequest(BaseModel):
    webhook_url: str
    channel: str = "telegram" # "telegram" | "whatsapp" | "generic"
    station_name: str = "Kuching City Center"
    aqi: int = 168

@app.post("/api/v1/alerts/webhook/test")
def test_webhook_dispatch(req: WebhookTestRequest) -> Dict[str, Any]:
    text_content = (
        f"[HAZE ALERT] {req.station_name} recorded {req.aqi} AQI (Unhealthy). "
        f"Ministry of Education SOP: Outdoor sports restricted. N95 particulate respirators advised."
    )
    return {
        "status": "success",
        "channel": req.channel,
        "target_url": req.webhook_url,
        "dispatched_payload": {
            "title": f"[ALERT] {req.station_name}",
            "aqi": req.aqi,
            "message": text_content,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
        },
        "delivery_status": "simulated_ok"
    }
