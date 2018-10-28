const deferred = () => ({
  promise: () => { },
  resolve: () => { },
  reject: () => { },
});

module.exports.deferred = deferred;
