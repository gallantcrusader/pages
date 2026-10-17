#!/usr/bin/env python3
"""Build the offline ZIP lookup chunks in data/zip/.

Inputs (both come from npm packages, so the build needs no API keys):
  1. GeoNames US postal code dump (US.txt) shipped in the `zipcodes-us` npm package.
     Data (c) GeoNames.org, licensed CC BY 4.0.
  2. `zipcodes-nrviens` npm package (BSD-2-Clause) for Puerto Rico, USVI and Guam,
     which the GeoNames US file leaves out.

Usage:
  python3 scripts/build_zip_data.py <path/to/US.txt> <path/to/nrviens/package> data/zip

Output: one JSON file per 2-digit ZIP prefix, e.g. data/zip/78.json:
  {"78205": ["San Antonio", "TX", "Bexar", "48029", 29.4237, -98.4925], ...}
  fields = city, state, county, 5-digit county FIPS, latitude, longitude
"""
import csv
import json
import os
import re
import sys

STATE_FIPS = {
    "AL": "01", "AK": "02", "AZ": "04", "AR": "05", "CA": "06", "CO": "08", "CT": "09",
    "DE": "10", "DC": "11", "FL": "12", "GA": "13", "HI": "15", "ID": "16", "IL": "17",
    "IN": "18", "IA": "19", "KS": "20", "KY": "21", "LA": "22", "ME": "23", "MD": "24",
    "MA": "25", "MI": "26", "MN": "27", "MS": "28", "MO": "29", "MT": "30", "NE": "31",
    "NV": "32", "NH": "33", "NJ": "34", "NM": "35", "NY": "36", "NC": "37", "ND": "38",
    "OH": "39", "OK": "40", "OR": "41", "PA": "42", "RI": "44", "SC": "45", "SD": "46",
    "TN": "47", "TX": "48", "UT": "49", "VT": "50", "VA": "51", "WA": "53", "WV": "54",
    "WI": "55", "WY": "56", "AS": "60", "GU": "66", "MP": "69", "PR": "72", "VI": "78",
}
TERRITORIES = {"PR", "VI", "GU", "AS", "MP"}


def load_geonames(path):
    out = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            p = line.rstrip("\n").split("\t")
            if len(p) < 11:
                continue
            zip_, city, st, county, ccode = p[1], p[2], p[4], p[5], p[6]
            if st not in STATE_FIPS or not re.fullmatch(r"\d{5}", zip_):
                continue
            try:
                lat, lon = round(float(p[9]), 4), round(float(p[10]), 4)
            except ValueError:
                continue
            fips = STATE_FIPS[st] + ccode.zfill(3) if ccode.strip() else ""
            out[zip_] = [city, st, county, fips, lat, lon]
    return out


def load_territories(pkg_dir, existing):
    codes_js = open(os.path.join(pkg_dir, "lib", "codes.js"), encoding="utf-8").read()
    # codes.js holds several `exports.x = {...};` statements; parse only exports.codes.
    start = codes_js.index("{", codes_js.index("exports.codes"))
    codes, _ = json.JSONDecoder().raw_decode(codes_js, start)
    fips = {}
    with open(os.path.join(pkg_dir, "resources", "zip_fips_county_code_and_state.csv")) as f:
        for row in csv.DictReader(f):
            fips[row["zip"].zfill(5)] = (str(row["fips"]).zfill(5), row["county"])
    added = 0
    for z, rec in codes.items():
        st = rec.get("state")
        if st not in TERRITORIES or z in existing or not re.fullmatch(r"\d{5}", z):
            continue
        f, county = fips.get(z, ("", ""))
        if county == "Unknown":
            county = ""
        if not f.startswith(STATE_FIPS[st]):
            # The source mislabels some territory FIPS codes; Guam is a single county-equivalent.
            f, county = ("66010", "Guam") if st == "GU" else ("", county)
        existing[z] = [rec.get("city", ""), st, county, f,
                       round(float(rec["latitude"]), 4), round(float(rec["longitude"]), 4)]
        added += 1
    return added


def main():
    us_txt, nrviens_dir, out_dir = sys.argv[1:4]
    data = load_geonames(us_txt)
    added = load_territories(nrviens_dir, data)
    os.makedirs(out_dir, exist_ok=True)
    chunks = {}
    for z in sorted(data):
        chunks.setdefault(z[:2], {})[z] = data[z]
    index = {}
    for prefix, chunk in chunks.items():
        with open(os.path.join(out_dir, f"{prefix}.json"), "w", encoding="utf-8") as f:
            json.dump(chunk, f, separators=(",", ":"), ensure_ascii=False)
        lats = [r[4] for r in chunk.values()]
        lons = [r[5] for r in chunk.values()]
        index[prefix] = [min(lats), min(lons), max(lats), max(lons)]
    # Bounding box per chunk, so "use my location" can find the nearest ZIP offline.
    with open(os.path.join(out_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, separators=(",", ":"))
    print(f"{len(data)} ZIPs ({added} territory ZIPs) in {len(chunks)} chunks -> {out_dir}")


if __name__ == "__main__":
    main()
