import { nahtuhClient as yai } from 'nahtuh-client'

// eslint-disable-next-line no-sparse-arrays
export const nth = (n) => [, 'st', 'nd', 'rd'][(n / 10) % 10 ^ 1 && n % 10] || 'th'
export const isAlpha = (ch) => /^[A-Z]$/i.test(ch)
export const range = (size, startAt = 0) => [...Array(size).keys()].map((i) => i + startAt)
export const int = (n) => parseInt(n)
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
export const hash = (str) => str.split('').reduce((prev, curr) => ((prev << 5) - prev + curr.charCodeAt(0)) | 0, 0)
export const mod = (n, m) => ((n % m) + m) % m
export const generateString = (l) =>
  Array(l)
    .fill('')
    .map((_) => Math.random().toString(36).charAt(2))
    .join('')
export const generateAnagramString = (length) => {
  const vocals = 'aiueo'
  const consonants = 'qwrtypsdfghjklcvbnm'
  const vArray = Array(3)
    .fill('')
    .map((v) => vocals[Math.floor(Math.random() * vocals.length)])
  const cArray = Array(length - 3)
    .fill('')
    .map((v) => consonants[Math.floor(Math.random() * consonants.length)])
  return [...cArray, ...vArray].join('')
}

export const flat = (arr) => arr.reduce((a, b) => (Array.isArray(b) ? [...a, ...flat(b)] : [...a, b]), [])

export const findHost = async () => {
  var participants = await yai.getParticipantList()
  var host = participants.find((player) => player.isHost)
  return host
}

export const regenerateKeypad = (w, b) => {
  const base = b.split('')
  const res = base.map((letter) => ({ letter: letter, lit: false }))
  if (w.length === 0) return res

  const word = w.split('')
  const v = base.join('')
  while (word.length > 0 && base.length > 0) {
    let x = base.indexOf(word[0])
    let y = v.indexOf(word[0])
    if (x === -1) word.shift()
    else {
      while (res[y].lit) y = v.indexOf(word[0], y + 1)
      res[y] = { ...res[y], lit: true }
      word.shift()
      base.splice(x, 1)
    }
  }
  return res
}

export const shuffle = (string) => {
  return string
    .split('')
    .reverse()
    .sort(function () {
      return 0.5 - Math.random()
    })
    .join('')
}
