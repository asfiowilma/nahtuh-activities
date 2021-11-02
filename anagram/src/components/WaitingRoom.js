import { useEffect, useRef } from 'react'
import swal from 'sweetalert'

function WaitingRoom({ eventId, onStart }) {
  const lobbyComponent = useRef(null)

  useEffect(() => {
    if (lobbyComponent != null) {
      lobbyComponent.current.onStart = onStart
      lobbyComponent.current.onAlert = onAlert
      lobbyComponent.current.eventId = eventId
      console.log(eventId)
    }
  }, [lobbyComponent])

  const onAlert = (message) => {
    swal({ icon: 'warning', text: message, button: false })
  }

  return (
    <div className="text-neutral">
      <lobby-component
        eventId={eventId}
        ref={lobbyComponent}
        colorprimary="#ff80c0"
        colorsecondary="#e14794"
      ></lobby-component>
    </div>
  )
}

export default WaitingRoom
