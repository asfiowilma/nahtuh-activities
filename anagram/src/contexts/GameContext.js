import React from 'react'
import { nahtuhClient as n } from 'nahtuh-client'

const INITIAL_STATE = {
  isStarted: false,
  mode: 'AA',
  timeLimit: 60,
  timer: 0,
  baseString: '---------',
  guessedWords: [],
  anagram: [],
  restartVotes: 0,
  requiredVotes: 0,
}
const GameContext = React.createContext(INITIAL_STATE)

function gameReducer(state, action) {
  const { restartVotes } = state
  switch (action.type) {
    case 'RESET_GAME':
      return { ...INITIAL_STATE, mode: state.mode }
    case 'SET_STARTED':
      return { ...state, isStarted: action.payload }
    case 'SET_TIME_LIMIT':
      return { ...state, timeLimit: action.payload }
    case 'SET_TIMER':
      return { ...state, timer: action.payload }
    case 'SET_BASE':
      return { ...state, baseString: action.payload }
    case 'SET_ANAGRAM':
      return { ...state, anagram: action.payload }
    case 'SET_MODE':
      n.eventVars.mode = action.payload
      return { ...state, mode: action.payload }
    case 'SET_GUESSED':
      return { ...state, guessedWords: action.payload }
    case 'SET_VOTES':
      return { ...state, restartVotes: action.payload }
    case 'ADD_VOTES':
      console.log('add votes', restartVotes + 1)
      n.broadcast({ payload: 'VOTES', votes: restartVotes + 1 })
      return { ...state, restartVotes: restartVotes + 1 }
    case 'DEC_VOTES':
      console.log('add votes', restartVotes + 1)
      n.broadcast({ payload: 'VOTES', votes: restartVotes + 1 })
      return { ...state, restartVotes: restartVotes + 1 }
    case 'SET_REQUIRED':
      return { ...state, requiredVotes: action.payload }
    default:
      throw new Error(`Unhandled action type: ${action.type}`)
  }
}

function GameProvider({ children }) {
  const [state, dispatch] = React.useReducer(gameReducer, INITIAL_STATE)

  const setTimeLimit = (timeLimit) => dispatch({ type: 'SET_TIME_LIMIT', payload: timeLimit })
  const setTimer = (timer) => dispatch({ type: 'SET_TIMER', payload: timer })
  const setMode = (mode) => dispatch({ type: 'SET_MODE', payload: mode })
  const setBase = (baseString) => dispatch({ type: 'SET_BASE', payload: baseString })
  const setAnagram = (anagram) => dispatch({ type: 'SET_ANAGRAM', payload: anagram })
  const setGuessedWords = (guessedWords) => dispatch({ type: 'SET_GUESSED', payload: guessedWords })
  const setStarted = (s) => dispatch({ type: 'SET_STARTED', payload: s })
  const setVotes = (v) => dispatch({ type: 'SET_REQUIRED', payload: v })
  const setRestartVotes = (v) => dispatch({ type: 'SET_VOTES', payload: v })
  const addVote = () => dispatch({ type: 'ADD_VOTES' })

  const decVote = () => dispatch({ type: 'DEC_VOTES' })

  const resetGame = () => {
    n.broadcast({ payload: 'RESET_GAME', ...INITIAL_STATE, mode: state.mode })
    dispatch({ type: 'RESET_GAME' })
  }

  const value = {
    state,
    resetGame,
    setStarted,
    setTimeLimit,
    setTimer,
    setMode,
    setBase,
    setAnagram,
    setGuessedWords,
    setVotes,
    setRestartVotes,
    addVote,
    decVote,
  }
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

function useGame() {
  const context = React.useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}

export { GameProvider, useGame }
