from django.db import models
from django.contrib.auth.models import User


class Dataset(models.Model):

    class DatasetType(models.TextChoices):
        RASTER = 'raster', 'Raster'
        VECTOR = 'vector', 'Vector'

    class UploadStatus(models.TextChoices):
        PENDING   = 'pending',   'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED    = 'failed',    'Failed'

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    dataset_type = models.CharField(
        max_length=10,
        choices=DatasetType.choices,
    )

    file = models.FileField(upload_to='uploads/')
    is_visible = models.BooleanField(default=False)
    upload_status = models.CharField(
        max_length=10,
        choices=UploadStatus.choices,
        default=UploadStatus.PENDING,
    )

    bounds = models.JSONField(null=True, blank=True)
    crs = models.CharField(max_length=50, blank=True, default='')
    band_count = models.IntegerField(null=True, blank=True)
    pixel_width  = models.IntegerField(null=True, blank=True)
    pixel_height = models.IntegerField(null=True, blank=True)
    feature_count = models.IntegerField(null=True, blank=True)
    geometry_type = models.CharField(max_length=50, blank=True, default='')
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='datasets',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    preview_image = models.ImageField(
        upload_to='previews/',
        null=True,
        blank=True
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.dataset_type})"