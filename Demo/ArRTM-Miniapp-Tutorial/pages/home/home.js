const app = getApp();
Page({
    data: {
        message_list: [],//历史单聊列表
        touch_x: 0,//水平方向
        touch_y: 0,//垂直方向 
        message_index: 0,//记录滑动元素下标
        id: '',//用户id或者频道id
        cute_id: "",//记录id
        navH: 0,//导航栏高度
        title: '',//本地id
    },
    onLoad(){
        wx.setNavigationBarTitle({ title: app.globalData.my_id });
        //监听单点消息
        app.globalData.client.on("MessageFromPeer", (message, peerId) => {
            let message_list = this.data.message_list;
            let message_list_index = null;
            let bool = message_list.some((item, index) => {
                if (item.peerId == peerId) {
                    message_list_index = index;
                    return true;
                } else {
                    return false;
                };
            });
            if (bool) {
                let obj = message_list[message_list_index];
                obj.user_message_number++;
                obj.new_message = message.text;
                if (peerId == this.data.cute_id) {
                    obj.user_message_number = 0;
                } else if ( obj.user_message_number > 99 ) {
                    obj.user_message_number = '99+';
                };
            } else {
                if (peerId == this.data.cute_id) {
                    message_list.push({
                        peerId,
                        user_message_number: 0,
                        new_message: message.text,
                        login_status: true,
                        touch: 'to_right',
                    });
                } else {
                    message_list.push({
                        peerId,
                        user_message_number: 1,
                        new_message: message.text,
                        login_status: true,
                        touch: 'to_right',
                    });
                };
            };
             //订阅该用户
            app.globalData.client.subscribePeersOnlineStatus([peerId]);
            this.setData({message_list});
        });
        this.subscribe();
        this.setData({
            navH: app.globalData.navHeight,
            title: app.globalData.my_id,
            message_list: app.globalData.offmessage,
        });
    },

    onUnload(){
        app.globalData.message_list = [];
        app.globalData.offmessage = [];
    },

    //跳转私聊页面
    go_private: function(){
        const { id } = this.data;
        if (id == '') return;
        if (id == app.globalData.my_id) return;
        //清除未读条数
        this.data.message_list.forEach((item) => {
            if (item.peerId == id) {
                item.user_message_number = 0;
            };
        });
        this.data.cute_id = this.data.id;
        this.setData({id: '', message_list: this.data.message_list, cute_id: this.data.cute_id});
        const url = `../private/private?id=${id}`;
        wx.navigateTo({url});
    },

    //跳转私聊页面(历史消息点击)
    go_private_two: function(e){
        let id = e.target.dataset.id;
        if (id == '') return;
        //清除未读条数
        this.data.message_list.forEach((item) => {
            if (item.peerId == id) {
                item.user_message_number = 0;
            };
        });
        this.setData({cute_id: id, message_list: this.data.message_list});
        const url = `../private/private?id=${id}`;
        wx.navigateTo({url});
    },

    //跳转群聊页面
    go_group_private: function(){
        const { id } = this.data;
        if (id == '') return;
        let url = `../group_private/group_private?id=${id}`;
        wx.navigateTo({url});
        this.setData({id: ""});
    },

    //获取输入的id
    get_id: function(e){
        this.setData({id: e.detail.value});
    },

    //处理未读信息条数
    get_user_message_number: function(number){
        return number > 99? '99+' : number;
    },
    
    //手指滑动开始
    touchStart: function(e){
        this.setData({
            message_index: e.target.dataset.index,
        });
        this.setData({
            touch_x: e.changedTouches[0].clientX,
            touch_y: e.changedTouches[0].clientY,
        });
    },

    //手指滑动结束
    touchEnd: function(e){
        const x = e.changedTouches[0].clientX;
        const y = e.changedTouches[0].clientY;
        this.getTouchData(x, y, this.data.touch_x, this.data.touch_y);
    },

    //判断滑动方向
    getTouchData: function(endX, endY, startX, startY){
        if (endX - startX > 50 && Math.abs(endY - startY) < 50) {      //右滑
            this.data.message_list[this.data.message_index].touch = 'to_right';
            this.setData({
                message_list: this.data.message_list,
            });
        } else if (endX - startX < -50 && Math.abs(endY - startY) < 50) {   //左滑
            this.data.message_list[this.data.message_index].touch = 'to_left';
            this.setData({
                message_list: this.data.message_list,
            });
        };
    },

    //订阅状态回调
    subscribe: function(){
        app.globalData.client.on('PeersOnlineStatusChanged', (status) => {
            var peerId = null;
            for (var key in status) { peerId = key };
            this.data.message_list.forEach((item, index) => {
                if (item.peerId == peerId) {
                    item.login_status = status[peerId] == 'ONLINE'? true : false;
                };
            });
            this.setData({
                message_list: this.data.message_list,
            });
        });
    },

    //跳转个人设置
    toSetting: function(){
        wx.navigateTo({
          url: '../setting/setting',
        });
    },

    //退出当前页
    navlinkBack: function(){
        app.globalData.client.logout();
        app.globalData.msg_list = [];
        app.globalData.offmessage = [];
        app.globalData.my_id = '';
        wx.navigateBack({
          delta: 1,
        });
    },

    //页面销毁
    onUnload: function(){
        this.navlinkBack();
    },

    //删除记录
    my_detele: function(e){
        let index = e.target.dataset.index;
        let peerId = this.data.message_list[index].peerId;
        this.data.message_list.splice(index, 1);
        this.setData({
            message_list: this.data.message_list,
        });
        app.globalData.msg_list.map((item, index) => {
            if (item[0].peerId == peerId) {
                app.globalData.msg_list.splice(index, 1);
            };
        });
    },
});