from django.db import models


# Create your models here.

# 任务文档(老师发布的任务)
class TeacherJobs(models.Model):
    T_title = models.CharField(max_length=200, verbose_name='任务标题')
    T_text = models.TextField(null=True, verbose_name='任务要求')
    T_count = models.IntegerField(verbose_name='完成人数', default=0)
    T_time = models.DateTimeField(auto_now_add=True, verbose_name='发布时间')
    T_U = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True)

    class Meta:
        db_table = 'File_TeacherJobs'


# 上传的文件
class JobFiles(models.Model):
    J_name = models.CharField(max_length=200, verbose_name='文件名')
    J_files = models.FileField(upload_to='TeacherJobs', null=True, verbose_name='任务附件')
    J_T = models.ForeignKey('TeacherJobs', on_delete=models.CASCADE, null=True)

    class Meta:
        db_table = 'File_JobFiles'


# 提交的任务(学生提交的作业)
class StudentJobs(models.Model):
    S_name = models.CharField(max_length=200, verbose_name='文件名')
    S_files = models.FileField(upload_to='StudentJobs', null=True, verbose_name='提交的任务')
    # 0已上传，1审核通过，2审核未通过
    S_is = models.IntegerField(verbose_name='是否通过', default=0)
    S_time = models.DateTimeField(auto_now_add=True, verbose_name='提交时间')
    S_num = models.FloatField(verbose_name='分数', null=True)
    # 关联老师的任务
    S_T = models.ForeignKey('TeacherJobs', on_delete=models.CASCADE, null=True)
    # 关联用户表
    S_U = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True)

    class Meta:
        db_table = 'File_StudentJobs'


# 文件共享(老师&学生分享的文件)
class FilesShare(models.Model):
    F_name = models.CharField(max_length=200, verbose_name='文件名')
    F_files = models.FileField(upload_to='FilesShare', null=True, verbose_name='文件共享')
    F_time = models.DateTimeField(auto_now_add=True, verbose_name='上传时间')
    F_U = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True)

    class Meta:
        db_table = 'File_FilesShare'


# 下载记录
class DownloadLog(models.Model):
    D_U = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True)
    D_log = models.CharField(max_length=300)
    D_time = models.DateTimeField(auto_now_add=True, verbose_name='下载时间')

    class Meta:
        db_table = 'log_DownloadLog'
