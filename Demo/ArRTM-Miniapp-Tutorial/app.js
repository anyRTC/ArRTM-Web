//app.js
import ArRTM from "ar-rtm-sdk";
import config from "./utils/config";
const { APPID, SERVERADD, PORT, WSS  } = config;

App({
	async onLaunch() {
		// 获取手机系统信息
		wx.getSystemInfo({
			success: res => {
				//导航高度
				this.globalData.navHeight = res.statusBarHeight + 46;
			},
			fail: err => {
				console.log(err);
			},
		});

		//创建sdk全局实例
		if (APPID === "") {
			wx.showModal({
				title: '警告',
				content: '请在 utils/config.js 里面配置APPID',
			});
			return;
		};
		let client = ArRTM.createInstance(APPID);
		if (SERVERADD && PORT) {
			const RtmParameters = {
				confPriCloudAddr: {
				  ServerAdd: SERVERADD,
				  Port: PORT,
				  Wss: WSS,
				},
			};
			client.setParameters(RtmParameters);
		};

		//监听点对点消息
		client.on("MessageFromPeer", async (message, peerId, messagePros) => {
			if (messagePros.isOfflineMessage) { //离线消息
				let result = await this.globalData.client.queryPeersOnlineStatus([peerId]);
				let login_status = result[peerId];
				let bool = this.globalData.offmessage.some((item, index) => {
					if (item.peerId == peerId) {
						item.user_message_number += 1;
						return true;
					} else {
						return false;
					};
				});
				if (!bool) {
					this.globalData.offmessage.push({
						peerId,
						user_message_number: 1,
						new_message: message.text,
						login_status,
						touch: 'to_right',
					});
				};
			};
			if (this.globalData.msg_list.length > 0) {
				let bool = this.globalData.msg_list.some((item, index) => {
					if (item[0].peerId == peerId) {
						item.push({
							content: message.text,
							you_portrait: '../../images/gril.jpg',
							peerId,
						});
						return true;
					} else {
						return false;
					};
				});
				if (!bool) {
					this.globalData.msg_list.push([{
						content: message.text,
						you_portrait: '../../images/gril.jpg',
						peerId,
					}]);
				};
			} else {
				this.globalData.msg_list.push([{
					content: message.text,
					you_portrait: '../../images/gril.jpg',
					peerId,
				}]);
			};
		});
		this.globalData.client = client;
	},

	globalData: {
		userInfo: null,
		navHeight: 0,
		client: null,
		my_id: null,//本地id
		msg_list: [],//点对点消息列表
		offmessage: [],//离线消息
		LocalInvitation: null,
	},
});