$(function () {
    layui.use(['element', 'layer', 'form'], function () {
        let element = layui.element;
        let layer = layui.layer;
        let form = layui.form;
        let info = $('#info');
        //我的信息
        $('#user_info').click(function () {
            layer.open({
                type: 1,
                title: false,
                closeBtn: false,
                area: '400px;',
                shade: 0.8,
                id: 'LAY_layuipro1',
                btn: ['修改信息', '知道了'],
                btnAlign: 'c',
                moveType: 1,
                content: info,
                success: function (layero) {
                    let btn = layero.find('.layui-layer-btn');
                    // 点击打开个人信息页面
                    btn.find('.layui-layer-btn0').on('click', function () {
                        let nav = $('#nav_left li').first().children('a');
                        // 如果该栏是关闭就打开，如果是打开就只点击个人信息一栏
                        if (nav.hasClass('close')) {
                            nav.click();
                            $('#my_info').click();
                        } else {
                            $('#my_info').click();
                        }
                    })
                }
            });
            $(this).parents('dd').removeClass()
        });
        //我的微信
        let WeChat_code = $('#WeChat_code');
        $('#WeChat').click(function () {
            layer.open({
                type: 1,
                title: false,
                closeBtn: false,
                area: '400px;',
                shade: 0.8,
                id: 'LAY_layuipro2',
                btn: ['好的呢'],
                btnAlign: 'c',
                moveType: 1,
                content: WeChat_code,
            });
            $(this).parents('dd').removeClass()
        });
        //系统介绍
        $('#system_info').click(function () {
            layer.open({
                type: 1,
                title: false,
                closeBtn: false,
                area: '500px;',
                shade: 0.8,
                id: 'LAY_layuipro',
                btn: ['知道了'],
                btnAlign: 'c',
                moveType: 1,
                content:
                    '<div style="padding: 50px; line-height: 22px; background-color: #393D49; color: #fff; font-weight: 300;">\n' +
                    '<h3>AiYa任务发布系统</h3>\n' +
                    '<br>作者：Tao\n' +
                    '<br><br>web框架：Django\n' +
                    '<br><br>登录&注册：Bootstrap3/4 (国外前端框架)\n' +
                    '<br><br>系统布局&效果：layui(国产前端框架"类UI")\n' +
                    '<br><br>主要工具：jQuery 3.0+、阿里云短信服务、Celery、Redis、MySql、xadmin2.0\n' +
                    '<br><br>系统功能：不同身份不同展示&权限、用户管理、文件管理、发布任务/接受任务...\n' +
                    '<br><br>感谢对AiYa的支持！ ^_^\n' +
                    '</div>',
            });
            $(this).parents('dd').removeClass()
        });

        // 修改密码
        function up_pwd() {
            let up_pwd = $('form');
            let index = layer.open({
                type: 1,
                title: '修改密码',
                area: ['420px', '300px'],
                content: up_pwd,
            });
            form.on('submit', function () {
                // 获取表单值
                let up_pwd = form.val('up_pwd');
                $.ajax({
                    url: $('form').attr('action'),
                    type: 'post',
                    data: up_pwd,
                    success: function (res) {
                        if (res.err === 'update_yes') {
                            layer.msg('修改成功！', {offset: 't'});
                            // 关闭窗口
                            layer.close(index);
                            layer.load(1);
                            setTimeout(function () {
                                // 刷新当前页面
                                window.location.href = ''
                                // layer.closeAll('loading');
                            }, 2000);
                        } else {
                            layer.msg('异常！稍后重试！');
                        }
                    }
                });
                return false
            });
        }

        // 按钮监听，验证当前用户密码
        $('#update_pwd').click(function () {
            $(this).parents('dd').removeClass();
            layer.prompt({title: '当前密码', formType: 1}, function (val, index) {
                let url = $('form').attr('action');
                $.ajax({
                    url: url, type: 'post', data: {password: val},
                    success: function (res) {
                        if (res.err === '200') {
                            layer.close(index);
                            up_pwd()
                        } else {
                            layer.msg('密码错误！', function () {
                            })
                        }
                    }
                });
            });
        });
    });


    //菜单栏伸展运动
    $('#nav_left li dl').css({backgroundColor: 'rgba(0,0,0,.3)'});
    let left_a = $('#nav_left li a');
    left_a.addClass('close');
    left_a.click(function () {
        let that = this;
        if ($(that).hasClass('close')) {
            $(that).removeClass('close');
            $(that).addClass('open');
            $(that).children('span').css({
                marginTop: '-9px',
                borderStyle: 'dashed dashed solid',
                borderColor: 'transparent transparent #fff'
            });
            $(that).siblings('dl').slideDown();
            // 老子的兄弟的儿子为open的收起来！
            $(that).parents('li').siblings().children('.open').click()
        } else {
            $(that).removeClass('open');
            $(that).addClass('close');
            $(that).children('span').css({
                marginTop: '',
                borderStyle: '',
                borderColor: ''
            });
            $(that).siblings('dl').slideUp();
        }
    });

    //伸缩
    $('#ss').click(function () {
        $(this).hide();
        $('#ss_ss').show();
        $('#left').animate({left: '-200px'});
        $('div.layui-body').animate({left: '0'});
        $('div.layui-footer').animate({left: '0'});
    });

    $('#ss_ss').click(function () {
        $(this).hide();
        $('#ss').show();
        $('#left').animate({left: '0'});
        $('div.layui-body').animate({left: '+200px'});
        $('div.layui-footer').animate({left: '+200px'});
    });

    //刷新
    $('#nav_left dl[class="layui-nav-child"] dd a').click(function () {
        $('#console').removeClass('layui-this');
        let src = $(this).attr('href');
        $('iframe').attr('src', src)
    });
    $('#console a').click(function () {
        $('#nav_left dl[class="layui-nav-child"] dd').removeClass('layui-this');
        let src = $(this).attr('href');
        $('iframe').attr('src', src)
    });
    $('#flush').click(function () {
        let iframe = $('iframe');
        iframe.attr('src', iframe.attr('src'));
    });

    // 模拟单页,防止服务器崩，每次打开一个页面都初始化
    $('dd>a,#console a').on('click', function (event) {
        event.preventDefault();
        $(function () {
            $('iframe').attr('src', $(this).attr('href'));
        })
    })
});