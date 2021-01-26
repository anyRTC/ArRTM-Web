const app = getApp();
Page({
	data: {
		is_loading: false,
		user_id: '',//用户id
	},
	login: async function () {
		if (this.data.user_id == '') return;
		this.setData({
			is_loading: true,
		});
		//登录系统
		await app.globalData.client.login({
			uid: this.data.user_id,
		});

		this.setData({
			is_loading: false,
		});
		app.globalData.my_id = this.data.user_id;
		wx.navigateTo({
			url: '../home/home',
		});

		app.globalData.client.on('ConnectionStateChanged', (newState, reason) => {
			if (reason == 'REMOTE_LOGIN') {
				wx.navigateTo({
					url: '../login/login',
				});

				wx.showModal({
					title: '提示',
					content: '账号已在别处登录',
					showCancel: false,
				});
			};
		});

		this.setData({
			user_id: '',
		});
	},

	//输入用户id
	input_user_id: function (e) {
		this.setData({ user_id: e.detail.value.replace(/\s*/g, "").toString() });
	},
});
