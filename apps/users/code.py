from captcha.fields import CaptchaField
from django import forms

# 验证码包


class CodeForm(forms.Form):

    captcha = CaptchaField()

