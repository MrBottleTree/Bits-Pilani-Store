"""
URL configuration for pawnshop project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.views.static import serve as static_serve
from django.urls import re_path
from . import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path("accounts/", include("allauth.urls")),
    path('', include('pwa.urls')),
    path("", include("bits.urls")),
    path('social-auth/', include('social_django.urls', namespace='social')),
    re_path(r'^\.well-known/assetlinks\.json$', static_serve, {
    'path': 'assetlinks.json',
    'document_root': settings.STATIC_ROOT / 'wellknown',
}),

]+static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
handler404 = 'bits.views.custom_page_not_found'
handler500 = 'bits.views.custom_server_error'
