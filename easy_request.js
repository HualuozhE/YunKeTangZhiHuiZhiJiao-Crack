const request = require('request');

const TIMEOUT = 8 * 1000; // 8秒超时
const RETRY = 5; //最大重试次数

exports.requestByGet = function (uri, parm = {}) {

  return exports.requestBase({
      method: 'get',
      qs: parm,
      uri: uri,
      json: true
    })
    .then(res => res[1]);

}

exports.requestByPost = function (uri, parm = {}) {

  return exports.requestBase({
      method: 'post',
      uri: uri,
      form: parm,
      json: true
    })
    .then(res => res[1])

};


exports.requestDelayByPost = function (uri, parm = {}) {

  return new Promise(function (resolve) {

      setTimeout(() => resolve(), Math.floor(Math.random() * 8001));

    })
    .then(() => exports.requestByPost(uri, parm));

};


/** 基本请求
 * 
 * @param {Object} option request配置对象
 * 
 * @return {Promise} Promise
 * 
 */
exports.requestBase = function (option = {}) {

  return new Promise((resolve, reject) => {

    let count = 0;

    (function () {

      option.timeout = option.timeout || TIMEOUT,

      // option.maxRedirects = 900;

        request(option, (err, res, body) => {

          if (err && (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') && count < RETRY) {
            count++;
            return arguments.callee();
          }

          if (err) return reject(err);

          resolve([res, body]);

        });

    })();

  })

};