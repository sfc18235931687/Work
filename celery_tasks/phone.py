# 短信验证
import random
from aliyunsdkcore.client import AcsClient
from aliyunsdkcore.request import CommonRequest


def send_sms(phone, phone_code):
    client = AcsClient('LTAI4FeJ2EDrkGTjoS9LjkTW', 'GVAjUxKQulG3qlYdiWxTnx26cXKBs6', 'cn-hangzhou')

    code = "{'code':%s}" % phone_code
    request = CommonRequest()
    request.set_accept_format('json')
    request.set_domain('dysmsapi.aliyuncs.com')
    request.set_method('POST')
    request.set_protocol_type('https')  # https | http
    request.set_version('2017-05-25')
    request.set_action_name('SendSms')

    request.add_query_param('RegionId', "cn-hangzhou")
    request.add_query_param('PhoneNumbers', phone)
    request.add_query_param('SignName', "涛声依旧")
    request.add_query_param('TemplateCode', "SMS_183145166")
    request.add_query_param('TemplateParam', code)

    response = client.do_action_with_exception(request)
    return str(response, encoding='utf-8')


# 生成随机验证码: 数字表示生成几位, True表示生成带有字母的 False不带字母的
def get_code(n=6, alpha=False):
    # 创建字符串变量,存储生成的验证码
    s_code = ''
    # 通过for循环控制验证码位数
    for i in range(n):
        # 生成随机数字0-9
        num = random.randint(1, 9)
        # 需要字母验证码,不用传参,如果不需要字母的,关键字alpha=False
        if alpha:
            upper_alpha = chr(random.randint(65, 90))
            lower_alpha = chr(random.randint(97, 122))
            num = random.choice([num, upper_alpha, lower_alpha])
        s_code += str(num)
    return s_code

