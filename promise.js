const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";
const isPromise = x => x != null && typeof x.then === "function";
const id = v => v;
const idThrow = e => {
  throw e;
};

function FTPromise(executor) {
  this.state = PENDING;
  this.value = undefined;
  this.queue = [];

  const transitionTo = (state, x) => {
    if (this.state === PENDING) {
      this.state = state;
      this.value = x;
    }
    this.queue.forEach(f => f());
  };

  const resolve = value => transitionTo(FULFILLED, value);
  const reject = reason => transitionTo(REJECTED, reason);
  try {
    executor(resolve, reject);
  } catch (e) {
    reject(e);
  }
}

function resolvePromise(promise, x, resolve, reject) {
  if (promise === x) {
    return reject(new TypeError("failed"));
  }
  if (isPromise(x)) {
    x.then(resolve, reject);
  } else {
    resolve(x);
  }
}

FTPromise.prototype.then = function(onFulfilled, onRejected) {
  onFulfilled = typeof onFulfilled === "function" ? onFulfilled : id;
  onRejected = typeof onRejected === "function" ? onRejected : idThrow;

  const promise2 = new FTPromise((resolve, reject) => {
    const schedulePromise2Resolution = () => {
      setTimeout(() => {
        try {
          const fn = this.state === FULFILLED ? onFulfilled: onRejected;
          resolvePromise(promise2, fn(this.value), resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    }
    if (this.state === PENDING) {
      this.queue.push(schedulePromise2Resolution);
    } else {
      schedulePromise2Resolution()
    }
  });
  return promise2;
};

module.exports = FTPromise;
