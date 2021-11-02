import React, { useEffect } from 'react'
import { RiSwordLine } from 'react-icons/ri'
import { MdAirlineSeatReclineExtra } from 'react-icons/md'
import { useGame } from '../contexts/GameContext'

export const SetupModal = ({ isOpen, setOpen }) => {
  const {
    state: { mode, timeLimit },
    setStarted,
    setMode,
    setTimeLimit,
    setTimer,
    resetGame,
  } = useGame()

  useEffect(() => {
    if (isOpen) {
      resetGame()
      setTimer(timeLimit)
    }
  }, [isOpen])

  const timeChangeHandler = (e) => {
    setTimeLimit(e.target.value)
    setTimer(e.target.value)
  }

  const startGame = () => {
    setStarted(true)
    setOpen(false)
  }

  return (
    <div className={`modal items-center ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box">
        <div className="font-bold text-xl">Game Settings</div>
        <div className="flex flex-col">
          <input type="radio" name="mode" id="all-alone" className="hidden" />
          <input type="radio" name="mode" id="free-for-all" className="hidden" />
          <label className="ml-6 mt-4 text-sm mb-2">Mode</label>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`btn p-4 items-center h-auto ${mode === 'AA' ? 'btn-primary' : ''}`}
              onClick={() => setMode('AA')}
            >
              <MdAirlineSeatReclineExtra className="w-10 h-10" />
              <span className="w-full">All Alone</span>
            </div>
            <div
              className={`btn p-4 items-center h-auto ${mode === 'FFA' ? 'btn-primary' : ''}`}
              onClick={() => setMode('FFA')}
            >
              <RiSwordLine className="w-10 h-10" />
              <span className="w-full">Free for All</span>
            </div>
          </div>
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
          <div onClick={() => startGame()} className="btn btn-primary">
            Start game
          </div>
        </div>
      </div>
    </div>
  )
}
