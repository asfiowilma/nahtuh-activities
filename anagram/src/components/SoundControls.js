import React, { useState } from 'react'
import { MdVolumeUp, MdVolumeOff } from 'react-icons/md'
import { Howler } from 'howler'

export const SoundControls = () => {
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)

  const muteHandler = () => {
    if (muted) Howler.volume(volume)
    else Howler.volume(0)
    setMuted(!muted)
  }

  const volumeHandler = (e) => {
    // eslint-disable-next-line eqeqeq
    if (e.target.value == 0) setMuted(true)
    else if (muted) setMuted(false)
    setVolume(e.target.value)
    Howler.volume(e.target.value)
  }

  return (
    <div className="fixed top-2 left-2" style={{ zIndex: 1000 }}>
      <div className="dropdown dropdown-hover dropdown-right">
        <div tabIndex="0" className="hidden lg:inline-flex m-1 btn btn-outline btn-circle" onClick={muteHandler}>
          {muted ? (
            <MdVolumeOff className="w-5 h-5 cursor-pointer" />
          ) : (
            <MdVolumeUp className="w-5 h-5 cursor-pointer" />
          )}
        </div>
        <div tabIndex="0" className="inline-flex lg:hidden m-1 btn btn-outline btn-circle btn-sm md:btn-md">
          {muted ? (
            <MdVolumeOff className="w-5 h-5 cursor-pointer" />
          ) : (
            <MdVolumeUp className="w-5 h-5 cursor-pointer" />
          )}
        </div>
        <ul
          tabIndex="0"
          className="p-2 md:mt-2 shadow dropdown-content bg-base-100 rounded-box w-52 flex items-center gap-2"
        >
          {muted ? (
            <MdVolumeOff onClick={muteHandler} className="block lg:hidden w-6 h-6 cursor-pointer" />
          ) : (
            <MdVolumeUp onClick={muteHandler} className="block lg:hidden w-6 h-6 cursor-pointer" />
          )}
          <input
            onChange={volumeHandler}
            type="range"
            min={0}
            max={1}
            value={volume}
            step={0.05}
            className="range transform rotate-270"
          />
        </ul>
      </div>
    </div>
  )
}
