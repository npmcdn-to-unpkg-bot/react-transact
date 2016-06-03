import * as React from 'react'
import transact from './transact'
import { invariant, getDisplayName, shallowEqual } from '../internals/helpers'
import { IMapTasks } from "../interfaces";

// Takes in route params and location query and returns a component props object.
// If the value is empty, then the default is used.
const toProps = (paramNames, queryNames, defaults, props) =>
  Object.assign(
    queryNames.reduce((acc, name) =>
        Object.assign(acc, { [name]: props.location.query[name] || defaults[name] })
      , {}),
    paramNames.reduce((acc, name) =>
        Object.assign(acc, { [name]: props.params[name] || defaults[name] })
      , {})
  )

type IProps = {
  transact: any
  params: any
}

type IState = {
  routeProps: Array<string>
}

type RouteDescriptor = {
  params?: Array<string>
  query?: Array<string>
  defaults?: {
    [key: string]: string
  }
}

/*
 * The @transact.route decorator is used to decorate a router handler to resolve tasks
 * based on the declared params and query props.
 *
 * When the param or query values change, the decorated route handler will resolve its
 * tasks again.
 */
export default (first: RouteDescriptor | Array<string>, mapper: IMapTasks): IMapTasks => {
  let paramNames: Array<string>
  let queryNames: Array<string>
  let defaults: { [key: string]: string }

  // Task mapper is either the first and only argument, or it is the last.
  if (first instanceof Array) {
    paramNames = first
    queryNames = []
    defaults = {}
  } else {
    paramNames = first.params || []
    queryNames = first.query || []
    defaults = first.defaults
  }

  invariant(
    typeof mapper === 'function',
    '@transact.router called without a task mapper function as the last argument'
  )

  return (Wrappee: any): any => {
    const Inner = transact(mapper, { onMount: true })((props) =>
      React.createElement(
        Wrappee,
        props
      ))

    class Wrapped extends React.Component<IProps,IState> {
      static displayName = `TransactRoute(${getDisplayName(Wrappee)})`

      static _mapTasks = (state, props, commit) => mapper(state, toProps(paramNames, queryNames, defaults, props), commit)

      static contextTypes = {
        router: React.PropTypes.any,
        transact: React.PropTypes.object
      }

      context: IProps

      _inner: any = null

      constructor(props, context) {
        super(props, context)
        this.state = {
          routeProps: toProps(paramNames, queryNames, defaults, props)
        }
      }

      componentWillReceiveProps(nextProps) {
        const nextParamProps = toProps(paramNames, queryNames, defaults, nextProps)
        if (!shallowEqual(this.state.routeProps, nextParamProps)) {
          // Set the state, then call the @transact component to resolve its tasks again.
          this.setState({ routeProps: nextParamProps }, () => {
            this._inner.forceResolve()
          })
        }
      }
      
      render() {
        return React.createElement(
          Inner,
          Object.assign({
            ref: r => this._inner = r,
            children: this.props.children
          }, this.state.routeProps)
        )
      }
    }

    return Wrapped
  }
}

