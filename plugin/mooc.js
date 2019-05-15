const request = require('../easy_request');
const fs = require('fs');
const path = require('path');
const extend = require('node.extend');
const logHandle = require('../log');


function Crack(user = 0, pwd = 0) {

  this.user = user;
  this.pwd = pwd;

  // 计数
  this.count = 0;

}

/**
 * 请求地址,放在原型中存储
 * @type {{getCellListByTopicId: string, getTopicListByModuleId: string, getModuleListByClassId: string, getCourseList: string, login: string}}
 */
Crack.prototype.requestUri = {

  getProcessList: 'https://mooc.icve.com.cn/mobile/coursedetail/getProcessList',
  getTopicList: 'https://mooc.icve.com.cn/mobile/coursedetail/getTopicList',
  getCellList: 'https://mooc.icve.com.cn/mobile/coursedetail/getCellList',
  statStuProcessCellLogAndTimeLong: 'https://mooc.icve.com.cn/mobile/coursestudy/statStuProcessCellLogAndTimeLong'


};

Crack.prototype.go = function (body, option) {

  let uri = this.requestUri;

  let nodeName = [

    'moduleList',
    'topicList',
    'cellList',
    'childNodeList'

  ];

  let that = this;

  /**
   * 
   * 1. 先处理传过来的对象
   * 
   * 2. 然后丢进handle函数进行流水化处理
   * 
   */

  option.courseOpenId = body.courseOpenId;

  option.sourceType = 2;

  request.requestByPost(uri.getProcessList, option).then(res => handle(res.proces, option))


  function handle(body, option) {

    let currentNode = '';

    let NodeHandle = {
      // 此函数调用了resolve

      // ok
      moduleList: function (body, option) {

        let arr = body.moduleList;

        arr.forEach(item => {

          // 跳过考试模块
          if (item.moduleType === 2) return false;

          let optionNew = {};

          extend(optionNew, option);

          optionNew.moduleId = item.id;

          request.requestByPost(uri.getTopicList, optionNew)
            .then(res => handle(res, optionNew))
            .catch(logHandle);

        });

      },

      // ok
      topicList: function (body, option) {

        let arr = body.topicList;

        arr.forEach(item => {

          let optionNew = {};

          extend(optionNew, option);

          optionNew.topicId = item.id;

          request.requestByPost(uri.getCellList, optionNew)
            .then(res => handle(res, optionNew));

        });

      },

      // ok
      cellList: function (body, option) {

        let arr = body.cellList;

        arr.forEach(item => {

          if (item['cellType'] === 1) {

            let optionNew = {};

            extend(optionNew, option);

            optionNew.cellId = item.id;

            this.statStuProcessCellLogAndTimeLong(optionNew);

          } else {

            let optionNew = {};

            extend(optionNew, option);

            handle(item, optionNew)

          }

        });

      },

      // 处理最终请求逻辑
      // ok
      statStuProcessCellLogAndTimeLong: function (option) {

        option.auvideoLength = 9999;

        option.videoTimeTotalLong = 9999;

        request.requestByPost(uri.statStuProcessCellLogAndTimeLong, option)
          .then(res => {

            if (res.code !== 1) {
              return logHandle(new Error('发送结果时code不为1了，错了啊。' + JSON.stringify(body)));
            }

            that.count++;
          })

      },

      // ok
      childNodeList: function (body, option) {

        let arr = body.childNodeList;

        arr.forEach(item => {

          let optionNew = {};

          extend(optionNew, option);

          optionNew.cellId = item.id;

          return this.statStuProcessCellLogAndTimeLong(optionNew);

        });

      },

    };

    nodeName.forEach(item => {

      if (body[item]) {
        currentNode = item;
      }

    });

    switch (currentNode) {
      case 'moduleList':
        NodeHandle.moduleList(body, option);
        break;
      case 'topicList':
        NodeHandle.topicList(body, option);
        break;
      case 'cellList':
        NodeHandle.cellList(body, option);
        break;
      case 'childNodeList':
        NodeHandle.childNodeList(body, option);
        break;
    }

  }

};


if (!process.argv[2] || !process.argv[3]) {

  return console.log('参数错误！');

} else {

  let crack = new Crack();

  crack.go(JSON.parse(process.argv[2]), JSON.parse(process.argv[3]));

  process.on('exit', () => console.log(crack.count));
}



// let crack = new Crack();

// process.on('exit', () => console.log(crack.count));

// crack.go(JSON.parse(`
// {"id":"cojkabqpdjdnqft8edjvca","cid":"DXYLF028754","courseName":"大学英语","thumbnail":"https://file.icve.com.cn/ssykt/646/911/A18E3C446B1AD551381C723E0F2E101C.jpg","courseOpenId":"ektlabqplorcfjxtp9cxww","courseOpenName":"第一次开课","process":86,"studentCount":"2394","isFinished":null,"stuId":"soovaggpkblfftdx63v6g","schoolName":"廊坊燕京职业技术学院"}
// `), JSON.parse(`
// {"userId":"soovaggpkblfftdx63v6g"}
// `));
