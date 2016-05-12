'use strict'

const test = require('tape')
const sinon = require('sinon')
const Task = require('../../../lib/internals/Task').default

test('Task#fork (with two thunks)', (t) => {
  t.plan(2)

  const left = new Task((rej, res) => rej({ type: 'BAD', payload: 'Oops' }))
  const right = new Task((rej, res) => res({ type: 'GOOD', payload: 42 }))

  left.fork((action) => {
    t.deepEqual(action, {
      type: 'BAD',
      payload: 'Oops'
    }, 'dispatches to the left side of disjunction')
  })

  right.fork(() => {}, (action) => {
    t.deepEqual(action, {
      type: 'GOOD',
      payload: 42
    }, 'dispatches to the right side of disjunction')
  })
})

test('Task#fork (with one thunk)', (t) => {
  t.plan(2)

  const left = Task.reject({ type: 'BAD' })
  const right = Task.resolve({ type: 'GOOD' })

  left.fork((action) => {
    t.deepEqual(action, { type: 'BAD' }, 'dispatches to the left side of disjunction')
  })

  right.fork((action) => {
    t.deepEqual(action, { type: 'GOOD' }, 'dispatches to the right side of disjunction')
  })
})

test('Task#chain', (t) => {
  t.plan(2)

  const k = x => Task.resolve({ type: 'VALUE', payload: x })
  const inc = x => Task.resolve({ type: 'INCREMENT', payload: x + 1 })
  const bad = () => Task.reject({ type: 'BAD', payload: 'Boo-urns' })

  k(1).chain(inc).fork(() => {}, (action) => {
    t.deepEqual(action, {
      type: 'INCREMENT',
      payload: 2
    }, 'it chains the computation')
  })

  bad().chain(k).fork((action) => {
    t.deepEqual(action, {
      type: 'BAD',
      payload: 'Boo-urns'
    }, 'it stops the chain on failure')
  })
})

test('Task#map', (t) => {
  t.plan(1)

  const k = Task.resolve({ type: 'VALUE', payload: 'Hello' })

  k.map(s => `${s} World!`).map(s => Promise.resolve(s.toUpperCase())).fork((action) => {
    t.deepEqual(action, {
      type: 'VALUE',
      payload: 'HELLO WORLD!'
    }, 'maps over payload')
  })
})

test('Task.resolve', (t) => {
  t.plan(2)

  const task = Task.resolve({ type: 'GOOD', payload: 42 })

  t.ok(task instanceof Task, 'returns instance of task')

  task.fork(() => {}, (action) => {
    t.deepEqual(action, {
      type: 'GOOD',
      payload: 42
    }, 'returns resolved task')
  })
})

test('Task.reject', (t) => {
  t.plan(2)

  const task = Task.reject({ type: 'BAD', payload: 'Oops' })

  t.ok(task instanceof Task, 'returns instance of task')

  task.fork((action) => {
    t.deepEqual(action, {
      type: 'BAD',
      payload: 'Oops'
    }, 'returns rejected task')
  })
})

test('Task#tap', (t) => {
  const task = Task.resolve({ type: 'GOOD', payload: 'Hello' })
  const spy = sinon.spy()
  Task.tap(spy)(task).fork((action) => {
    t.deepEqual(action, { type: 'GOOD', payload: 'Hello' })
    t.ok(spy.called, 'tap is called')
    t.deepEqual(spy.firstCall.args[1], { type: 'GOOD', payload: 'Hello' }, 'tap is called with action')
    t.equal(spy.firstCall.args[2], false, 'tap is called with rejected boolean')
    t.end()
  })
})

test('Task#orElse', (t) => {
  const goodTask = Task.resolve({ type: 'GOOD', payload: 'great!' })
  const badTask = Task.reject({ type: 'BAD', payload: 'error' })
  const elseCreator = a => Task.resolve({ type: 'GOOD', payload: `${a} has been handled :)`})

  badTask.orElse(elseCreator).fork((action) => {
    t.deepEqual(action, { type: 'GOOD', payload:'error has been handled :)' }, 'transforms failures to new Task')
  })

  goodTask.orElse(elseCreator).fork((action) => {
    t.deepEqual(action, { type: 'GOOD', payload:'great!' }, 'does nothing if Task is already successful')
  })

  t.end()

})

test('Task#cancel', (t) => {
  const spy = sinon.spy()
  const task = new Task((rej, res) => {
    res({ type: 'RESOLVED' })
  })

  task.cancel()
  task.fork(spy)

  t.ok(!spy.called, 'task should be cancelled')

  t.end()
})

test('Task.empty', (t) => {
  const task = Task.empty()
  task.fork(() => {
    t.ok(false, 'should not resolve empty task')
  })
  // Give the Task a chance to fork.
  setTimeout(() => {
    t.end()
  }, 10)
})