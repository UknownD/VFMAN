const DEFAULT_VALUE = 1

function buildLetterValues(password: string, code: number[]): Record<string, number> {
  const letterValues: Record<string, number> = {}
  const cleanPassword = password.toUpperCase().replace(/[^A-Z]/g, "")

  for (let i = 0; i < cleanPassword.length; i++) {
    const letter = cleanPassword[i]
    const bonus = code[i] || 0
    letterValues[letter] = DEFAULT_VALUE + bonus
  }

  return letterValues
}

function getLetterValue(letter: string, letterValues: Record<string, number>): number {
  return letterValues[letter.toUpperCase()] || DEFAULT_VALUE
}

function getAlphabetPosition(letter: string): number {
  return letter.toUpperCase().charCodeAt(0) - 65
}

function getLetterFromPosition(position: number): string {
  const normalizedPosition = ((position % 26) + 26) % 26
  return String.fromCharCode(65 + normalizedPosition)
}

function calculateEncryptionValue(
  passwordLetter: string,
  targetLetter: string,
  letterValues: Record<string, number>,
): number {
  const startPos = getAlphabetPosition(passwordLetter)
  const endPos = getAlphabetPosition(targetLetter)

  let sum = 0
  let currentPos = startPos

  // Traverse from start to end (circular), including start letter
  while (currentPos !== endPos) {
    const currentLetter = getLetterFromPosition(currentPos)
    sum += getLetterValue(currentLetter, letterValues)
    currentPos = (currentPos + 1) % 26
  }

  // Add the value of the target letter
  sum += getLetterValue(targetLetter, letterValues)

  return sum
}

export function encrypt(word: string, password: string, code: string): string {
  if (!word || !password || !code) return ""

  const cleanWord = word.toUpperCase().replace(/[^A-Z]/g, "")
  const cleanPassword = password.toUpperCase().replace(/[^A-Z]/g, "")

  if (!cleanWord || !cleanPassword) return ""

  const codeArray = code.split(",").map((n) => Number.parseInt(n.trim()))
  if (codeArray.some(isNaN)) return ""
  if (codeArray.length !== cleanPassword.length) return ""

  const letterValues = buildLetterValues(cleanPassword, codeArray)
  const result: number[] = []

  for (let i = 0; i < cleanWord.length; i++) {
    const wordLetter = cleanWord[i]
    const passwordLetter = cleanPassword[i % cleanPassword.length]
    const value = calculateEncryptionValue(passwordLetter, wordLetter, letterValues)
    result.push(value)
  }

  return result.join(",")
}

export function decrypt(numbers: string, password: string, code: string): string {
  if (!numbers || !password || !code) return ""

  const cleanPassword = password.toUpperCase().replace(/[^A-Z]/g, "")
  if (!cleanPassword) return ""

  const codeArray = code.split(",").map((n) => Number.parseInt(n.trim()))
  if (codeArray.some(isNaN)) return ""
  if (codeArray.length !== cleanPassword.length) return ""

  const letterValues = buildLetterValues(cleanPassword, codeArray)

  const numArray = numbers.split(",").map((n) => Number.parseInt(n.trim()))
  if (numArray.some(isNaN)) return ""

  const result: string[] = []

  for (let i = 0; i < numArray.length; i++) {
    const targetValue = numArray[i]
    const passwordLetter = cleanPassword[i % cleanPassword.length]
    const startPos = getAlphabetPosition(passwordLetter)

    let sum = 0
    let currentPos = startPos
    let found = false

    // Try all 26 positions to find the matching letter
    for (let j = 0; j < 26; j++) {
      sum = 0
      currentPos = startPos
      const testPos = (startPos + j) % 26

      // Calculate sum from start to test position
      while (currentPos !== testPos) {
        const currentLetter = getLetterFromPosition(currentPos)
        sum += getLetterValue(currentLetter, letterValues)
        currentPos = (currentPos + 1) % 26
      }

      // Add the value of the test letter
      const testLetter = getLetterFromPosition(testPos)
      sum += getLetterValue(testLetter, letterValues)

      if (sum === targetValue) {
        result.push(testLetter)
        found = true
        break
      }
    }

    if (!found) {
      return ""
    }
  }

  return result.join("")
}
