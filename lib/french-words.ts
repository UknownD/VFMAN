export const FRENCH_WORDS = [
  "pomme",
  "clavier",
  "souris",
  "porte",
  "maison",
  "jardin",
  "arbre",
  "fleur",
  "soleil",
  "lune",
  "étoile",
  "nuage",
  "pluie",
  "neige",
  "vent",
  "ocean",
  "montagne",
  "vallée",
  "rivière",
  "lac",
  "forêt",
  "désert",
  "plage",
  "île",
  "roche",
  "sable",
  "herbe",
  "feuille",
  "branche",
  "racine",
  "graine",
  "fruit",
  "légume",
  "pain",
  "fromage",
  "lait",
  "œuf",
  "viande",
  "poisson",
  "riz",
  "pâtes",
  "soupe",
  "sauce",
  "sel",
  "poivre",
  "sucre",
  "farine",
  "beurre",
  "huile",
  "vinaigre",
  "café",
  "thé",
  "eau",
  "jus",
  "vin",
  "bière",
  "table",
  "chaise",
  "lit",
  "armoire",
  "miroir",
  "lampe",
  "fenêtre",
  "mur",
  "toit",
  "escalier",
  "porte",
  "clé",
  "serrure",
  "poignée",
  "bouton",
  "interrupteur",
  "prise",
  "fil",
  "ampoule",
  "chandelle",
  "torche",
  "ombre",
  "lumière",
  "couleur",
  "bleu",
  "rouge",
  "vert",
  "jaune",
  "noir",
  "blanc",
  "gris",
  "rose",
  "orange",
  "violet",
  "or",
  "argent",
  "cuivre",
  "fer",
  "acier",
  "verre",
  "pierre",
  "bois",
  "métal",
  "plastique",
  "papier",
  "tissu",
  "laine",
  "coton",
  "soie",
  "cuir",
]

export function generateFrenchWords(count: number): string[] {
  const words: string[] = []
  const usedIndices = new Set<number>()

  for (let i = 0; i < count; i++) {
    let randomIndex: number
    do {
      randomIndex = Math.floor(Math.random() * FRENCH_WORDS.length)
    } while (usedIndices.has(randomIndex))

    usedIndices.add(randomIndex)
    words.push(FRENCH_WORDS[randomIndex])
  }

  return words
}

export function generateFrenchWordsWithLength(totalCharacters: number): string[] {
  const words: string[] = []
  let totalLength = 0
  const usedIndices = new Set<number>()
  let attempts = 0
  const maxAttempts = FRENCH_WORDS.length * 3

  while (totalLength < totalCharacters && attempts < maxAttempts) {
    let randomIndex: number
    let attemptCount = 0
    const maxInnerAttempts = FRENCH_WORDS.length

    do {
      randomIndex = Math.floor(Math.random() * FRENCH_WORDS.length)
      attemptCount++
    } while (usedIndices.has(randomIndex) && attemptCount < maxInnerAttempts)

    if (attemptCount >= maxInnerAttempts) {
      break
    }

    const word = FRENCH_WORDS[randomIndex]
    if (totalLength + word.length <= totalCharacters) {
      usedIndices.add(randomIndex)
      words.push(word)
      totalLength += word.length
    }

    attempts++
  }

  return words
}

export function generateFrenchWordsWithoutRepeatingLetters(totalCharacters: number): string[] {
  const words: string[] = []
  const usedLetters = new Set<string>()
  const usedIndices = new Set<number>()
  let attempts = 0
  const maxAttempts = FRENCH_WORDS.length * 3

  while (usedLetters.size < 26 && attempts < maxAttempts) {
    let randomIndex: number
    let attemptCount = 0
    const maxInnerAttempts = FRENCH_WORDS.length

    do {
      randomIndex = Math.floor(Math.random() * FRENCH_WORDS.length)
      attemptCount++
    } while (usedIndices.has(randomIndex) && attemptCount < maxInnerAttempts)

    if (attemptCount >= maxInnerAttempts) {
      break
    }

    const word = FRENCH_WORDS[randomIndex]
    const wordLetters = new Set(
      word
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .split(""),
    )

    // Check if word would introduce repeated letters
    let wouldRepeat = false
    for (const letter of wordLetters) {
      if (usedLetters.has(letter)) {
        wouldRepeat = true
        break
      }
    }

    if (!wouldRepeat) {
      usedIndices.add(randomIndex)
      words.push(word)
      for (const letter of wordLetters) {
        usedLetters.add(letter)
      }
    }

    attempts++
  }

  return words
}
