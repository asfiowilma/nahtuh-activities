import React, { useEffect, useState } from 'react'
import { nahtuhClient as n } from 'nahtuh-client'
import { useGame } from '../../contexts/GameContext'
import { useIdentity } from '../../contexts/IdentityContext'
import { useScore } from '../../contexts/ScoreContext'
import { nth, regenerateKeypad, shuffle } from '../../utils'
import { WordInput } from './WordInput'
import { useSound } from '../../contexts/SoundContext'

export default function Board({ guessHandler, setOpen, hostId }) {
  const [myStanding, setMyStanding] = useState(1)
  const [word, setword] = useState('')
  const [iVoted, setVoted] = useState(false)
  const [keypad, setKeypad] = useState([])
  const {
    state: { btnClick },
  } = useSound()
  const {
    state: { isHost, username, group },
  } = useIdentity()

  const {
    state: { isStarted, baseString, restartVotes, requiredVotes, mode },
    setBase,
    addVote,
    decVote,
    resetGame,
  } = useGame()
  const {
    state: { score, standings },
    setScore,
  } = useScore()

  useEffect(() => {
    const mine = standings.findIndex((p) => p.username === username)
    if (standings[mine]) setScore(standings[mine].score)
    setMyStanding(mine)
  }, [standings])

  useEffect(() => {
    const keys = baseString.split('').map((letter) => ({ letter: letter, lit: false }))
    setKeypad(keys)
  }, [baseString])

  useEffect(() => {
    setVoted(false)
  }, [isStarted])

  const restartHandler = () => {
    btnClick.play()
    if (isHost) {
      if (iVoted) decVote()
      else addVote()
    } else {
      if (iVoted) n.sendToUser(hostId, { payload: 'DEC_VOTE' })
      else n.sendToUser(hostId, { payload: 'ADD_VOTE' })
    }
    setVoted(!iVoted)
    console.log(restartVotes, requiredVotes)
  }

  const restartGame = () => {
    btnClick.play()
    resetGame()
    setOpen(true)
  }

  const wordInputHandler = (newWord) => {
    setword(newWord)
    setKeypad(regenerateKeypad(newWord, baseString))
  }

  const keypadColor = (key) => (key.lit ? 'bg-base-content text-base-100' : 'bg-base-300')

  const keypadClickHandler = (letter, i) => {
    btnClick.play()
    setword(word + letter)
    const keys = keypad.map((key, idx) => {
      if (key.letter === letter && idx === i) return { ...key, lit: true }
      return key
    })
    setKeypad(keys)
  }

  return (
    <div className="w-full">
      <WordInput setword={wordInputHandler} {...{ guessHandler, word }} />
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 p-4">
        <div className="flex order-last md:order-none flex-row-reverse md:flex-col gap-2 w-auto xl:w-40">
          <div
            className="flex-1 md:flex-none btn btn-primary rounded-full px-6"
            onClick={() => setBase(shuffle(baseString))}
          >
            Shuffle
          </div>

          <div className="flex-none flex flex-col items-stretch gap-2">
            {isHost && restartVotes >= requiredVotes ? (
              <div className="btn rounded-full btn-secondary" onClick={() => restartGame()}>
                Restart
              </div>
            ) : (
              <div className="btn rounded-full whitespace-nowrap" onClick={restartHandler}>
                Vote{iVoted && 'd'} Restart
              </div>
            )}
            {restartVotes > 0 && (
              <div className="text-center">
                {restartVotes}/{requiredVotes}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-center flex-1">
          <div className="self-center md:self-auto grid grid-cols-3 grid-rows-3 gap-2 place-items-center">
            {keypad.map((key, i) => (
              <div
                key={key.letter + i}
                onClick={() => keypadClickHandler(key.letter, i)}
                className={`btn ${keypadColor(
                  key,
                )} shadow-lg w-20 h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 text-2xl font-bold uppercase`}
              >
                {isStarted ? key.letter : '--'}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-row flex-wrap md:flex-col order-first md:order-none gap-2 sm:gap-4">
          <div className="w-full md:w-auto bg-base-200 shadow-lg text-center p-4 rounded-xl flex sm:flex-col items-center justify-between">
            <div className="text-xs sm:text-base">My Nickname</div>
            <div className="flex gap-2 sm:flex-col">
              <div className="font-bold text-sm sm:text-base">{username}</div>
              {mode === 'GM' && group && (
                <div className="badge badge-primary text-xs sm:text-sm">
                  {group.length > 9 ? group.slice(0, 10) + '...' : group}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 md:flex-none bg-base-200 shadow-lg text-center p-4 rounded-xl">
            <div className="text-xs sm:text-base">My Position</div>
            <div className="font-bold text-sm sm:text-base">
              {myStanding + 1}
              {nth(myStanding + 1)}
            </div>
          </div>
          <div className="flex-1 md:flex-none bg-base-200 shadow-lg text-center p-4 rounded-xl">
            <div className="text-xs sm:text-base">My Score</div>
            <div className="font-bold text-sm sm:text-base">{score}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
