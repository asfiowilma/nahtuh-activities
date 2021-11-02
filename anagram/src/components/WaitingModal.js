import React, { useState } from 'react'
import { RiLoader5Fill } from 'react-icons/ri'
import { MdAirlineSeatReclineExtra } from 'react-icons/md'
import { LeaderboardModal } from './Lobby/Leaderboard'
import { useScore } from '../contexts/ScoreContext'

export const WaitingModal = () => {
  const [openLeaderboard, setOpenLeaderboard] = useState(false)
  const {
    state: { score },
  } = useScore()

  return openLeaderboard ? (
    <LeaderboardModal isOpen={openLeaderboard} setOpen={setOpenLeaderboard} />
  ) : (
    <div className={`modal items-center modal-open`}>
      <div className="modal-box">
        <div className="flex flex-col items-center gap-2">
          <RiLoader5Fill className="w-24 h-24 animate-spin" />
          {score > 0 && <div className="font-bold text-2xl text-secondary">Well Played!</div>}
          <div className="font-bold">Waiting for host to start the {score > 0 && 'next'} round..</div>
          {score > 0 && (
            <div className="btn mt-4" onClick={() => setOpenLeaderboard(true)}>
              View Leaderboard
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
