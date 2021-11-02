import React from 'react'
import Leaderboard from './Leaderboard'
import { WordsToFind } from './WordsToFind'

export default function Sidebar({ setOpen }) {
  return (
    <div className="flex flex-row lg:flex-col max-w-screen-sm py-4 mx-auto lg:mx-0 lg:items-center lg:py-8 lg:px-4 xl:pr-8 gap-4 w-full lg:w-96">
      <Leaderboard className="mx-4 md:mx-0" />
      <WordsToFind className="hidden md:block" setOpen={setOpen} />
    </div>
  )
}
