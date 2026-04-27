from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from .models import InferenceJob
from .serializers import (
    InferenceRunSerializer,
    InferenceJobSerializer,
    InferenceResultSerializer,
)
from .services import InferenceService
from apps.datasets.models import Dataset


class InferenceRunView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InferenceRunSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        validated = serializer.validated_data

        dataset = Dataset.objects.get(pk=validated['dataset_id'])

        job = InferenceJob.objects.create(
            dataset       = dataset,
            n_clusters    = validated['n_clusters'],
            colour_scheme = validated['colour_scheme'],
            status        = 'pending',
            created_by    = request.user,
        )

        try:
            result = InferenceService.run(job)

            job.status        = 'completed'
            job.result_image  = result['result_image_path']
            job.result_bounds = result['result_bounds']
            job.colour_legend = result['colour_legend']
            job.mlflow_run_id = result['mlflow_run_id']
            job.save()

            return Response(
                InferenceResultSerializer(job).data,
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {
                    'error':  'Inference failed.',
                    'detail': str(e),
                    'job_id': job.id,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InferenceJobListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        jobs = InferenceJob.objects.filter(
            created_by=request.user
        ).select_related('dataset', 'created_by')

        serializer = InferenceJobSerializer(jobs, many=True)
        return Response(serializer.data)


class InferenceResultView(APIView):

    permission_classes = [AllowAny]

    def get(self, request, pk):
        job = get_object_or_404(
            InferenceJob,
            pk=pk,
            status='completed'
        )

        serializer = InferenceResultSerializer(job)
        return Response(serializer.data)


class ColourSchemesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from utils.colours import get_available_schemes
        schemes = get_available_schemes()
        return Response({'colour_schemes': schemes})