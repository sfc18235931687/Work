from django.conf import settings
from django.core.mail import send_mail
from celery_tasks.celery import app
import time


@app.task
# 激活链接
def send_email(email, username, token):
    subject = '哎吖系统信息中心'
    message = '感谢对哎吖任务发布系统的支持!'
    html_message = '<h1>%s, 欢迎您成为哎吖任务发布系统的一员!</h1>' \
                   '<b>请30分钟内点击下面的链接激活您的账号即可登录本系统正常使用,不是本人操作请忽略!</b>' \
                   '<br/><br/>' \
                   '<a href="http://127.0.0.1:8000/users/active/%s">%s</a>' % (username, token, token)
    # 发件人
    send = settings.EMAIL_FROM
    # 收件人
    receiver = [email]

    send_mail(subject, message, send, receiver, html_message=html_message)


time.sleep(5)


# 邮箱验证码
def send_email_code(email, username, email_code):
    subject = '哎吖系统信息中心'
    message = '感谢对哎吖任务发布系统的支持!'
    html_message = '<h1>尊敬的%s用户, 您正在邮件绑定操作！（AiYa）</h1>' \
                   '<br/>' \
                   '<h3>验证码：%s</h3>' \
                   '<br/><br/>' \
                   '<b>该验证码5分钟有效,不是本人操作请忽略!</b>' % (username, email_code)
    # 发件人
    send = settings.EMAIL_FROM
    # 收件人
    receiver = [email]

    send_mail(subject, message, send, receiver, html_message=html_message)


time.sleep(5)
