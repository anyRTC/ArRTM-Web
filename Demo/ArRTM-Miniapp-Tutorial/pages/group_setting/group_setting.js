const app = getApp();
Page({
    data: {
        attribute_list: [],//属性列表
        add_success_name: '',//添加class类名
        dialog: false,//dialog依赖
        dialog_title: '添加属性',//dialog标题
        key: '',//属性键
        value: '',//属性值
        // touch_x: 0,//水平方向
        // touch_y: 0,//垂直方向 
        // message_index: 0,//记录滑动元素下标
        // change_index: null,//修改下标
        msg_content: '',//提示框内容
        // channel_id: '',//频道id
    },

    async onLoad(opation){
        this.setData({channel_id: opation.id}, () => {
            this.init();
        });
    },

    //初始化数据
    init: async function(){
        let result = await app.globalData.client.getChannelAttributes(this.data.channel_id);
        this.data.attribute_list = [];
        for (var key in result) {
            this.data.attribute_list.push({
                key: key,
                value: result[key].value,
            });
        };
        this.setData({
            attribute_list: this.data.attribute_list,
        });
    },

    //修改属性
    change_attr: function(e){
        const { key, value } = this.data.attribute_list[e.target.dataset.index];
        this.data.attribute_list[e.target.dataset.index].touch = 'to_right';
        this.setData({
            attribute_list: this.data.attribute_list,
            dialog_title: '修改属性',
            change_index: e.target.dataset.index,
            dialog: true,
            key,
            value,
        });
    },

    //删除属性
    detele_attr: function(e){
        this.data.attribute_list.splice(e.target.dataset.index, 1);
        this.setData({
            attribute_list: this.data.attribute_list,
            change_index: e.target.dataset.index,
        });
    },

    //显示dialog
    show_dialog: function(){
        this.setData({
            dialog:true,
        });
    },

    //隐藏dialog
    hide_dialog: function(){
        this.setData({
            dialog: false,
            key: '',
            value: '',
        });
    },

    //确认添加属性
    add_attribute_success: async function(){
        let { key, value, change_index, msg_content, channel_id } = this.data;
        if (key.replace(/\s+/g, "") == '' || value.replace(/\s+/g, "") == '') return;
        await app.globalData.client.addOrUpdateChannelAttributes(channel_id, {[key]: value});
        if (change_index == null) {
            this.data.attribute_list.push({
                key,
                value,
                touch: 'to_right',
            });
            msg_content = '添加成功';
        } else {
            this.data.attribute_list[this.data.change_index].key = key;
            this.data.attribute_list[this.data.change_index].value = value;
            msg_content = '修改成功';
            change_index = null;
        };

        this.setData({
            attribute_list: this.data.attribute_list,
            dialog: false,
            add_success_name: 'add_success_show',
            msg_content,
            key: '',
            value: '',
            change_index,
        });
        setTimeout(() => {
            this.setData({
                add_success_name: 'add_success_hide',
            });
        }, 2500);
    },

    //input 事件
    input_change: function(e){
        if (e.target.dataset.type == 'key') {
            this.setData({
                key: e.detail.value,
            });
        } else {
            this.setData({
                value: e.detail.value,
            });
        };
    },

      //页面相关事件处理函数--监听用户下拉动作
    onPullDownRefresh: function(){
        this.init();
        wx.stopPullDownRefresh();
    },

     //手指滑动开始
    // touchStart: function(e){
    //     this.setData({
    //       message_index: e.target.dataset.index,
    //     });
    //     this.setData({
    //         touch_x: e.changedTouches[0].clientX,
    //         touch_y: e.changedTouches[0].clientY,
    //     });
    // },

    //手指滑动结束
    // touchEnd: function(e){
    //     let x = e.changedTouches[0].clientX;
    //     let y = e.changedTouches[0].clientY;
    //     this.getTouchData(x, y, this.data.touch_x, this.data.touch_y);
    // },

    //判断滑动方向
    // getTouchData: function(endX, endY, startX, startY){
    //     if (endX - startX > 50 && Math.abs(endY - startY) < 50) {      //右滑
    //         this.data.attribute_list[this.data.message_index].touch = 'to_right';
    //         this.setData({
    //           attribute_list: this.data.attribute_list,
    //         });
    //     } else if (endX - startX < -50 && Math.abs(endY - startY) < 50) {   //左滑
    //         this.data.attribute_list[this.data.message_index].touch = 'to_left';
    //         this.setData({
    //           attribute_list: this.data.attribute_list,
    //         });
    //     };
    // },
});