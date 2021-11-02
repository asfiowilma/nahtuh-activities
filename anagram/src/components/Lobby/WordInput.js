import React, { useState } from 'react'
import { BiSubdirectoryLeft } from 'react-icons/bi'
export const WordInput = ({ guessHandler, word, setword }) => {
  const enterWord = (e) => {
    e.preventDefault()
    guessHandler(word)
    setword('')
  }

  return (
    <form onSubmit={enterWord} className="w-full bg-base-200 shadow-lg rounded-full flex gap-2 p-4">
      <input
        type="text"
        placeholder="Type word here"
        value={word}
        onChange={(e) => setword(e.target.value.toLowerCase())}
        className="flex-1 input input-bordered"
      />
      <button
        type="submit"
        className="btn btn-primary rounded-full btn-rounded sm:px-6 sm:w-auto sm:h-auto"
        onClick={enterWord}
      >
        <span className="hidden sm:inline">Enter</span>
        <span className="sm:hidden inline">
          <BiSubdirectoryLeft className="w-5 h-5" />
        </span>
      </button>
    </form>
  )
}
