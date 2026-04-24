from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views

urlpatterns = [
    # Login — returns access + refresh JWT tokens
    path('token/',
         TokenObtainPairView.as_view(),
         name='token-obtain'),

    # Refresh — get a new access token using refresh token
    path('token/refresh/',
         TokenRefreshView.as_view(),
         name='token-refresh'),

    # Register new user
    path('register/',
         views.RegisterView.as_view(),
         name='register'),

    # Get current user info
    path('me/',
         views.MeView.as_view(),
         name='me'),
]