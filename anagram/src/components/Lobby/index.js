/* eslint-disable eqeqeq */
import React, { useEffect, useRef, useState } from 'react'
import Board from './Board'
import Sidebar from './Sidebar'
import axios from 'axios'
import { generateAnagramString } from '../../utils'
import toast from 'react-hot-toast'
import { WordsFound } from './WordsFound'
import { SetupModal } from '../SetupModal'
import { WaitingModal } from '../WaitingModal'
import { nahtuhClient as n } from 'nahtuh-client'
import { useIdentity } from '../../contexts/IdentityContext'
import { useGame } from '../../contexts/GameContext'
import { useScore } from '../../contexts/ScoreContext'
import { WordsToFind } from './WordsToFind'
import swal from 'sweetalert'
import { useSound } from '../../contexts/SoundContext'
import { SoundControls } from '../SoundControls'

export default function Index({ toFinalLeaderboard }) {
  const [isOpen, setOpen] = useState(false)
  const {
    state: { isHost, username, group, myId, hostId },
    setHostId,
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
    setVotes,
    setRestartVotes,
    addVote,
    decVote,
  } = useGame()
  const {
    state: { score, playerList, leaderboard, groupData },
    setScore,
    setStandings,
    setGroupStandings,
    submitGroupScore,
    submitScore,
    setLeaderboard,
  } = useScore()
  const {
    state: { guessFailed, guessSuccess, alreadyFound, music },
  } = useSound()

  // refs
  const anagram = useRef()
  const guessedWords = useRef()
  const groupDataRef = useRef()
  const leaderboardRef = useRef()
  anagram.current = ag
  guessedWords.current = gw
  groupDataRef.current = groupData
  leaderboardRef.current = leaderboard

  const getAnagram = async () => {
    const generated = generateAnagramString(9)
    setBase(generated)
    axios.get(`https://yaidevfunc-hub.azurewebsites.net/api/anagram?scope=all&word=${generated}`).then((res) => {
      const newAnagram = res.data.all.filter((word) => word.length >= 4)
      const gameData = {
        payload: 'START_GAME',
        isStarted: true,
        baseString: generated,
        anagram: newAnagram,
        timeLimit: timeLimit,
        mode: mode,
        requiredVotes: Math.ceil(playerList.length / 2),
      }
      setAnagram(newAnagram)
      n.broadcast(gameData)
      console.log(gameData)
      console.log(playerList)
    })
  }

  const getHost = async () => {
    var participants = await n.getParticipantList()
    var host = participants.find((player) => player.isHost)
    return host
  }

  const getSender = (senderId) => {
    var sender = playerList.find((p) => p.participantId === senderId).participantName
    return sender
  }

  useEffect(() => {
    music.play()
    n.onIncomingMessage = onIncomingMessage
    if (!isHost) getHost().then((host) => setHostId(host.participantId))
  }, [])

  // broadcast start game from host
  useEffect(() => {
    if (isHost && isStarted) getAnagram()
  }, [isStarted, isHost])

  useEffect(() => {
    if (!isHost && isStarted && guessedWords.current.length === anagram.current.length)
      swal({ text: "You've found everything!", icon: 'success', buttons: false })
  }, [isStarted, guessedWords])

  useEffect(() => {
    if (guessedWords.current.length === 0) return
    console.log(`anagram length = ${anagram.current.length}, guessedWords length = ${guessedWords.current.length}`)
    if (anagram.current.length === 0 && guessedWords.current.length > 0) {
      swal({
        icon: 'success',
        title: 'Congratulations!',
        text: "You've guessed every possible anagram",
        buttons: false,
      })
    }
  }, [ag, gw])

  const onIncomingMessage = (message) => {
    if (isHost) onHostReceiveMessage(message)
    else onPlayerReceiveMessage(message.content)
  }

  const onPlayerReceiveMessage = (content) => {
    switch (content.payload) {
      case 'RESET_GAME':
      case 'START_GAME':
        setTimeLimit(content.timeLimit)
        setTimer(content.timeLimit)
        setBase(content.baseString)
        setGuessedWords([])
        setAnagram(content.anagram)
        setMode(content.mode || mode)
        setStarted(content?.isStarted)
        setOpen(content?.isStarted)
        setVotes(content.requiredVotes)
        setRestartVotes(0)
        break
      case 'FINISH_GAME':
        toFinalLeaderboard()
        break
      case 'CURRENT_STANDINGS':
        setStandings(content.standings)
        break
      case 'CURRENT_GROUP_STANDINGS':
        setGroupStandings(content.groupStandings)
        break
      case 'FFA_SUCCESS':
        guessSuccess.play()
        setScore(score + content.word.length)
        toast.success(`Word found: ${content.word}. Yay!`)
        break
      case 'FFA_FAILED':
        guessFailed.play()
        toast.error(`Invalid word: ${content.word}`)
        break
      case 'FFA_WORDS':
        setGuessedWords(content.guessedWords)
        setAnagram(anagram.current.filter((w) => !content.guessedWords.includes(w)))
        break
      case 'VOTES':
        setRestartVotes(content.votes)
        break
      case 'JOIN_GROUP':
        if (group === content.groupName) return
        else if (group !== '') n.leaveGroup(myId, group)
        n.joinGroup(myId, content.groupName)
        break
      default:
        break
    }
  }

  const onHostReceiveMessage = (message) => {
    console.log(message)
    const { content, senderId } = message
    switch (content.payload) {
      case 'START_GAME':
        setAnagram(content.anagram)
        setVotes(content.requiredVotes)
        setRestartVotes(0)
        break
      case 'FFA_GUESS':
        ffaJudgeHandler(content.word.toLowerCase(), senderId)
        break
      case 'FFA_WORDS':
        setGuessedWords(content.guessedWords)
        setAnagram(anagram.current.filter((w) => !content.guessedWords.includes(w)))
        break
      case 'AA_GUESS':
        if (content.iGuessed <= 9) submitScore(getSender(senderId), content.iGuessed)
        break
      case 'ADD_VOTE':
        addVote()
        break
      case 'DEC_VOTE':
        decVote()
        break
      case 'GROUP_GUESS':
        const groupData = groupDataRef.current,
          leaderboard = leaderboardRef.current
        console.log('group data from submit group score:', groupData)
        const groupGuessed = groupData.find((g) => g.name == content.groupName)
        console.log('group  guessed:', groupGuessed)
        var tempLeaderboard = { ...leaderboard }
        for (let member of groupGuessed.members) {
          tempLeaderboard = {
            ...tempLeaderboard,
            [member.name]: (tempLeaderboard[member.name] || 0) + content.weGuessed,
          }
        }
        console.log('updated individual leaderboard from group guess', tempLeaderboard)
        setLeaderboard(tempLeaderboard)
        submitGroupScore(content.groupName, content.weGuessed)
        break
      default:
        break
    }
  }

  const guessHandler = (word) => {
    if (mode === 'FFA') {
      if (!/\S/.test(word)) {
        // empty word
        guessFailed.play()
        toast.error(`Invalid input.`)
      } else if (guessedWords.current.includes(word)) {
        // word already found
        alreadyFound.play()
        toast(`${word} already found`, { icon: '🙏' })
      } else if (anagram.current.includes(word)) {
        // correct guess
        if (!isHost) n.sendToUser(hostId, { payload: 'FFA_GUESS', iGuessed: word.length, word: word })
        else {
          guessSuccess.play()
          n.broadcast({ payload: 'FFA_WORDS', guessedWords: [...guessedWords.current, word] })
          submitScore(username, word.length)
        }
      } else {
        // wrong guess
        toast.error(`Invalid word: ${word}`)
        guessFailed.play()
      }
    } else if (mode === 'GM') {
      if (!/\S/.test(word)) {
        // empty word
        toast.error(`Invalid input.`)
        guessFailed.play()
      } else if (
        // word already found
        guessedWords.current.includes(word)
      ) {
        toast(`${word} already found`, { icon: '🙏' })
        alreadyFound.play()
      } else if (anagram.current.includes(word)) {
        // correct guess
        guessSuccess.play()
        setAnagram(anagram.current.filter((w) => w !== word))
        setGuessedWords([...guessedWords.current, word])
        setScore(score + word.length)
        n.groupVars[group].guessedWords = [...guessedWords.current, word]
        if (!isHost) n.sendToUser(hostId, { payload: 'GROUP_GUESS', groupName: group, weGuessed: word.length })
        else {
          const groupData = groupDataRef.current,
            leaderboard = leaderboardRef.current
          console.log('group data from submit group score:', groupData)
          const groupGuessed = groupData.find((g) => g.name == group)
          console.log('group  guessed:', groupGuessed)
          var tempLeaderboard = { ...leaderboard }
          for (let member of groupGuessed.members) {
            tempLeaderboard = {
              ...tempLeaderboard,
              [member.name]: (tempLeaderboard[member.name] || 0) + word.length,
            }
          }
          console.log('updated individual leaderboard from group guess', tempLeaderboard)
          setLeaderboard(tempLeaderboard)
          submitGroupScore(group, word.length)
        }
        toast.success(`Word found: ${word}. Yay!`)
      } else {
        // wrong guess
        guessFailed.play()
        toast.error(`Invalid word: ${word}`)
      }
    } else if (mode === 'AA') {
      if (!/\S/.test(word)) {
        // empty guess
        toast.error(`Invalid input.`)
        guessFailed.play()
      } else if (guessedWords.current.includes(word)) {
        // word already found
        toast(`${word} already found`, { icon: '🙏' })
        alreadyFound.play()
      } else if (anagram.current.includes(word)) {
        // correct guess
        guessSuccess.play()
        setAnagram(anagram.current.filter((w) => w !== word))
        setGuessedWords([...guessedWords.current, word])
        setScore(score + word.length)
        toast.success(`Word found: ${word}. Yay!`)
        // add score to leaderboard and broadcast
        if (isHost) submitScore(username, word.length)
        // send new score to central leaderboard
        else n.sendToUser(hostId, { payload: 'AA_GUESS', iGuessed: word.length })
      } else {
        // wrong guess
        toast.error(`Invalid word: ${word}`)
        guessFailed.play()
      }
    }
  }

  const ffaJudgeHandler = (word, senderId) => {
    const sender = getSender(senderId)

    if (guessedWords.current.includes(word)) {
      n.sendToUser(senderId, { payload: 'FFA_FAILED', success: false, word: word })
    } else if (anagram.current.includes(word)) {
      n.sendToUser(senderId, { payload: 'FFA_SUCCESS', success: true, word: word })
      n.broadcast({ payload: 'FFA_WORDS', guessedWords: [...guessedWords.current, word] })
      setAnagram(anagram.current.filter((w) => w !== word))
      setGuessedWords([...guessedWords.current, word])
      submitScore(sender, word.length)
    } else {
      n.sendToUser(senderId, { payload: 'FFA_FAILED', success: false, word: word })
    }
  }

  return (
    <div className="w-full min-h-screen">
      <SoundControls />
      <div className="flex flex-col-reverse lg:flex-row">
        <div className="flex-1 flex flex-col items-center justify-center max-w-screen-sm lg:max-w-screen-md md:mx-auto px-4 md:px-0 lg:pl-4 xl:px-4 pb-8 lg:py-8">
          <Board {...{ guessHandler, setOpen, hostId }} />
          <WordsToFind setOpen={setOpen} className="block mb-4 md:hidden" />
          <WordsFound />
        </div>
        <Sidebar setOpen={setOpen} />
      </div>
      {isHost && <SetupModal {...{ isOpen, setOpen, toFinalLeaderboard }} />}
      {!isHost && !isStarted && <WaitingModal />}
    </div>
  )
}
