import { useEffect, useState } from 'react'
import { nahtuhClient as n } from 'nahtuh-client'
import 'nahtuh-components'
import CreateEvent from './components/CreateEvent'
import WaitingRoom from './components/WaitingRoom'
import Lobby from './components/Lobby'
import { useIdentity } from './contexts/IdentityContext'
import { useScore } from './contexts/ScoreContext'

const scenes = {
  login: 'LOGIN',
  lobby: 'LOBBY',
  waiting: 'WAITINGROOM',
}

function App() {
  const [currentPage, setCurrentPage] = useState(scenes.login)
  const [eventId, setEventId] = useState(null)
  const { setUsername, setIsHost } = useIdentity(),
    { addPlayer } = useScore()

  useEffect(() => {
    n.participantJoined = onParticipantJoined
  }, [])

  const onParticipantJoined = (message) => addPlayer(message)

  const toWaitingRoom = (data) => {
    console.log(data)
    setIsHost(data.participant.isHost)
    setUsername(data.participant.participantName)
    setEventId(data.eventInfo.eventId)
    setCurrentPage(scenes.waiting)
  }

  const toLobby = () => {
    setCurrentPage(scenes.lobby)
  }

  const scene = () => {
    switch (currentPage) {
      case scenes.waiting:
        return <WaitingRoom onStart={toLobby} eventId={eventId} />
      case scenes.lobby:
        return <Lobby />
      default:
        return <CreateEvent onStart={toWaitingRoom} />
    }
  }

  return <div className="flex justify-center items-center min-h-screen font-poppins">{scene()}</div>
}

export default App
