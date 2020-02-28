from celery import Celery
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Work.settings')
django.setup()

app = Celery('celery_tasks.celery', broker='redis://127.0.0.1:6379/0', backend='redis://127.0.0.1:6379/1')

