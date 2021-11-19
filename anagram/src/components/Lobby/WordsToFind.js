import React, { useEffect, useRef, useState } from 'react'
import { MdAlarm } from 'react-icons/md'
import { useGame } from '../../contexts/GameContext'
import { mod } from '../../utils'

const secondsToTime = (secs) => {
  let divisor_for_minutes = mod(secs, 60 * 60)
  let minutes = Math.floor(divisor_for_minutes / 60)

  let divisor_for_seconds = mod(divisor_for_minutes, 60)
  let seconds = Math.ceil(divisor_for_seconds)

  let obj = {
    m: minutes,
    s: seconds,
  }
  return obj
}

export const WordsToFind = ({ setOpen, className }) => {
  const {
    state: { anagram, guessedWords, timer, timeLimit, isStarted },
    setTimer,
    setStarted,
  } = useGame()
  const [timeLeft, setTimeLeft] = useState(secondsToTime(timeLimit))

  let intervalRef = useRef()

  const [words, setWords] = useState({
    four: 0,
    five: 0,
    six: 0,
    seven: 0,
    eight: 0,
    nine: 0,
  })

  // starts timer if game is started
  useEffect(() => {
    if (isStarted) {
      setOpen(false)
      setTimer(timeLimit)
      setTimeLeft(secondsToTime(timeLimit))
    }
    console.log(isStarted)
  }, [isStarted, timeLimit])

  useEffect(() => {
    if (isStarted) {
      // exit early when we reach 0
      if (!timer) {
        setOpen(true)
        setStarted(false)
        setTimeLeft(secondsToTime(0))
        return
      }

      // save intervalId to clear the interval when the
      // component re-renders
      intervalRef.current = setInterval(() => {
        setTimer(timer - 1)
      }, 1000)

      // clear interval on re-render to avoid memory leaks
      return () => clearInterval(intervalRef.current)
      // add timeLeft as a dependency to re-rerun the effect
      // when we update it
    } else {
      setOpen(true)
      setTimeLeft(secondsToTime(0))
      return
    }
  }, [isStarted, timer])

  useEffect(() => {
    setTimeLeft(secondsToTime(timer))
  }, [timer])

  useEffect(() => {
    setWords({
      four: anagram.filter((w) => !guessedWords.includes(w) && w.length === 4).length,
      five: anagram.filter((w) => !guessedWords.includes(w) && w.length === 5).length,
      six: anagram.filter((w) => !guessedWords.includes(w) && w.length === 6).length,
      seven: anagram.filter((w) => !guessedWords.includes(w) && w.length === 7).length,
      eight: anagram.filter((w) => !guessedWords.includes(w) && w.length === 8).length,
      nine: anagram.filter((w) => !guessedWords.includes(w) && w.length === 9).length,
    })
  }, [anagram, guessedWords])

  useEffect(() => {
    setTimeLeft(secondsToTime(timeLimit))
  }, [timeLimit])

  return (
    <div className={`bg-base-200 shadow-lg w-full p-4 rounded-box ${className}`}>
      <div>
        <div className="flex gap-2 items-center">
          <MdAlarm className="w-6 h-6" />
          <progress
            className="progress progress-accent h-4 bg-base-100 transition ease-in-out"
            value={timer}
            max={timeLimit}
          ></progress>
        </div>
        <div className="text-center ml-8 flex justify-center">
          {!isStarted || timer > 0 ? (
            <div className="countdown">
              <span key="timerminute" style={{ '--value': timeLeft.m }}></span>m
              <span key="timersecond" className="ml-1" style={{ '--value': timeLeft.s }}></span>s
            </div>
          ) : (
            "Time's Up!"
          )}
        </div>
      </div>
      <div className="font-bold mb-2">Words to Find</div>
      <div className="w-full grid grid-cols-2 grid-rows-3 gap-2">
        <div
          className={`w-full text-sm lg:text-base badge badge-lg badge-primary flex justify-between ${
            words.four < 1 ? 'opacity-20' : ''
          }`}
        >
          <span>four letter:</span> <span className="font-bold">{words.four}</span>
        </div>
        <div
          className={`w-full text-sm lg:text-base badge badge-lg badge-secondary flex justify-between ${
            words.five < 1 ? 'opacity-20' : ''
          }`}
        >
          <span>five letter:</span> <span className="font-bold">{words.five}</span>
        </div>
        <div
          className={`w-full text-sm lg:text-base badge badge-lg badge-accent flex justify-between ${
            words.six < 1 ? 'opacity-20' : ''
          }`}
        >
          <span>six letter:</span> <span className="font-bold">{words.six}</span>
        </div>
        <div
          className={`w-full text-sm lg:text-base badge badge-lg badge-primary border-none bg-primary-focus flex justify-between ${
            words.seven < 1 ? 'opacity-20' : ''
          }`}
        >
          <span>seven letter:</span> <span className="font-bold">{words.seven}</span>
        </div>
        <div
          className={`w-full text-sm lg:text-base badge badge-lg badge-primary border-none bg-secondary-focus flex justify-between ${
            words.eight < 1 ? 'opacity-20' : ''
          }`}
        >
          <span>eight letter:</span> <span className="font-bold">{words.eight}</span>
        </div>
        <div
          className={`w-full text-sm lg:text-base badge badge-lg badge-primary border-none bg-accent-focus flex justify-between ${
            words.nine < 1 ? 'opacity-20' : ''
          }`}
        >
          <span>nine letter:</span> <span className="font-bold">{words.nine}</span>
        </div>
      </div>
    </div>
  )
}
