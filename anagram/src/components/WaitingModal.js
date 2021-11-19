import React, { useState } from 'react'
import { RiLoader5Fill } from 'react-icons/ri'
import { LeaderboardModal } from './Lobby/Leaderboard'
import { useScore } from '../contexts/ScoreContext'
import { useIdentity } from '../contexts/IdentityContext'
import { useGame } from '../contexts/GameContext'
import { Howl } from 'howler'
import { useSound } from '../contexts/SoundContext'

export const WaitingModal = () => {
  const [openLeaderboard, setOpenLeaderboard] = useState(false)
  const {
      state: { btnClick },
    } = useSound(),
    {
      state: { score },
    } = useScore(),
    {
      state: { mode },
    } = useGame(),
    {
      state: { group },
    } = useIdentity()

  return openLeaderboard ? (
    <LeaderboardModal isOpen={openLeaderboard} setOpen={setOpenLeaderboard} />
  ) : (
    <div className={`modal items-center modal-open`}>
      <div className="modal-box">
        <div className="flex flex-col items-center gap-2">
          <RiLoader5Fill className="w-24 h-24 animate-spin" />
          {score > 0 && <div className="font-bold text-2xl text-secondary">Well Played!</div>}
          <div className="font-bold">Waiting for host to start the {score > 0 && 'next'} round..</div>
          {mode === 'GM' && group && (
            <div>
              You've been assigned to group <span className="font-bold text-primary">{group}</span>
            </div>
          )}
          {score > 0 && (
            <div
              className="btn mt-4"
              onClick={() => {
                setOpenLeaderboard(true)
                btnClick.play()
              }}
            >
              View Leaderboard
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
