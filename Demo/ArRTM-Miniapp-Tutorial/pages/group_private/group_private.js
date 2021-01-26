const app = getApp();
Page({
	data: {
		id: '',//群聊id
		msg_list: [],//消息列表
		self_portrait: '../../images/self.png',//本人头像
		scroll_bottom: '',//scoll组件依赖
		msg_content: 'error: This is a fatal error, error code: 5',//提示框内容
		navH: 0,//导航栏高度
		message_text: '',//待发送的消息
		textarea: '',
		my_id: '',
	},
	async onLoad(e){
		this.setData({
			my_id: app.globalData.my_id,
		});
		//生成频道实列
		let RtmChannel = await app.globalData.client.createChannel(e.id);
		//加入频道
		await RtmChannel.join();
		//监听频道消息
		setTimeout(() => {
			RtmChannel.on('ChannelMessage', ((message, memberId) => {
				let msg_list = this.data.msg_list;
				msg_list.push({
					content: message.text,
					peerId: memberId,
					you_portrait: '../../images/gril.jpg',
				});
				this.setData({ msg_list, scroll_bottom: `item-${this.data.msg_list.length - 1}` });
			}));
		}, 500);

		this.setData({
			id: e.id,
			navH: app.globalData.navHeight,
			scroll_bottom: `item-${this.data.msg_list.length - 1}`,
		});
	},

	//页面跳转
	navlinkTo: function(){
		wx.navigateTo({
			url: `../group_setting/group_setting?id=${this.data.id}`,
		});
	},

	//回到上一页
	navlinkBack: async function(){
		//生成频道实列
		let RtmChannel = await app.globalData.client.createChannel(this.data.id);
		//加入频道
		await RtmChannel.join();
		//离开频道
		await RtmChannel.leave();
		wx.navigateBack({
			delta: 1,
		});
	},

	//收集输入框文本
	textarea_text: function(e){
		this.setData({ message_text: e.detail.value });
	},

	//发送消息
	send_message: async function(){
		let { message_text, msg_list, id } = this.data;
		if (message_text.replace(/\s*/g, "") == "") return;
		//生成频道实列
		let RtmChannel = await app.globalData.client.createChannel(id, { enableHistoricalMessaging: true, enableOfflineMessaging: true });
		//发送消息
		await RtmChannel.sendMessage({ text: message_text });
		//添加自己发送的消息
		msg_list.push({
			content: message_text,
			you_portrait: '',
		});
		this.setData({ msg_list, textarea: '' });
	},
});