from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import ee

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Earth Engine
try:
    ee.Authenticate()
    ee.Initialize(project='ee-steviaap')
except Exception as e:
    print(f"EE Init failed: {e}")

@app.get("/get_weather_data")
def get_weather_data(lat: float = Query(...), lon: float = Query(...)):
    try:
        point = ee.Geometry.Point([lon, lat])
        scale = 10000

        # === ERA5-LAND (surface variables) ===
        era5 = (
            ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY")
            .filterDate("2024-01-01", "2024-01-31")
            .select(['u_component_of_wind_10m', 'v_component_of_wind_10m', 'dewpoint_temperature_2m', 'temperature_2m', 'surface_pressure'])
            .mean()
        )


        # === NOAA OISST (SST)
        sst = (
            ee.ImageCollection("NOAA/CDR/OISST/V2_1")
            .filterDate("2024-01-01", "2024-01-31")
            .select("sst")
            .mean()
        )

        # === NCEP REANALYSIS (MSLP)
        mslp = (
            ee.ImageCollection("ECMWF/ERA5/DAILY")
            .filterDate("2024-01-01", "2024-01-31")
            .select("msl")
            .mean()

        )

        # === NCEP DOE RE2 (approximate stl1 as tmp.2m)
        stl1 = (
            ee.ImageCollection("NOAA/GFS0P25")
            .filterDate("2024-01-01", "2024-01-31")
            .select("temperature_2m_above_ground")
            .mean()
        )

        # Combine all
        combined = era5.addBands(sst).addBands(mslp).addBands(stl1)

        # Extract values at the point
        raw_data = combined.reduceRegion(
            reducer=ee.Reducer.first(),
            geometry=point,
            scale=scale,
            maxPixels=1e9
        ).getInfo()
        
        # Rename keys
        key_map = {
            'u_component_of_wind_10m': 'u10',
            'v_component_of_wind_10m': 'v10',
            'dewpoint_temperature_2m': 'd2m',
            'temperature_2m': 't2m',
            'surface_pressure': 'sp',
            'sst': 'sst',
            'msl': 'mslp',
            'temperature_2m_above_ground': 'stl1'
        }

        renamed_data = {}
        for old_key, new_key in key_map.items():
            if old_key in raw_data:
                value = raw_data[old_key]
                if old_key == 'temperature_2m_above_ground':
                    value *= 10 
                renamed_data[new_key] = value

        return {"status": "success", "data": renamed_data}
    except Exception as e:
        return {"status": "error", "message": str(e)}
