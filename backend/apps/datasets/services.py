import json
import io
import os
import numpy as np
import rasterio
from rasterio.warp import (
    calculate_default_transform,
    reproject,
    Resampling,
    transform_bounds,
)
from PIL import Image
from django.conf import settings


class RasterService:

    TARGET_CRS = 'EPSG:4326'

    @staticmethod
    def extract_metadata(file_path: str) -> dict:
        with rasterio.open(file_path) as src:
            bounds_wgs84 = transform_bounds(
                src.crs,
                RasterService.TARGET_CRS,
                *src.bounds
            )
            return {
                'crs':          str(src.crs),
                'band_count':   src.count,
                'pixel_width':  src.width,
                'pixel_height': src.height,
                'bounds': {
                    'west':  bounds_wgs84[0],
                    'south': bounds_wgs84[1],
                    'east':  bounds_wgs84[2],
                    'north': bounds_wgs84[3],
                }
            }

    @staticmethod
    def _normalise_band(band: np.ndarray) -> np.ndarray:
        valid_pixels = band[band > 0]

        if len(valid_pixels) == 0:
            return band.astype(np.uint8)

        p2  = np.percentile(valid_pixels, 2)
        p98 = np.percentile(valid_pixels, 98)
        clipped = np.clip(band.astype(float), p2, p98)
        if p98 > p2:
            normalised = (clipped - p2) / (p98 - p2) * 255
        else:
            normalised = clipped

        return normalised.astype(np.uint8)

    @staticmethod
    def _select_rgb_bands(bands: list) -> tuple:
        n_bands = len(bands)

        if n_bands == 3:
            return 0, 1, 2

        elif n_bands == 4:
            means   = [b.mean() for b in bands]
            nir_idx = means.index(max(means))
            rgb_indices = [i for i in range(4) if i != nir_idx]
            return rgb_indices[0], rgb_indices[1], rgb_indices[2]

        elif n_bands >= 6:
            return 2, 1, 0

        else:
            return 0, 1, 2

    @staticmethod
    def to_png(file_path: str) -> tuple:
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
                destination = np.zeros((height, width), dtype=np.float32)
                reproject(
                    source        = rasterio.band(src, band_index),
                    destination   = destination,
                    src_transform = src.transform,
                    src_crs       = src.crs,
                    dst_transform = transform,
                    dst_crs       = RasterService.TARGET_CRS,
                    resampling    = Resampling.nearest,
                )
                reprojected_bands.append(destination)

            bounds_wgs84 = transform_bounds(
                src.crs, RasterService.TARGET_CRS, *src.bounds
            )

        if len(reprojected_bands) >= 3:
            r_idx, g_idx, b_idx = RasterService._select_rgb_bands(
                reprojected_bands
            )
            r = RasterService._normalise_band(reprojected_bands[r_idx])
            g = RasterService._normalise_band(reprojected_bands[g_idx])
            b = RasterService._normalise_band(reprojected_bands[b_idx])
            image_array = np.dstack([r, g, b])
        else:
            band = RasterService._normalise_band(reprojected_bands[0])
            image_array = np.dstack([band] * 3)

        alpha      = np.any(image_array > 0, axis=2).astype(np.uint8) * 255
        rgba_array = np.dstack([image_array, alpha])
        image      = Image.fromarray(rgba_array.astype(np.uint8), 'RGBA')

        png_buffer = io.BytesIO()
        image.save(png_buffer, format='PNG')
        png_buffer.seek(0)

        bounds = {
            'west':  bounds_wgs84[0],
            'south': bounds_wgs84[1],
            'east':  bounds_wgs84[2],
            'north': bounds_wgs84[3],
        }

        return png_buffer, bounds

    @staticmethod
    def save_preview(file_path: str, dataset_id: int) -> tuple:
        png_buffer, bounds = RasterService.to_png(file_path)

        previews_dir  = os.path.join(settings.MEDIA_ROOT, 'previews')
        os.makedirs(previews_dir, exist_ok=True)

        filename      = f'preview_dataset_{dataset_id}.png'
        absolute_path = os.path.join(previews_dir, filename)
        relative_path = f'previews/{filename}'

        with open(absolute_path, 'wb') as f:
            f.write(png_buffer.read())

        return relative_path, bounds


class VectorService:

    @staticmethod
    def extract_metadata(file_path: str) -> dict:
        with open(file_path, 'r') as f:
            geojson = json.load(f)

        features      = geojson.get('features', [])
        feature_count = len(features)
        geometry_type = ''

        if features:
            geometry      = features[0].get('geometry', {})
            geometry_type = geometry.get('type', '')

        bounds = VectorService._calculate_bounds(features)

        return {
            'feature_count': feature_count,
            'geometry_type': geometry_type,
            'bounds':        bounds,
            'crs':           RasterService.TARGET_CRS,
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