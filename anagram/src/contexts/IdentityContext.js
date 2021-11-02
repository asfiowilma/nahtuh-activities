import React from 'react'
import { nahtuhClient as n } from 'nahtuh-client'

const INITIAL_STATE = {
  isHost: false,
  username: '',
}
const IdentityContext = React.createContext(INITIAL_STATE)

function identityReducer(state, action) {
  switch (action.type) {
    case 'SET_IS_HOST':
      return { ...state, isHost: action.payload }
    case 'SET_USERNAME':
      return { ...state, username: action.payload }
    default:
      throw new Error(`Unhandled action type: ${action.type}`)
  }
}

function IdentityProvider({ children }) {
  const [state, dispatch] = React.useReducer(identityReducer, INITIAL_STATE)

  const setIsHost = (isHost) => dispatch({ type: 'SET_IS_HOST', payload: isHost })
  const setUsername = (username) => dispatch({ type: 'SET_USERNAME', payload: username })

  const value = {
    state,
    setIsHost,
    setUsername,
  }
  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>
}

function useIdentity() {
  const context = React.useContext(IdentityContext)
  if (context === undefined) {
    throw new Error('useIdentity must be used within a IdentityProvider')
  }
  return context
}

export { IdentityProvider, useIdentity }
