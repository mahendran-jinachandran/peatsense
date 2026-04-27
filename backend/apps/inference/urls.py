from django.urls import path
from . import views

urlpatterns = [

    path(
        'run/',
        views.InferenceRunView.as_view(),
        name='inference-run'
    ),

    path(
        'jobs/',
        views.InferenceJobListView.as_view(),
        name='inference-job-list'
    ),

    path(
        '<int:pk>/result/',
        views.InferenceResultView.as_view(),
        name='inference-result'
    ),

    path(
        'colour-schemes/',
        views.ColourSchemesView.as_view(),
        name='colour-schemes'
    ),
]