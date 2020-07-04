const Nuo = require('./index')
module.exports = {
  Promise: Nuo,
  deferred: function() {
    let resolve, reject
    return {
      promise: new Nuo(function(_resolve, _reject) {
        resolve = _resolve
        reject = _reject
      }),
      resolve,
      reject
    }
  }
}
