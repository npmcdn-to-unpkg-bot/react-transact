const test = require('tape')
const middleware = require('../lib/middleware').default
const applyMiddleware = require('redux').applyMiddleware
const actions = require('../lib/actions')
const Task = require('../lib/internals/Task').default
const createStore = require('redux').createStore
const sinon = require('sinon')

test('middleware (no tasks)', (t) => {
  const identity = (state) => state
  const m = middleware()
  const store = createStore(identity, {}, applyMiddleware(m))

  t.ok(typeof m.done.then === 'function', 'returns a done promise on middleware')

  store.dispatch({ type: actions.RUN_SCHEDULED_TASKS })

  m.done.then(() => {
    t.end()
  })
})

test('middleware (run one task)', (t) => {
  const reducer = (state = 'called', action = {}) => {
    if (action.type === 'OK') return 'called'
    else return 'not called'
  }
  const m = middleware()
  const store = createStore(reducer, undefined, applyMiddleware(m))

  store.dispatch({ type: actions.SCHEDULE_TASKS, payload: {
    mapper: () => [Task.resolve({ type: 'OK' })],
    props: {}
  } })

  store.dispatch({ type: actions.RUN_SCHEDULED_TASKS })

  m.done.then(() => {
    t.equal(store.getState(), 'called')
    t.end()
  })
})

test('middleware (multiple tasks)', (t) => {
  const reducer = (state = [], action = {}) => {
    if (action.type === 'OK') return state.concat([action])
    else return state
  }
  const m = middleware()
  const store = createStore(reducer, undefined, applyMiddleware(m))

  // This should resolve after all tasks are finished.
  m.done.then(() => {
    t.deepEqual(store.getState(), [
      { type: 'OK', payload: 1 },
      { type: 'OK', payload: 2 },
      { type: 'OK', payload: 3 },
      { type: 'OK', payload: 4 },
      { type: 'OK', payload: 5 },
      { type: 'OK', payload: 6 }
    ], 'waits for all tasks to resolve and dispatches their actions')
    t.end()
  })

  store.dispatch({ type: actions.SCHEDULE_TASKS, payload: {
    mapper: () => [Task.resolve({ type: 'OK', payload: 1 })],
    props: {}
  } })

  store.dispatch({ type: actions.RUN_SCHEDULED_TASKS })

  store.dispatch({ type: actions.SCHEDULE_TASKS, payload: {
    mapper: () => [Task.resolve({ type: 'OK', payload: 2 })],
    props: {}
  } })

  store.dispatch({ type: actions.RUN_SCHEDULED_TASKS })

  store.dispatch({ type: actions.SCHEDULE_TASKS, payload: {
    mapper: () => [
      Task.resolve({ type: 'OK', payload: 3 }),
      Task.resolve({ type: 'OK', payload: 4 }),
      Task.resolve({ type: 'OK', payload: 5 })
    ],
    props: {}
  } })

  store.dispatch({ type: actions.SCHEDULE_TASKS, payload: {
    mapper: () => [Task.resolve({ type: 'OK', payload: 6 })],
    props: {}
  } })

  store.dispatch({ type: actions.RUN_SCHEDULED_TASKS })
})
