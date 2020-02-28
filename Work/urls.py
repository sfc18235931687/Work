"""Work URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
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
from django.urls import path, include, re_path
from extra_apps import xadmin
from django.views.static import serve
from Work.settings import MEDIA_ROOT, STATIC_ROOT
from django.conf.urls import url
from Work.views import page_not_found, page_error

urlpatterns = [
    path('xadmin/', xadmin.site.urls),
    path('', include('apps.system.urls')),
    # 验证码
    path('captcha', include('captcha.urls')),
    path('users/', include('apps.users.urls')),
    # 添加media正则路径,显示图片用的
    # re_path(r'^media/(?P<path>.*)$', serve, {'document_root': MEDIA_ROOT}, name='media'),
    # 静态文件映射
    url('^static/(?P<path>.*)$', serve, {'document_root': STATIC_ROOT}, name='static'),
]
handler404 = 'Work.views.page_not_found'
handler500 = 'Work.views.page_error'
