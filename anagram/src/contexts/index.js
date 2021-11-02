import React from 'react'
import { GameProvider } from './GameContext'
import { IdentityProvider } from './IdentityContext'
import { ScoreProvider } from './ScoreContext'

export const index = ({ children }) => {
  return (
    <IdentityProvider>
      <ScoreProvider>
        <GameProvider>{children}</GameProvider>
      </ScoreProvider>
    </IdentityProvider>
  )
}

export default index
