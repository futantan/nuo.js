const id = v => v
const idThrow = e => {
  throw e
}
const isPromise = x => x != null && typeof x.then === 'function'

function Nuo(executor) {
  this.state = 'PENDING'
  this.value = undefined
  this.queue = []

  const transitionTo = (state, x) => {
    if (this.state === 'PENDING') {
      this.state = state
      this.value = x
    }
    this.queue.forEach(f => f())
  }

  const resolve = value => transitionTo('FULFILLED', value)
  const reject = reason => transitionTo('REJECTED', reason)

  try {
    executor(resolve, reject)
  } catch (e) {
    reject(e)
  }
}
Nuo.prototype.then = function(onResolved, onRejected) {
  onResolved = typeof onResolved === 'function' ? onResolved : id
  onRejected = typeof onRejected === 'function' ? onRejected : idThrow

  const promise2 = new Nuo((resolve, reject) => {
    const schedulePromise2Resolution = () => {
      setTimeout(() => {
        try {
          const cb = this.state === 'FULFILLED' ? onResolved : onRejected
          const x = cb(this.value)
          if (x === promise2) {
            throw new TypeError('Chaining cycle detected for promise')
          }
          if (isPromise(x)) {
            x.then(resolve, reject)
          } else {
            resolve(x)
          }
        } catch (e) {
          reject(e)
        }
      })
    }
    if (this.state === 'PENDING') {
      this.queue.push(schedulePromise2Resolution)
    } else {
      schedulePromise2Resolution()
    }
  })
  return promise2
}
module.exports = Nuo
