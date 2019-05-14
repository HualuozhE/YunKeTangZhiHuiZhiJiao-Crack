const path = require('path');
const fs = require('fs');

module.exports = function (outErr) {

  let UTCTime = new Date().toUTCString();

  let filePath = path.join(__dirname, './errorLog.txt');

  fs.readFile(filePath, 'utf8', (err, data) => {

      if (err) {
          return fs.writeFile(filePath, UTCTime + '   ' + err + '\r\n\r\n', 'utf8', (err) => {
              if (err) {
                  throw err;
              }
          });
      }


      fs.writeFile(filePath, data + '\r\n\r\n' + UTCTime + '   ' + outErr + '\r\n' + (outErr && outErr.stack), 'utf8', (err) => {
          if (err) {
              throw err;
          }
      });

  });

}