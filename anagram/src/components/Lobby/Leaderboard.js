import { Howl } from 'howler'
import React, { useEffect, useRef, useState } from 'react'
import { FaEllipsisH } from 'react-icons/fa'
import { useGame } from '../../contexts/GameContext'
import { useIdentity } from '../../contexts/IdentityContext'
import { useScore } from '../../contexts/ScoreContext'
import { useSound } from '../../contexts/SoundContext'
import { nth } from '../../utils'

export default function Leaderboard({ className }) {
  const {
      state: { btnClick },
    } = useSound(),
    {
      state: { standings, groupStandings },
    } = useScore(),
    {
      state: { mode },
    } = useGame(),
    {
      state: { username, group },
    } = useIdentity()
  const [nearest, setNearest] = useState([])
  const [myStanding, setMyStanding] = useState(0)
  const [isOpen, setOpen] = useState(false)

  const leaderboard = useRef()
  leaderboard.current = mode === 'GM' ? groupStandings : standings

  useEffect(() => {
    if (leaderboard.current) {
      const mine = leaderboard.current.findIndex((p) =>
        mode === 'GM' ? p.groupName === group : p.username === username,
      )
      setMyStanding(mine)
      setNearest(
        leaderboard.current.map((pl, i) => {
          if (mine < 2) {
            return i < 3 ? pl : undefined
          } else {
            return i >= mine - 1 && i <= mine + 1 ? pl : undefined
          }
        }),
      )
    }
  }, [standings, groupStandings, mode])

  return (
    <div className={`bg-base-200 shadow-lg w-full p-4 rounded-box ${className}`}>
      <div className="flex justify-between">
        <div className="font-bold">Leaderboard</div>
        <div
          className="btn btn-xs btn-ghost lowercase"
          onClick={() => {
            setOpen(true)
            btnClick.play()
          }}
        >
          view all
        </div>
      </div>
      <table className="table w-full table-compact text-center rounded-lg overflow-hidden">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {myStanding > 1 && (
            <tr>
              <td colSpan={3}>
                <FaEllipsisH className="mx-auto" />
              </td>
            </tr>
          )}
          {nearest.map(
            (pl, i) =>
              pl && (
                <LeaderboardRow
                  key={i}
                  isMe={mode === 'GM' ? pl.groupName === group : pl.username === username}
                  username={mode === 'GM' ? pl.groupName : pl.username}
                  score={pl.score}
                  rank={parseInt(i + 1)}
                />
              ),
          )}
          {leaderboard.current && leaderboard.current.length > 3 && myStanding < leaderboard.current.length - 2 && (
            <tr>
              <td colSpan={3}>
                <FaEllipsisH className="mx-auto" />
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <LeaderboardModal {...{ setOpen, isOpen }} />
    </div>
  )
}

export const LeaderboardRow = ({ rank, username, score, isMe }) => {
  return (
    <tr className={isMe ? 'active' : ''}>
      <td>
        {rank}
        {nth(rank)}
      </td>
      <td className="text-left">{username}</td>
      <td>{score}</td>
    </tr>
  )
}

export const LeaderboardModal = ({ setOpen, isOpen, isFinal }) => {
  const {
      state: { btnClick },
    } = useSound(),
    {
      state: { group, username },
    } = useIdentity()
  const {
    state: { mode },
  } = useGame()
  const {
    state: { standings, groupStandings },
  } = useScore()
  const leaderboard = useRef()
  leaderboard.current = mode === 'GM' && !isFinal ? groupStandings : standings

  return (
    <div className={`modal items-center ${isOpen ? 'modal-open' : ''}`}>
      <div className={`modal-box  ${isFinal ? 'max-w-screen-sm' : ''}`}>
        <div className="font-bold text-2xl mb-2">{isFinal ? 'Final' : 'Current'} Standings</div>
        <div className="max-h-96 overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 scrollbar-track-radius-full pr-3">
          <table className="relative table w-full table-compact text-center">
            <thead className="sticky top-0">
              <tr className="absolute w-full bg-base-100 h-2"></tr>
              <tr className="relative z-10">
                <th>Rank</th>
                <th>Name</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody className=" rounded-lg">
              {leaderboard.current &&
                leaderboard.current.map((pl, i) => (
                  <LeaderboardRow
                    key={i}
                    isMe={mode === 'GM' ? pl.groupName === group : pl.username === username}
                    username={mode === 'GM' ? pl.groupName : pl.username}
                    score={pl.score}
                    rank={parseInt(i + 1)}
                  />
                ))}
            </tbody>
          </table>
        </div>
        {!isFinal && (
          <div className="modal-action">
            <div
              className="btn"
              onClick={() => {
                setOpen(false)
                btnClick.play()
              }}
            >
              Close
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
