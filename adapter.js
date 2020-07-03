const FTPromise = require('./promise')
module.exports = {
  Promise: FTPromise,
  deferred: function () {
    let resolve, reject
    return {
      // eslint-disable-next-line
      promise: new Promise(function (_resolve, _reject) {
        resolve = _resolve
        reject = _reject
      }),
      resolve,
      reject
    }
  }
}
