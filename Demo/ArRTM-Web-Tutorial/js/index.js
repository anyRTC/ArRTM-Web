var Config = {
    APPID: '', // your appid
};

var Store = {
    uid: '', // 登录的id
    active: null, // 判断是私聊还是群聊 true = 私聊  false = 群聊
    client: null, // rtm实例
    channel: null, // 频道实例
    isAttr: null, // 记录active
    changeSet: null, // 属性修改依赖
    notaddNum: 32, // 个人属性条数
    msgList: [], // 消息列表
    oldMsgList: [], // 历史消息列表
    userSettingList: [], // 个人设置列表
    useridOrChannelid: '', // 用户id或者频道id
    myPortrait: './images/self.png', // 我的头像
    isNotadd: 0, // 小于 notaddNum 条个人属性时  可以添加新属性
};


// 个人属性设置
$('#user_setting').click(() => {
    get_attr();
    Store.isAttr = Store.active;
    Store.active = null;
    $('#message_page').css('opacity', 0);
    $('#user_setting_page').css('display', 'block');
});

// 属性设置 添加属性 
$('#add_attribute').click(() => {
    if(Store.active){
        if(Store.isNotadd == Store.notaddNum) return;
        $('#staticBackdrop').css('display', 'block');
    }else{
        $('#staticBackdrop').css('display', 'block');
    };
});

// 属性设置 取消
$('#set_cancal').click(() => {
    Store.changeSet = null;
    clear();
    $('#staticBackdrop').css('display', 'none');
});

// 关闭个人属性设置
$('#set_shutDown').click(() => {
    Store.active = Store.isAttr;
    $('#message_page').css('opacity', 1);
    $('#user_setting_page').css('display', 'none');
});

// 离线消息 聊天列表 事件委托
$('#message').click((event) => {
    var $target = $(event.target);
    if($target.text() == '删除' && $target.is('div')){
        $target.parent().parent().remove();
        var peerId = $target.parent().parent().attr('data-peerId');
        Store.oldMsgList.forEach((item, index) => {
            if(item.peerId == peerId){
                Store.oldMsgList.splice(index, 1);
            }
        });
        Store.msgList.forEach((item, index) => {
            if(item[0].peerId == peerId){
                Store.msgList.splice(index, 1);
            };
        });
        $('#panel_title').html('');
        $('#show_message_list').html('');
        Store.active = null;
        Store.useridOrChannelid = '';
    }else{
        if($target.parent().is('li')){
            go_private($target.parent());
        }else if($target.parent().parent().is('li')){
            go_private($target.parent().parent());
        }else if($target.parent().parent().parent().is('li')){
            go_private($target.parent().parent().parent());
        }else if($target.parent().parent().parent().parent().is('li')){
            go_private($target.parent().parent().parent().parent());
        };
    };
});

// 查看属性
$('#mesage_more').click(() => {
    Store.useridOrChannelid == '' || get_user_attr();
});

// 返回聊天页面
$('#go_back').click(() => {
    $('#message_page').removeClass('message_page_hide');
    $('#panel_x').css('display', 'none');
});

// 添加频道属性
$('#add_groud_attribute').click(() => {
    $('#staticBackdrop').css('display', 'block');
});

// 刷新用户属性
$('#panel_reset').click(() => {
    get_user_attr();
});

// 点击退出登录
$('#logout').click(() => {
    outlogin();
});

// 关闭聊天窗口
$('#not_down').click(() => {
    $('#panel_title').html('');
    $('#show_message_list').html('');
    Store.active = null;
    Store.useridOrChannelid = '';
    Store.channel.leave();// 离开频道
});

// 私聊
$('#private').click(() => {
    Store.useridOrChannelid = $('#userId').val();
    if(Store.useridOrChannelid == '' || Store.uid == Store.useridOrChannelid || Store.useridOrChannelid == 'undefined' ||  !Store.useridOrChannelid) return;
    $('#userId').val("");
    $('#message_page').css('opacity', 1);
    $('#panel_x').css('display', 'none');
    $('#user_setting_page').css('display', 'none');
    $('#message_page').removeClass('message_page_hide');
    $('#panel_title').html(`Peer: ${Store.useridOrChannelid}`);
    Store.active = true;
    Store.oldMsgList.forEach((item, index) => {
        if(item.peerId == Store.useridOrChannelid){
            item.message_number = 0;
            $($('#message').children()[index]).children().children().children().children('.badge').remove();
        }
    });
    draw(Store.useridOrChannelid);
});

// 群聊
$('#group_chat').click(async () => {
    Store.useridOrChannelid = $('#userId').val();
    if(Store.useridOrChannelid == '' || Store.useridOrChannelid == undefined ) return;
    $('#userId').val('');
    $('#show_message_list').html('');
    $('#message_page').css('opacity', 1);
    $('#panel_x').css('display', 'none');
    $('#user_setting_page').css('display', 'none');
    $('#message_page').removeClass('message_page_hide');
    $('#panel_title').html(`群聊: ${Store.useridOrChannelid}`);
    Store.active = false;
    Store.channel = await Store.client.createChannel(Store.useridOrChannelid); // 创建频道
    await Store.channel.join();// 加入频道
    setTimeout(() => {
        Store.channel.on('ChannelMessage',  ({ text }, peerId)  => { // 监听频道消息
            draw_group_chat(false, text, peerId);
        });
    }, 500)
});

// 发送消息
$('#send_message').click(async () => {
    var message = $('#message_text').val();
    $('#message_text').val('');
    if(message == '' || Store.useridOrChannelid == '')return;
    var obj = {
        content: message, 
        youPortrait: '', 
        peerId: Store.useridOrChannelid, 
    };
    if(Store.active){
        if(Store.msgList.length > 0){
            var bool = Store.msgList.some((item, ) => {
                item[0].peerId == Store.useridOrChannelid && item.push(obj);
                return item[0].peerId == Store.useridOrChannelid? true : false;
            });
            bool || Store.msgList.push([obj]);
        }else{
            Store.msgList.push([obj]);
        };
        draw(Store.useridOrChannelid);
        var PeersOnlineStatusResult = await Store.client.queryPeersOnlineStatus([Store.useridOrChannelid]);
        old_message({text: message},  Store.useridOrChannelid, PeersOnlineStatusResult[Store.useridOrChannelid]);
        Store.client.sendMessageToPeer({text: message}, Store.useridOrChannelid, {enableHistoricalMessaging:true,enableOfflineMessaging:true}).then(() => {
            scrollToEnd();
        });
    }else{// 群聊
        draw_group_chat(true, message);
        Store.channel.sendMessage({text: message}).then(() => {
            scrollToEnd();
        });
    };
});

// 点击登录
$('#login_button').click(async () => {
    if(Store.uid == '') return;
    $('#exampleInput').val('');
    $('#navbarDropdown').html(Store.uid);
    $('#navbarDropdown').css('display', 'block');
    $('#login_loading').toggleClass('login_loading_hide');
    await Store.client.login({uid: Store.uid});
    $('#login_loading').toggleClass('login_loading_hide');
    $('#login').css('display', 'none');
    $('#offline_message').css('display', 'block');
    Store.client.on('ConnectionStateChanged', (newState, reason) => {
        if(reason == 'REMOTE_LOGIN'){
            outlogin();
            $('#outlogin').css('display', 'block');
        };
    });
});

// 属性设置 确定 点击事件
$('#set_determine').click(async () => {
    var key = $('#user_setting_input_key').val();
    var value = $('#user_setting_input_value').val();
    if(key == '' || value == '') return;
    if(Store.active == null){
        if(Store.changeSet){
            var fingUser = Store.userSettingList.find( (item) => item.key == key );
            if(!fingUser){
                dialog(false, '不允许修改键');
                return;
            };
            await Store.client.deleteLocalUserAttributesByKeys([Store.changeSet.children().first().children().first().text()]);
            Store.changeSet = null;
        }else{
            var fingUser = Store.userSettingList.find( (item) => item.key == key );
            if(fingUser){
                dialog(false, '不允许添加重复属性');
                return;
            }
        };
        Store.client.addOrUpdateLocalUserAttributes({[key]: value}).then(my_success, dialog);
    }else{
        Store.client.addOrUpdateChannelAttributes(Store.useridOrChannelid, {[key]: value}).then(my_success, dialog);
    }
});

// 退出提示框
$('#outlogin_end').click(() => {
    $('#outlogin').css('display', 'none');
});

// 个人属性设置 属性列表 事件委托
$('#userSettingList').click(async (event) => {
    var $target = $(event.target);
    var $target_parent = $target.parent().parent();
    if( $target.is('span')){
        var first = $target_parent.children().first().children().first().text();
        if($target.text() == '删除'){
            Store.isNotadd -= 1;
            $target_parent.remove();
            Store.userSettingList.forEach((item, index) => {
                if(item.key === first){
                    Store.userSettingList.splice(index, 1);
                };
            });
            Store.client.deleteLocalUserAttributesByKeys([first]);
            $('#add_attribute').css({'background': '#007BFF', 'color': '#fff'});
        }else{
            Store.changeSet = $target_parent;
            $('#user_setting_input_key').val(first);
            $('#staticBackdrop').css('display', 'block');
            $('#user_setting_input_value').val($target_parent.children().first().children().last().text());
        };
    };
});

// 打字输入框
$('#message_text').change(() => {
    Store.message_text = $('#message_text').val();
});

// 获取uid
$('#exampleInput').change(() => {
    Store.uid = $('#exampleInput').val();
});

// 滚动到底部
function scrollToEnd(){
    var h = $('#show_message_list').height() - $('#message_box').height();
    $('#message_box').scrollTop(h);
};

// 渲染私聊消息
function draw(peerId){
    if(Store.active == null) return ;
    var str = '';
    var list = [];
    Store.msgList.forEach((item) => {
        if(item[0].peerId == peerId){ list = item };
    });
    list.forEach((item) => {
        if(item.youPortrait == ''){
            str += `<div class='row col-6 align-self-end justify-content-end'>
                        <div class='panel_main_message d-flex align-items-center flex-row-reverse'>
                            <img class='panel_main_message_head image' src=${Store.myPortrait}></img>
                            <div class='panel_main_message_info'>${item.content}</div>
                        </div>
                    </div>`;
        }else{
            str += `<div class='row col-6'>
                        <div class='panel_main_message d-flex align-items-center'>
                            <img class='panel_main_message_head image' src=${item.youPortrait}></img>
                            <div class='panel_main_message_info'>${item.content}</div>
                        </div>
                    </div>`;
        };
    });
    $('#show_message_list').html(str);
};

// 渲染历史消息列表
function drawing(){
    var str = '';
    Store.oldMsgList.forEach((item, index) => {
        if(item.message_number == 0 && item.login_status == true){ // 没有未读消息 在线
            str += `
            <li class='old_msg_item' data-index=${index} data-peerId=${item.peerId}>
                <div class='message_each d-flex justify-content-between'>
                    <div class='message_each_main'>
                        <div class='d-flex justify-content-between align-items-center'>
                            <span>${item.peerId}</span>
                        </div>
                        <div class='d-flex justify-content-between align-items-center'>
                            <span>${item.content}</span>
                            <span class='line'></span>
                        </div>
                    </div>
                    <div class='message_each_clear d-flex justify-content-center align-items-center'>删除</div>
                </div>
            </li>`
        }else if(item.message_number == 0 && item.login_status == false){// 没有未读消息 不在线
            str += `
            <li class='old_msg_item' data-index=${index} data-peerId=${item.peerId}>
                <div class='message_each d-flex justify-content-between'>
                    <div class='message_each_main'>
                        <div class='d-flex justify-content-between align-items-center'>
                            <span>${item.peerId}</span>
                        </div>
                        <div class='d-flex justify-content-between align-items-center'>
                            <span>${item.content}</span>
                            <span class='not_line'></span>
                        </div>
                    </div>
                    <div class='message_each_clear d-flex justify-content-center align-items-center'>删除</div>
                </div>
            </li>`
        }else if(item.message_number != 0 && item.login_status == false){// 有未读消息 不在线
            str += `
            <li class='old_msg_item' data-index=${index} data-peerId=${item.peerId}>
                <div class='message_each d-flex justify-content-between'>
                    <div class='message_each_main'>
                        <div class='d-flex justify-content-between align-items-center'>
                            <span>${item.peerId}</span>
                            <span class='badge badge-danger'>${item.message_number}</span>
                        </div>
                        <div class='d-flex justify-content-between align-items-center'>
                            <span>${item.content}</span>
                            <span class='not_line'></span>
                        </div>
                    </div>
                    <div class='message_each_clear d-flex justify-content-center align-items-center'>删除</div>
                </div>
            </li>`
        }else if(item.message_number != 0 && item.login_status == true){// 有未读消息 在线
            str += `
            <li class='old_msg_item' data-index=${index} data-peerId=${item.peerId}>
                <div class='message_each d-flex justify-content-between'>
                    <div class='message_each_main'>
                        <div class='d-flex justify-content-between align-items-center'>
                            <span>${item.peerId}</span>
                            <span class='badge badge-danger'>${item.message_number}</span>
                        </div>
                        <div class='d-flex justify-content-between align-items-center'>
                            <span>${item.content}</span>
                            <span class='line'></span>
                        </div>
                    </div>
                    <div class='message_each_clear d-flex justify-content-center align-items-center'>删除</div>
                </div>
            </li>`
        }
    })
    $('#message').html(str);
};

// 渲染群聊消息
function draw_group_chat(bool, message, peerId){
    if(Store.active == null) return;
    var str = '';
    if(bool){
        str = `<div class='row col-6 align-self-end justify-content-end'>
                    <span style='display: block;text-align: right;box-sizing:  border-box;padding-right: 70px'>${Store.uid}</span>
                    <div class='panel_main_message d-flex align-items-center flex-row-reverse'>
                        <img class='panel_main_message_head image' src=${Store.myPortrait}></img>
                        <div class='panel_main_message_info'>${message}</div>
                    </div>
                </div>`;
    }else{
        str = `<div class='row col-6'>
                    <span style='display: block;text-align: left;box-sizing:  border-box;padding-left: 70px'>${peerId}</span>
                    <div class='panel_main_message d-flex align-items-center'>
                        <img class='panel_main_message_head image' src='./images/gril.jpg'></img>
                        <div class='panel_main_message_info'>${message}</div>
                    </div>
                </div>`;
    };
    $('#show_message_list').append(str);
    scrollToEnd();
};

// 显示私聊窗口
function go_private(target){
    var index = target.attr('data-index');
    var peerId = target.attr('data-peerId');
    $('#panel_x').css('display', 'none');
    $('#message_page').css('opacity', 1);
    $('#panel_title').html(`Peer: ${peerId}`);
    $('#user_setting_page').css('display', 'none');
    $('#message_page').removeClass('message_page_hide');
    $($('#message').children()[index]).children().children().children().children('.badge').remove();
    Store.active = true;
    Store.useridOrChannelid = peerId;
    Store.oldMsgList[index].message_number = 0;
    draw(peerId);
};

// 监听点对点消息
function listening(){
    Store.client.on('MessageFromPeer',  (message,  peerId) => {
        if(peerId === Store.uid){ // 离线消息
            return;
        };
        var obj = {
            content: message.text, 
            youPortrait: './images/gril.jpg', 
            peerId, 
        };
        if(Store.msgList.length > 0){
            var bool = Store.msgList.some((item) => {
                item[0].peerId == peerId && item.push(obj);
                return item[0].peerId == peerId? true : false;
            });
            bool || Store.msgList.unshift([obj]);
        }else{
            Store.msgList.push([obj]);
        };
        // 订阅该用户
        Store.client.subscribePeersOnlineStatus([peerId]);
        old_message(message,  peerId, true);
        peerId == Store.useridOrChannelid && draw(peerId);
        scrollToEnd();
    });
};

// 订阅状态回调
function subscribe(){
    Store.client.on('PeersOnlineStatusChanged', (status) => {
        var peerId = null;
        for(var key in status){ peerId = key };
        Store.oldMsgList.forEach((item, index) => {
            if(item.peerId == peerId){
                var my_message = $($($($($('#message').children()[index]).children().children()[0]).children()[1]));
                $(my_message.children()[1]).remove();
                item.login_status = status[peerId] == 'ONLINE'? true : false;
                my_message.append(status[peerId] == 'ONLINE'? '<span class="line"></span>' : '<span class="not_line"></span>');
            };
        });
    });
};

// 历史消息列表
function old_message(message,  peerId, status){
    var is_private = Store.active && Store.useridOrChannelid == peerId; // 如果是私聊 并且 id等于peerId
    var obj = {
        content: message.text, 
        message_number: is_private? 0 : 1, 
        peerId, 
        login_status: status, 
    };
    if(Store.oldMsgList.length > 0){
        var bool = Store.oldMsgList.some((item) => {
            if(item.peerId == peerId){
                item.content = message.text;
                is_private? item.message_number = 0 : item.message_number++;
            };
            return item.peerId == peerId? true : false;
        });
        bool || Store.oldMsgList.push(obj);
    }else{
        Store.oldMsgList.push(obj);
    };
    drawing();
};

// 个人属性设置 清除输入框内容
function clear(){
    $('#user_setting_input_key').val('');
    $('#user_setting_input_value').val('');
};

// 获取用户所有属性
async function get_attr(){
    var AttributesMap = await Store.client.getUserAttributes(Store.uid);
    Store.userSettingList = [];
    for(var key in AttributesMap){
        Store.userSettingList.push({
            key: key, 
            value: AttributesMap[key], 
        });
    };
    var template = '';
    Store.userSettingList.forEach((item) => {
        template += `<li class='d-flex  set_determine_child justify-content-between align-items-center'>
            <div>
                <p>${item.key}</p>
                <p>${item.value}</p>
            </div>
            <div>
                <span class='determine_button'>编辑</span>
                <span class='determine_button detele'>删除</span>
            </div>
        </li>`;
    })
    $('#userSettingList').html(template);
    Store.isNotadd = Store.userSettingList.length;
    if(Store.isNotadd == Store.notaddNum){
        $('#add_attribute').css({'background': '#7F7F7F', 'color': '#ccc'});
    };
};

// 获取用户或频道属性
async function get_user_attr(){
    var list = [];
    var template = '';
    var api = Store.active? 'User' : 'Channel';
    var AttributesMap = await Store.client[`get${api}Attributes`](Store.useridOrChannelid);
    for(var key in AttributesMap){
        list.push({
            key: key, 
            value: AttributesMap[key], 
        });
    };
    if(list.length > 0){
        list.forEach((item) => {
            item.value = Store.active? item.value : item.value.value;
            template += `<li>
                <p>${item.key}</p>
                <p>${item.value}</p>
            </li>`;
        });
    };
    $('#panel_x').css('display', 'block');
    $('#detil_panel_message').html(template);
    $('#message_page').addClass('message_page_hide');
    $('#btn-primary_x').css('display', Store.active? 'none' : 'block');
    $('#not_available_x').css('display', list.length > 0? 'none' : 'block');
    $('#detil_panel_message').css('display', list.length > 0? 'block' : 'none');
    $('#add_groud_attribute').css('display', Store.active? 'none' : 'block');
    $('#panel_header_peer_x').html(Store.active? `用户${Store.useridOrChannelid}详情` : '群设置');
};

// 成功回调
function my_success(){
    clear();
    dialog(true);
    $('#staticBackdrop').css('display', 'none');
    Store.active == null? get_attr() : get_user_attr();
};

// 弹窗
function dialog(dialog_bool, message){
    var type = dialog_bool? '#add_success' : '#add_error';
    if(dialog_bool == false){
        $('#alert_characters').text(message);
    };
    $(type).css('opacity', '1');
    setTimeout(() => { 
        $(type).css('opacity', '0');
    }, 2000);
};

// 退出登录
function outlogin(){
    Store.client.logout();
    $('#message_text').val('');
    $('#userId').val('');
    $('#message').html('');
    $('#panel_title').html('');
    $('#navbarDropdown').html('');
    $('#show_message_list').html('');
    $('#login').css('display', 'block');
    $('#message_page').css('opacity', 1);
    $('#navbarDropdown').css('display', 'none');
    $('#offline_message').css('display', 'none');
    $('#user_setting_page').css('display', 'none');
    Store = {
        uid: '', // 登录的id
        active: null, // 判断是私聊还是群聊 true = 私聊  false = 群聊
        client: null, // rtm实例
        channel: null, // 频道实例
        isAttr: null, // 记录active
        changeSet: null, // 属性修改依赖
        msgList: [], // 消息列表
        oldMsgList: [], // 历史消息列表
        userSettingList: [], // 个人设置列表
        notaddNum: 32, // 个人属性条数
        useridOrChannelid: '', // 用户id或者频道id
        myPortrait: './images/self.png', // 我的头像
        isNotadd: 0, // 小于 notaddNum 条个人属性时  可以添加新属性
    };
    initRTM();
};

// 初始化rtm实例
async function initRTM(){
    if( !Config.APPID ) {
        alert('请输入正确的 APPID');
        console.error('请输入正确的 APPID');
        return;
    }
    Store.client = await ArRTM.createInstance(Config.APPID);
    listening();
    subscribe();
}

initRTM();