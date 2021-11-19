import React from 'react'

const INITIAL_STATE = {
  isHost: false,
  hostId: '',
  username: '',
  group: '',
  myId: '',
}
const IdentityContext = React.createContext(INITIAL_STATE)

function identityReducer(state, action) {
  switch (action.type) {
    case 'SET_IS_HOST':
      return { ...state, isHost: action.payload }
    case 'SET_HOST_ID':
      return { ...state, hostId: action.payload }
    case 'SET_USERNAME':
      return { ...state, username: action.payload }
    case 'SET_ID':
      return { ...state, myId: action.payload }
    case 'SET_GROUP':
      return { ...state, group: action.payload }
    default:
      throw new Error(`Unhandled action type: ${action.type}`)
  }
}

function IdentityProvider({ children }) {
  const [state, dispatch] = React.useReducer(identityReducer, INITIAL_STATE)

  const setIsHost = (isHost) => dispatch({ type: 'SET_IS_HOST', payload: isHost })
  const setUsername = (username) => dispatch({ type: 'SET_USERNAME', payload: username })
  const setId = (id) => dispatch({ type: 'SET_ID', payload: id })
  const setHostId = (id) => dispatch({ type: 'SET_HOST_ID', payload: id })
  const setGroup = (groupName) => dispatch({ type: 'SET_GROUP', payload: groupName })

  const value = {
    state,
    setIsHost,
    setUsername,
    setId,
    setHostId,
    setGroup,
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
