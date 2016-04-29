import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { Router, Route, IndexRoute, hashHistory } from 'react-router'
import { RouterRunContext } from 'react-transact/router'
import configureStore from './configureStore'
import App from './App'
import Colors from './Colors'
import Echo from './Echo'
import Greeting from './Greeting'

const store = configureStore({ name: 'World', error: false })

ReactDOM.render(
  <div style={{ fontSize: '24px', textAlign: 'center' }}>
    <Provider store={store}>
      <Router history={hashHistory}
              render={props => <RouterRunContext onResolve={() => console.log('Resolved!')} {...props}/>}>
        <Route path="/" component={App}>
          <IndexRoute component={Colors}/>
          <Route path="echo/:what" component={Echo}/>
          <Route path="greeting" component={Greeting}/>
        </Route>
      </Router>
    </Provider>
  </div>,
  document.getElementById('app')
)