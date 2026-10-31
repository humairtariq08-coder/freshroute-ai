"""Road-route lookup through the public OSRM demo server.

Returns a straight-line fallback when OSRM is unreachable so the planning map
stays usable offline. The response always states which source produced it.
"""
import json
import math
import os
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api")

OSRM_BASE = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org").rstrip("/")
CACHE_TTL_SECONDS = 3600
_cache = {}


def haversine_km(lat1, lng1, lat2, lng2):
    radius = 6371.0
    to_radians = math.radians
    dlat = to_radians(lat2 - lat1)
    dlng = to_radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(to_radians(lat1)) * math.cos(to_radians(lat2)) * math.sin(dlng / 2) ** 2)
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def fallback(origin_lat, origin_lng, dest_lat, dest_lng, note):
    return {
        "source": "fallback",
        "distance_km": round(haversine_km(origin_lat, origin_lng, dest_lat, dest_lng), 1),
        "duration_min": None,
        "geometry": [{"lat": origin_lat, "lng": origin_lng}, {"lat": dest_lat, "lng": dest_lng}],
        "note": note,
    }


def _fetch_osrm(origin_lat, origin_lng, dest_lat, dest_lng):
    url = (f"{OSRM_BASE}/route/v1/driving/{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
           "?overview=full&geometries=geojson&alternatives=false&steps=false")
    request = Request(url, headers={
        "User-Agent": "FreshRouteAI/0.1 (hackathon demo)",
        "Accept": "application/json",
    })
    with urlopen(request, timeout=8) as response:
        payload = json.load(response)
    routes = payload.get("routes") or []
    if not routes:
        raise ValueError("OSRM returned no routes")
    best = routes[0]
    coordinates = best["geometry"]["coordinates"]
    if len(coordinates) < 2:
        raise ValueError("OSRM returned an empty geometry")
    return {
        "source": "osrm",
        "distance_km": round(best["distance"] / 1000, 1),
        "duration_min": round(best["duration"] / 60),
        "geometry": [{"lat": lat, "lng": lng} for lng, lat in coordinates],
        "note": "Road route from the public OSRM demo server; not a commercial routing guarantee.",
    }


@router.get("/route")
def route(
    origin_lat: float = Query(..., ge=-90, le=90),
    origin_lng: float = Query(..., ge=-180, le=180),
    dest_lat: float = Query(..., ge=-90, le=90),
    dest_lng: float = Query(..., ge=-180, le=180),
):
    key = tuple(round(value, 4) for value in (origin_lat, origin_lng, dest_lat, dest_lng))
    cached = _cache.get(key)
    if cached and time.time() - cached[0] < CACHE_TTL_SECONDS:
        return cached[1]
    try:
        result = _fetch_osrm(origin_lat, origin_lng, dest_lat, dest_lng)
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError, TypeError, IndexError):
        result = fallback(
            origin_lat, origin_lng, dest_lat, dest_lng,
            "OSRM unavailable or returned invalid data; straight-line distance shown instead.",
        )
    if len(_cache) >= 256:
        _cache.clear()
    _cache[key] = (time.time(), result)
    return result
