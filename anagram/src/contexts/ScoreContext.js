import React from 'react'
import { nahtuhClient as n } from 'nahtuh-client'

const INITIAL_STATE = {
  playerList: [],
  leaderboard: {},
  standings: [],
  groupLeaderboard: {},
  groupStandings: [],
  groupData: [],
  score: 0,
}
const ScoreContext = React.createContext(INITIAL_STATE)

function scoreReducer(state, action) {
  const { leaderboard, groupLeaderboard, playerList } = state
  var lb

  switch (action.type) {
    case 'SET_SCORE':
      return { ...state, score: action.payload }
    case 'SET_PLAYERS':
      return { ...state, playerList: action.payload }
    case 'SET_LEADERBOARD':
      return { ...state, leaderboard: action.payload }
    case 'SET_STANDINGS':
      return { ...state, standings: action.payload }
    case 'UPDATE_STANDINGS':
      lb = Object.entries(leaderboard).map((e) => ({
        username: e[0],
        score: e[1],
      }))
      lb = lb.sort((a, b) => (a.score > b.score ? -1 : 1))
      n.broadcast({ payload: 'CURRENT_STANDINGS', standings: lb })
      return { ...state, standings: lb }
    case 'SET_GROUP_LEADERBOARD':
      return { ...state, groupLeaderboard: action.payload }
    case 'SET_GROUP_STANDINGS':
      return { ...state, groupStandings: action.payload }
    case 'ADD_PLAYER':
      console.log('playerlist', [...playerList, action.payload])
      return { ...state, playerList: [...playerList, action.payload] }
    case 'SET_GROUP_DATA':
      return { ...state, groupData: action.payload }
    case 'SUBMIT_GROUP_SCORE':
      let { groupName, scoreToAdd: score } = action.payload
      const newGrLeaderboard = {
        ...groupLeaderboard,
        [groupName]: (groupLeaderboard[groupName] || 0) + score,
      }
      lb = Object.entries(newGrLeaderboard).map((e) => ({
        groupName: e[0],
        score: e[1],
      }))
      lb = lb.sort((a, b) => (a.score > b.score ? -1 : 1))
      n.broadcast({ payload: 'CURRENT_GROUP_STANDINGS', groupStandings: lb })
      return { ...state, groupLeaderboard: newGrLeaderboard, groupStandings: lb }
    case 'SUBMIT_SCORE':
      const { username, scoreToAdd } = action.payload
      const newLeaderboard = {
        ...leaderboard,
        [username]: (leaderboard[username] || 0) + scoreToAdd,
      }
      lb = Object.entries(newLeaderboard).map((e) => ({
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
  const updateStandings = () => dispatch({ type: 'UPDATE_STANDINGS' })
  const setGroupLeaderboard = (leaderboard) => dispatch({ type: 'SET_GROUP_LEADERBOARD', payload: leaderboard })
  const setGroupStandings = (standings) => dispatch({ type: 'SET_GROUP_STANDINGS', payload: standings })
  const setPlayers = (p) => dispatch({ type: 'SET_PLAYERS', payload: p })
  const addPlayer = (p) => dispatch({ type: 'ADD_PLAYER', payload: p })
  const setGroupData = (data) => dispatch({ type: 'SET_GROUP_DATA', payload: data })
  const submitScore = (username, scoreToAdd) =>
    dispatch({ type: 'SUBMIT_SCORE', payload: { ...{ username, scoreToAdd } } })
  const submitGroupScore = (groupName, scoreToAdd) => {
    dispatch({ type: 'SUBMIT_GROUP_SCORE', payload: { ...{ groupName, scoreToAdd } } })
  }

  const value = {
    state,
    addPlayer,
    setPlayers,
    setScore,
    setLeaderboard,
    setStandings,
    setGroupLeaderboard,
    setGroupStandings,
    setGroupData,
    submitGroupScore,
    submitScore,
    updateStandings,
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
