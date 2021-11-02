import React from 'react'
import { useGame } from '../../contexts/GameContext'

export const WordsFound = () => {
  const {
    state: { guessedWords },
  } = useGame()

  return (
    <div className="bg-base-200 shadow-lg w-full p-4 rounded-box lg:mt-4">
      <div className="font-bold">Words Found</div>
      <div className="flex gap-1 mt-2 flex-wrap">
        {guessedWords.length > 0 ? (
          guessedWords.map((word) => <WordBadge key={word} word={word} />)
        ) : (
          <div className="w-full bg-base-300 rounded-btn py-2 text-sm text-center">None yet :(</div>
        )}
      </div>
    </div>
  )
}

const WordBadge = ({ word }) => {
  const className = () => {
    switch (word.length) {
      case 4:
        return 'badge-primary'
      case 5:
        return 'badge-secondary'
      case 6:
        return 'badge-accent'
      case 7:
        return 'badge-primary border-none bg-primary-focus'
      case 8:
        return 'badge-primary border-none bg-secondary-focus'
      case 9:
        return 'badge-primary border-none bg-accent-focus'

      default:
        break
    }
  }
  return <div className={`badge ${className()}`}>{word}</div>
}
