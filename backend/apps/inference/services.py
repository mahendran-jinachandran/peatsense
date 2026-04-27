import io
import os
import time
import logging

import joblib
import mlflow
import mlflow.sklearn
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

from utils.colours import colourise

logger = logging.getLogger(__name__)

MODEL_NAME    = 'peatsense-kmeans'
MODEL_VERSION = '1'
MODEL_URI     = f'models:/{MODEL_NAME}/{MODEL_VERSION}'
TARGET_CRS    = 'EPSG:4326'
EXPERIMENT_NAME = 'peatsense-inference'

class InferenceService:

    @staticmethod
    def run(job) -> dict:
 
        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
        mlflow.set_experiment(EXPERIMENT_NAME)

        job.status = 'running'
        job.save()
        start_time = time.time()

        try:
            with mlflow.start_run() as run:
                mlflow.log_param('dataset_id',    job.dataset.id)
                mlflow.log_param('dataset_name',  job.dataset.name)
                mlflow.log_param('n_clusters',    job.n_clusters)
                mlflow.log_param('colour_scheme', job.colour_scheme)
                mlflow.log_param('model_version', MODEL_VERSION)

                model = mlflow.sklearn.load_model(MODEL_URI)
                logger.info(f'Model loaded from MLflow: {MODEL_URI}')

                file_path = job.dataset.file.path

                pixels_2d, shape, bounds = InferenceService._read_raster(
                    file_path
                )

                logger.info(
                    f'Running KMeans prediction on '
                    f'{pixels_2d.shape[0]:,} pixels '
                    f'with {job.n_clusters} clusters'
                )

                predictions_flat = model.predict(pixels_2d)
                predictions_2d = predictions_flat.reshape(shape)

                rgb_array, colour_legend = colourise(
                    predictions_2d,
                    job.n_clusters,
                    job.colour_scheme,
                )

                result_image_path = InferenceService._save_result_png(
                    rgb_array,
                    job.id
                )

                processing_time = time.time() - start_time

                mlflow.log_metric('processing_time_seconds', round(processing_time, 2))
                mlflow.log_metric('total_pixels', int(pixels_2d.shape[0]))
                mlflow.log_metric('image_height', shape[0])
                mlflow.log_metric('image_width',  shape[1])
                mlflow.log_artifact(
                    os.path.join(settings.MEDIA_ROOT, result_image_path)
                )

                mlflow_run_id = run.info.run_id

                logger.info(
                    f'Inference completed in {processing_time:.2f}s. '
                    f'MLflow run: {mlflow_run_id}'
                )

                return {
                    'result_image_path': result_image_path,
                    'result_bounds':     bounds,
                    'colour_legend':     colour_legend,
                    'mlflow_run_id':     mlflow_run_id,
                }
        
        except Exception as e:
            logger.error(f'Inference failed: {str(e)}', exc_info=True)
            job.status        = 'failed'
            job.error_message = str(e)
            job.save()
            raise
    
    @staticmethod
    def _read_raster(file_path: str):
 
        with rasterio.open(file_path) as src:
            transform, width, height = calculate_default_transform(
                src.crs,
                TARGET_CRS,
                src.width,
                src.height,
                *src.bounds
            )

            reprojected_bands = []
            for band_index in range(1, src.count + 1):
                destination = np.zeros((height, width), dtype=np.uint8)
                reproject(
                    source      = rasterio.band(src, band_index),
                    destination = destination,
                    src_transform = src.transform,
                    src_crs       = src.crs,
                    dst_transform = transform,
                    dst_crs       = TARGET_CRS,
                    resampling    = Resampling.nearest,
                )
                reprojected_bands.append(destination)

            bounds_wgs84 = transform_bounds(
                src.crs, TARGET_CRS, *src.bounds
            )

        if len(reprojected_bands) >= 3:
            image_array = np.dstack([
                reprojected_bands[0],
                reprojected_bands[1],
                reprojected_bands[2],
            ])
        else:
            image_array = np.dstack([reprojected_bands[0]] * 3)

        shape = (height, width)

        pixels_2d = image_array.reshape(-1, image_array.shape[2])

        bounds = {
            'west':  bounds_wgs84[0],
            'south': bounds_wgs84[1],
            'east':  bounds_wgs84[2],
            'north': bounds_wgs84[3],
        }

        return pixels_2d, shape, bounds

    @staticmethod
    def _save_result_png(rgb_array: np.ndarray, job_id: int) -> str:
        results_dir = os.path.join(settings.MEDIA_ROOT, 'inference_results')
        os.makedirs(results_dir, exist_ok=True)

        filename      = f'result_job_{job_id}.png'
        absolute_path = os.path.join(results_dir, filename)
        relative_path = os.path.join('inference_results', filename)

        image = Image.fromarray(rgb_array.astype(np.uint8), 'RGB')
        image.save(absolute_path, format='PNG')

        logger.info(f'Result PNG saved: {absolute_path}')

        return relative_path