#!/usr/bin/env python3
"""
extract_photo_trips.py
Läser GPS-data från Photos-biblioteket och detekterar resor.
Sparar resultatet som trips.json i samma mapp.

Kör med:  python3 scripts/extract_photo_trips.py
"""

import sqlite3
import datetime
import json
import time
import math
import urllib.request
import urllib.parse
from pathlib import Path

# ── Inställningar ──────────────────────────────────────────────────────────────
PHOTOS_DB = Path.home() / "Pictures/Bilder-bibliotek.photoslibrary/database/Photos.sqlite"
OUTPUT    = Path(__file__).parent / "trips.json"

# Hemregion (Sverige/Skandinavien)
HOME_LAT_MIN, HOME_LAT_MAX = 54.0, 70.0
HOME_LON_MIN, HOME_LON_MAX = 4.0,  28.0

# Tröskel: minsta gap (dagar) mellan resor
GAP_DAYS = 3

# Minsta antal foton för att det ska räknas som en resa
MIN_PHOTOS = 3

# Minsta reslängd (dagar)
MIN_TRIP_DAYS = 1

# Apple Core Data epoch
APPLE_EPOCH = datetime.datetime(2001, 1, 1, tzinfo=datetime.timezone.utc)

def apple_ts(ts: float) -> datetime.date:
    return (APPLE_EPOCH + datetime.timedelta(seconds=ts)).date()

def is_home(lat: float, lon: float) -> bool:
    return (HOME_LAT_MIN <= lat <= HOME_LAT_MAX and
            HOME_LON_MIN <= lon <= HOME_LON_MAX)

def centroid(points):
    lats = [p[0] for p in points]
    lons = [p[1] for p in points]
    return sum(lats) / len(lats), sum(lons) / len(lons)

def reverse_geocode(lat: float, lon: float) -> tuple:
    """Returnerar (stad, land) via Nominatim."""
    url = (
        "https://nominatim.openstreetmap.org/reverse"
        f"?lat={lat}&lon={lon}&format=json&zoom=10&addressdetails=1&accept-language=en"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "resekollen-trip-extractor/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        addr = data.get("address", {})
        country = addr.get("country", "Okänt land")
        city = (
            addr.get("city") or
            addr.get("town") or
            addr.get("village") or
            addr.get("county") or
            addr.get("state") or
            country
        )
        return city, country
    except Exception as e:
        print(f"  Geocoding misslyckades ({lat:.2f},{lon:.2f}): {e}")
        return "Okänd plats", "Okänt land"

# ── Läs Photos.sqlite ─────────────────────────────────────────────────────────
print(f"Laser {PHOTOS_DB} ...")
conn = sqlite3.connect(str(PHOTOS_DB))
cur  = conn.cursor()
cur.execute("""
    SELECT ZLATITUDE, ZLONGITUDE, ZDATECREATED
    FROM ZASSET
    WHERE ZLATITUDE  IS NOT NULL
      AND ZLATITUDE  != -180.0
      AND ZLONGITUDE IS NOT NULL
      AND ZTRASHEDSTATE = 0
    ORDER BY ZDATECREATED
""")
photos = [(lat, lon, apple_ts(ts)) for lat, lon, ts in cur.fetchall()]
conn.close()
print(f"  {len(photos):,} geotaggade foton ({photos[0][2]} - {photos[-1][2]})")

# ── Gruppera i segment (tidslucka > GAP_DAYS → ny grupp) ──────────────────────
segments = []
current  = [photos[0]]
for photo in photos[1:]:
    gap = (photo[2] - current[-1][2]).days
    if gap > GAP_DAYS:
        segments.append(current)
        current = [photo]
    else:
        current.append(photo)
segments.append(current)
print(f"  {len(segments)} segment detekterade")

# ── Filtrera: behåll segment utanför hemregionen ───────────────────────────────
trips_raw = []
for seg in segments:
    if len(seg) < MIN_PHOTOS:
        continue
    start_date = seg[0][2]
    end_date   = seg[-1][2]
    duration   = (end_date - start_date).days
    if duration < MIN_TRIP_DAYS:
        continue

    # Räkna andelen foton utanför Sverige
    foreign = [(lat, lon) for lat, lon, _ in seg if not is_home(lat, lon)]
    foreign_ratio = len(foreign) / len(seg)

    if foreign_ratio < 0.5:
        continue  # mestadels hemma

    points = foreign if foreign else [(lat, lon) for lat, lon, _ in seg]
    clat, clon = centroid(points)

    trips_raw.append({
        "start":        start_date,
        "end":          end_date,
        "duration":     duration,
        "photo_count":  len(seg),
        "centroid_lat": clat,
        "centroid_lon": clon,
    })

print(f"  {len(trips_raw)} potentiella utlandsresor")

# ── Slå ihop nära segment ─────────────────────────────────────────────────────
if not trips_raw:
    print("Inga resor hittades.")
    exit(0)

merged = [trips_raw[0]]
for t in trips_raw[1:]:
    prev = merged[-1]
    if (t["start"] - prev["end"]).days <= GAP_DAYS + 2:
        merged[-1] = {
            "start":        prev["start"],
            "end":          max(prev["end"], t["end"]),
            "duration":     (max(prev["end"], t["end"]) - prev["start"]).days,
            "photo_count":  prev["photo_count"] + t["photo_count"],
            "centroid_lat": (prev["centroid_lat"] + t["centroid_lat"]) / 2,
            "centroid_lon": (prev["centroid_lon"] + t["centroid_lon"]) / 2,
        }
    else:
        merged.append(t)

print(f"  {len(merged)} resor efter sammanslagning\n")

# ── Reverse geocoding ─────────────────────────────────────────────────────────
print(f"Reverse geocodar {len(merged)} platser (1 sek/forfragan)...\n")
results = []
for i, trip in enumerate(merged, 1):
    city, country = reverse_geocode(trip["centroid_lat"], trip["centroid_lon"])
    print(f"  [{i:2d}/{len(merged)}] {trip['start']} - {trip['end']}  =>  {city}, {country}  ({trip['photo_count']} foton)")
    results.append({
        "destination": city,
        "land":        country,
        "startDatum":  trip["start"].isoformat(),
        "slutDatum":   trip["end"].isoformat(),
        "photoCount":  trip["photo_count"],
    })
    if i < len(merged):
        time.sleep(1.1)

# ── Spara ─────────────────────────────────────────────────────────────────────
with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"\nKlart! {len(results)} resor sparade till: {OUTPUT}")
