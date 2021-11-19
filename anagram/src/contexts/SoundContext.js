import React from 'react'
import { Howl } from 'howler'

const INITIAL_STATE = {
  guessSuccess: new Howl({ src: ['guess-success.wav'] }),
  guessFailed: new Howl({ src: ['guess-failed.mp3'] }),
  alreadyFound: new Howl({ src: ['already-found.wav'] }),
  btnClick: new Howl({ src: ['btn-click.ogg'] }),
  music: new Howl({ src: ['music-loop.wav'], loop: true }),
}

const SoundContext = React.createContext(INITIAL_STATE)

function soundReducer(state, action) {
  return state
}

function SoundProvider({ children }) {
  const [state, dispatch] = React.useReducer(soundReducer, INITIAL_STATE)

  return <SoundContext.Provider value={{ state, dispatch }}>{children}</SoundContext.Provider>
}

function useSound() {
  const context = React.useContext(SoundContext)
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider')
  }
  return context
}

export { SoundProvider, useSound }
