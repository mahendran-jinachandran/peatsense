import os
import shutil
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.conf import settings
from apps.datasets.models import Dataset
from apps.datasets.services import RasterService, VectorService


class Command(BaseCommand):
    help = 'Seeds the database with sample raster and vector datasets'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding sample data...')

        admin = User.objects.filter(username='admin').first()
        if not admin:
            self.stdout.write('Admin user not found. Skipping seed.')
            return

        if not Dataset.objects.filter(name='London Satellite Image').exists():
            self._seed_raster(admin)
        else:
            self.stdout.write('Raster already seeded. Skipping.')

        if not Dataset.objects.filter(name='Sample Vector Boundaries').exists():
            self._seed_vector(admin)
        else:
            self.stdout.write('Vector already seeded. Skipping.')

        self.stdout.write(self.style.SUCCESS('Seeding complete.'))

    def _seed_raster(self, admin):
        source_path = os.path.join(settings.DATA_DIR, 'Sample_raster.tif')

        if not os.path.exists(source_path):
            self.stdout.write(f'Raster file not found at {source_path}')
            return

        media_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
        os.makedirs(media_dir, exist_ok=True)
        dest_filename = 'Sample_raster.tif'
        dest_path = os.path.join(media_dir, dest_filename)
        shutil.copy2(source_path, dest_path)

        metadata = RasterService.extract_metadata(dest_path)
        dataset = Dataset.objects.create(
            name='London Satellite Image',
            description=(
                'A 3-band RGB satellite image of London '
                'captured by Sentinel-2. Used as the primary '
                'sample dataset for land cover classification.'
            ),
            dataset_type='raster',
            file=f'uploads/{dest_filename}',
            upload_status='completed',
            uploaded_by=admin,
            **metadata
        )

        self.stdout.write(f'Raster seeded: {dataset.name}')

    def _seed_vector(self, admin):
        source_path = os.path.join(
            settings.DATA_DIR, 'Sample_vector.geojson'
        )

        if not os.path.exists(source_path):
            self.stdout.write(f'Vector file not found at {source_path}')
            return

        media_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
        os.makedirs(media_dir, exist_ok=True)
        dest_filename = 'Sample_vector.geojson'
        dest_path = os.path.join(media_dir, dest_filename)
        shutil.copy2(source_path, dest_path)
        metadata = VectorService.extract_metadata(dest_path)

        dataset = Dataset.objects.create(
            name='Sample Vector Boundaries',
            description=(
                'Sample Irish Garda district boundaries. '
                'Demonstrates vector overlay capabilities '
                'on the interactive map.'
            ),
            dataset_type='vector',
            file=f'uploads/{dest_filename}',
            upload_status='completed',
            uploaded_by=admin,
            **metadata
        )

        self.stdout.write(f'Vector seeded: {dataset.name}')