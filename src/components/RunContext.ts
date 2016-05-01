import * as React from 'react'
import { MapperWithProps, IStore, IResolveOptions, ITask } from './../interfaces'
import TaskQueue from '../internals/TaskQueue'
import ComponentStateStore, { INIT } from '../internals/ComponentStateStore'

const defaultResolveOpts = {
  immediate: false
}

const { func, object, shape } = React.PropTypes

export default class RunContext extends React.Component<any,any> {
  static displayName = 'RunContext'
  static contextTypes = {
    store: object
  }
  static childContextTypes = {
    transact: shape({
      resolve: func,
      run: func
    })
  }
  static propsTypes = {
    onResolve: func,
    stateReducer: func
  }
  static defaultProps = {
    onResolve: () => {}
  }

  context: any
  store: IStore
  queue: TaskQueue

  constructor(props, context) {
    super(props, context)
    if (typeof props.stateReducer === 'undefined') {
      this.store = context.store || props.store
      this.state = {}
    } else {
      this.state = props.stateReducer(undefined, INIT)
      this.store = ComponentStateStore(
        props.stateReducer,
        () => this.state,
        this.setState.bind(this)
      )
    }
    this.queue = new TaskQueue()
  }

  getChildContext() {
    return {
      transact: {
        resolve: this.resolve.bind(this),
        run: this.run.bind(this)
      }
    }
  }

  resolve(mapTaskRuns: MapperWithProps, opts: IResolveOptions = defaultResolveOpts): void {
    this.queue.push(mapTaskRuns)
    if (opts.immediate) {
      this.runTasks(this.props)
    }
  }

  run(tasks: Array<ITask<any,any>> | ITask<any,any>, props: any): void {
    this.queue.push({ mapper: () => tasks, props })
    this.runTasks(this.props)
  }

  runTasks(props): void {
    this.queue.run(
      this.store.dispatch,
      this.store.getState()
    ).then((failedTasks) => {
      props.onResolve(failedTasks)
    })
  }

  componentDidMount() {
    this.runTasks(this.props)
  }

  componentWillReceiveProps(nextProps) {
    setTimeout(() => {
      // Only call run if there are tasks to run, otherwise `onResolve` will trigger unnecessarily.
      if (this.queue.size > 0) {
        this.runTasks(nextProps)
      }
    }, 0)
  }

  render() {
    const { children } = this.props
    const onlyChild = React.Children.only(children)
    return React.cloneElement(onlyChild, { state: this.state })
  }
}
