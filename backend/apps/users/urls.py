from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views

urlpatterns = [

    path('token/',
         TokenObtainPairView.as_view(),
         name='token-obtain'),

    path('token/refresh/',
         TokenRefreshView.as_view(),
         name='token-refresh'),

    path('register/',
         views.RegisterView.as_view(),
         name='register'),

    path('me/',
         views.MeView.as_view(),
         name='me'),
]