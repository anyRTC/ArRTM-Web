const app = getApp();
Page({
	data: {
		id: '',//用户id
		my_id: '',
		msg_list: [],//消息列表
		self_portrait: '../../images/self.png',//本人头像
		scroll_bottom: '',//scoll组件依赖
		msg_content: 'error:This is a fatal error, error code: 5',//提示框内容
		message_text: '',//待发送的消息
		navH: 0,//导航栏高度
		textarea: '',
	},
	onLoad(e){
		wx.setNavigationBarTitle({ title: e.id });
		this.setData({
			my_id: app.globalData.my_id,
		});
		this.updata(e);
		//监听点对点消息
		app.globalData.client.on("MessageFromPeer", (message, peerId, messagePros) => {
			this.updata();
		});
		this.setData({
			navH: app.globalData.navHeight,
		});
	},

	//更新数据
	updata: function(e = this.data){
		let msg_list = [];
		app.globalData.msg_list.map((item) => {
			if (item[0].peerId == e.id) {
				msg_list = item;
			};
		});
		let scroll_bottom = `item-${msg_list.length - 1}`;
		this.setData({
			id: e.id,
			msg_list,
			scroll_bottom,
		});
	},

	//跳转页面
	navlinkTo: function(e){
		const { id, url } = e.target.dataset;
		wx.navigateTo({
			url: `${url}?id=${id}`,
		});
	},

	//返回页面
	navlinkBack: function(){
		let pages = getCurrentPages();    //获取加载的页面( 页面栈 )
		let prevPage = pages[pages.length - 2];    //获取上一个页面
		prevPage.setData({
			cute_id: null,
		});
		wx.navigateBack({
			delta: 1,
		});
	},

	//收集输入框文本
	textarea_text: function(e){
		this.setData({ message_text: e.detail.value });
	},

	//发送消息
	send_message: async function (){
		let { message_text, id } = this.data;
		if (message_text.replace(/\s*/g, "") == "") return;
		await app.globalData.client.sendMessageToPeer({ text: message_text }, id, { enableHistoricalMessaging: true, enableOfflineMessaging: true });
		if (app.globalData.msg_list.length > 0) {
			let bool = app.globalData.msg_list.some((item, index) => {
				if (item[0].peerId == id) {
					item.push({
						content: message_text,
						you_portrait: '',
						peerId: id,
					});
					return true;
				} else {
					return false;
				};
			});
			if (!bool) {
				app.globalData.msg_list.push([{
					content: message_text,
					you_portrait: '',
					peerId: id,
				}]);
			};
		} else {
			app.globalData.msg_list.push([{
				content: message_text,
				you_portrait: '',
				peerId: id,
			}]);
		};
		let pages = getCurrentPages();    //获取加载的页面( 页面栈 )
		let prevPage = pages[pages.length - 2];    //获取上一个页面
		// 设置上一个页面的数据（可以修改，也可以新增）
		let message_list = prevPage.data.message_list;
		let message_list_index = null;
		let bool = message_list.some((item, index) => {
			if (item.peerId == this.data.id) {
				message_list_index = index;
				return true;
			} else {
				return false;
			};
		});
		let PeersOnlineStatusResult = await app.globalData.client.queryPeersOnlineStatus([this.data.id]);
		if (bool) {
			let obj = message_list[message_list_index];
			obj.user_message_number = 0;
			obj.new_message = message_text;
			if (obj.user_message_number > 99) {
				obj.user_message_number = '99+';
			};
		} else {
			message_list.push({
				peerId: this.data.id,
				user_message_number: 0,
				new_message: message_text,
				login_status: PeersOnlineStatusResult[this.data.id],
				touch: 'to_right',
			});
		};
		app.globalData.client.subscribePeersOnlineStatus([this.data.id]);
		prevPage.setData({
			message_list,
		});
		this.setData({ textarea: '', message_text: '' });
		this.updata();
	},
});