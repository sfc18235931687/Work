layui.use('table', function () {
    let table = layui.table;

    let url = $('form').attr('action');
    table.render({
        elem: '#test',
        url: url,
        id: 'table_info',
        toolbar: '#toolbarDemo', //开启头部工具栏，并为其绑定左侧模板
        limit: 5,
        limits: [5, 10, 20],
        cellMinWidth: 80,
        defaultToolbar: ['filter', 'exports', 'print'],
        title: '学生列表',
        cols: [[
            {type: 'checkbox', fixed: 'left'},
            {field: 'id', title: 'ID', sort: true, fixed: 'left', width: 80},
            {field: 'username', title: '用户名', width: 150},
            {field: 'first_name', title: '真实姓名', width: 100},
            {field: 'is_rank', title: '职位', width: 100},
            {field: 'sex', title: '性别', sort: true, width: 80},
            {field: 'phone', title: '手机'},
            {field: 'email', title: '邮箱'},
            {field: 'date_joined', title: '加入时间', width: 200},
            {fixed: 'right', title: '操作', toolbar: '#barDemo', width: 150, align: 'center'}
        ]]
        , page: true
    });

    // 复选框监听
    table.on('checkbox(test)', function (obj) {
        //console.log(obj.checked); //当前是否选中状态
        //console.log(obj.data); //选中行的相关数据
        //console.log(obj.type); //如果触发的是全选，则为：all，如果触发的是单选，则为：one
        $('button[lay-event="getCheckLength"]').click()
    });

    function batch(lis, data) {
        $.each(data, function (index, value) {
            // console.log(value.id);
            // 批量的数据id打包给后端
            lis.push(value.id)
        });
        return lis
    }

    //头工具栏事件
    table.on('toolbar(test)', function (obj) {
            let checkStatus = table.checkStatus(obj.config.id);
            switch (obj.event) {
                case 'getCheckData':
                    let data1 = checkStatus.data;
                    if (data1.length <= 0) {
                        layer.msg('还未勾选要删除的数据！');
                        return false
                    }
                    let lis = [];
                    // 处理数据
                    batch(lis, data1);
                    layer.confirm('确定删除' + data1.length + '条数据吗？', function (index) {
                        $.ajax({
                            url: url, type: 'post',
                            // JSON.stringify()转换为 JSON 字符串传递给后端
                            data: {'id': JSON.stringify(lis)},
                            success: function (result) {
                                if (result.stu_info === 'del_ok') {
                                    // 刷新当前页面
                                    window.location.reload();
                                    parent.layer.msg('已删除' + data1.length + '条数据！');
                                } else {
                                    layer.msg('出现异常，请稍后重试！')
                                }
                            }
                        });
                        layer.close(index);
                    });
                    break;
                case 'getCheckLength':
                    let data2 = checkStatus.data;
                    if (data2.length === 0) {
                        $('.layui-btn-container button').children('span').html('');
                    } else {
                        $('.layui-btn-container button').children('span').html('(已选' + data2.length + '个)');
                    }
                    break;
                //DelStudentList页面的功能(批量永久删除)
                case 'del_over':
                    let data3 = checkStatus.data;
                    if (data3.length >= 5) {
                        layer.alert('危险操作，需要管理员验证！');
                        return false
                    }
                    if (data3.length <= 0) {
                        layer.msg('还未勾选要删除的数据！');
                        return false
                    }
                    let lis_del = [];
                    // 处理数据
                    batch(lis_del, data3);
                    layer.confirm('永久删除' + data3.length + '条数据吗？操作后数据无法恢复！', function (index) {
                        $.ajax({
                            url: url, type: 'post',
                            // JSON.stringify()转换为 JSON 字符串传递给后端
                            data: {'del_over_id': JSON.stringify(lis_del)},
                            success: function (result) {
                                if (result.info === 'del_over_ok') {
                                    // 刷新当前页面
                                    window.location.reload();
                                    parent.layer.msg('永久删除' + data3.length + '条数据！');
                                } else {
                                    layer.msg('出现异常，请稍后重试！')
                                }
                            }
                        });
                        layer.close(index);
                    });
                    break;
                //DelStudentList页面的功能(批量恢复)
                case
                'batch_recover':
                    let data4 = checkStatus.data;
                    if (data4.length <= 0) {
                        layer.msg('还未勾选要恢复的数据！');
                        return false
                    }
                    let lis_recover = [];
                    // 处理数据
                    batch(lis_recover, data4);
                    layer.confirm('确定恢复' + data4.length + '条数据吗？', function (index) {
                        $.ajax({
                            url: url, type: 'post',
                            // JSON.stringify()转换为 JSON 字符串传递给后端
                            data: {'batch_recover_id': JSON.stringify(lis_recover)},
                            success: function (result) {
                                if (result.info === 'batch_recover_ok') {
                                    // 刷新当前页面
                                    window.location.reload();
                                    parent.layer.msg('已恢复' + data4.length + '条数据！');
                                } else {
                                    layer.msg('出现异常，请稍后重试！')
                                }
                            }
                        });
                        layer.close(index);
                    });
                    break;
            }
        }
    );

    //监听行工具事件
    table.on('tool(test)', function (obj) {
        let data = obj.data;
        // console.log(data.id);
        // 删除按钮
        if (obj.event === 'del') {
            layer.confirm('确定删除' + data.username + '所有信息吗？', function (index) {
                $.ajax({
                    url: url, type: 'post', data: {'one_id': data.id}, success: function (result) {
                        if (result.stu_info === 'one_ok') {
                            obj.del();
                            layer.msg('删除成功！')
                        } else {
                            layer.msg('出现异常，稍后重试')
                        }
                    }
                });
                layer.close(index);
            });
            // 编辑按钮
        } else if (obj.event === 'edit') {
            layer.prompt({
                formType: 3,
                title: '修改姓名',
                value: data.first_name
            }, function (value, index) {
                $.ajax({
                    url: url, type: 'post', data: {'one_name_id': data.id, 'username': value},
                    success: function (result) {
                        if (result.stu_info === 'one_name_ok') {
                            obj.update({
                                first_name: value
                            });
                            layer.msg('修改成功！')
                        } else {
                            layer.msg('出现异常，稍后重试')
                        }
                    }
                });
                layer.close(index);
            });
            //DelStudentList页面的功能
        } else if (obj.event === 'recover') {
            $.ajax({
                url: url, type: 'post', data: {'one_id': data.id}, success: function (result) {
                    if (result.info === 'one_ok') {
                        obj.del();
                        layer.msg('操作成功！')
                    } else {
                        layer.msg('出现异常，稍后重试！')
                    }
                }
            })
        }
    });

    // 搜索部分
    // 执行搜索，表格重载
    $('#do_search').on('click', function () {
        $('#retreat').show();
        // 搜索条件
        let search = $('#search').val();
        table.reload('table_info', {
            // layui内置的异步，默认get请求
            where: {
                'search': search,
            }
            , page: {
                curr: 1
            }
        });
    });
    // 取消
    $('#retreat').on('click', function () {
        window.location.reload();
    })
});