import os
import joblib
import mlflow
import mlflow.sklearn
from django.core.management.base import BaseCommand
from django.conf import settings


MODEL_NAME      = 'peatsense-kmeans'
MODEL_FILE_NAME = 'kmeans_model'


class Command(BaseCommand):
    help = 'Registers the KMeans model in MLflow if not already registered'

    def handle(self, *args, **kwargs):
        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)

        self.stdout.write('Checking MLflow model registry...')

        client = mlflow.tracking.MlflowClient()

        try:
            versions = client.get_latest_versions(MODEL_NAME)
            if versions:
                self.stdout.write(
                    f'Model "{MODEL_NAME}" already registered '
                    f'(version {versions[0].version}). Skipping.'
                )
                return
        except Exception:
            pass

        model_path = os.path.join(settings.DATA_DIR, MODEL_FILE_NAME)

        if not os.path.exists(model_path):
            self.stdout.write(
                self.style.ERROR(
                    f'Model file not found at {model_path}. '
                    f'Cannot register.'
                )
            )
            return

        self.stdout.write(f'Loading model from {model_path}...')
        model = joblib.load(model_path)

        self.stdout.write('Registering model in MLflow...')

        with mlflow.start_run(run_name='model-registration') as run:
            mlflow.log_param('model_type',    'KMeans')
            mlflow.log_param('n_clusters',    model.n_clusters)
            mlflow.log_param('trained_on',    'Sample_raster.tif')
            mlflow.log_param('n_bands',       3)

            mlflow.sklearn.log_model(
                sk_model        = model,
                artifact_path   = 'kmeans-model',
                registered_model_name = MODEL_NAME,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Model "{MODEL_NAME}" registered successfully in MLflow.'
            )
        )