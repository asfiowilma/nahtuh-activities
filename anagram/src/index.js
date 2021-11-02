import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import { Toaster } from 'react-hot-toast'
import GlobalProvider from './contexts'

ReactDOM.render(
  <React.StrictMode>
    <Toaster position="bottom-right" reverseOrder={false} />
    <GlobalProvider>
      <App />
    </GlobalProvider>
  </React.StrictMode>,
  document.getElementById('root'),
)
