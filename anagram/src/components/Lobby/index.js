import React, { useEffect, useRef, useState } from 'react'
import Board from './Board'
import Sidebar from './Sidebar'
import axios from 'axios'
import { HiMenu } from 'react-icons/hi'
import { generateAnagramString } from '../../utils'
import toast from 'react-hot-toast'
import { WordsFound } from './WordsFound'
import { useActivity } from '../../contexts'
import { SetupModal } from '../SetupModal'
import { WaitingModal } from '../WaitingModal'
import { nahtuhClient as n } from 'nahtuh-client'
import { useIdentity } from '../../contexts/IdentityContext'
import { useGame } from '../../contexts/GameContext'
import { useScore } from '../../contexts/ScoreContext'
import { WordsToFind } from './WordsToFind'

export default function Index() {
  const [isOpen, setOpen] = useState(true)
  const [hostId, setHostId] = useState('')
  const {
    state: { isHost, username },
  } = useIdentity()
  const {
    state: { isStarted, mode, anagram: ag, guessedWords: gw, timeLimit },
    setAnagram,
    setBase,
    setGuessedWords,
    setStarted,
    setTimeLimit,
    setTimer,
    setMode,
  } = useGame()
  const {
    state: { score },
    setScore,
    setStandings,
    submitScore,
  } = useScore()
  const anagram = useRef()
  const guessedWords = useRef()
  anagram.current = ag
  guessedWords.current = gw

  const getAnagram = async () => {
    const generated = generateAnagramString(9)
    setBase(generated)
    axios.get(`https://yaidevfunc-hub.azurewebsites.net/api/anagram?scope=all&word=${generated}`).then((res) => {
      const newAnagram = res.data.all.filter((word) => word.length >= 4)
      setAnagram(newAnagram)
      n.broadcast({
        payload: 'START_GAME',
        isStarted: true,
        baseString: generated,
        anagram: newAnagram,
        timeLimit: timeLimit,
        mode: mode,
      })
    })
  }

  const getHost = async () => {
    var participants = await n.getParticipantList()
    var host = participants.find((player) => player.isHost)
    return host
  }

  const getSender = async (senderId) => {
    var participants = await n.getParticipantList()
    var sender = participants.find((p) => p.participantId === senderId).participantName
    return sender
  }

  useEffect(() => {
    n.onIncomingMessage = onIncomingMessage
    if (!isHost) getHost().then((host) => setHostId(host.participantId))
  }, [])

  // broadcast start game from host
  useEffect(() => {
    if (isHost && isStarted) getAnagram()
  }, [isStarted, isHost])

  const onIncomingMessage = (message) => {
    if (isHost) onHostReceiveMessage(message)
    else onPlayerReceiveMessage(message.content)
  }

  const onPlayerReceiveMessage = (content) => {
    switch (content.payload) {
      case 'START_GAME':
        setTimeLimit(content.timeLimit)
        setTimer(content.timeLimit)
        setBase(content.baseString)
        setGuessedWords([])
        setAnagram(content.anagram)
        setMode(content.mode || mode)
        setStarted(content?.isStarted)
        setOpen(content?.isStarted)
        break
      case 'CURRENT_STANDINGS':
        setStandings(content.standings)
        break
      case 'FFA_SUCCESS':
        setScore(score + content.word.length)
        toast.success(`Word found: ${content.word}. Yay!`)
        break
      case 'FFA_FAILED':
        toast.error(`Invalid word: ${content.word}`)
        break
      case 'FFA_WORDS':
        setGuessedWords(content.guessedWords)
        setAnagram(anagram.current.filter((w) => !content.guessedWords.current.includes(w)))
        break
      default:
        break
    }
  }

  const onHostReceiveMessage = (message) => {
    const { content, senderId } = message
    switch (content.payload) {
      case 'START_GAME':
        setAnagram(content.anagram)
        break
      case 'FFA_GUESS':
        ffaJudgeHandler(content.word.toLowerCase(), senderId)
        break
      case 'FFA_WORDS':
        setGuessedWords(content.guessedWords)
        setAnagram(anagram.current.filter((w) => !content.guessedWords.current.includes(w)))
        break
      case 'AA_GUESS':
        getSender(senderId).then((sender) => {
          if (content.iGuessed <= 9) submitScore(sender, content.iGuessed)
        })
        break
      default:
        break
    }
  }

  const guessHandler = (word) => {
    if (mode === 'FFA') {
      if (!isHost) n.sendToUser(hostId, { payload: 'FFA_GUESS', iGuessed: word.length, word: word })
      else {
        n.broadcast({ payload: 'FFA_WORDS', guessedWords: [...guessedWords.current, word] })
        submitScore(username, word.length)
      }
    } else {
      if (!/\S/.test(word)) {
        // input is empty
        toast.error(`Invalid input.`)
      } else if (guessedWords.current.includes(word)) {
        // word has been guessed
        toast(`${word} already found`, { icon: '🙏' })
      } else if (anagram.current.includes(word)) {
        // correct guess
        setAnagram(anagram.current.filter((w) => w !== word))
        setGuessedWords([...guessedWords.current, word])
        setScore(score + word.length)
        toast.success(`Word found: ${word}. Yay!`)
        // add score to leaderboard and broadcast
        if (isHost) submitScore(username, word.length)
        // send new score to central leaderboard
        else n.sendToUser(hostId, { payload: 'AA_GUESS', iGuessed: word.length })
      } else {
        // incorrect guess
        toast.error(`Invalid word: ${word}`)
      }
    }
  }

  const ffaJudgeHandler = (word, senderId) => {
    console.log('anagram', anagram.current)
    getSender(senderId).then((sender) => {
      if (guessedWords.current.includes(word) || !anagram.current.includes(word)) {
        n.sendToUser(senderId, { payload: 'FFA_FAILED', success: false, word: word })
      } else {
        n.sendToUser(senderId, { payload: 'FFA_SUCCESS', success: true, word: word })
        n.broadcast({ payload: 'FFA_WORDS', guessedWords: [...guessedWords.current, word] })
        setAnagram(anagram.current.filter((w) => w !== word))
        setGuessedWords([...guessedWords.current, word])
        submitScore(sender, word.length)
      }
    })
  }

  return (
    <div className="w-full min-h-screen">
      <div className="flex flex-col-reverse lg:flex-row">
        <div className="flex-1 flex flex-col items-center justify-center max-w-screen-sm md:mx-auto px-4 md:px-0 lg:pl-4 xl:px-4 pb-8 lg:py-8">
          <Board {...{ guessHandler, setOpen }} />
          <WordsToFind setOpen={setOpen} className="block mb-4 md:hidden" />
          <WordsFound />
        </div>
        <Sidebar setOpen={setOpen} />
      </div>
      {isHost && <SetupModal {...{ isOpen, setOpen }} />}
      {!isHost && !isStarted && <WaitingModal />}
    </div>
  )
}
