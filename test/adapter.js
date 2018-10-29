const FTPromise = require("../lib/index");

const deferred = () => {
  const promise = new FTPromise();
  return {
    promise: promise,
    resolve: promise.resolve,
    reject: promise.reject,
  }
};

module.exports.deferred = deferred;
