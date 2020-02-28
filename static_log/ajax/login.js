$(function () {
    let url = $('#loginFrom').attr('action');
    let captcha = $('#id_captcha_1');
    captcha.attr({'class': 'input-material', 'placeholder': '验证码'});

    /*判断上次是否勾选记住密码*/
    let check1s = localStorage.getItem("check1");
    let oldName = localStorage.getItem("userName");
    let oldPass = localStorage.getItem("passWord");
    if (check1s === "true") {
        $("#login-username").val(oldName);
        $("#login-password").val(oldPass);
        $("#check1").prop('checked', true);
    } else {
        $("#login-username").val('');
        $("#login-password").val('');
        $("#check1").prop('checked', false);
    }
    /*拿到刚刚注册的账号*/
    if (localStorage.getItem("name") != null) {
        $("#login-username").val(localStorage.getItem("name"));
    }

    // 用户名框
    $('#login-username').keyup(function () {
        if ($(this).val().length > 0) {
            $('#login-username').css({borderColor: '#eee'});
            $('#login-username-error').hide();
        } else {
            $('#login-username').css({borderColor: '#dc3545'});
            $('#login-username-error').show();
            $(this).html('登录');
        }
    });
    // 密码框
    $('#login-password').keyup(function () {
        if ($(this).val().length > 0) {
            $('#login-password').css({borderColor: '#eee'});
            $('#login-password-error').hide();
        } else {
            $('#login-password').css({borderColor: '#dc3545'});
            $('#login-password-error').show();
            $(this).html('登录');
        }
    });
    // 验证码框
    captcha.keyup(function () {
        if ($(this).val().length > 0) {
            $(this).css({borderColor: '#eee'});
            $('#login-code-error').hide();
        } else {
            $(this).css({borderColor: '#dc3545'});
            $('#login-code-error').show();
            $(this).html('登录');
        }
    });

    //输入框输入的时候清除提示
    $('input').keyup(function () {
        $('#login-error').hide();
        $('#login-auth-error').hide();
    });

    //点击更换验证码
    $('.captcha').click(function () {
        $.getJSON(url, function (res) {
            $('.captcha').attr('src', res['c_img']);
            $('#id_captcha_0').val(res['c_key'])
        });
        return false;
    });

    //验证码验证
    //html源码可以看到 验证码id为 key为id_captcha_0，输入数据为id_captcha_1
    let auth_code = false;
    captcha.keyup(function () {
        let code_key = $('#id_captcha_0').val();
        let code = $('#id_captcha_1').val();

        $.ajax({
            type: 'get',
            url: url,
            data: {code_key: code_key, code: code},
            success: function (data) {
                console.log(data.err);
                if (data.err === 'code_true') {
                    captcha.attr({'class': 'input-material form-control is-valid'}).css('height', '44');
                    auth_code = true;
                } else {
                    captcha.attr({'class': 'input-material form-control is-invalid'}).css('height', '44');
                    auth_code = false;
                }
            }
        })
    });

    /*登录*/
    $("#login").click(function (event) {
        event.preventDefault();
        let userName = $("#login-username").val();
        let passWord = $("#login-password").val();
        $(this).html('正在登录...');
        /*获取当前输入的账号密码*/
        localStorage.setItem("userName", userName);
        localStorage.setItem("passWord", passWord);
        /*获取记住密码的 checkbox的值*/
        let check1 = $("#check1").prop('checked');
        localStorage.setItem("check1", check1);

        //输入框检测
        if (userName === '') {
            $('#login-username').css({borderColor: '#dc3545'});
            $('#login-username-error').show();
            $(this).html('登录');
        } else {
            $('#login-username').css({borderColor: '#eee'});
            $('#login-username-error').hide();
        }
        if (passWord === '') {
            $('#login-password').css({borderColor: '#dc3545'});
            $('#login-password-error').show();
            $(this).html('登录');
        } else {
            $('#login-password').css({borderColor: '#eee'});
            $('#login-password-error').hide();
        }
        if (captcha.val() === '') {
            captcha.css({borderColor: '#dc3545'});
            $('#login-code-error').show();
            $(this).html('登录');
            return false
        } else {
            captcha.css({borderColor: '#eee'});
            $('#login-code-error').hide();
        }

        $.ajax({
            type: 'POST',
            url: url,
            data: {userName: userName, passWord: passWord},
            dataType: 'json',
            success: function (data) {
                console.log(data.err);
                if (auth_code === false) {
                    $('#login').html('登录');
                    $('#login-auth-error').show();
                }
                if (data.err === '101' && auth_code === true) {
                    $('#login').html('登录');
                    $('#login-error').show();
                }
                if (data.err === '200' && auth_code === true) {
                    window.location = 'http://127.0.0.1:8000/'
                }
            }
        });
    });
});