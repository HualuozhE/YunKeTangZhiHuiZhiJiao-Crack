# 食用指南

### example

+ 1.安装nodejs

+ 2.下载源码

+ 3.找到index.js最后3行代码，，如下，，把学号密码替换成你的

```javascript
module.exports.go('学号', '密码')
.then(() => console.log('complete'))
.catch(msg => console.log(msg));
```

+ 4.然后打开cmd，cd到代码目录， 执行以下代码即可

```javascript
npm install
npm run start
```
