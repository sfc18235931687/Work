from django.shortcuts import render, redirect, HttpResponse
from django.http import JsonResponse, FileResponse
from django.contrib.auth.decorators import login_required
from apps.users.models import User
from apps.system.models import TeacherJobs, StudentJobs, JobFiles, FilesShare, DownloadLog
# 用户组&&权限
from django.contrib.auth.models import Group, Permission
from django.views import View
from django.utils.decorators import method_decorator
# 分页
from django.core.paginator import Paginator, PageNotAnInteger, InvalidPage
from django.core.cache import caches
# Q多条件查询
from django.db.models import Q, F
# 发送邮件脚本
from celery_tasks.email import send_email
# 短信脚本
from celery_tasks.phone import send_sms, get_code
from django.core.cache import cache
# 发邮件
from celery_tasks.email import send_email_code
# 上传文件存放目录
from Work.settings import MEDIA_ROOT
import json
import time


# Create your views here.

# 首页(所有用户)
@login_required
def index(request):
    if request.method == 'GET':
        return render(request, 'index.html')
    if request.is_ajax():
        # 当前密码
        password = request.POST.get('password')
        # 新密码
        new_password = request.POST.get('password1')
        # 第一道验证，验证当前用户密码
        ver = request.user.check_password(raw_password=password)
        if ver is True:
            return JsonResponse({'err': '200'})
        if new_password:
            # 修改当前用户的密码
            request.user.set_password(new_password)
            # 保存密码
            request.user.save()
            return JsonResponse({'err': 'update_yes'})
        else:
            return JsonResponse({'err': '100'})


# 用户列表tabs页面(超管)
@method_decorator(login_required, name='dispatch')
class ConsoleView(View):
    @staticmethod
    def get(request):
        trends = User.objects.all().order_by('-date_joined')
        user_list = User.objects.all()
        # 分页功能
        paginator = Paginator(user_list, 6)
        users = paginator.page(1)
        if request.is_ajax():
            page = request.GET.get('page')
            try:
                users = paginator.page(page)
            # 如果页数不是整数，返回第一页
            except PageNotAnInteger:
                users = paginator.page(1)
            # 如果页数不存在/不合法，返回最后一页
            except InvalidPage:
                users = paginator.page(paginator.num_pages)
            # 信息展出并转化为列表形式
            user_li = list(users.object_list.values())
            result = {'has_previous': users.has_previous(),
                      'has_next': users.has_next(),
                      'num_pages': users.paginator.num_pages,
                      'user_li': user_li}
            return JsonResponse(result)
        # 任务最新的一条
        jobs = TeacherJobs.objects.all().order_by('-T_time')
        now_job = jobs.first()
        # 任务量
        job_count = jobs.count()
        teachers = User.objects.filter(is_rank='教师').count()
        students = User.objects.filter(is_rank='学生').count()
        results = {'trends': trends, 'user_list': user_list, 'users': users, 'now_job': now_job, 'teachers': teachers,
                   'students': students, 'job_count': job_count}
        return render(request, 'system/console.html', results)

    @staticmethod
    def post(request):
        if request.is_ajax():
            # 启用/停用开关
            swi = request.POST.get('swi')
            # 删除的用户id
            del_user = request.POST.get('del_id')
            # 编辑用户的id
            update_id = request.POST.get('user_id')
            # 给redis等下修改页面来取,临时数据1分钟后清掉,以登录的用户名为键名
            if update_id:
                caches['redis_user'].set(request.user, update_id, 60)
                return JsonResponse({'update_id_info': 'ok'})
            # 搜索信息
            search = request.POST.get('search')
            if search:
                # Q多条件查询不区分大小写的所有包含有关的数据, 信息展出并转化为列表形式
                result = User.objects.filter(
                    Q(username__icontains=search) | Q(first_name__icontains=search) | Q(is_rank__icontains=search) | Q(
                        sex__icontains=search) | Q(phone=search) | Q(email=search))
                result = list(result.values())
                # print(result)
                return JsonResponse({'search_info': result})
            if del_user:
                User.objects.get(id=int(del_user)).delete()
                return JsonResponse({'del_info': 'del_ok'})
            # 代号1后的是id切片切出来
            swi_id = int(swi[1:])
            if swi[0] == '0':
                User.objects.filter(id=swi_id).update(is_active=0)
                return JsonResponse({'result': 'close'})
            else:
                User.objects.filter(id=swi_id).update(is_active=1)
                return JsonResponse({'result': 'open'})


# 添加用户页面(超管)
@method_decorator(login_required, name='dispatch')
class CreateUserView(View):
    @staticmethod
    def get(request):
        # 判断是否为超级用户
        if request.user.is_superuser is True:
            return render(request, 'system/create_user.html')
        else:
            return redirect('system:index')

    @staticmethod
    def post(request):
        if request.is_ajax():
            # 用户信息获取
            username = request.POST.get('username')
            first_name = request.POST.get('first_name')
            password1 = request.POST.get('password1')
            sex = request.POST.get('sex')
            city = request.POST.get('city')
            # 开关打开返回'on'，关闭返回None
            switch = request.POST.get('switch')
            # print(switch)
            # 判断用户是否存在
            try:
                user = User.objects.get(username=username)
            except Exception:
                user = None
            if user:
                return JsonResponse({'err': 'false'})
            if not all([username, password1, sex, city]):
                return JsonResponse({'err': '101'})
            # 如果未激活状态
            if switch is None:
                User.objects.create_user(username=username, first_name=first_name, password=password1, sex=sex,
                                         is_rank=city, is_active=0)
                return JsonResponse({'err': '200'})
            # 如果激活状态
            else:
                User.objects.create_user(username=username, first_name=first_name, password=password1, sex=sex,
                                         is_rank=city, is_active=1)
                return JsonResponse({'err': '200'})
        return render(request, 'system/create_user.html')


# 修改信息(超管编辑所有用户的信息)(超管)
@method_decorator(login_required, name='dispatch')
class UpdateInfoView(View):
    @staticmethod
    def get(request):
        try:
            if request.user.is_superuser is True:
                # 获取要修改的信息id
                user_id = caches['redis_user'].get(request.user)
                info = User.objects.get(id=int(user_id))
                # 先把信息存入session缓存中，因为session中的信息是安全的
                request.session['now_phone'] = info.phone
                return render(request, 'system/update_info.html', {'user': info})
            else:
                return redirect('system:index')
        except Exception:
            return redirect('system:index')

    @staticmethod
    def post(request):
        if request.is_ajax():
            user_id = request.POST.get('user_id')
            first_name = request.POST.get('first_name')
            sex = request.POST.get('sex')
            phone = request.POST.get('phone')
            email = request.POST.get('email')
            city = request.POST.get('city')
            # session获取当前的手机号
            now_phone = request.session.get('now_phone')
            # 临时删除当前手机号
            User.objects.filter(id=user_id).update(phone='')
            phone_is = User.objects.filter(Q(phone=phone)).count()
            # 判断手机号是否已经存在，如果存在恢复原来账号
            if phone_is >= 1:
                User.objects.filter(id=user_id).update(phone=now_phone)
                return JsonResponse({'update_info': 'phone_no'})
            else:
                User.objects.filter(id=user_id).update(first_name=first_name, sex=sex, phone=phone, email=email,
                                                       is_rank=city)
                return JsonResponse({'update_info': 'ok'})
        return render(request, 'system/update_info.html')


# 个人信息(每个用户修改个人信息)(所有用户)
@method_decorator(login_required, name='dispatch')
class MyInfoView(View):
    @staticmethod
    def get(request):
        teacher = TeacherJobs.objects.filter(T_U_id=request.user.id)
        student = StudentJobs.objects.filter(S_U_id=request.user.id)
        result = {'teacher': teacher, 'student': student}
        return render(request, 'system/my_info.html', result)

    @staticmethod
    def post(request):
        li = [request.user.phone]
        if request.is_ajax():
            # 手机绑定部分
            phone = request.POST.get('phone')
            phone_code = request.POST.get('phone_code')
            # 如果同时接收两个进行验证
            if phone and phone_code:
                code = cache.get(phone)
                # print(phone, code, phone_code)
                if phone_code == code:
                    # 验证通过，绑定成功
                    User.objects.filter(id=request.user.id).update(phone=phone)
                    return JsonResponse({'my_info': 'phone_ok'})
                else:
                    return JsonResponse({'my_info': 'phone_not'})
            if phone:
                # 临时删除当前手机号
                User.objects.filter(id=request.user.id).update(phone='')
                phone_is = User.objects.filter(Q(phone=phone)).count()
                if phone_is >= 1:
                    User.objects.filter(id=request.user.id).update(phone=li[0])
                    return JsonResponse({'my_info': 'phone_no'})
                else:
                    User.objects.filter(id=request.user.id).update(phone=li[0])
                    # 5分钟有效
                    is_code = get_code(6)
                    res = send_sms(phone, is_code)
                    cache.set(phone, is_code, 60 * 5)
                    # 字符串转换字典(原因:发短信的脚本转换了字符串,JsonResponse解析崩溃)
                    result = json.loads(res)
                    # result = {"Message": "OK", "RequestId": "EB300564-1400-4E06-BA31-DA96698BBAAA",
                    #           "BizId": "859623680593186549^0", "Code": "OK"}
                    return JsonResponse(result)
            # 邮箱绑定部分
            email = request.POST.get('email')
            email_code = request.POST.get('email_code')
            if email and email_code:
                code = cache.get(request.user.username + '-' + email)
                if email_code == code:
                    # 验证通过，绑定成功
                    User.objects.filter(id=request.user.id).update(email=email)
                    return JsonResponse({'my_info': 'email_ok'})
                else:
                    return JsonResponse({'my_info': 'email_not'})
            if email:
                # 发邮件
                is_code = get_code(6)
                send_email_code(email, request.user, is_code)
                # 以登录用户名+邮件为键存入redis
                cache.set(request.user.username + '-' + email, is_code, 60 * 5)
                return JsonResponse({'my_info': 'email_send_ok'})
            # 修改信息
            username = request.POST.get('username')
            first_name = request.POST.get('first_name')
            sex = request.POST.get('sex')
            User.objects.filter(id=request.user.id).update(username=username, first_name=first_name, sex=sex)
            return JsonResponse({'my_info': 'all_ok'})
        return render(request, 'system/my_info.html')


# 表格数据的处理(复用)
class Table:
    # 静态方法
    @staticmethod
    def table_manage(request, lis, students):
        # 处理成LayUi官方文档的格式
        for student in students:
            data = dict()
            data['id'] = student.id
            data['username'] = student.username
            data['first_name'] = student.first_name
            data['is_rank'] = student.is_rank
            data['sex'] = student.sex
            if request.user.is_superuser is True or request.user.is_rank == '教师':
                data['phone'] = student.phone
                data['email'] = student.email
            else:
                data['phone'] = '权限不足'
                data['email'] = '权限不足'
            # 时间格式转换
            data_joined = student.date_joined.strftime("%Y-%m-%d %H:%M:%S")
            data['date_joined'] = data_joined
            lis.append(data)
        return lis


# 学生列表(超管+老师)
@method_decorator(login_required, name='dispatch')
class StudentListView(View):
    @staticmethod
    def get(request):
        if request.is_ajax():
            students = User.objects.filter(is_rank='学生', del_log=0)

            # 搜索信息
            search = request.GET.get('search')
            if search:
                students = User.objects.filter(
                    Q(is_rank='学生', del_log=0) & Q(username__icontains=search)
                    | Q(is_rank='学生', del_log=0) & Q(first_name__icontains=search)
                    | Q(is_rank='学生', del_log=0) & Q(sex__icontains=search))
            # 筛选完替换students下边表格信息也就替换了

            lis = []
            # 表格类的方法数据处理
            Table.table_manage(request, lis, students)

            # 前台传来的页数
            page_index = request.GET.get('page')
            # 前台传来的一页显示多少条数据
            page_limit = request.GET.get('limit')
            # 分页器进行分配
            paginator = Paginator(lis, page_limit)
            # 前端传来页数的数据分离出来
            data = paginator.page(page_index)
            student_info = [x for x in data]
            # students.count()数据量
            students = {"code": 0, "msg": "", "count": students.count(), "data": student_info}
            return JsonResponse(students)
        return render(request, 'system/StudentList.html')

    @staticmethod
    def post(request):
        if request.is_ajax():
            students_id = request.POST.get('id')
            if students_id:
                # 接收到的是json字符串，先转换回json
                sss = json.loads(students_id)
                for s_id in sss:
                    User.objects.filter(id=s_id).update(del_log=1)
                return JsonResponse({'stu_info': 'del_ok'})
            # 单条数据
            one_id = request.POST.get('one_id')
            if one_id:
                User.objects.filter(id=int(one_id)).update(del_log=1)
                return JsonResponse({'stu_info': 'one_ok'})
            one_name_id = request.POST.get('one_name_id')
            username = request.POST.get('username')
            if one_name_id:
                User.objects.filter(id=int(one_name_id)).update(first_name=username)
                return JsonResponse({'stu_info': 'one_name_ok'})
        return render(request, 'system/StudentList.html')


# 删除的学生
@method_decorator(login_required, name='dispatch')
class DelStudentListView(View):
    @staticmethod
    def get(request):
        if request.user.is_superuser is True or request.user.is_rank == '教师':
            if request.is_ajax():
                del_students = User.objects.filter(is_rank='学生', del_log=1)

                # 搜索信息
                search = request.GET.get('search')
                if search:
                    del_students = User.objects.filter(
                        Q(is_rank='学生', del_log=1) & Q(username__icontains=search)
                        | Q(is_rank='学生', del_log=1) & Q(first_name__icontains=search)
                        | Q(is_rank='学生', del_log=1) & Q(sex__icontains=search))
                # 筛选完替换students下边表格信息也就替换了

                lis = []
                # 表格类的方法数据处理
                Table.table_manage(request, lis, students=del_students)

                # 前台传来的页数
                page_index = request.GET.get('page')
                # 前台传来的一页显示多少条数据
                page_limit = request.GET.get('limit')
                # 分页器进行分配
                paginator = Paginator(lis, page_limit)
                # 前端传来页数的数据分离出来
                data = paginator.page(page_index)
                student_info = [x for x in data]
                # students.count()数据量
                students = {"code": 0, "msg": "", "count": del_students.count(), "data": student_info}
                return JsonResponse(students)
            return render(request, 'system/DelStudentList.html')
        else:
            return redirect('system:index')

    @staticmethod
    def post(request):
        if request.is_ajax():
            # 单条恢复
            one_id = request.POST.get('one_id')
            if one_id:
                User.objects.filter(id=int(one_id)).update(del_log=0)
                return JsonResponse({'info': 'one_ok'})
            # 批量永久删除
            del_over_id = request.POST.get('del_over_id')
            if del_over_id:
                # 接收到的是json字符串，先转换回json
                sss = json.loads(del_over_id)
                for s_id in sss:
                    User.objects.filter(id=s_id).delete()
                return JsonResponse({'info': 'del_over_ok'})
            # 批量恢复
            batch_recover_id = request.POST.get('batch_recover_id')
            if batch_recover_id:
                bbb = json.loads(batch_recover_id)
                for b_id in bbb:
                    User.objects.filter(id=b_id).update(del_log=0)
                return JsonResponse({'info': 'batch_recover_ok'})
        return render(request, 'system/DelStudentList.html')


# 存放任务栏的id
job_id = []


# 发布作业(老师)
@method_decorator(login_required, name='dispatch')
class PublishJobView(View):
    @staticmethod
    def get(request):
        if request.user.is_superuser is True or request.user.is_rank == '教师':
            return render(request, 'system_task/PublishJob.html')
        else:
            return redirect('system:index')

    @staticmethod
    def post(request):
        if request.is_ajax():
            title = request.POST.get('title')
            text = request.POST.get('text')
            if title or text:
                job = TeacherJobs.objects.create(T_title=title, T_text=text, T_U_id=request.user.id)
                job_id.clear()
                job_id.append(job.id)
                return JsonResponse({'code': 0})
            file = request.FILES.get('file', None)
            if file:
                # 修改文件名为当前时间+文件名
                file.name = time.strftime('%Y-%m-%d', time.localtime(time.time())) + file.name
                JobFiles.objects.create(J_name=file.name, J_files=file, J_T_id=job_id[0])
                return JsonResponse({'code': 0})
        return render(request, 'system_task/PublishJob.html')


# 检查作业
@method_decorator(login_required, name='dispatch')
class CheckJobsView(View):
    @staticmethod
    def get(request):
        if request.user.is_superuser is True or request.user.is_rank == '教师':
            jobs = StudentJobs.objects.all()
            return render(request, 'system_task/CheckJobs.html', {'jobs': jobs})
        else:
            return redirect('system:index')

    @staticmethod
    def post(request):
        if request.is_ajax():
            is_is = request.POST.get('is_is')
            s_id = request.POST.get('id')
            if is_is and s_id:
                StudentJobs.objects.filter(S_U_id=int(s_id)).update(S_is=int(is_is))
                return JsonResponse({'code': 200})
            num = request.POST.get('num')
            if num and s_id:
                try:
                    if 0 <= float(num) < 100:
                        StudentJobs.objects.filter(S_U_id=int(s_id)).update(S_num=float(num))
                        return JsonResponse({'code': 200})
                    else:
                        return JsonResponse({'code': 101})
                except Exception:
                    return JsonResponse({'code': 101})
        return render(request, 'system_task/CheckJobs.html')


# 学生查看任务
@method_decorator(login_required, name='dispatch')
class SeeJobsView(View):
    @staticmethod
    def get(request):
        if request.is_ajax():
            # 老师发布的任务
            jobs = TeacherJobs.objects.all().order_by('-T_time')
            li = []
            for j in jobs:
                # 当前任务的所有文件
                file = JobFiles.objects.filter(J_T_id=j.id)
                # 当前用户提交的作业
                s_file = StudentJobs.objects.filter(S_T_id=j.id, S_U_id=request.user.id)
                data = dict()
                data['id'] = j.id
                data['username'] = j.T_U.username
                data['first_name'] = j.T_U.first_name
                data['title'] = j.T_title
                # 内容
                data['text'] = j.T_text
                data['file'] = [f.J_name for f in file]
                # 下载路径
                data['link'] = [f.J_files.name for f in file]
                data['time'] = j.T_time.strftime("%Y-%m-%d %H:%M:%S")
                # 完成人数
                data['count'] = j.T_count

                if request.user.is_rank == '教师' or request.user.is_superuser is True:
                    data['s_is'] = '<span style="color: #9F9F9F">------</span>'
                    data['sss'] = 'vip'
                else:
                    data['s_is'] = '<span style="color: #9F9F9F">未提交</span>'
                    data['sss'] = '000'
                    for s in s_file:
                        if s.S_is == 0:
                            data['s_is'] = '<span style="color: #9F9F9F">待审核</span>'
                            data['sss'] = 0
                        elif s.S_is == 1:
                            data['s_is'] = '<span style="color: green">已通过</span>'
                            data['sss'] = 1
                        elif s.S_is == 2:
                            data['s_is'] = '<span style="color: red">未通过</span>'
                            data['sss'] = 2
                li.append(data)
            page_index = request.GET.get('page')
            page_limit = request.GET.get('limit')
            paginator = Paginator(li, page_limit)
            data = paginator.page(page_index)
            job_info = [d for d in data]
            jobs = {"code": 0, "msg": "", "count": jobs.count(), "data": job_info}
            return JsonResponse(jobs)
        return render(request, 'system_task/SeeJobs.html')

    @staticmethod
    def post(request):
        # 提交任务
        if request.is_ajax():
            file = request.FILES.get('file', None)
            j_id = request.POST.get('id')
            if file and j_id:
                file.name = time.strftime('%Y%m%d', time.localtime(time.time())) + file.name
                # F方法字段加数
                TeacherJobs.objects.filter(id=int(j_id)).update(T_count=F('T_count') + 1)
                StudentJobs.objects.create(S_files=file, S_name=file.name, S_T_id=int(j_id), S_U_id=request.user.id)
                return JsonResponse({'code': 0})
        return render(request, 'system_task/SeeJobs.html')


# 上传文件
@method_decorator(login_required, name='dispatch')
class UploadFilesView(View):
    @staticmethod
    def get(request):
        return render(request, 'system_task/UploadFiles.html')

    @staticmethod
    def post(request):
        if request.is_ajax():
            file = request.FILES.get('file', None)
            if file:
                file.name = time.strftime('%Y-%m-%d', time.localtime(time.time())) + file.name
                FilesShare.objects.create(F_name=file.name, F_files=file, F_U_id=request.user.id)
                return JsonResponse({'code': 0})
        return render(request, 'system_task/UploadFiles.html')


# 查看文件
@method_decorator(login_required, name='dispatch')
class SeeFilesView(View):
    @staticmethod
    def get(request):
        # 我的上传
        my_files = FilesShare.objects.filter(F_U_id=request.user.id).order_by('-F_time')
        # 作业文件
        job_files = JobFiles.objects.all().order_by('-id')
        # 共享文件
        share_files = FilesShare.objects.all().order_by('-F_time')
        result = {'my_files': my_files, 'job_files': job_files, 'share_files': share_files}
        return render(request, 'system_task/SeeFiles.html', result)


# 下载文件
@login_required
def download(request, path):
    try:
        file = open(MEDIA_ROOT + '/' + path, 'rb')
        # 名字分割出来
        name = str(path).split("/")[-1]
        response = FileResponse(file)
        response['Content-Type'] = 'application/octet-stream'
        response['Content-Disposition'] = 'attachment;filename="%s"' % name
        DownloadLog.objects.create(D_U_id=request.user.id, D_log=name)
        return response
    except Exception:
        FilesShare.objects.filter(F_files=path).delete()
        return HttpResponse('<h1 style="text-align: center;">该文件不存在或已删除....</h1>')


# 下载记录
@login_required
def download_log(request):
    # 我的下载
    my_download = DownloadLog.objects.filter(D_U_id=request.user.id).order_by('-D_time')
    # 所有的下载
    log = DownloadLog.objects.all().order_by('-D_time')
    return render(request, 'system_task/DownloadLog.html', {'log': log, 'my_download': my_download})
