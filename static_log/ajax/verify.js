layui.use('form', function () {
    let form = layui.form;

    // 获取邮箱验证码按钮
    let btn_email = $('#btn_email_code');
    let btn_phone = $('#btn_phone_code');
    // 表单验证
    form.verify({
        username: [/^[a-zA-Z0-9_-]{5,16}$/, '用户名格式错误，必须5到16位且不能出现符号'],
        password0: [/^[\S]{6,18}$/, '密码必须5到18位，且不能出现空格'],
        password1: [/^[\S]{6,18}$/, '密码必须5到18位，且不能出现空格'],
        "password_is"() {
            let password0 = $('input[name="password0"]').val();
            let password1 = $('input[name="password1"]').val();
            if (password0 !== password1) {
                return '两次密码不一致'
            }
        },
        "email_is"(value) {
            if (!/\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/.test(value) || value === '') {
                return '邮箱格式不正确'
            }
        },
        "phone_is"(value) {
            if (!/^(13[0-9]|14[5-9]|15[012356789]|166|17[0-8]|18[0-9]|19[8-9])[0-9]{8}$/.test(value) || value === '') {
                return '手机号格式不正确'
            }
        },
        "empty_is"(value) {
            if (value === '') {
                return '请输入关键字搜索'
            }
        }
    });
});