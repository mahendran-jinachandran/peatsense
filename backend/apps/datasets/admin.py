from django.contrib import admin
from .models import Dataset


@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):

    list_display = [
        'name',
        'dataset_type',
        'is_visible',
        'upload_status',
        'uploaded_by',
        'created_at',
    ]


    list_filter = [
        'dataset_type',
        'is_visible',
        'upload_status',
    ]


    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']