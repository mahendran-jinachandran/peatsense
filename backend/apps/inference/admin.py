from django.contrib import admin
from .models import InferenceJob


@admin.register(InferenceJob)
class InferenceJobAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'dataset',
        'status',
        'n_clusters',
        'colour_scheme',
        'created_by',
        'created_at',
    ]

    list_filter = ['status', 'colour_scheme']

    readonly_fields = [
        'mlflow_run_id',
        'result_bounds',
        'colour_legend',
        'created_at',
        'updated_at',
    ]