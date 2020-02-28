from django.db import models
from django.contrib.auth.models import AbstractUser


# Create your models here.
class BaseModel(models.Model):
    update_time = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    del_log = models.IntegerField(default=0, verbose_name='删除记录')

    class Meta:
        # 让该类抽象，抽象的父类不会再生产数据表
        abstract = True


# 用户表
class User(AbstractUser, BaseModel):
    phone = models.CharField(max_length=20, verbose_name='手机')
    sex = models.CharField(max_length=5, verbose_name='性别')
    is_rank = models.CharField(max_length=20, verbose_name='身份', null=True)

    class Meta:
        db_table = 'U_user'
