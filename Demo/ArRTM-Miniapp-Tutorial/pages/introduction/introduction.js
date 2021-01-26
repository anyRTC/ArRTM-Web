const app = getApp();
Page({
    data: {
        id: '',//用户id
        attribute_list: [],//属性列表
    },
    onLoad(opation){
      wx.setNavigationBarTitle({title: `用户${opation.id}详情`});
      this.setData({
        id: opation.id,
      }, () => {
        this.init();
      });
    },

    //初始化页面数据
    init: async function(){
      let result = {};
      try {
        result = await app.globalData.client.getUserAttributes(this.data.id);
      } catch (err){

      };
      this.data.attribute_list = [];
      for (var key in result) {
        this.data.attribute_list.push({
            key: key,
            value: result[key],
        });
      };
      this.setData({
        attribute_list: this.data.attribute_list,
      });
    },

    //页面相关事件处理函数--监听用户下拉动作
    onPullDownRefresh: function () {
      this.init();
      wx.stopPullDownRefresh();
    },
});