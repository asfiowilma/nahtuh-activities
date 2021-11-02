import React, { useEffect, useState } from 'react'
import { FaEllipsisH } from 'react-icons/fa'
import { useIdentity } from '../../contexts/IdentityContext'
import { useScore } from '../../contexts/ScoreContext'
import { nth } from '../../utils'

export default function Leaderboard({ className }) {
  const {
      state: { standings },
    } = useScore(),
    {
      state: { username },
    } = useIdentity()
  const [nearest, setNearest] = useState([])
  const [myStanding, setMyStanding] = useState(0)
  const [isOpen, setOpen] = useState(false)

  useEffect(() => {
    const mine = standings.findIndex((p) => p.username === username)
    setMyStanding(mine)
    setNearest(
      standings.map((pl, i) => {
        if (mine < 2) {
          return i < 3 ? pl : undefined
        } else {
          return i >= mine - 1 && i <= mine + 1 ? pl : undefined
        }
      }),
    )
  }, [standings])

  return (
    <div className={`bg-base-200 shadow-lg w-full p-4 rounded-box ${className}`}>
      <div className="flex justify-between">
        <div className="font-bold">Leaderboard</div>
        <div className="btn btn-xs btn-ghost lowercase" onClick={() => setOpen(true)}>
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
                  isMe={pl.username === username}
                  username={pl.username}
                  score={pl.score}
                  rank={parseInt(i + 1)}
                />
              ),
          )}
          {standings.length > 3 && myStanding < standings.length - 2 && (
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

export const LeaderboardModal = ({ setOpen, isOpen }) => {
  const {
    state: { standings, username },
  } = useScore()
  const [myStanding, setMyStanding] = useState(1)

  useEffect(() => {
    const mine = standings.findIndex((p) => p.username === username)
    setMyStanding(mine)
  }, [standings])

  return (
    <div className={`modal items-center ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box">
        <div className="font-bold text-2xl mb-2">Current Standings</div>
        <table className="table w-full table-compact text-center rounded-lg overflow-hidden">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((pl, i) => (
              <LeaderboardRow
                key={i}
                isMe={pl.username === username}
                username={pl.username}
                score={pl.score}
                rank={parseInt(i + 1)}
              />
            ))}
          </tbody>
        </table>
        <div className="modal-action">
          <div className="btn" onClick={() => setOpen(false)}>
            Close
          </div>
        </div>
      </div>
    </div>
  )
}
