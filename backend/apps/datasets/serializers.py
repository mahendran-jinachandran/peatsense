from rest_framework import serializers
from .models import Dataset


class DatasetListSerializer(serializers.ModelSerializer):

    uploaded_by = serializers.StringRelatedField()
    class Meta:
        model  = Dataset
        fields = [
            'id',
            'name',
            'description',
            'dataset_type',
            'is_visible',
            'upload_status',
            'bounds',
            'feature_count',
            'band_count',
            'uploaded_by',
            'created_at',
        ]


class DatasetDetailSerializer(serializers.ModelSerializer):

    uploaded_by = serializers.StringRelatedField()
    class Meta:
        model  = Dataset
        fields = '__all__'


class DatasetUploadSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Dataset
        fields = [
            'name',
            'description',
            'dataset_type',
            'file',
        ]

    def validate(self, data):
        file        = data.get('file')
        dataset_type = data.get('dataset_type')

        if file and dataset_type:
            filename = file.name.lower()

            if dataset_type == 'raster':
                if not filename.endswith(('.tif', '.tiff')):
                    raise serializers.ValidationError(
                        'Raster datasets must be .tif or .tiff files.'
                    )

            elif dataset_type == 'vector':
                if not filename.endswith('.geojson'):
                    raise serializers.ValidationError(
                        'Vector datasets must be .geojson files.'
                    )

        return data


class DatasetVisibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Dataset
        fields = ['is_visible']


class DatasetUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Dataset
        fields = ['name', 'description']