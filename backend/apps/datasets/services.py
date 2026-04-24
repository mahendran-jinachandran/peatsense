import json
import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling, transform_bounds
from PIL import Image
import io
import os


class RasterService:
    """
    Handles all rasterio processing for GeoTIFF files.
    Responsible for:
    - Extracting metadata (bounds, CRS, band count, pixel size)
    - Reprojecting from any CRS to WGS84 (EPSG:4326)
    - Converting raster data to a PNG image for display on the map
    """

    TARGET_CRS = 'EPSG:4326'  # what web maps use

    @staticmethod
    def extract_metadata(file_path: str) -> dict:

        with rasterio.open(file_path) as src:

            # Convert to WGS84 so that they are in lat/lon
            bounds_wgs84 = transform_bounds(
                src.crs,
                RasterService.TARGET_CRS,
                *src.bounds
            )

            return {
                'crs': str(src.crs),
                'band_count': src.count,
                'pixel_width': src.width,
                'pixel_height': src.height,
                'bounds': {
                    'west':  bounds_wgs84[0],
                    'south': bounds_wgs84[1],
                    'east':  bounds_wgs84[2],
                    'north': bounds_wgs84[3],
                }
            }

    @staticmethod
    def to_png(file_path: str) -> tuple[bytes, dict]:

        with rasterio.open(file_path) as src:

            transform, width, height = calculate_default_transform(
                src.crs,
                RasterService.TARGET_CRS,
                src.width,
                src.height,
                *src.bounds
            )


            reprojected_bands = []
            for band_index in range(1, src.count + 1):
                destination = np.zeros(
                    (height, width),
                    dtype=np.uint8
                )

                reproject(
                    source=rasterio.band(src, band_index),
                    destination=destination,
                    src_transform=src.transform,
                    src_crs=src.crs,
                    dst_transform=transform,
                    dst_crs=RasterService.TARGET_CRS,
                    resampling=Resampling.nearest
                )
                reprojected_bands.append(destination)


            if len(reprojected_bands) >= 3:
                rgb_array = np.dstack([
                    reprojected_bands[0],
                    reprojected_bands[1],
                    reprojected_bands[2]
                ])

            else:
                rgb_array = np.dstack([reprojected_bands[0]] * 3)

            image = Image.fromarray(rgb_array.astype(np.uint8), 'RGB')
            buffer = io.BytesIO()
            image.save(buffer, format='PNG')
            png_bytes = buffer.getvalue()

            bounds_wgs84 = transform_bounds(
                src.crs,
                RasterService.TARGET_CRS,
                *src.bounds
            )

            bounds = {
                'west':  bounds_wgs84[0],
                'south': bounds_wgs84[1],
                'east':  bounds_wgs84[2],
                'north': bounds_wgs84[3],
            }

            return png_bytes, bounds


class VectorService:

    @staticmethod
    def extract_metadata(file_path: str) -> dict:
        """
        Reads a GeoJSON file and extracts metadata.
        Returns feature_count, geometry_type, and bounds.
        """
        with open(file_path, 'r') as f:
            geojson = json.load(f)

        features = geojson.get('features', [])
        feature_count = len(features)
        geometry_type = ''
        if features:
            geometry = features[0].get('geometry', {})
            geometry_type = geometry.get('type', '')

        bounds = VectorService._calculate_bounds(features)

        return {
            'feature_count': feature_count,
            'geometry_type': geometry_type,
            'bounds': bounds,
            'crs': 'EPSG:4326', 
        }

    @staticmethod
    def read_geojson(file_path: str) -> dict:
        with open(file_path, 'r') as f:
            return json.load(f)

    @staticmethod
    def _calculate_bounds(features: list) -> dict:
        all_lons = []
        all_lats = []

        for feature in features:
            geometry = feature.get('geometry', {})
            if not geometry:
                continue
            coords = VectorService._extract_coordinates(geometry)
            for coord in coords:
                lon, lat = coord[0], coord[1]
                all_lons.append(lon)
                all_lats.append(lat)

        if not all_lons:
            return None

        return {
            'west':  min(all_lons),
            'south': min(all_lats),
            'east':  max(all_lons),
            'north': max(all_lats),
        }

    @staticmethod
    def _extract_coordinates(geometry: dict) -> list:
        geo_type = geometry.get('type', '')
        coords   = geometry.get('coordinates', [])

        if geo_type == 'Point':
            return [coords]
        elif geo_type in ('LineString', 'MultiPoint'):
            return coords
        elif geo_type in ('Polygon', 'MultiLineString'):
            return [c for ring in coords for c in ring]
        elif geo_type == 'MultiPolygon':
            return [
                c
                for polygon in coords
                for ring in polygon
                for c in ring
            ]
        return []