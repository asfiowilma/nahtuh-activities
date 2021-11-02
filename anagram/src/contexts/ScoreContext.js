import React from 'react'
import { nahtuhClient as n } from 'nahtuh-client'

const INITIAL_STATE = {
  playerList: [],
  leaderboard: {},
  standings: [],
  score: 0,
}
const ScoreContext = React.createContext(INITIAL_STATE)

function scoreReducer(state, action) {
  const { leaderboard, playerList } = state

  switch (action.type) {
    case 'SET_SCORE':
      return { ...state, score: action.payload }
    case 'SET_LEADERBOARD':
      return { ...state, leaderboard: action.payload }
    case 'SET_STANDINGS':
      return { ...state, standings: action.payload }
    case 'ADD_PLAYER':
      return { ...state, playerList: [...playerList, action.payload] }
    case 'SUBMIT_SCORE':
      const { username, scoreToAdd } = action.payload
      const newLeaderboard = {
        ...leaderboard,
        [username]: (leaderboard[username] || 0) + scoreToAdd,
      }
      var lb = Object.entries(newLeaderboard).map((e) => ({
        username: e[0],
        score: e[1],
      }))
      lb = lb.sort((a, b) => (a.score > b.score ? -1 : 1))
      n.broadcast({ payload: 'CURRENT_STANDINGS', standings: lb })
      return { ...state, leaderboard: newLeaderboard, standings: lb }
    default:
      throw new Error(`Unhandled action type: ${action.type}`)
  }
}

function ScoreProvider({ children }) {
  const [state, dispatch] = React.useReducer(scoreReducer, INITIAL_STATE)

  const setScore = (score) => dispatch({ type: 'SET_SCORE', payload: score })
  const setLeaderboard = (leaderboard) => dispatch({ type: 'SET_LEADERBOARD', payload: leaderboard })
  const setStandings = (standings) => dispatch({ type: 'SET_STANDINGS', payload: standings })
  const addPlayer = (p) => dispatch({ type: 'ADD_PLAYER', payload: p })
  const submitScore = (username, scoreToAdd) =>
    dispatch({ type: 'SUBMIT_SCORE', payload: { ...{ username, scoreToAdd } } })

  const value = {
    state,
    addPlayer,
    setScore,
    setLeaderboard,
    setStandings,
    submitScore,
  }
  return <ScoreContext.Provider value={value}>{children}</ScoreContext.Provider>
}

function useScore() {
  const context = React.useContext(ScoreContext)
  if (context === undefined) {
    throw new Error('useScore must be used within a ScoreProvider')
  }
  return context
}

export { ScoreProvider, useScore }
