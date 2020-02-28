from django.urls import path, re_path
from . import views

app_name = 'system'

urlpatterns = [
    path('', views.index, name='index'),
    # 控制台(所有用户)
    path('console/', views.ConsoleView.as_view(), name='console'),
    # 添加用户(超管)
    path('create_user/', views.CreateUserView.as_view(), name='create_user'),
    # 编辑用户(超管)
    path('update_info/', views.UpdateInfoView.as_view(), name='update_info'),
    # 个人信息(所有用户)
    path('my_info/', views.MyInfoView.as_view(), name='my_info'),
    # 学生列表(所有用户,超管&老师的权限高于学生)
    path('StudentList/', views.StudentListView.as_view(), name='StudentList'),
    # 删除的学生(老师)
    path('DelStudentList/', views.DelStudentListView.as_view(), name='DelStudentList'),
    # 发布作业
    path('PublishJob/', views.PublishJobView.as_view(), name='PublishJob'),
    # 检查作业
    path('CheckJobs/', views.CheckJobsView.as_view(), name='CheckJobs'),
    # 查看作业
    path('SeeJobs/', views.SeeJobsView.as_view(), name='SeeJobs'),
    # 上传文件
    path('UploadFiles/', views.UploadFilesView.as_view(), name='UploadFiles'),
    # 查看文件
    path('SeeFiles/', views.SeeFilesView.as_view(), name='SeeFiles'),
    # 下载文件
    re_path(r'^download/(?P<path>.*)$', views.download, name='download'),
    # 下载记录
    path('DownloadLog/', views.download_log, name='DownloadLog'),
]
