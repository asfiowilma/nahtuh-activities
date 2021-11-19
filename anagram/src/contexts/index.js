import React from 'react'
import { GameProvider } from './GameContext'
import { IdentityProvider } from './IdentityContext'
import { ScoreProvider } from './ScoreContext'
import { SoundProvider } from './SoundContext'

export const index = ({ children }) => {
  return (
    <IdentityProvider>
      <ScoreProvider>
        <SoundProvider>
          <GameProvider>{children}</GameProvider>
        </SoundProvider>
      </ScoreProvider>
    </IdentityProvider>
  )
}

export default index
