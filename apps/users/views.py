from django.shortcuts import render, redirect, HttpResponse
from django.http import JsonResponse
from django.contrib import auth
from django.views import View
from apps.users.code import CodeForm
from captcha.fields import CaptchaStore
from captcha.helpers import captcha_image_url
# redis/session默认缓存
from django.core.cache import cache
# redis多个缓存
from django.core.cache import caches
# 用户表
from apps.users.models import User
# 发送邮件脚本
from celery_tasks.email import send_email
# 短信脚本
from celery_tasks.phone import send_sms, get_code
from django.conf import settings
# 令牌
from itsdangerous import TimedJSONWebSignatureSerializer as Token
# 异步返回结果
from celery.result import AsyncResult
import json


# Create your views here.

# 登录
class LoginView(View):
    def get(self, request):
        # 验证码
        code_form = CodeForm()
        # 使用验证码
        code_key = request.GET.get('code_key')
        code = request.GET.get('code')
        # 验证码图库、key值
        c_key = CaptchaStore.generate_key()
        c_img = captcha_image_url(c_key)
        if request.is_ajax():
            if code_key and code:
                try:
                    yard = CaptchaStore.objects.get(hashkey=code_key, response=code.lower())
                except Exception:
                    yard = None
                if yard:
                    # 验证码储存到redis中，便于分离各个用户
                    cache.set('is_code', yard.response)
                    return JsonResponse({'err': 'code_true'})
                else:
                    return JsonResponse({'err': 'code_false'})
            else:
                return JsonResponse({'c_key': c_key, 'c_img': c_img})
        else:
            return render(request, "users/login.html", {'code': code_form})

    def post(self, request):
        if request.is_ajax():
            username = request.POST.get('userName')
            password = request.POST.get('passWord')
            # 获取到存在redis中的验证码
            is_code = cache.get('is_code')
            try:
                user_phone = User.objects.get(phone=username)
                username = user_phone.username
            except Exception:
                pass
            # 用户与验证码对号入座
            cache.set(username, is_code)
            user = auth.authenticate(username=username, password=password, is_active=1, del_log=0)
            if user:
                auth.login(request, user)
                return JsonResponse({'err': '200'})
            else:
                return JsonResponse({'err': '101'})
        else:
            return render(request, 'users/login.html')


# 注册
class RegisterView(View):
    def get(self, request):
        if request.is_ajax():
            username = request.GET.get('username')
            phone = request.GET.get('phone')
            # 判断用户名是否存在
            try:
                user = User.objects.get(username=username)
            except Exception:
                user = None
            # 判断手机号是否存在
            try:
                is_phone = User.objects.get(phone=phone)
            except Exception:
                is_phone = None

            if user:
                return JsonResponse({'err': 'false'})
            if is_phone:
                return JsonResponse({'err': 'phone_false'})
            if phone:
                phone_code = get_code(6)
                res = send_sms(phone, phone_code)
                cache.set(phone, phone_code, 300)
                # 字符串转换字典(原因:发短信的脚本转换了字符串,JsonResponse解析崩溃)
                result = json.loads(res)
                # result = {"Message": "OK", "RequestId": "EB300564-1400-4E06-BA31-DA96698BBAAA",
                #           "BizId": "859623680593186549^0", "Code": "OK"}
                return JsonResponse(result)
            else:
                return JsonResponse({'err': 'true'})
        return render(request, 'users/register.html')

    def post(self, request):
        if request.is_ajax():
            username = request.POST.get('userName')
            password = request.POST.get('passWords')
            sex = request.POST.get('sex')
            phone = request.POST.get('phone')
            code = request.POST.get('code')
            email = request.POST.get('email')
            rank = request.POST.get('rank')
            # 超管验证
            s_user = request.POST.get('s_user')
            s_pwd = request.POST.get('s_pwd')
            if all([s_user, s_pwd]):
                superuser = auth.authenticate(username=s_user, password=s_pwd, is_superuser=1)
                if superuser:
                    return JsonResponse({'err': 'yz_200'})
                else:
                    return JsonResponse({'err': 'yz_101'})
            # 信息加密,有效期30分钟
            encipher = Token(settings.SECRET_KEY, 1800)
            # bytes类型
            token = encipher.dumps(username)
            # 转字符串
            token = token.decode()
            phone_code = cache.get(phone)
            if phone_code == code:
                send_email.delay(email, username, token)
                redis_user = {'username': username,
                              'password': password,
                              'email': email,
                              'phone': phone,
                              'sex': sex,
                              'rank': rank}
                # 缓存在redis中,30分钟后失效
                caches['redis_user'].set(username, redis_user, 1800)
                return JsonResponse({'err': '200'})
            else:
                return JsonResponse({'err': '101'})
        return render(request, 'users/register.html')


# 注销
def off(request):
    auth.logout(request)
    return redirect('users:login')


# 邮件激活账号
def active(request, token):
    if request.method == 'GET':
        try:
            encipher = Token(settings.SECRET_KEY, 1800)
            # 解密
            info = encipher.loads(token)
            user = caches['redis_user'].get(info)
            # 激活账号后存入数据库用户表
            User.objects.create_user(username=user['username'], password=user['password'], email=user['email'],
                                     phone=user['phone'], sex=user['sex'],
                                     is_active=1, is_rank=user['rank'])
            return render(request, 'users/active.html')
        except Exception:
            return HttpResponse("<h3>该链接已经过期,请重新<a href='http://127.0.0.1:8000/users/register/'>注册</a></h3>")
