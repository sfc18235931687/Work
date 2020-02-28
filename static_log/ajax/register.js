$(function () {
    /*错误class  form-control is-invalid
    正确class  form-control is-valid*/
    let url = $('form').attr('active');
    let flagName = false;
    let flagPas = false;
    let flagPass = false;
    let flagPhone = false;
    let flagEmail = false;
    let flagCode = false;
    let name, passWord, passWords, phone, email, code;

    /*验证用户名*/
    $("#register-username").keyup(function () {
        name = $(this).val();
        if (name.length < 5 || name.length > 16) {
            $(this).removeClass("form-control is-valid");
            $(this).addClass("form-control is-invalid");
            $('#register-username-error1').hide();
            $('#register-username-error2').hide();
            flagName = false;
            return false
        } else {
            $(this).removeClass("form-control is-invalid");
            $(this).addClass("form-control is-valid");
            flagName = true;
        }
        $.ajax({
            type: 'get',
            url: url,
            data: {username: name},
            success: function (data) {
                // console.log(data.err);
                let username = $("#register-username");
                if (data.err === 'false') {
                    // console.log('用户名已存在');
                    username.removeClass("form-control is-valid");
                    username.addClass("is-invalid");
                    $('#register-username-error1').show();
                    $('#register-username-error2').hide();
                    flagName = false;
                } else {
                    // console.log('用户名可用');
                    username.removeClass("form-control is-invalid");
                    username.addClass("form-control is-valid");
                    $('#register-username-error1').hide();
                    $('#register-username-error2').show();
                    flagName = true;
                }
            }
        })
    });
    /*验证密码*/
    $("#register-password").change(function () {
        passWord = $(this).val();
        if (passWord.length < 6 || passWord.length > 18) {
            $(this).removeClass("form-control is-valid");
            $(this).addClass("form-control is-invalid");
            flagPas = false;
        } else {
            $(this).removeClass("form-control is-invalid");
            $(this).addClass("form-control is-valid");
            flagPas = true;
        }
    });
    /*验证确认密码*/
    $("#register-passwords").change(function () {
        passWords = $(this).val();
        if ((passWord !== passWords) || (passWords.length < 6 || passWords.length > 18)) {
            $(this).removeClass("form-control is-valid");
            $(this).addClass("form-control is-invalid");
            flagPass = false;
        } else {
            $(this).removeClass("form-control is-invalid");
            $(this).addClass("form-control is-valid");
            flagPass = true;
        }
    });
    /*验证手机号格式*/
    let reg_phone = /^(13[0-9]|14[5-9]|15[012356789]|166|17[0-8]|18[0-9]|19[8-9])[0-9]{8}$/;
    let input_phone = $("#register-phone");
    input_phone.change(function () {
        phone = $(this).val();
        if (reg_phone.test(phone) === false || phone.length < 1) {
            $(this).removeClass("form-control is-valid");
            $(this).addClass("form-control is-invalid");
            $('#btn_code').attr('disabled', 'true');
            flagPhone = false;
        } else {
            $(this).removeClass("form-control is-invalid");
            $(this).addClass("form-control is-valid");
            $('#btn_code').removeAttr('disabled');
            flagPhone = true;
        }
    });
    /*验证手机验证码*/
    $("#register-code").change(function () {
        code = $(this).val();
        if (code.length < 1) {
            $(this).addClass("form-control is-invalid");
            $('#register-code-error').html('请正确输入手机验证码');
            flagCode = false;
        } else {
            $(this).removeClass("form-control is-invalid");
            flagCode = true;
        }
    });
    /*验证邮箱格式*/
    let reg_email = /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
    $("#register-email").change(function () {
        email = $(this).val();
        if (reg_email.test(email) === false || email.length < 1) {
            $(this).removeClass("form-control is-valid");
            $(this).addClass("form-control is-invalid");
            flagEmail = false;
        } else {
            $(this).removeClass("form-control is-invalid");
            $(this).addClass("form-control is-valid");
            flagEmail = true;
        }
    });


    //获取手机验证码
    let btn_code = $('#btn_code');
    let count = 60;
    let times = null;
    btn_code.click(function () {
        console.log(phone);
        console.log('已向服务器发送手机短信请求...');
        $.ajax({
            type: 'get',
            url: url,
            data: {phone: phone},
            success: function (data) {
                console.log(data.Message);
                console.log(data.err);
                if (data.err === 'phone_false') {
                    btn_code.siblings('span').html('该手机号已被绑定!').css({'color': '#dc3545', 'margin-right': '9%'});
                    return false
                }
                if (data.Message === 'OK') {
                    btn_code.siblings('span').html('发送成功!').css({'color': 'green', 'margin-right': '15%'});
                    $('#register-phone').attr('disabled', 'true');
                    btn_code.attr('disabled', 'true');
                    times = setInterval(function () {
                        if (count > 0) {
                            count--;
                            btn_code.html(count + '秒后重发')
                        } else {
                            //终止循环
                            clearInterval(times);
                            btn_code.html('重新发送');
                            count = 60;
                            $('#register-phone').removeAttr('disabled');
                            btn_code.removeAttr('disabled');
                            btn_code.siblings('span').html('');
                        }
                    }, 1000)
                } else {
                    btn_code.siblings('span').html('发送失败!').css({'color': '#dc3545', 'margin-right': '15%'});
                }
            }
        });
    });

    //清除phone提示
    input_phone.focus(function () {
        btn_code.siblings('span').html('');
    });

    //注册
    $("#regbtn").click(function (event) {
        event.preventDefault();
        let sex = $('input[type=radio][name=optionsRadios]:checked').val();
        let rank = $('input[type=radio][name=example]:checked').val();
        $(this).html('正在注册...');
        if (flagName && flagPas && flagPass && flagPhone && flagCode && flagEmail) {
            $.ajax({
                type: 'post',
                url: url,
                data: {
                    userName: name,
                    passWord: passWord,
                    passWords: passWords,
                    sex: sex,
                    phone: phone,
                    code: code,
                    email: email,
                    rank: rank,
                },
                success: function (data) {
                    console.log(data.err);
                    if (data.err === '200') {
                        console.log('注册成功!邮箱激活后登录!');
                        localStorage.setItem("name", name);
                        localStorage.setItem("passWord", passWord);
                        $('#hint').click();
                        $('#Yes').click(function () {
                            window.location = "http://127.0.0.1:8000/users/login/"
                        });
                        $('#No').click(function () {
                            window.location = "http://127.0.0.1:8000/users/login/"
                        });
                    } else {
                        if (data.err === '101') {
                            $("#register-code").addClass("form-control is-invalid");
                            $('#register-code-error').html('验证码错误!');
                            $("#regbtn").html('注册');
                        } else {
                            alert('服务器异常,稍后重试!');
                            $("#regbtn").html('注册');
                        }
                        return false
                    }
                }
            });
        } else {
            if (!flagName) {
                $("#register-username").addClass("form-control is-invalid");
            }
            if (!flagPas) {
                $("#register-password").addClass("form-control is-invalid");
            }
            if (!flagPass) {
                $("#register-passwords").addClass("form-control is-invalid");
            }
            if (!flagPhone) {
                $("#register-phone").addClass("form-control is-invalid");
            }
            if (!flagEmail) {
                $("#register-email").addClass("form-control is-invalid");
            }
            if (!flagCode) {
                $("#register-code").addClass("form-control is-invalid");
            }
            if (!flagName || !flagPas || !flagPass || !flagPhone || !flagEmail || !flagCode) {
                $("#regbtn").html('注册');
            }
        }
    });


    //超管验证
    $('#teacher').click(function (event) {
        event.preventDefault();
        $('#verify').click();
        $('#modal_yz').click(function (event) {
            event.preventDefault();
            let s_user = $('#exampleInputSuperuser').val();
            let s_pwd = $('#exampleInputPassword').val();
            if (s_user === '' || s_pwd === '') {
                $('#yz_hint').html('请正确输入超管账号与密码!');
                return false
            }
            $.ajax({
                type: 'post',
                url: url,
                data: {s_user: s_user, s_pwd: s_pwd},
                success: function (data) {
                    console.log(data.err);
                    if (data.err === 'yz_200') {
                        //解除事件
                        $('#teacher').off();
                        $('#radio_teacher').prop('checked', true);
                        $('#yz_no').click();
                    } else {
                        $('#exampleInputPassword').val('');
                        $('#yz_hint').html('验证失败!');
                    }
                }
            })
        });
        $(document).keydown(function (event) {
            if (event.keyCode === 13) {
                $('#modal_yz').triggerHandler('click');
            }
        });
    });
});