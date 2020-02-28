$(function () {
    $('input').parent('div').removeClass('layui-input-block').addClass('layui-input-inline');
    layui.use('form', function () {
        let form = layui.form;


        let url = $('#input_phone').attr('action');
        // 手机
        $('.my_info_phone').click(function () {
            layer.open({
                title: '手机号',
                type: 1,
                skin: 'layui-layer-demo',
                closeBtn: 1,
                area: ['35%', '300px'],
                anim: 2,
                shadeClose: false,
                content: $('#input_phone'),
            });
            form.on('submit(phone_code)', function (data) {
                let that = this;
                console.log('手机发送验证码执行成功');
                $.ajax({
                    url: url,
                    type: 'post',
                    data: {phone: data.field.phone},
                    success: function (result) {
                        if (result.my_info === 'phone_no') {
                            layer.msg('该手机号已存在！', function () {
                            });
                            return false
                        }
                        if (result.Message === 'OK') {
                            layer.msg('发送成功！');
                            count_down($(that), 60, null);
                        } else {
                            layer.msg('发送失败稍后重试！')
                        }
                    }
                });
            });
            form.on('submit(submit_phone_code)', function (data) {
                console.log(data);
                if ($('input[name="phone_code"]').val() === '') {
                    layer.msg('请输入验证码', function () {
                    });
                    return false
                }
                $.ajax({
                    url: url,
                    type: 'post',
                    data: data.field,
                    success: function (result) {
                        if (result.my_info === 'phone_ok') {
                            layer.closeAll();
                            // 改变页面绑定的手机
                            $('.my_info_phone').prev().text(data.field.phone);
                            layer.msg('绑定成功!');
                        } else {
                            layer.msg('验证码错误!', function () {
                            })
                        }
                    }
                });
                return false
            })
        });
        // 邮箱
        $('.my_info_email').click(function () {
            layer.open({
                title: '邮箱',
                type: 1,
                skin: 'layui-layer-demo',
                closeBtn: 1,
                area: ['35%', '300px'],
                anim: 2,
                shadeClose: false,
                content: $('#input_email'),
            });
            form.on('submit(email_code)', function (data) {
                count_down($(this), 60, null);
                console.log('邮箱发送验证码执行成功');
                $.ajax({
                    url: url,
                    type: 'post',
                    data: {email: data.field.email},
                    success: function (result) {
                        if (result.my_info === 'email_send_ok') {
                            layer.msg('发送成功！请注意邮件查收！')
                        } else {
                            layer.msg('出现异常，稍后重试!', function () {
                            });
                        }
                    }
                });
                return false
            });
            form.on('submit(submit_email_code)', function (data) {
                if ($('input[name="email_code"]').val() === '') {
                    layer.msg('请输入验证码', function () {
                    });
                    return false
                }
                $.ajax({
                    url: url,
                    type: 'post',
                    data: data.field,
                    success: function (result) {
                        if (result.my_info === 'email_ok') {
                            layer.closeAll();
                            // 改变页面绑定的邮箱
                            $('.my_info_email').prev().text(data.field.email);
                            layer.msg('绑定成功!');
                        } else {
                            layer.msg('验证码错误!', function () {
                            });
                        }
                    }
                });
                return false
            })
        });
        // 监听提交
        form.on('submit(my_info_update)', function (data) {
            console.log(data.field);
            $.ajax({
                url: url,
                type: 'post',
                data: data.field,
                success: function (result) {
                    if (result.my_info === 'all_ok'){
                        layer.msg('修改成功！')
                    }
                }
            });
            return false
        });

        // 倒计时(复用)
        function count_down(btn_code, count, times) {
            btn_code.addClass('layui-btn-disabled').attr('disabled', true);
            times = setInterval(function () {
                if (count > 0) {
                    count--;
                    btn_code.html(count + '秒后重发')
                } else {
                    btn_code.removeClass('layui-btn-disabled').attr('disabled', false);
                    clearInterval(times);
                    btn_code.html('重新发送');
                    count = 60;
                }
            }, 1000)
        }
    })
})