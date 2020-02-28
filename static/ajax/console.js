$(function () {
    layui.use(['element', 'form', 'layer'], function () {
        let element = layui.element;
        let form = layui.form;
        let layer = layui.layer;


        let url = $('#page').attr('active');
        // 用户状态启用/停用
        $(document).on('click', '.on_off', function () {
            let swi = $(this).find('input[name="close"]');
            let id = swi.val().substring(1,);
            if (swi.val() === 'disabled') {
                console.log('超管是最高权限无法修改');
                layer.msg('醒醒孩子，这是超管！');
                return false
            } else {
                $.ajax({
                    type: 'post',
                    url: url,
                    data: {swi: swi.val()},
                    success: function (res) {
                        if (res.result === 'close') {
                            swi.val('1' + id);
                            console.log('已停用');
                            layer.msg('已停用')
                        } else {
                            swi.val('0' + id);
                            console.log('已启用');
                            layer.msg('已启用')
                        }
                    }
                });
            }
        });

        //页数&跳转
        let now_page = 1;
        page_click();
        $('.first_page button').removeClass('layui-btn-primary').addClass('layui-btn-disabled');
        $('.now_page button').first().removeClass('layui-btn-primary').addClass('page_this');
        //上一页
        $('.first_page').click(function () {
            now_page -= 1;
            if (now_page < 1) {
                now_page = 1;
                return false
            } else {
                $('.page_this').parent().prev().click();
            }
        });
        //下一页
        $('.last_page').click(function () {
            let num_pages = $('.now_page button').last().text();
            now_page += 1;
            if (now_page > parseInt(num_pages)) {
                now_page -= 1;
                return false
            } else {
                $('.page_this').parent().next().click();
            }
        });
        //切换页
        $('.now_page').click(function () {
            now_page = parseInt($(this).children('button').text());
            $('.now_page button').removeClass('page_this').addClass('layui-btn-primary');
            $(this).addClass('page_this');
            $(this).children('button').removeClass('layui-btn-primary').addClass('page_this');
            page_click()
        });

        // ajax数据交互
        function page_click() {
            $.ajax({
                type: 'get',
                url: url,
                data: {page: now_page},
                success: function (data) {
                    $('#tbody tr').remove();
                    $('#num_pages').html('共' + data.num_pages + '页');
                    // 分页按钮状态调整
                    if (data.has_previous === true) {
                        $('.first_page button').removeClass('layui-btn-disabled').addClass('layui-btn-primary');
                    } else {
                        $('.first_page button').removeClass('layui-btn-primary').addClass('layui-btn-disabled')
                    }
                    if (data.has_next === true) {
                        $('.last_page button').removeClass('layui-btn-disabled').addClass('layui-btn-primary');
                    } else {
                        $('.last_page button').removeClass('layui-btn-primary').addClass('layui-btn-disabled');
                    }
                    info_ajax(data)
                }
            });
            return false
        }

        // 函数复用
        function info_ajax(data) {
            layer.load(1);
            $.each(data.user_li, function (index, user) {
                $.each(user, function (index, info) {
                    // 为空的数据上填上提示
                    if (user[index] === '') {
                        user[index] = '---'
                    }
                });
                let a = '<td>';
                let b = '</td>';
                let form1 = '<form class="layui-form on_off"><label class="layui-form-label" style="display: none"></label>';
                let form2 = '</form>';
                // 操作栏按钮
                let han =
                    '<div class="layui-btn-group">\n' +
                    '    <button type="button" class="layui-btn layui-btn-primary layui-btn-xs update_user" value=" ' + user.id + '">\n' +
                    '        <i class="layui-icon"></i>\n' +
                    '    </button>\n' +
                    '    <button type="button" class="layui-btn layui-btn-primary layui-btn-xs del_user" value="' + user.id + '">\n' +
                    '        <i class="layui-icon"></i>\n' +
                    '    </button>\n' +
                    '</div>';

                let on_off;
                // 判断激活状态
                if (user.is_superuser === true && user.is_active === true) {
                    han = '---';
                    on_off = form1 + '<input type="checkbox" name="close" lay-skin="switch" value="disabled" checked disabled>' + form2;
                } else if (user.is_active === true) {
                    on_off = form1 + '<input type="checkbox" name="close" lay-skin="switch" value="0' + user.id + '" checked>' + form2
                } else {
                    on_off = form1 + '<input type="checkbox" name="close" lay-skin="switch" value="1' + user.id + '">' + form2
                }
                // 改变时间显示
                let up_time = user.update_time.replace('T', ' ').substring(0, 19);
                let date_joined = user.date_joined.replace('T', ' ').substring(0, 19);
                let last_login;
                if (user.last_login === null) {
                    last_login = '---'
                } else {
                    last_login = user.last_login.replace('T', ' ').substring(0, 19);
                }
                // 拼接添加
                let body = a + user.username + b + a + user.first_name + b + a + user.is_rank + b + a + user.sex + b + a + user.phone + b + a + user.email + b + a + last_login + b + a + up_time + b + a + date_joined + b + a + on_off + b + a + han + b;
                $('#tbody').append('<tr>' + body + '</tr>');
            });
            form.render();
            layer.closeAll('loading');
        }

        // 动态加载的事件绑定document上
        // 编辑
        $(document).on('click', '.update_user', function () {
            let user_id = $(this).val();
            // layer.msg('编辑id' + user_id);
            // 把id传给编辑页面的后台
            $.ajax({
                url: url, type: 'post', data: {user_id: user_id}, success: function (res) {
                    if (res.update_id_info === 'ok') {
                        // 打开编辑页面
                        layer.open({
                            type: 2,
                            title: '编辑资料',
                            shadeClose: true,
                            shade: 0,
                            area: ['50%', '90%'],
                            content: '/update_info/'
                        });
                    } else {
                        layer.msg('出现异常，稍后重试！')
                    }
                }
            });
            return false
        });

        // 删除
        $(document).on('click', '.del_user', function () {
            let user_id = $(this).val();
            layer.msg('确认删除该用户吗？', {
                time: 0,
                btn: ['删除', '算了'],
                yes: function () {
                    $.ajax({
                        url: url, type: 'post', data: {del_id: user_id}, success: function (res) {
                            if (res.del_info === 'del_ok') {
                                layer.msg('删除成功！');
                                //成功以后重新加载当前分页
                                page_click()
                            } else {
                                layer.msg('异常，请稍后重试！');
                            }
                        }
                    });

                }
            });
        });


        //添加用户
        $('#add_user').click(function () {
            layer.open({
                type: 2,
                title: '添加用户',
                area: ['100%', '100%'],
                shade: 0,
                maxmin: false,
                content: '/create_user/'
            });
        });

        // 返回
        let retreat = $('#retreat');
        let page_div = $("#page_div");
        retreat.hide();
        page_div.show();
        retreat.click(function () {
            // 隐藏返回键
            $(this).hide();
            // 显示分页栏
            page_div.show();
            // 返回之前的页面
            page_click();
        });

        // 搜索
        form.on('submit', function () {
            let search = form.val('search');
            $.ajax({
                url: url, type: 'post', data: search, success: function (data) {
                    if (data.search_info.length < 1) {
                        layer.msg('没有查到结果')
                    } else {
                        layer.msg(data.search_info.length + '个结果');
                        $('#tbody tr').remove();
                        // 隐藏返回键
                        retreat.show();
                        // 显示分页栏
                        page_div.hide();
                        // 情况列表
                        info_ajax(data, data.user_li = data.search_info)
                    }
                }
            });
            return false
        })
    });
});