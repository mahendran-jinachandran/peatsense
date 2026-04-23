from django.db import models
from django.contrib.auth.models import User
from apps.datasets.models import Dataset


class InferenceJob(models.Model):

    class Status(models.TextChoices):
        PENDING   = 'pending',   'Pending'
        RUNNING   = 'running',   'Running'
        COMPLETED = 'completed', 'Completed'
        FAILED    = 'failed',    'Failed'

    class ColourScheme(models.TextChoices):
        DEFAULT    = 'default',    'Default'
        TERRAIN    = 'terrain',    'Terrain'
        SPECTRAL   = 'spectral',   'Spectral'
        MONOCHROME = 'monochrome', 'Monochrome'


    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.CASCADE,
        related_name='inference_jobs',
    )


    n_clusters = models.IntegerField(default=8)
    colour_scheme = models.CharField(
        max_length=20,
        choices=ColourScheme.choices,
        default=ColourScheme.DEFAULT,
    )


    mlflow_run_id = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )

    error_message = models.TextField(blank=True, default='')
    result_image = models.ImageField(
        upload_to='inference_results/',
        null=True,
        blank=True,
    )


    result_bounds = models.JSONField(null=True, blank=True)
    colour_legend = models.JSONField(null=True, blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inference_jobs',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Job {self.id} — {self.dataset.name} ({self.status})"