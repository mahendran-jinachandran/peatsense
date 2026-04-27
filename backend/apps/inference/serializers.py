from rest_framework import serializers
from .models import InferenceJob
from apps.datasets.models import Dataset


class InferenceRunSerializer(serializers.Serializer):

    dataset_id    = serializers.IntegerField()
    n_clusters    = serializers.IntegerField(
                        min_value=2,
                        max_value=20,
                        default=8
                    )
    
    colour_scheme = serializers.ChoiceField(
                        choices=[
                            'default',
                            'terrain',
                            'spectral',
                            'monochrome'
                        ],
                        default='default'
                    )

    def validate_dataset_id(self, value):

        try:
            Dataset.objects.get(
                pk=value,
                dataset_type='raster',
                is_visible=True,
                upload_status='completed'
            )
        except Dataset.DoesNotExist:
            raise serializers.ValidationError(
                'Dataset not found or is not a valid completed raster.'
            )
        return value


class InferenceJobSerializer(serializers.ModelSerializer):

    created_by = serializers.StringRelatedField()
    dataset    = serializers.StringRelatedField()

    class Meta:
        model  = InferenceJob
        fields = [
            'id',
            'dataset',
            'status',
            'n_clusters',
            'colour_scheme',
            'mlflow_run_id',
            'error_message',
            'created_by',
            'created_at',
        ]


class InferenceResultSerializer(serializers.ModelSerializer):

    result_image_url = serializers.SerializerMethodField()

    class Meta:
        model  = InferenceJob
        fields = [
            'id',
            'status',
            'n_clusters',
            'colour_scheme',
            'result_image_url',
            'result_bounds',
            'colour_legend',
            'mlflow_run_id',
            'error_message',
        ]

    def get_result_image_url(self, obj):

        if obj.result_image:
            return f'/media/{obj.result_image}'
        return None