from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('',
         views.DatasetListView.as_view(),
         name='dataset-list'),

    path('<int:pk>/',
         views.DatasetDetailView.as_view(),
         name='dataset-detail'),

    path('<int:pk>/raster/',
         views.DatasetRasterView.as_view(),
         name='dataset-raster'),

    path('<int:pk>/vector/',
         views.DatasetVectorView.as_view(),
         name='dataset-vector'),

    # Protected
    path('upload/',
         views.DatasetUploadView.as_view(),
         name='dataset-upload'),

    path('<int:pk>/update/',
         views.DatasetUpdateView.as_view(),
         name='dataset-update'),

    path('<int:pk>/delete/',
         views.DatasetDeleteView.as_view(),
         name='dataset-delete'),

    path('<int:pk>/visibility/',
         views.DatasetVisibilityView.as_view(),
         name='dataset-visibility'),
]