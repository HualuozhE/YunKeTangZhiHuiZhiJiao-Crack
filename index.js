const fs = require('fs');
const path = require('path');
const extend = require('node.extend');
const util = require('util');
const {
  spawn
} = require('child_process');

const request = require('./easy_request');
const logHandle = require('./log');

// require('events').EventEmitter.prototype._maxListeners = 900;


function Crack(user, pwd) {

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

  login: 'https://zjy2.icve.com.cn/newmobileapi/mobilelogin/newlogin',
  getCourseList: 'https://zjy2.icve.com.cn/newmobileapi/student/getCourseList',
  getModuleListByClassId: 'https://zjy2.icve.com.cn/newmobileapi/AssistTeacher/getModuleListByClassId',
  getTopicListByModuleId: 'https://zjy2.icve.com.cn/newmobileapi/AssistTeacher/getTopicListByModuleId',
  getCellListByTopicId: 'https://zjy2.icve.com.cn/newmobileapi/AssistTeacher/getCellListByTopicId',
  getCellInfoByCellId: 'https://zjy2.icve.com.cn/newmobileapi/AssistTeacher/getCellInfoByCellId',
  stuProcessCellLog: 'https://zjy2.icve.com.cn/newmobileapi/Student/stuProcessCellLog',
  getMyCourseList: 'https://mooc.icve.com.cn/mobile/courseinfo/getMyCourseList',
  getStuScoreList: 'https://zjy2.icve.com.cn/study/viewScore/getStuScoreList',
  pcLogin: 'https://zjy2.icve.com.cn/common/login/login'

};

Crack.prototype.go = function () {

  return new Promise((resolve, reject) => {

    let that = this;

    function dataList(body, option) {

      return new Promise(function (resolve) {

        let arr = body.dataList;

        let promiseContainer = [];

        let config = [];

        arr.forEach(item => {

          let optionNew = {};

          extend(optionNew, option);

          optionNew.courseOpenId = item.courseOpenId;

          optionNew.openClassId = item.openClassId;

          config.push(optionNew);

          promiseContainer.push(request.requestByGet(that.requestUri.getModuleListByClassId, optionNew));

        });

        Promise.all(promiseContainer)
          .then(value => {
            resolve({
              value: value,
              config: config
            });
          })
          .catch(err => reject(err));
      });

    }

    let stuId = '';

    that.login()
      .then((body) => {
        stuId = body.token;
        if (body['code'] === -1) {
          return reject(body['msg']);
        }
        return request.requestByGet(that.requestUri.getCourseList, {
          stuId: stuId
        })
      })
      .then((body) => {

        if (!body) return Promise.reject(body);

        return dataList(body, {
          stuId: stuId
        });

      })
      .then((obj) => {
        /**
                 * { value:
   [ { code: 1, moduleList: [Array], msg: '获取成功！' },
     { code: 1, moduleList: [Array], msg: '获取成功！' } ],
  config:
   [ { stuId: 'hzruahepsjjhcdcunp4aiq',
       courseOpenId: '61gaaxwp3i9mux1cqpptsw',
       openClassId: '1sx2aaeq5kzfuxqzekfgw' },
     { stuId: 'hzruahepsjjhcdcunp4aiq',
       courseOpenId: 'axdahwp9krfr8qgwmldka',
       openClassId: 'd1khaqeqh5peghmiu6jayq' } ] }
                 */

        let i = 0;
        let len = obj && obj.value && obj.value.length || 0;
        let afterEnd = false; //确定全部结束

        // console.log(JSON.stringify(obj.value[0]), JSON.stringify(obj.config[0]));

        function recursive() {

          if (i === len) return false;

          let flag = false;

          let ykt = spawn('node', [path.join(__dirname, './plugin/ykt.js'), JSON.stringify(obj.value[i]), JSON.stringify(obj.config[i])]);

          i++;

          if (i === len) flag = true;

          ykt.on('exit', () => {
            if (flag) afterEnd = true;
            recursive();
          });

          ykt.on('error', (err) => {
            if (flag) afterEnd = true;
            logHandle(err, '子进程的Error，注意了');
            recursive();
          });

        }

        recursive(); //上来就先启动一个

        return new Promise(resolve => {

          let timer = setInterval(() => {

            if (i === len && (afterEnd || !len)) {

              let idList = obj && obj.config || [];

              request.requestBase({
                  method: 'post',
                  uri: that.requestUri.pcLogin,
                  form: {
                    userName: this.user,
                    userPwd: this.pwd
                  }
                })
                .then(res => {
                  return res[0]['headers']['set-cookie'].filter(item => item.indexOf('auth') === 0);
                })
                .then(res => {

                  let promiseContainer = [];

                  idList.forEach(item => {

                    promiseContainer.push(request.requestBase({
                      method: 'post',
                      uri: that.requestUri.getStuScoreList,
                      form: {
                        courseOpenId: item.courseOpenId,
                        openClassId: item.openClassId
                      },
                      headers: {
                        cookie: res[0] || ''
                      }
                    }));

                  });

                  return Promise.all(promiseContainer);
                  //End
                })
                .then(() => {
                  return request.requestByPost(that.requestUri.getMyCourseList, {
                    userId: stuId
                  });
                })
                .then(res => resolve(res))
                .catch(err => logHandle(err));

              clearInterval(timer);

            };

          }, 1000);

        });

      })
      .then(res => {

        const list = res && res.list || [];

        let i = 0;
        let len = list.length;

        function recursive() {

          if (i === len) return false;;

          let ykt = spawn('node', [path.join(__dirname, './plugin/mooc.js'), JSON.stringify(list[i]), JSON.stringify({
            userId: stuId
          })]);

          ykt.on('exit', () => recursive());

          ykt.on('error', (err) => {
            logHandle(err, '子进程的Error，注意了');
            recursive()
          });

          i++;

        }

        recursive();

        let timer = setInterval(() => {
          if (i === len) {
            clearInterval(timer);
            resolve(1);
          }
        }, 1000);

      })
      .catch(err => {
        logHandle(err);
        resolve(1);
      });

  });

};

/**
 * @features 登录云课堂 返回stuId
 *
 * @parameter then(body) catch(err)
 *
 * @returns {Promise}
 *
 * @info { code: 1,
 * userType: 1,
 * token: 'hzruahepsjjhcdcunp4aiq',
 * userName: '1833333',
 * secondUserName: '',
 * userId: 'hzruahepsjjhcdcunp4aiq',
 * displayName: '格式',
 * url: 'http://zjy2.icve.com.cn/common/images/default_avatar.jpg',
 * schoolName: '2222222',
 * schoolId: 'ngmbah6neppm2xnzb1m7pq',
 * isValid: 1,
 * isNeedMergeUserName: 0,
 * pwd: '2222' }
 *
 */
Crack.prototype.login = function () {

  const that = this;

  return new Promise(function (resolve, reject) {

    request.requestByGet(that.requestUri.login, {

        clientId: 'b42b6aae4c05c8f9516540d6d693fa82',
        sourceType: '2',
        userName: that.user,
        userPwd: that.pwd

      })
      .then(function (body) {

        resolve(body);

      })
      .catch(function (err) {

        reject(err);

      });

  });

};


module.exports.go = (user, pwd) => {

  return new Crack(user, pwd).go();

};

// code -1 msg 错误信息
module.exports.login = function (user, pwd) {
  return new Promise((resolve, reject) => {

    new Crack(user, pwd).login()
      .then(body => {
        if (body.code !== 1) {
          return reject(body.msg);
        }
        return resolve();
      })
      .catch(err => reject(err));

  });
};

// example
module.exports.go('账号', '密码')
  .then(() => console.log('complete!'))
  .catch(msg => console.log(msg));
