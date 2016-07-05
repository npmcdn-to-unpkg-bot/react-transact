import express from 'express'
import React, {Component} from 'react'
import ReactDOM from 'react-dom/server'
import {Route, match, Redirect, RouterContext } from 'react-router'
import {transact, TransactContext, call, resolve} from '../../index'
import {Provider, inject} from 'react-tunnel'

const server = express()

/*
 * Component that creates tasks to be run, as well as connect to redux state.
 */
@transact.route({
  params: ['color'],
  query: ['message'],
  defaults: {
    color: 'purple',
    message: 'Hello World!'
  }
},
({ mutateState, color, message }) => {
  return [
    call(mutateState, { message }),
    call(mutateState, { color  })
  ]
})
class RouteHandler extends Component {
  render() {
    const { color, message } = this.props
    return (
      <div style={{ color }}>
        <h1>{message}</h1>
      </div>
    )
  }
}

const routes = (
  <Route path="/(:color)" component={RouteHandler}/>
)

server.listen(8080, () => {
  server.get('*', (req, res) => {
    if (req.accepts('html')) {
      match({ routes, location: req.url }, (err, redirect, routeProps) => {
        const appState = {
          color: '',
          message: ''
        }

        // Artificially make mutation async and delayed.
        const mutateState = (newState) => new Promise((res) => {
          setTimeout(() => {
            Object.assign(appState, newState)
            res()
          }, Math.random() * 200)
        })

        const extraProps = { appState, mutateState }

        // Wait for all route tasks to resolve.
        resolve(routeProps, extraProps).then(() => {
          // Now call render to get the final HTML.
          const markup = ReactDOM.renderToStaticMarkup(
            <TransactContext>
              <RouterContext {...routeProps}/>
            </TransactContext>
          )

          res.send(`
          <!doctype html>
          ${markup}
          <pre>State = ${JSON.stringify(appState, null, 2)}</pre>
          `)
        })
      })
    } else {
      res.status(404).end()
    }
  })
})
