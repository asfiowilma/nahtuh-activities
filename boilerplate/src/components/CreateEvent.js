import { useEffect, useRef } from 'react'
import swal from 'sweetalert'

function CreateEvent({ onStart }) {
  const createEventComponent = useRef(null)

  useEffect(() => {
    if (createEventComponent != null) {
      createEventComponent.current.onStart = onStart
      createEventComponent.current.onAlert = onAlert
    }
  }, [createEventComponent])

  const onAlert = (message) => {
    swal({ icon: 'warning', text: message, button: false })
  }

  return (
    <div className="bg-gray-light absolute inset-0 flex items-center justify-center">
      <create-event-component
        id="create-event"
        colorprimary="#ff80c0"
        colorlink="#e14794"
        colorsecondary="#e14794"
        ref={createEventComponent}
      ></create-event-component>
    </div>
  )
}

export default CreateEvent
