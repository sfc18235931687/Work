from django.urls import path, re_path
from . import views

app_name = 'users'

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('register/', views.RegisterView.as_view(), name='register'),
    # 注销
    path('logout/', views.off, name='logout'),
    # 邮件激活页面
    re_path('active/(?P<token>.*)$', views.active, name='active'),
]
