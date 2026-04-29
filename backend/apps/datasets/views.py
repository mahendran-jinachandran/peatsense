import os
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Dataset
from .serializers import (
    DatasetListSerializer,
    DatasetDetailSerializer,
    DatasetUploadSerializer,
    DatasetVisibilitySerializer,
    DatasetUpdateSerializer,
)
from .services import RasterService, VectorService
from django.http import FileResponse
from django.conf import settings
from django.db.models import Q

class DatasetListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        
        if request.user.is_authenticated and request.user.is_staff:
            # Admin sees everything
            datasets = Dataset.objects.filter(
                upload_status='completed'
            ).select_related('uploaded_by')

        elif request.user.is_authenticated:
            # Logged in user sees public + own datasets
            datasets = Dataset.objects.filter(
                upload_status='completed'
            ).filter(
                Q(is_visible=True) | Q(uploaded_by=request.user)
            ).select_related('uploaded_by')

        else:
            # Not logged in — public only
            datasets = Dataset.objects.filter(
                is_visible=True,
                upload_status='completed'
            ).select_related('uploaded_by')

        serializer = DatasetListSerializer(datasets, many=True)
        return Response(serializer.data)


class DatasetDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        dataset = get_object_or_404(
            Dataset,
            pk=pk,
            is_visible=True,
            upload_status='completed'
        )
        serializer = DatasetDetailSerializer(dataset)
        return Response(serializer.data)


class DatasetRasterView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        dataset = get_object_or_404(
            Dataset,
            pk=pk,
            dataset_type='raster',
            upload_status='completed'
        )

        # Fast path — serve pre-processed preview if available
        if dataset.preview_image:
            preview_path = os.path.join(
                settings.MEDIA_ROOT,
                str(dataset.preview_image)
            )

            if os.path.exists(preview_path):
                bounds   = dataset.bounds or {}
                response = FileResponse(
                    open(preview_path, 'rb'),
                    content_type='image/png'
                )
                response['X-Bounds-West']  = bounds.get('west', 0)
                response['X-Bounds-South'] = bounds.get('south', 0)
                response['X-Bounds-East']  = bounds.get('east', 0)
                response['X-Bounds-North'] = bounds.get('north', 0)
                response['Access-Control-Expose-Headers'] = (
                    'X-Bounds-West, X-Bounds-South, '
                    'X-Bounds-East, X-Bounds-North'
                )
                return response

        try:
            png_buffer, bounds = RasterService.to_png(dataset.file.path)

            response = HttpResponse(
                png_buffer.read(),
                content_type='image/png'
            )
            response['X-Bounds-West']  = bounds['west']
            response['X-Bounds-South'] = bounds['south']
            response['X-Bounds-East']  = bounds['east']
            response['X-Bounds-North'] = bounds['north']
            response['Access-Control-Expose-Headers'] = (
                'X-Bounds-West, X-Bounds-South, '
                'X-Bounds-East, X-Bounds-North'
            )
            return response

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DatasetVectorView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        dataset = get_object_or_404(
            Dataset,
            pk=pk,
            dataset_type='vector',
            is_visible=True
        )

        file_path = dataset.file.path

        try:
            geojson = VectorService.read_geojson(file_path)
            return Response(geojson)

        except Exception as e:
            return Response(
                {'error': f'Failed to read vector: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DatasetUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')

        if file and file.size > 200 * 1024 * 1024:
            return Response(
                {'error': 'File too large. Maximum size is 200MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = DatasetUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        dataset = serializer.save(
            uploaded_by=request.user,
            upload_status='pending'
        )

        try:
            if dataset.dataset_type == 'raster':
                metadata = RasterService.extract_metadata(dataset.file.path)

                preview_path, _ = RasterService.save_preview(
                    dataset.file.path,
                    dataset.id
                )
                dataset.preview_image = preview_path

            else:
                metadata = VectorService.extract_metadata(dataset.file.path)

            for key, value in metadata.items():
                setattr(dataset, key, value)

            dataset.upload_status = 'completed'
            dataset.save()

        except Exception as e:
            dataset.upload_status = 'failed'
            dataset.save()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            DatasetDetailSerializer(dataset).data,
            status=status.HTTP_201_CREATED
    )


class DatasetUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        dataset = get_object_or_404(Dataset, pk=pk)

        if dataset.uploaded_by != request.user:
            return Response(
                {'error': 'You do not have permission to edit this dataset.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = DatasetUpdateSerializer(
            dataset,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(DatasetDetailSerializer(dataset).data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class DatasetDeleteView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        dataset = get_object_or_404(Dataset, pk=pk)

        if dataset.uploaded_by != request.user:
            return Response(
                {'error': 'You do not have permission to delete this dataset.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if dataset.file and os.path.exists(dataset.file.path):
            os.remove(dataset.file.path)

        dataset.delete()

        return Response(
            {'message': 'Dataset deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


class DatasetVisibilityView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        dataset = get_object_or_404(Dataset, pk=pk)

        if dataset.uploaded_by != request.user:
            return Response(
                {'error': 'You do not have permission to change visibility.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = DatasetVisibilitySerializer(
            dataset,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                'id':         dataset.id,
                'is_visible': dataset.is_visible,
                'message':    'Visibility updated.'
            })

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )