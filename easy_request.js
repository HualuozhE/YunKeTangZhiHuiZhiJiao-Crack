const request = require('request');

const TIMEOUT = 8 * 1000;// 8秒超时
const RETRY = 5; //最大重试次数

exports.requestByGet = function (url, parm = {}) {

  return new Promise((resolve, reject) => {

    let count = 0;

    (function () {

      request.get({

        qs: parm,
        uri: url,
        json: true,
        timeout: TIMEOUT
  
      }, (err, res, body) => {

        if (err && (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') && count < RETRY) {
          count ++;
          return arguments.callee();
        }

        if (err) return reject(err);

        resolve(body);
        
      });

    })();



    })



}

exports.requestByPost = function (url, parm = {}) {

  return new Promise((resolve, reject) => {

    let count = 0;

    (function () {

      request.post({

        url: url,
        form: parm,
        json: true,
        timeout: TIMEOUT
  
      }, (err, res, body) => {

        if (err && (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') && count < RETRY) {
          count ++;
          return arguments.callee();
        }

        if (err) return reject(err);

        resolve(body);
        
      });

    })();

    })

};

exports.requestDelayByPost = function (url, parm = {}) {

  return new Promise(function (resolve) {

    setTimeout(() => resolve(), Math.floor(Math.random() * 8001));

  })
  .then(() => exports.requestByPost(url, parm));

};
