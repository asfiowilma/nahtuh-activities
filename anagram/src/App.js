import { useEffect, useRef, useState } from 'react'
import { nahtuhClient as n } from 'nahtuh-client'
import 'nahtuh-components'
import CreateEvent from './components/CreateEvent'
import WaitingRoom from './components/WaitingRoom'
import Lobby from './components/Lobby'
import { useIdentity } from './contexts/IdentityContext'
import { useScore } from './contexts/ScoreContext'
import { useGame } from './contexts/GameContext'
import toast from 'react-hot-toast'
import { FinalLeaderboard } from './components/FinalLeaderboard'

const scenes = {
  login: 'LOGIN',
  lobby: 'LOBBY',
  waiting: 'WAITINGROOM',
  leaderboard: 'LEADERBOARD',
}

function App() {
  const [currentPage, setCurrentPage] = useState(scenes.login)
  const [eventId, setEventId] = useState(null)
  const {
      state: { myId, group, hostId },
      setUsername,
      setIsHost,
      setId,
      setGroup,
    } = useIdentity(),
    { setMode, setGuessedWords } = useGame(),
    {
      state: { score, playerList },
      addPlayer,
      setPlayers,
      setScore,
    } = useScore()
  const id = useRef()
  id.current = myId
  const pl = useRef()
  pl.current = playerList
  const gr = useRef()
  gr.current = group
  const host = useRef()
  host.current = hostId

  useEffect(() => {
    window.yai = n

    n.onParticipantJoined = onParticipantJoined
    n.onGroupMemberJoined = onGroupMemberJoined
    n.onGroupMemberLeft = onGroupMemberLeft
    n.onGroupVariableChanged = onGroupVariableChanged
    n.onEventVariableChanged = onEventVariableChanged
  }, [])

  const onParticipantJoined = (message) => {
    console.log(message)
    addPlayer(message)
  }

  const onGroupVariableChanged = (message) => {
    console.log(message)
    const { sender, name, value } = message
    if (name === 'guessedWords') {
      const word = value.slice(-1).pop()
      setGuessedWords(value)
      toast.success(`${getSender(sender)} found: ${word}. Yay!`)
    }
    if (name === 'score') setScore(score + parseInt(value))
  }

  const onEventVariableChanged = (message) => {
    console.log(message)
    const { name, value } = message
    if (name === 'mode') setMode(value)
  }

  const onGroupMemberJoined = (message) => {
    console.log(message)
    if (message.participantId === id.current) setGroup(message.groupName)
  }

  const onGroupMemberLeft = (message) => {
    console.log(message)
    if (message.participantId === id.current) setGroup('')
  }

  const getSender = (senderId) => {
    console.log(pl.current)
    var sender = pl.current.find((p) => p.participantId === senderId).participantName
    return sender
  }

  const toWaitingRoom = (data) => {
    console.log(data)
    n.getParticipantList().then((p) => setPlayers(p))
    setIsHost(data.participant.isHost)
    setId(data.participant.participantId)
    setUsername(data.participant.participantName)
    setEventId(data.eventInfo.eventId)
    setCurrentPage(scenes.waiting)
  }

  const toLobby = () => {
    setCurrentPage(scenes.lobby)
  }

  const toFinalLeaderboard = () => {
    setCurrentPage(scenes.leaderboard)
  }

  const scene = () => {
    switch (currentPage) {
      case scenes.waiting:
        return <WaitingRoom onStart={toLobby} eventId={eventId} />
      case scenes.lobby:
        return <Lobby toFinalLeaderboard={toFinalLeaderboard} />
      case scenes.leaderboard:
        return <FinalLeaderboard />
      default:
        return <CreateEvent onStart={toWaitingRoom} />
    }
  }

  return <div className="flex justify-center items-center min-h-screen font-poppins">{scene()}</div>
}

export default App
