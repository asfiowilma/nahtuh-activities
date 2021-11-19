import React, { useEffect, useState } from 'react'
import { RiSwordLine } from 'react-icons/ri'
import { HiUserGroup, HiOutlineLogout } from 'react-icons/hi'
import { MdAirlineSeatReclineExtra } from 'react-icons/md'
import { useGame } from '../contexts/GameContext'
import { GroupAssignment } from './GroupAssignment'
import { LeaderboardModal } from './Lobby/Leaderboard'
import swal from 'sweetalert'
import { useSound } from '../contexts/SoundContext'
import { useScore } from '../contexts/ScoreContext'

export const SetupModal = ({ isOpen, setOpen, toFinalLeaderboard }) => {
  const [isEditing, setEditing] = useState(true)
  const [openLeaderboard, setOpenLeaderboard] = useState(false)
  const {
      state: { mode, timeLimit },
      setStarted,
      setMode,
      setTimeLimit,
      setTimer,
      resetGame,
    } = useGame(),
    {
      state: { btnClick },
    } = useSound(),
    {
      state: { standings },
    } = useScore()

  useEffect(() => {
    if (isOpen) {
      resetGame()
      setTimer(timeLimit)
    }
  }, [isOpen])

  useEffect(() => {
    if (mode !== 'GM') setEditing(false)
  }, [mode])

  const timeChangeHandler = (e) => {
    btnClick.play()
    setTimeLimit(e.target.value)
    setTimer(e.target.value)
  }

  const startGame = () => {
    if (isEditing) swal({ text: 'Assign groups first!', icon: 'warning' })
    else {
      setStarted(true)
      setOpen(false)
    }
  }

  const modeTip = () => {
    if (mode === 'AA') return 'Each player can guess all possible anagram from the word pool.'
    else if (mode === 'FFA') return 'Each unique word from the anagram word pool can only be guessed by one player.'
    else if (mode === 'GM') return 'Compete in a group and earn points together.'
  }

  return openLeaderboard ? (
    <LeaderboardModal isOpen={openLeaderboard} setOpen={setOpenLeaderboard} />
  ) : (
    <div className={`modal overflow-auto ${isOpen ? 'modal-open' : ''}`}>
      <div className={`modal-box rounded-box self-center ${mode === 'GM' && 'self-start'} m-4 sm:m-8`}>
        <div className="font-bold text-xl">Game Settings</div>
        <div className="flex flex-col">
          <input type="radio" name="mode" id="all-alone" className="hidden" />
          <input type="radio" name="mode" id="free-for-all" className="hidden" />
          <label className="ml-6 mt-4 text-sm mb-2">Mode</label>
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`btn p-4 items-center h-auto ${mode === 'AA' ? 'btn-primary' : ''}`}
              onClick={() => {
                setMode('AA')
                btnClick.play()
              }}
            >
              <MdAirlineSeatReclineExtra className="w-10 h-10" />
              <span className="w-full">All Alone</span>
            </div>
            <div
              className={`btn p-4 items-center h-auto ${mode === 'FFA' ? 'btn-primary' : ''}`}
              onClick={() => {
                setMode('FFA')
                btnClick.play()
              }}
            >
              <RiSwordLine className="w-10 h-10" />
              <span className="w-full">Free for All</span>
            </div>
            <div
              className={`btn p-4 items-center h-auto ${mode === 'GM' ? 'btn-primary' : ''}`}
              onClick={() => {
                setMode('GM')
                btnClick.play()
              }}
            >
              <HiUserGroup className="w-10 h-10" />
              <span className="w-full">Group Match</span>
            </div>
          </div>
          <div className="w-full px-6 bg-neutral bg-opacity-60 mt-2 rounded-box py-2">{modeTip()}</div>

          {mode === 'GM' && <GroupAssignment {...{ isEditing, setEditing }} />}

          <label htmlFor="time-limit" className="ml-6 mt-4 text-sm">
            Time Limit
          </label>
          <select
            id="time-limit"
            className="select select-bordered w-full rounded-full px-6"
            onChange={timeChangeHandler}
            value={timeLimit}
          >
            <option value={60}>1 minutes</option>
            <option value={120}>2 minutes</option>
            <option value={180}>3 minutes</option>
            <option value={300}>5 minutes</option>
          </select>
        </div>

        <div className="modal-action">
          {standings && standings.length > 0 && (
            <React.Fragment>
              <div className="flex-1">
                <div className="btn btn-outline rounded-full" onClick={() => toFinalLeaderboard()}>
                  <HiOutlineLogout className="w-5 h-5 mr-1" />
                  Finish Game
                </div>
              </div>
              <div
                onClick={() => {
                  setOpenLeaderboard(true)
                  btnClick.play()
                }}
                className="btn rounded-full"
              >
                Leaderboard
              </div>
            </React.Fragment>
          )}
          <div
            onClick={() => {
              startGame()
              btnClick.play()
            }}
            className="btn btn-primary rounded-full"
          >
            Start game
          </div>
        </div>
      </div>
    </div>
  )
}
