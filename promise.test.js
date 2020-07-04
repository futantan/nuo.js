const FTPromise = require('./promise')

describe('Promise constructor', () => {
  it('receives a resolver function when constructed which is called immediately', () => {
    // mock function with spies
    const executor = jest.fn()
    const promise = new FTPromise(executor)
    // mock function should be called immediately
    expect(executor.mock.calls.length).toBe(1)
    // arguments should be functions
    expect(typeof executor.mock.calls[0][0]).toBe('function')
    expect(typeof executor.mock.calls[0][1]).toBe('function')
  })

  it('is in a PENDING state', () => {
    const promise = new FTPromise(function executor(resolve, reject) {
      /* ... */
    })
    // for the sake of simplicity the state is public
    expect(promise.state).toBe('PENDING')
  })

  it('transitions to the FULFILLED state with a `value`', () => {
    const value = ':)'
    const promise = new FTPromise((resolve, reject) => {
      resolve(value)
    })
    expect(promise.state).toBe('FULFILLED')
  })

  it('transitions to the REJECTED state with a `reason`', () => {
    const reason = 'I failed :('
    const promise = new FTPromise((resolve, reject) => {
      reject(reason)
    })
    expect(promise.state).toBe('REJECTED')
  })
})

describe('Observing state changes', () => {
  it('should have a .then method', () => {
    const promise = new FTPromise(() => {})
    expect(typeof promise.then).toBe('function')
  })

  it('should call the onFulfilled method when promise is in a FULFILLED state', done => {
    const value = ':)'
    const onFulfilled = jest.fn()
    const promise = new FTPromise((resolve, reject) => {
      resolve(value)
    }).then(onFulfilled)
    setTimeout(() => {
      expect(onFulfilled.mock.calls.length).toBe(1)
      expect(onFulfilled.mock.calls[0][0]).toBe(value)
      done()
    }, 10)
  })

  it('transitions to the REJECTED state with a `reason`', done => {
    const reason = 'I failed :('
    const onRejected = jest.fn()
    const promise = new FTPromise((resolve, reject) => {
      reject(reason)
    }).then(null, onRejected)

    setTimeout(() => {
      expect(onRejected.mock.calls.length).toBe(1)
      expect(onRejected.mock.calls[0][0]).toBe(reason)
      done()
    }, 10)
  })
})

describe('One way transition', () => {
  const value = ':)'
  const reason = 'I failed :('

  it('when a promise is fulfilled it should not be rejected with another value', done => {
    const onFulfilled = jest.fn()
    const onRejected = jest.fn()

    const promise = new FTPromise((resolve, reject) => {
      resolve(value)
      reject(reason)
    })
    promise.then(onFulfilled, onRejected)

    setTimeout(() => {
      expect(onFulfilled.mock.calls.length).toBe(1)
      expect(onFulfilled.mock.calls[0][0]).toBe(value)
      expect(onRejected.mock.calls.length).toBe(0)
      expect(promise.state === 'FULFILLED')
      done()
    }, 10)
  })

  it('when a promise is rejected it should not be fulfilled with another value', done => {
    const onFulfilled = jest.fn()
    const onRejected = jest.fn()

    const promise = new FTPromise((resolve, reject) => {
      reject(reason)
      resolve(value)
    })
    promise.then(onFulfilled, onRejected)

    setTimeout(() => {
      expect(onRejected.mock.calls.length).toBe(1)
      expect(onRejected.mock.calls[0][0]).toBe(reason)
      expect(onFulfilled.mock.calls.length).toBe(0)
      expect(promise.state === 'REJECTED')
      done()
    }, 10)
  })
})

describe('Handling resolver errors', () => {
  it('when the resolver fails the promise should transition to the REJECTED state', done => {
    const reason = new Error('I failed :(')
    const onRejected = jest.fn()
    const promise = new FTPromise((resolve, reject) => {
      throw reason
    })
    promise.then(null, onRejected)
    setTimeout(() => {
      expect(onRejected.mock.calls.length).toBe(1)
      expect(onRejected.mock.calls[0][0]).toBe(reason)
      expect(promise.state === 'REJECTED')
      done()
    }, 10)
  })
})

describe('Async executors', () => {
  it('should queue callbacks when the promise is not fulfilled immediately', done => {
    const value = ':)'
    const promise = new FTPromise((resolve, reject) => {
      setTimeout(resolve, 1, value)
    })

    const onFulfilled = jest.fn()

    promise.then(onFulfilled)
    setTimeout(() => {
      // should have been called once
      expect(onFulfilled.mock.calls.length).toBe(1)
      expect(onFulfilled.mock.calls[0][0]).toBe(value)
      promise.then(onFulfilled)
    }, 5)

    // should not be called immediately
    expect(onFulfilled.mock.calls.length).toBe(0)

    setTimeout(function() {
      // should have been called twice
      expect(onFulfilled.mock.calls.length).toBe(2)
      expect(onFulfilled.mock.calls[1][0]).toBe(value)
      done()
    }, 10)
  })

  it('should queue callbacks when the promise is not rejected immediately', done => {
    const reason = 'I failed :('
    const promise = new FTPromise((resolve, reject) => {
      setTimeout(reject, 1, reason)
    })

    const onRejected = jest.fn()
    promise.then(null, onRejected)

    // should not be called immediately
    expect(onRejected.mock.calls.length).toBe(0)

    setTimeout(() => {
      // should have been called once
      expect(onRejected.mock.calls.length).toBe(1)
      expect(onRejected.mock.calls[0][0]).toBe(reason)
      promise.then(null, onRejected)
    }, 5)

    setTimeout(function() {
      // should have been called twice
      expect(onRejected.mock.calls.length).toBe(2)
      expect(onRejected.mock.calls[1][0]).toBe(reason)
      done()
    }, 10)
  })
})

describe('Chaining promises', () => {
  it('.then should return a new promise', () => {
    const f1 = jest.fn()
    expect(function() {
      new FTPromise(resolve => resolve()).then(f1).then(f1)
    }).not.toThrow()
  })

  it("if .then's onFulfilled is called without errors it should transition to FULFILLED", done => {
    const value = ':)'
    const f1 = jest.fn()
    new FTPromise(resolve => resolve()).then(() => value).then(f1)

    setTimeout(() => {
      expect(f1.mock.calls.length).toBe(1)
      expect(f1.mock.calls[0][0]).toBe(value)
      done()
    }, 10)
  })

  it("if .then's onRejected is called without errors it should transition to FULFILLED", done => {
    const value = ':)'
    const f1 = jest.fn()
    new FTPromise((fulfill, reject) => reject())
      .then(null, () => value)
      .then(f1)

    setTimeout(() => {
      expect(f1.mock.calls.length).toBe(1)
      expect(f1.mock.calls[0][0]).toBe(value)
      done()
    }, 10)
  })

  it("if .then's onFulfilled is called and has an error it should transition to REJECTED", done => {
    const reason = new Error('I failed :(')
    const f1 = jest.fn()
    new FTPromise(resolve => resolve())
      .then(() => {
        throw reason
      })
      .then(null, f1)

    setTimeout(() => {
      expect(f1.mock.calls.length).toBe(1)
      expect(f1.mock.calls[0][0]).toBe(reason)
      done()
    }, 10)
  })

  it("if .then's onRejected is called and has an error it should transition to REJECTED", done => {
    const reason = new Error('I failed :(')
    const f1 = jest.fn()
    new FTPromise((resolve, reject) => reject())
      .then(null, () => {
        throw reason
      })
      .then(null, f1)
    setTimeout(() => {
      expect(f1.mock.calls.length).toBe(1)
      expect(f1.mock.calls[0][0]).toBe(reason)
      done()
    }, 10)
  })
})

describe('Async handlers', () => {
  it(
    'if a handler returns a promise, the previous promise should ' +
      'adopt the state of the returned promise',
    done => {
      const value = ':)'
      const f1 = jest.fn()
      new FTPromise(resolve => resolve())
        .then(() => new FTPromise(resolve => resolve(value)))
        .then(f1)
      setTimeout(() => {
        expect(f1.mock.calls.length).toBe(1)
        expect(f1.mock.calls[0][0]).toBe(value)
        done()
      }, 10)
    }
  )

  it(
    'if a handler returns a promise resolved in the future, ' +
      'the previous promise should adopt its value',
    done => {
      const value = ':)'
      const f1 = jest.fn()
      new FTPromise(resolve => setTimeout(resolve, 0))
        .then(() => new FTPromise(resolve => setTimeout(resolve, 0, value)))
        .then(f1)
      setTimeout(() => {
        expect(f1.mock.calls.length).toBe(1)
        expect(f1.mock.calls[0][0]).toBe(value)
        done()
      }, 10)
    }
  )
})

describe('Additional cases', () => {
  // TODO: move up
  it('works with invalid handlers (fulfill)', done => {
    const value = ':)'
    const f1 = jest.fn()

    const p = new FTPromise(resolve => resolve(value))
    const q = p.then(null)
    q.then(f1)

    setTimeout(() => {
      expect(f1.mock.calls.length).toBe(1)
      expect(f1.mock.calls[0][0]).toBe(value)
      done()
    }, 10)
  })

  it('works with invalid handlers (reject)', done => {
    const reason = 'I failed :('
    const r1 = jest.fn()

    const p = new FTPromise((resolve, reject) => reject(reason))
    const q = p.then(null, null)
    q.then(null, r1)

    setTimeout(() => {
      expect(r1.mock.calls.length).toBe(1)
      expect(r1.mock.calls[0][0]).toBe(reason)
      done()
    }, 10)
  })

  it('the promise observers are called after the event loop', done => {
    const value = ':)'
    const f1 = jest.fn()
    let resolved = false

    const p = new FTPromise(resolve => {
      resolve(value) // should not execute f1 immediately
      resolved = true
    }).then(f1)

    expect(f1.mock.calls.length).toBe(0)

    setTimeout(function() {
      expect(f1.mock.calls.length).toBe(1)
      expect(f1.mock.calls[0][0]).toBe(value)
      expect(resolved).toBe(true)
      done()
    }, 10)
  })

  it('rejects with a resolved promise', done => {
    const value = ':)'
    const reason = new FTPromise(resolve => resolve(value))

    const r1 = jest.fn()
    const p = new FTPromise(resolve => resolve())
      .then(() => {
        throw reason
      })
      .then(null, r1)

    expect(r1.mock.calls.length).toBe(0)

    setTimeout(function() {
      expect(r1.mock.calls.length).toBe(1)
      expect(r1.mock.calls[0][0]).toBe(reason)
      done()
    }, 10)
  })

  it('should throw when attempted to be resolved with itself', done => {
    const r1 = jest.fn()
    const p = new FTPromise(resolve => resolve())
    const q = p.then(() => q)
    q.then(null, r1)

    setTimeout(function() {
      expect(r1.mock.calls.length).toBe(1)
      expect(r1.mock.calls[0][0] instanceof TypeError).toBe(true)
      done()
    }, 10)
  })

  it('should work with thenables', done => {
    const value = ':)'
    const thenable = {
      then: resolve => resolve(value)
    }
    const f1 = jest.fn()
    new FTPromise(resolve => resolve(value)).then(() => thenable).then(f1)

    setTimeout(function() {
      expect(f1.mock.calls.length).toBe(1)
      expect(f1.mock.calls[0][0]).toBe(value)
      done()
    }, 10)
  })
})
