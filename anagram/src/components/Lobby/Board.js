import React, { useEffect, useState } from 'react'
import { BiBusSchool } from 'react-icons/bi'
import { RiStethoscopeLine } from 'react-icons/ri'
import { useGame } from '../../contexts/GameContext'
import { useIdentity } from '../../contexts/IdentityContext'
import { useScore } from '../../contexts/ScoreContext'
import { nth, regenerateKeypad, shuffle } from '../../utils'
import { WordInput } from './WordInput'

export default function Board({ guessHandler, setOpen }) {
  const [myStanding, setMyStanding] = useState(1)
  const [word, setword] = useState('')
  const [keypad, setKeypad] = useState([])
  const {
    state: { isHost, username },
  } = useIdentity()
  const {
    state: { isStarted, baseString },
    setBase,
    resetGame,
  } = useGame()
  const {
    state: { score, standings },
  } = useScore()

  useEffect(() => {
    const mine = standings.findIndex((p) => p.username === username)
    setMyStanding(mine)
  }, [standings])

  useEffect(() => {
    const keys = baseString.split('').map((letter) => ({ letter: letter, lit: false }))
    setKeypad(keys)
  }, [baseString])

  const resetHandler = () => {
    resetGame()
    setOpen(true)
  }

  const wordInputHandler = (newWord) => {
    setword(newWord)
    setKeypad(regenerateKeypad(newWord, baseString))
  }

  const keypadColor = (key) => (key.lit ? 'bg-base-content text-base-100' : 'bg-base-300')

  const keypadClickHandler = (letter, i) => {
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
      <div className="flex flex-col md:flex-row gap-3 md:gap-6 p-4">
        <div className="flex order-last md:order-none flex-row-reverse md:flex-col gap-2">
          <div
            className="flex-1 md:flex-none btn btn-primary rounded-full px-6"
            onClick={() => setBase(shuffle(baseString))}
          >
            Shuffle
          </div>
          {isHost && (
            <div className="flex-none flex flex-col gap-2">
              <div className="btn rounded-full" onClick={resetHandler}>
                Vote Restart
              </div>
              <div className="text-center">1/4</div>
            </div>
          )}
        </div>
        <div className="self-center md:self-auto md:flex-1 grid grid-cols-3 grid-rows-3 gap-2 place-items-center">
          {keypad.map((key, i) => (
            <div
              key={key.letter + i}
              onClick={() => keypadClickHandler(key.letter, i)}
              className={`btn ${keypadColor(key)} shadow-lg w-24 h-24 text-2xl font-bold uppercase`}
            >
              {isStarted ? key.letter : '--'}
            </div>
          ))}
        </div>
        <div className="flex flex-row md:flex-col order-first md:order-none gap-4">
          <div className="flex-1 md:flex-none bg-base-200 shadow-lg text-center p-4 rounded-xl">
            <div>My Position</div>
            <div className="font-bold">
              {myStanding + 1}
              {nth(myStanding + 1)}
            </div>
          </div>
          <div className="flex-1 md:flex-none bg-base-200 shadow-lg text-center p-4 rounded-xl">
            <div>My Score</div>
            <div className="font-bold">{score}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
