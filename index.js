const Status = { Pending: 'PENDING', Fulfilled: 'FULFILLED', Rejected: 'REJECTED' }
const id = v => v
const idThrow = e => {
  throw e
}

class Nuo {
  constructor(executor) {
    this.state = Status.Pending
    this.value = undefined
    this.queue = []

    const transitionTo = state => x => {
      if (this.state === Status.Pending) {
        this.state = state
        this.value = x
        this.queue.forEach(f => f())
      }
    }

    try {
      executor(transitionTo(Status.Fulfilled), transitionTo(Status.Rejected))
    } catch (e) {
      reject(e)
    }
  }

  then(onResolved, onRejected) {
    onResolved = typeof onResolved === 'function' ? onResolved : id
    onRejected = typeof onRejected === 'function' ? onRejected : idThrow

    const promise2 = new Nuo((resolve, reject) => {
      const schedulePromise2Resolution = () => {
        setTimeout(() => {
          try {
            const cb = this.state === Status.Fulfilled ? onResolved : onRejected
            resolvePromise(promise2, cb(this.value), resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      if (this.state === Status.Pending) {
        this.queue.push(schedulePromise2Resolution)
      } else {
        schedulePromise2Resolution()
      }
    })
    return promise2
  }
}

function resolvePromise(promise2, x, resolve, reject) {
  if (x === promise2) return reject(new TypeError('Chaining cycle detected for promise'))

  let called
  const guard = fn => {
    if (called) return
    called = true
    fn()
  }
  if (x != null && (typeof x === 'object' || typeof x === 'function')) {
    try {
      const then = x.then // x.then should only be called once since it may be a getter
      if (typeof then === 'function') {
        then.call(
          x,
          y => guard(() => resolvePromise(promise2, y, resolve, reject)),
          err => guard(() => reject(err))
        )
      } else {
        resolve(x)
      }
    } catch (e) {
      guard(() => reject(e))
    }
  } else {
    resolve(x)
  }
} // 80 LOC

module.exports = Nuo
