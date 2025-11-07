"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { encrypt, decrypt } from "@/lib/cipher"
import { Eye, EyeOff, Shuffle, Copy, Check, Settings, Download, Clipboard, Lock, LockOpen } from "lucide-react"
import type { JSX } from "react"
import { useRouter } from "next/navigation"
import { NotepadApp } from "./notepad-app"
import { v4 as uuidv4 } from "uuid"

export function CipherTool() {
  const [encryptPassword, setEncryptPassword] = useState("")
  const [encryptCode, setEncryptCode] = useState("")
  const [encryptText, setEncryptText] = useState("")
  const [encryptResult, setEncryptResult] = useState("")
  const [encryptError, setEncryptError] = useState("")
  const [encryptPasswordHasDuplicates, setEncryptPasswordHasDuplicates] = useState(false)

  const [decryptPassword, setDecryptPassword] = useState("")
  const [decryptCode, setDecryptCode] = useState("")
  const [decryptNumbers, setDecryptNumbers] = useState("")
  const [decryptResult, setDecryptResult] = useState("")
  const [decryptError, setDecryptError] = useState("")
  const [decryptPasswordHasDuplicates, setDecryptPasswordHasDuplicates] = useState(false)

  const [copiedEncrypt, setCopiedEncrypt] = useState(false)
  const [copiedDecrypt, setCopiedDecrypt] = useState(false)

  const [exportedData, setExportedData] = useState<{ password: string; code: string } | null>(null)

  const [selectedStartLetter, setSelectedStartLetter] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  const [encryptTextCursorPos, setEncryptTextCursorPos] = useState(0)
  const [decryptNumbersCursorPos, setDecryptNumbersCursorPos] = useState(0)

  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)

  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState("")

  const [showPinModal, setShowPinModal] = useState(false)
  const [pinMode, setPinMode] = useState<"letter" | "number">("letter")
  const [appPin, setAppPin] = useState<string | null>(null)
  const [autoLockTime, setAutoLockTime] = useState<number | null | "onClose">(null)
  const [isAppLocked, setIsAppLocked] = useState(false)
  const [lockInputPin, setLockInputPin] = useState("")
  const [showLockAnimation, setShowLockAnimation] = useState(true)
  const lockTimeoutRef = useRef<NodeJS.Timeout>()

  const [isInNotepadMode, setIsInNotepadMode] = useState(false)
  const [lastAttemptedPassword, setLastAttemptedPassword] = useState("")

  const pasteInputRef = useRef<HTMLInputElement>(null)

  const [showExplanation, setShowExplanation] = useState(false)
  const [dontShowWelcomeAgain, setDontShowWelcomeAgain] = useState(false)

  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [history, setHistory] = useState<
    Array<{
      id: string
      encryptPassword: string
      encryptCode: string
      encryptResult: string
      decryptPassword: string
      decryptCode: string
      decryptResult: string
      timestamp: number
      isSaved: boolean
    }>
  >([])

  useEffect(() => {
    const savedHistory = localStorage.getItem("cipherHistory")
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.log("[v0] Error loading history:", e)
      }
    }
  }, [])

  useEffect(() => {
    const savedPin = localStorage.getItem("appPin")
    const savedPinMode = localStorage.getItem("appPinMode") as "letter" | "number" | null
    const savedAutoLock = localStorage.getItem("appAutoLock")
    const isInNotepad = localStorage.getItem("isInNotepadMode") === "true"
    const hasSeenExplanation = localStorage.getItem("hasSeenExplanation") === "true"

    if (!hasSeenExplanation || localStorage.getItem("needsResetCode") === "true") {
      setShowExplanation(true)
      localStorage.removeItem("needsResetCode")
    }

    if (savedPin) {
      setAppPin(savedPin)
      setPinMode(savedPinMode || "letter")
      setAutoLockTime(savedAutoLock ? Number.parseInt(savedAutoLock) : null)
      // If user was in notepad mode, keep them there
      if (isInNotepad) {
        setIsInNotepadMode(true)
        setIsAppLocked(false)
      } else {
        setIsAppLocked(true)
        setLockInputPin("")
      }
    }

    // Hide animation after 1 second
    setTimeout(() => setShowLockAnimation(false), 1000)
  }, [])

  useEffect(() => {
    if (!appPin || isAppLocked || autoLockTime === null) return

    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current)
    }

    lockTimeoutRef.current = setTimeout(() => {
      setIsAppLocked(true)
      setLockInputPin("")
    }, autoLockTime)

    return () => {
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current)
      }
    }
  }, [appPin, isAppLocked, autoLockTime])

  const handleEncryptPasswordChange = (value: string) => {
    setEncryptPassword(value)
    if (value.trim()) {
      setEncryptPasswordHasDuplicates(!hasNoDuplicateLetters(value))
    } else {
      setEncryptPasswordHasDuplicates(false)
    }
  }

  const handleDecryptPasswordChange = (value: string) => {
    setDecryptPassword(value)
    if (value.trim()) {
      setDecryptPasswordHasDuplicates(!hasNoDuplicateLetters(value))
    } else {
      setDecryptPasswordHasDuplicates(false)
    }
  }

  const handleEncryptCodeChange = (value: string) => {
    setEncryptCode(value)
  }

  const handleDecryptCodeChange = (value: string) => {
    setDecryptCode(value)
  }

  const handleCodeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    setter: (value: string) => void,
    getter: () => string,
  ) => {
    if (e.key === " ") {
      e.preventDefault()
      const currentValue = getter()
      if (currentValue && !currentValue.endsWith(",")) {
        setter(currentValue + ",")
      }
    }

    if (e.key === "Backspace") {
      const currentValue = getter()
      const cursorPos = (e.currentTarget as HTMLInputElement).selectionStart || 0

      if (cursorPos > 0 && currentValue[cursorPos - 1] === ",") {
        const afterComma = currentValue.substring(cursorPos)
        if (afterComma.match(/\d/)) {
          e.preventDefault()
          const beforeComma = currentValue.substring(0, cursorPos - 1)
          const lastDigitIndex = beforeComma.search(/\d(?!.*\d)/)
          if (lastDigitIndex !== -1) {
            const newValue =
              beforeComma.substring(0, lastDigitIndex) +
              beforeComma.substring(lastDigitIndex + 1) +
              currentValue.substring(cursorPos - 1)
            setter(newValue)
          }
        }
      }
    }
  }

  const handleEncrypt = () => {
    setEncryptError("")
    if (!hasNoDuplicateLetters(encryptPassword)) {
      setEncryptError("Le mot de passe ne doit pas contenir de lettres répétées")
      return
    }
    const result = encrypt(encryptText, encryptPassword, encryptCode)
    if (!result) {
      setEncryptError("Erreur de chiffrement. Vérifiez vos entrées.")
      return
    }
    setEncryptResult(result)
    copyToClipboard(result, "encrypt")

    const newEntry = {
      id: uuidv4(),
      encryptPassword: encryptPassword,
      encryptCode: encryptCode,
      encryptResult: result,
      decryptPassword: "",
      decryptCode: "",
      decryptResult: "",
      timestamp: Date.now(),
      isSaved: true,
    }
    const updatedHistory = [...history, newEntry]
    if (updatedHistory.length > 10) {
      updatedHistory.shift()
    }
    setHistory(updatedHistory)
    localStorage.setItem("cipherHistory", JSON.stringify(updatedHistory))
  }

  const handleDecrypt = () => {
    setDecryptError("")
    if (!hasNoDuplicateLetters(decryptPassword)) {
      setDecryptError("Le mot de passe ne doit pas contenir de lettres répétées")
      return
    }
    const result = decrypt(decryptNumbers, decryptPassword, decryptCode)
    if (!result) {
      setDecryptError("Erreur de déchiffrement. Vérifiez vos entrées.")
      return
    }
    setDecryptResult(result)
    copyToClipboard(result, "decrypt")

    const newEntry = {
      id: uuidv4(),
      encryptPassword: "",
      encryptCode: "",
      encryptResult: "",
      decryptPassword: decryptPassword,
      decryptCode: decryptCode,
      decryptResult: result,
      timestamp: Date.now(),
      isSaved: true,
    }
    const updatedHistory = [...history, newEntry]
    if (updatedHistory.length > 10) {
      updatedHistory.shift()
    }
    setHistory(updatedHistory)
    localStorage.setItem("cipherHistory", JSON.stringify(updatedHistory))
  }

  const copyToClipboard = async (text: string, type: "encrypt" | "decrypt") => {
    await navigator.clipboard.writeText(text)
    if (type === "encrypt") {
      setCopiedEncrypt(true)
      setTimeout(() => setCopiedEncrypt(false), 2000)
    } else {
      setCopiedDecrypt(true)
      setTimeout(() => setCopiedDecrypt(false), 2000)
    }
  }

  const calculateAlphabetValues = (): {
    baseValues: Record<string, number>
    letterValuesMap: Record<string, number>
  } => {
    const password = encryptPassword || decryptPassword
    const code = encryptCode || decryptCode

    const baseValues: Record<string, number> = {}
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i)
      baseValues[letter] = 1
    }

    if (!password || !code) {
      return { baseValues, letterValuesMap: {} }
    }

    const cleanPassword = password.toUpperCase().replace(/[^A-Z]/g, "")
    const codeArray = code.split(",").map((n) => Number.parseInt(n.trim(), 10))

    const letterValuesMap: Record<string, number> = {}

    for (let i = 0; i < cleanPassword.length && i < codeArray.length; i++) {
      const letter = cleanPassword[i]
      const bonus = codeArray[i]
      if (!isNaN(bonus)) {
        baseValues[letter] = 1 + bonus
        letterValuesMap[letter] = 1 + bonus
      }
    }

    return { baseValues, letterValuesMap }
  }

  const calculateCumulativeValue = (
    startLetter: string,
    targetLetter: string,
    letterValues: Record<string, number>,
  ): number => {
    const getAlphabetPosition = (letter: string): number => {
      return letter.toUpperCase().charCodeAt(0) - 65
    }

    const getLetterFromPosition = (position: number): string => {
      const normalizedPosition = ((position % 26) + 26) % 26
      return String.fromCharCode(65 + normalizedPosition)
    }

    const getLetterValue = (letter: string): number => {
      return letterValues[letter.toUpperCase()] || 1
    }

    const startPos = getAlphabetPosition(startLetter)
    const endPos = getAlphabetPosition(targetLetter)

    let sum = 0
    let currentPos = startPos

    while (currentPos !== endPos) {
      const currentLetter = getLetterFromPosition(currentPos)
      sum += getLetterValue(currentLetter)
      currentPos = (currentPos + 1) % 26
    }

    sum += getLetterValue(targetLetter)

    return sum
  }

  const getPasswordLetters = (): string[] => {
    const password = encryptPassword || decryptPassword
    if (!password) return []
    const cleanPassword = password.toUpperCase().replace(/[^A-Z]/g, "")
    return cleanPassword.split("").sort()
  }

  const renderTextWithCursor = (text: string, cursorPos: number): JSX.Element => {
    if (!text) {
      return (
        <span
          className="inline-block w-px bg-foreground mx-0"
          style={{
            height: "1em",
            animation: "blink 1s step-end infinite",
          }}
        />
      )
    }

    const beforeCursor = text.substring(0, cursorPos).replace(/./g, "*")
    const afterCursor = text.substring(cursorPos).replace(/./g, "*")

    return (
      <>
        {beforeCursor}
        <span
          className="inline-block w-px bg-foreground"
          style={{
            height: "1em",
            animation: "blink 1s step-end infinite",
            marginLeft: "-2px",
            marginRight: "-2px",
          }}
        />
        {afterCursor}
      </>
    )
  }

  const hasNoDuplicateLetters = (password: string): boolean => {
    const cleanPassword = password.toUpperCase().replace(/[^A-Z]/g, "")
    const letters = cleanPassword.split("")
    const uniqueLetters = new Set(letters)
    return letters.length === uniqueLetters.size
  }

  const generateRandomPassword = (): string => {
    const settings = JSON.parse(localStorage.getItem("generatorSettings") || "{}")
    const length = Math.min(settings.totalLength || 6, 26)

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
    const shuffled = alphabet.sort(() => Math.random() - 0.5)
    return shuffled.slice(0, length).join("")
  }

  const generateRandomCode = (letterLength: number): string => {
    const settings = JSON.parse(localStorage.getItem("generatorSettings") || "{}")
    const codeLength = Math.min(settings.totalLength || letterLength, 26)

    return Array.from({ length: codeLength }, () => Math.floor(Math.random() * 9) + 1).join(",")
  }

  const handleGenerateRandom = () => {
    const settings = JSON.parse(localStorage.getItem("generatorSettings") || "{}")
    const totalLength = Math.min(settings.totalLength || 6, 26)

    const password = generateRandomPassword()
    const code = generateRandomCode(totalLength)

    setEncryptPassword(password)
    setEncryptCode(code)
    setDecryptPassword(password)
    setDecryptCode(code)
    setEncryptPasswordHasDuplicates(false)
    setDecryptPasswordHasDuplicates(false)

    const newEntry = {
      id: uuidv4(),
      encryptPassword: password,
      encryptCode: code,
      encryptResult: "",
      decryptPassword: password,
      decryptCode: code,
      decryptResult: "",
      timestamp: Date.now(),
      isSaved: true,
    }
    const updatedHistory = [...history, newEntry]
    if (updatedHistory.length > 10) {
      updatedHistory.shift()
    }
    setHistory(updatedHistory)
    localStorage.setItem("cipherHistory", JSON.stringify(updatedHistory))
  }

  const handleSettingsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setIsTransitioning(true)
    setTimeout(() => {
      router.push("/settings")
    }, 100)
  }

  const validateAndFormatCode = (value: string): string => {
    let result = ""
    let currentGroup = ""

    for (let i = 0; i < value.length; i++) {
      const char = value[i]

      if (char === ",") {
        if (currentGroup.length > 0) {
          result += currentGroup + ","
          currentGroup = ""
        }
      } else if (/\d/.test(char)) {
        if (currentGroup.length < 3) {
          currentGroup += char
        } else {
          result += currentGroup + "," + char
          currentGroup = ""
        }
      }
    }

    if (currentGroup.length > 0) {
      result += currentGroup
    }

    return result
  }

  const handleExport = () => {
    const data = { password: encryptPassword, code: encryptCode }
    setExportedData(data)

    const jsonString = JSON.stringify(data)
    navigator.clipboard.writeText(jsonString)
    setCopiedEncrypt(true)
    setTimeout(() => setCopiedEncrypt(false), 2000)
  }

  const handleImportData = () => {
    setShowImportModal(true)
    setImportText("")
  }

  const applyImport = () => {
    try {
      const cleanedText = importText.trim()
      const data = JSON.parse(cleanedText)

      if (data.password && data.code) {
        setDecryptPassword(data.password)
        setDecryptCode(data.code)
        setDecryptError("")
        setShowImportModal(false)
        setCopiedDecrypt(true)
        setTimeout(() => setCopiedDecrypt(false), 2000)
      } else {
        setDecryptError("Format d'import invalide. Vérifiez que vous avez copié les données correctes.")
      }
    } catch (error) {
      setDecryptError("Impossible de lire les données. Assurez-vous que le JSON est valide.")
    }
  }

  const handleSavePinSettings = (newPin: string, mode: "letter" | "number", autoLock: number | null | "onClose") => {
    localStorage.setItem("appPin", newPin)
    localStorage.setItem("appPinMode", mode)
    if (autoLock !== null) {
      localStorage.setItem("appAutoLock", autoLock.toString())
    } else {
      localStorage.removeItem("appAutoLock")
    }
    setAppPin(newPin)
    setPinMode(mode)
    setAutoLockTime(autoLock)
    setShowPinModal(false)
  }

  const handleLockApp = () => {
    if (appPin) {
      setIsAppLocked(true)
      setLockInputPin("")
    }
  }

  const handleUnlockApp = () => {
    if (lockInputPin === appPin) {
      // Correct password - unlock the cipher app and clear notepad mode
      setIsAppLocked(false)
      setLockInputPin("")
      setIsInNotepadMode(false)
      localStorage.removeItem("isInNotepadMode")
    } else {
      // Wrong password - go to notepad and save this state
      setLastAttemptedPassword(lockInputPin)
      setIsInNotepadMode(true)
      setIsAppLocked(false)
      localStorage.setItem("isInNotepadMode", "true")
      setLockInputPin("")
    }
  }

  const handleRemovePin = () => {
    localStorage.removeItem("appPin")
    localStorage.removeItem("appPinMode")
    localStorage.removeItem("appAutoLock")
    setAppPin(null)
    setAutoLockTime(null)
    setShowPinModal(false)
  }

  const handleForgotPassword = () => {
    if (window.confirm("Êtes-vous sûr? Cela réinitialisera l'application et toutes les données sauvegardées.")) {
      // Clear app lock settings
      localStorage.removeItem("appPin")
      localStorage.removeItem("appPinMode")
      localStorage.removeItem("appAutoLock")

      // Keep user in notepad mode with "000" requirement
      localStorage.setItem("isInNotepadMode", "true")
      localStorage.setItem("needsResetCode", "true")

      // Clear all app data but keep notepad
      const notepadContent = localStorage.getItem("notepadContent")
      localStorage.clear()
      if (notepadContent) {
        localStorage.setItem("notepadContent", notepadContent)
      }

      setAppPin(null)
      setAutoLockTime(null)
      setIsAppLocked(false)
      setLockInputPin("")
      setEncryptPassword("")
      setEncryptCode("")
      setEncryptText("")
      setEncryptResult("")
      setEncryptError("")
      setDecryptPassword("")
      setDecryptCode("")
      setDecryptNumbers("")
      setDecryptResult("")
      setDecryptError("")
      setShowImportModal(false)
      setImportText("")
      setShowPinModal(false)
      setIsInNotepadMode(true)
    }
  }

  const handleDeleteFromHistory = (id: string) => {
    const newHistory = history.filter((entry) => entry.id !== id)
    setHistory(newHistory)
    localStorage.setItem("cipherHistory", JSON.stringify(newHistory))
  }

  const handleSaveToHistory = () => {
    const newEntry = {
      id: uuidv4(),
      encryptPassword: encryptPassword,
      encryptCode: encryptCode,
      encryptResult: encryptResult,
      decryptPassword: decryptPassword,
      decryptCode: decryptCode,
      decryptResult: decryptResult,
      timestamp: Date.now(),
      isSaved: true, // Assuming this is a saved entry, not just a temporary one
    }
    const updatedHistory = [...history, newEntry]
    if (updatedHistory.length > 10) {
      updatedHistory.shift()
    }
    setHistory(updatedHistory)
    localStorage.setItem("cipherHistory", JSON.stringify(updatedHistory))
  }

  if (isInNotepadMode) {
    return (
      <NotepadApp
        onUnlock={() => {
          setIsInNotepadMode(false)
          localStorage.removeItem("isInNotepadMode")
        }}
        onLock={() => {
          setIsInNotepadMode(false)
          localStorage.removeItem("isInNotepadMode")
          setIsAppLocked(true)
          setLockInputPin("")
        }}
      />
    )
  }

  if (isAppLocked && appPin) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <Card className="w-96 border border-border shadow-2xl rounded-2xl bg-card">
          <CardHeader className="border-b border-border/50 text-center">
            <Lock className="h-12 w-12 text-accent mx-auto mb-4 lock-pulse" />
            <CardTitle className="text-lg font-bold text-foreground">Application Verrouillée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Input
              type="password"
              placeholder="Entrez votre code"
              value={lockInputPin}
              onChange={(e) => setLockInputPin(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleUnlockApp()}
              className="rounded-xl border border-border focus:border-accent focus:ring-2 transition-all"
              autoFocus
            />
            <Button
              onClick={handleUnlockApp}
              className="w-full bg-accent hover:bg-accent/80 text-foreground font-bold rounded-xl transition-colors"
              disabled={!lockInputPin}
            >
              Déverrouiller
            </Button>
            <Button
              onClick={handleForgotPassword}
              variant="outline"
              className="w-full rounded-xl hover:bg-destructive/10 hover:border-destructive/50 text-destructive transition-colors bg-transparent"
            >
              Mot de passe oublié
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0 pb-6 scrollbar-hide overflow-y-scroll">
      {showLockAnimation && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
          <Lock className="h-16 w-16 text-accent lock-animation" strokeWidth={1.5} />
        </div>
      )}

      {showExplanation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
          <Card className="w-full max-w-2xl border border-border shadow-2xl rounded-xl sm:rounded-2xl bg-card max-h-[90vh] flex flex-col bg-gradient-to-br from-card to-card/95">
            <CardHeader className="border-b border-border/50 sticky top-0 bg-card flex flex-row items-center justify-between flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-lg sm:text-2xl font-bold text-foreground text-center flex-1 truncate">
                Guide d'utilisation
              </CardTitle>
              <button
                onClick={() => {
                  setShowExplanation(false)
                  localStorage.setItem("hasSeenExplanation", "true")
                }}
                className="p-1 sm:p-2 hover:bg-secondary rounded-lg transition-colors flex-shrink-0"
                title="Fermer"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 space-y-4 sm:space-y-6 pt-4 sm:pt-6 pb-4 sm:pb-6 px-3 sm:px-6 scrollbar-hide">
              <div className="space-y-2 sm:space-y-3 bg-accent/5 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-accent/20">
                <h3 className="text-base sm:text-lg font-bold text-accent">À propos de cette application</h3>
                <p className="text-xs sm:text-sm text-foreground/80">
                  Cette application utilise un{" "}
                  <strong>nouveau type de chiffrement inventé par le concepteur de cette application</strong>.
                  Contrairement aux méthodes classiques, elle combine un mot de passe et un code numérique pour créer
                  une clé de chiffrement unique et robuste. Toutes vos données restent stockées localement dans votre
                  navigateur - aucun serveur externe n'a accès à vos informations.
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3 bg-secondary/20 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border/30">
                <h3 className="text-base sm:text-lg font-bold text-foreground">Comment fonctionne ce chiffrement ?</h3>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground/90 mb-1">
                      1. La clé de chiffrement
                    </h4>
                    <p className="text-xs sm:text-sm text-foreground/70">
                      Chaque lettre de l'alphabet a une valeur de base de 1. Votre mot de passe et votre code numérique
                      modifient ces valeurs. Par exemple, avec le mot de passe "ABC" et le code "2,3,4" : la lettre A
                      vaudra 3 (1+2), B vaudra 4 (1+3), et C vaudra 5 (1+4).
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground/90 mb-1">
                      2. Calcul de la distance
                    </h4>
                    <p className="text-xs sm:text-sm text-foreground/70">
                      Pour chiffrer une lettre, l'algorithme calcule une "distance" en partant d'une lettre du mot de
                      passe et en avançant dans l'alphabet jusqu'à atteindre la lettre à chiffrer. Cette distance n'est
                      pas simplement le nombre de lettres, mais la somme des valeurs de toutes les lettres traversées.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground/90 mb-1">3. Exemple concret</h4>
                    <p className="text-xs sm:text-sm text-foreground/70">
                      Imaginons que vous voulez chiffrer la lettre E avec le mot de passe "ABC" (valeurs : A=3, B=4,
                      C=5) et que la première lettre du mot de passe (A) est utilisée. L'algorithme part de A et avance
                      : A(3) + B(4) + C(5) + D(1) + E(1) = 14. Le chiffre 14 représente alors la lettre E dans ce
                      contexte.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground/90 mb-1">
                      4. Rotation du mot de passe
                    </h4>
                    <p className="text-xs sm:text-sm text-foreground/70">
                      Les lettres du mot de passe sont utilisées de manière cyclique. Si votre texte est plus long que
                      votre mot de passe, l'algorithme recommence depuis la première lettre du mot de passe, créant
                      ainsi un motif complexe difficile à décrypter sans la bonne clé.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground/90 mb-1">5. Déchiffrement</h4>
                    <p className="text-xs sm:text-sm text-foreground/70">
                      Pour déchiffrer, l'algorithme fait l'opération inverse : à partir du nombre chiffré et de la
                      lettre du mot de passe, il teste toutes les lettres de l'alphabet jusqu'à trouver celle dont la
                      distance calculée correspond au nombre donné.
                    </p>
                  </div>

                  <div className="bg-accent/10 p-2 sm:p-3 rounded-lg border border-accent/30 mt-2">
                    <p className="text-xs sm:text-sm text-foreground/80">
                      <strong>Pourquoi c'est sécurisé ?</strong> Sans connaître à la fois le mot de passe ET le code
                      numérique exact, il est pratiquement impossible de retrouver le texte original. Même si quelqu'un
                      découvre votre mot de passe, le code numérique change complètement la façon dont les valeurs sont
                      calculées.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-4">
                <p className="text-xs sm:text-sm font-semibold text-foreground/90">
                  Comment utiliser cette application :
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="border-l-4 border-accent pl-3 sm:pl-4 py-2">
                  <h4 className="font-bold text-sm sm:text-base text-foreground">1. Code de sécurité</h4>
                  <p className="text-xs sm:text-sm text-foreground/70">
                    Cliquez sur l'icône cadenas pour configurer un code personnel. Choisissez lettres ou chiffres et
                    définissez le verrouillage automatique.
                  </p>
                </div>

                <div className="border-l-4 border-accent pl-3 sm:pl-4 py-2">
                  <h4 className="font-bold text-sm sm:text-base text-foreground">2. Générer un mot de passe</h4>
                  <p className="text-xs sm:text-sm text-foreground/70">
                    Utilisez le bouton Générer pour créer automatiquement un mot de passe et code. Configurez la
                    longueur dans les paramètres.
                  </p>
                </div>

                <div className="border-l-4 border-accent pl-3 sm:pl-4 py-2">
                  <h4 className="font-bold text-sm sm:text-base text-foreground">3. Mode confidentialité</h4>
                  <p className="text-xs sm:text-sm text-foreground/70">
                    Cliquez l'icône œil pour masquer vos données en astérisques. Utile si quelqu'un regarde par-dessus
                    votre épaule.
                  </p>
                </div>

                <div className="border-l-4 border-accent pl-3 sm:pl-4 py-2">
                  <h4 className="font-bold text-sm sm:text-base text-foreground">4. Chiffrer du texte</h4>
                  <p className="text-xs sm:text-sm text-foreground/70">
                    Entrez mot de passe, code et texte. Cliquez Chiffrer. Le résultat se copie automatiquement.
                  </p>
                </div>

                <div className="border-l-4 border-accent pl-3 sm:pl-4 py-2">
                  <h4 className="font-bold text-sm sm:text-base text-foreground">5. Exporter/Importer</h4>
                  <p className="text-xs sm:text-sm text-foreground/70">
                    Télécharger pour exporter vos identifiants en JSON. Presse-papiers pour importer dans Déchiffrer.
                  </p>
                </div>

                <div className="border-l-4 border-accent pl-3 sm:pl-4 py-2">
                  <h4 className="font-bold text-sm sm:text-base text-foreground">6. Déchiffrer du texte</h4>
                  <p className="text-xs sm:text-sm text-foreground/70">
                    Entrez identiques mot de passe et code, puis le texte chiffré. Cliquez Déchiffrer.
                  </p>
                </div>

                <div className="border-l-4 border-accent pl-3 sm:pl-4 py-2">
                  <h4 className="font-bold text-sm sm:text-base text-foreground">7. Verrouiller l'application</h4>
                  <p className="text-xs sm:text-sm text-foreground/70">
                    Cadenas en haut à gauche verrouille l'app et demande votre code. Mot de passe oublié réinitialise
                    tout.
                  </p>
                </div>

                <div className="border-l-4 border-accent pl-3 sm:pl-4 py-2">
                  <h4 className="font-bold text-sm sm:text-base text-foreground">
                    8. Code de sécurité dans le bloc-notes
                  </h4>
                  <p className="text-xs sm:text-sm text-foreground/70">
                    Lorsque vous êtes dans le bloc-notes et que vous tapez trois fois le chiffre 0 (000) puis appuyez
                    sur "Enregistrer", l'application se verrouille et vous demande de saisir à nouveau votre mot de
                    passe. Cela permet de sécuriser rapidement l'application sans y retourner directement si le code n'a
                    pas été correctement entré. <strong>Important :</strong> si vous cliquez sur "Mot de passe oublié"
                    depuis l'écran de verrouillage, vous serez redirigé vers le bloc-notes et vous devrez également
                    taper "000" puis "Enregistrer" pour compléter la réinitialisation et retourner à l'application
                    déverrouillée.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3 bg-secondary/30 p-2 sm:p-3 rounded-lg sm:rounded-lg border border-border/50">
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  checked={dontShowWelcomeAgain}
                  onChange={(e) => setDontShowWelcomeAgain(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-accent flex-shrink-0 mt-0.5"
                />
                <label htmlFor="dontShowAgain" className="text-xs sm:text-sm text-foreground/80 cursor-pointer">
                  Ne plus afficher ce message
                </label>
              </div>

              <Button
                onClick={() => {
                  setShowExplanation(false)
                  if (dontShowWelcomeAgain) {
                    localStorage.setItem("hasSeenExplanation", "true")
                  }
                }}
                className="w-full bg-accent hover:bg-accent/80 text-foreground font-bold rounded-lg sm:rounded-xl py-4 sm:py-6 transition-colors text-sm sm:text-base"
              >
                Commencer
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl p-3 sm:p-4">
          <PinConfigModal
            pinMode={pinMode}
            autoLockTime={autoLockTime}
            onSave={handleSavePinSettings}
            onClose={() => setShowPinModal(false)}
            onRemove={handleRemovePin}
            hasPin={!!appPin}
          />
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl p-3 sm:p-4">
          <Card className="w-full max-w-sm sm:max-w-md border border-border shadow-2xl rounded-xl sm:rounded-2xl bg-card">
            <CardHeader className="border-b border-border/50 px-3 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg font-bold text-foreground">Importer données</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 px-3 sm:px-6">
              <p className="text-xs sm:text-sm text-foreground/70">Collez le JSON exporté ci-dessous:</p>
              <Textarea
                placeholder='{"password":"ABC","code":"1,2,3"}'
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="font-mono min-h-[100px] sm:min-h-[120px] rounded-lg sm:rounded-xl border border-border focus:border-accent focus:ring-2 transition-all resize-none text-xs sm:text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowImportModal(false)}
                  variant="outline"
                  className="flex-1 rounded-lg sm:rounded-xl hover:bg-secondary/50 transition-colors text-xs sm:text-sm"
                >
                  Annuler
                </Button>
                <Button
                  onClick={applyImport}
                  className="flex-1 bg-accent hover:bg-accent/80 text-foreground font-bold rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm"
                  disabled={!importText.trim()}
                >
                  Appliquer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
          {appPin && (
            <div className="relative group">
              <Button
                onClick={handleLockApp}
                size="icon"
                variant="outline"
                className="rounded-lg sm:rounded-xl border border-border hover:bg-accent/10 hover:border-accent/50 transition-all bg-transparent h-8 w-8 sm:h-10 sm:w-10"
              >
                {isAppLocked ? (
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                ) : (
                  <LockOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                Verrouillage
              </span>
            </div>
          )}
        </div>

        <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
          <button
            onClick={handleSettingsClick}
            className={`p-1.5 sm:p-2 rounded-lg hover:bg-accent/20 transition-all bg-accent ${
              isTransitioning ? "opacity-50" : "opacity-100"
            }`}
            title="Paramètres"
            disabled={isTransitioning}
          >
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </button>
        </div>

        <div className="relative inline-block">
          <Button
            onClick={handleGenerateRandom}
            className="bg-accent hover:bg-accent/80 text-foreground font-bold rounded-lg sm:rounded-xl px-4 sm:px-8 h-9 sm:h-11 text-xs sm:text-sm"
          >
            <Shuffle className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            <span className="font-bold hidden sm:inline">Générer</span>
            <span className="font-bold sm:hidden">Gen</span>
          </Button>
        </div>

        <div className="relative group">
          <Button
            onClick={() => setIsVisible(!isVisible)}
            variant="outline"
            size="icon"
            className="rounded-lg sm:rounded-xl border border-border hover:bg-accent/10 hover:border-accent/50 transition-all h-8 w-8 sm:h-10 sm:w-10"
          >
            {isVisible ? <Eye className="h-4 w-4 sm:h-5 sm:w-5" /> : <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
            Confidentialité
          </span>
        </div>

        <Button
          onClick={() => setShowPinModal(true)}
          variant="outline"
          size="icon"
          className="rounded-lg sm:rounded-xl border border-border hover:bg-accent/10 hover:border-accent/50 transition-all h-8 w-8 sm:h-10 sm:w-10"
          title="Code de sécurité"
        >
          <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <Button
          onClick={() => setShowHistoryModal(true)}
          variant="outline"
          size="icon"
          className="rounded-lg sm:rounded-xl border border-border hover:bg-accent/10 hover:border-accent/50 transition-all h-8 w-8 sm:h-10 sm:w-10"
          title="Historique"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0"></path>
            <path d="M12 7v5l4 2"></path>
          </svg>
        </Button>
      </div>

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <Card className="w-full max-w-2xl border border-border shadow-2xl rounded-xl sm:rounded-2xl bg-card max-h-[80vh] flex flex-col">
            <CardHeader className="border-b border-border/50 sticky top-0 bg-card flex flex-row items-center justify-between flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg font-bold text-foreground">Historique</CardTitle>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 sm:p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1 space-y-2 sm:space-y-3 pt-4 sm:pt-6 pb-4 sm:pb-6 px-3 sm:px-6 scrollbar-hide">
              {history.length === 0 ? (
                <p className="text-center text-foreground/50 py-8 text-sm">Aucun enregistrement</p>
              ) : (
                history.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-secondary/50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border/50 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground/50">{new Date(entry.timestamp).toLocaleString()}</p>
                        {entry.encryptResult && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-foreground/70 mb-1">Chiffré:</p>
                            <div className="space-y-2">
                              <p className="font-mono text-xs bg-background/50 p-2 rounded break-all max-h-[60px] overflow-hidden">
                                {entry.encryptPassword} | {entry.encryptCode} → {entry.encryptResult}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${entry.encryptPassword} | ${entry.encryptCode}`)
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 rounded-lg text-xs h-7 hover:bg-accent/20"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copier clé
                                </Button>
                                <Button
                                  onClick={() => {
                                    navigator.clipboard.writeText(entry.encryptResult)
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 rounded-lg text-xs h-7 hover:bg-accent/20"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copier texte
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        {entry.decryptResult && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-foreground/70 mb-1">Déchiffré:</p>
                            <div className="space-y-2">
                              <p className="font-mono text-xs bg-background/50 p-2 rounded break-all max-h-[60px] overflow-hidden">
                                {entry.decryptPassword} | {entry.decryptCode} → {entry.decryptResult}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${entry.decryptPassword} | ${entry.decryptCode}`)
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 rounded-lg text-xs h-7 hover:bg-accent/20"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copier clé
                                </Button>
                                <Button
                                  onClick={() => {
                                    navigator.clipboard.writeText(entry.decryptResult)
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 rounded-lg text-xs h-7 hover:bg-accent/20"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copier texte
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleDeleteFromHistory(entry.id)}
                        size="sm"
                        variant="ghost"
                        className="flex-shrink-0 hover:bg-destructive/10 text-destructive h-7 w-7 sm:h-8 sm:w-8"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border border-border shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl sm:rounded-2xl bg-card backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-base sm:text-xl font-bold text-foreground">Chiffrer</CardTitle>
            <Button
              onClick={handleExport}
              size="icon"
              variant="outline"
              className="rounded-lg sm:rounded-xl border border-border hover:bg-accent/10 hover:border-accent/50 transition-all bg-transparent h-8 w-8 sm:h-10 sm:w-10"
              title="Exporter"
            >
              {copiedEncrypt ? (
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              ) : (
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5 pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="space-y-2">
              <Label htmlFor="encrypt-password" className="font-semibold text-foreground/90 text-xs sm:text-sm">
                Mot de passe
              </Label>
              <Input
                id="encrypt-password"
                type={isVisible ? "text" : "password"}
                placeholder={isVisible ? "Ex: BLINDE" : ""}
                value={encryptPassword}
                onChange={(e) => handleEncryptPasswordChange(e.target.value)}
                className={`font-mono uppercase rounded-lg sm:rounded-xl border focus:ring-2 transition-all overflow-x-hidden whitespace-nowrap text-xs sm:text-sm ${
                  encryptPasswordHasDuplicates
                    ? "border-destructive focus:ring-destructive/30"
                    : "border-border hover:border-border/70 focus:border-accent"
                }`}
              />
              {encryptPasswordHasDuplicates && (
                <p className="text-xs text-destructive font-medium">Lettres répétées non autorisées</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="encrypt-code" className="font-semibold text-foreground/90 text-xs sm:text-sm">
                Code
              </Label>
              <Input
                id="encrypt-code"
                type={isVisible ? "text" : "password"}
                placeholder={isVisible ? "Ex: 0,0,0,0,0,0" : ""}
                value={encryptCode}
                onChange={(e) => handleEncryptCodeChange(e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(e, setEncryptCode, () => encryptCode)}
                className="font-mono rounded-lg sm:rounded-xl border border-border hover:border-border/70 focus:border-accent focus:ring-2 transition-all overflow-x-hidden whitespace-nowrap text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="encrypt-text" className="font-semibold text-foreground/90 text-xs sm:text-sm">
                Texte
              </Label>
              {isVisible ? (
                <Textarea
                  id="encrypt-text"
                  placeholder="Ex: texte"
                  value={encryptText}
                  onChange={(e) => setEncryptText(e.target.value)}
                  className="font-mono uppercase min-h-[80px] sm:min-h-[100px] rounded-lg sm:rounded-xl border border-border hover:border-border/70 focus:border-accent focus:ring-2 transition-all overflow-hidden resize-none text-xs sm:text-sm"
                />
              ) : (
                <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-border">
                  <Textarea
                    id="encrypt-text"
                    placeholder=""
                    value={encryptText}
                    onChange={(e) => {
                      setEncryptText(e.target.value)
                      setEncryptTextCursorPos(e.target.selectionStart)
                    }}
                    onSelect={(e) => setEncryptTextCursorPos((e.target as HTMLTextAreaElement).selectionStart)}
                    onClick={(e) => setEncryptTextCursorPos((e.target as HTMLTextAreaElement).selectionStart)}
                    onKeyUp={(e) => setEncryptTextCursorPos((e.target as HTMLTextAreaElement).selectionStart)}
                    className="font-mono uppercase min-h-[80px] sm:min-h-[100px] rounded-lg sm:rounded-xl border border-border hover:border-border/70 focus:border-accent focus:ring-2 transition-all overflow-hidden resize-none text-xs sm:text-sm"
                    style={{ color: "transparent", caretColor: "transparent" }}
                  />
                  <div className="absolute inset-0 bg-transparent border border-transparent rounded-lg sm:rounded-xl p-2 sm:p-3 font-mono text-xs sm:text-sm pointer-events-none flex items-start overflow-hidden">
                    <div className="overflow-hidden max-h-[80px] sm:max-h-[100px] w-full">
                      {renderTextWithCursor(encryptText, encryptTextCursorPos)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {encryptError && <p className="text-xs sm:text-sm text-destructive font-medium">{encryptError}</p>}

            <div className="flex gap-2">
              <Button
                onClick={handleEncrypt}
                className="flex-1 bg-accent hover:bg-accent/80 text-foreground font-bold rounded-lg sm:rounded-xl py-4 sm:py-6 transition-colors text-xs sm:text-sm"
                disabled={!encryptPassword || !encryptCode || !encryptText}
              >
                Chiffrer
              </Button>
            </div>

            {encryptResult && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3">
                <Label className="font-semibold text-foreground/90 text-xs sm:text-sm">Résultat</Label>
                <div className="flex items-start gap-2 sm:gap-3 bg-secondary/70 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-border/50">
                  <div className="flex-1 font-mono text-xs sm:text-sm break-all min-w-0">
                    {isVisible ? encryptResult : "•".repeat(encryptResult.length)}
                  </div>
                  <Button
                    onClick={() => copyToClipboard(encryptResult, "encrypt")}
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0 hover:bg-accent/20 transition-colors"
                  >
                    {copiedEncrypt ? <Check className="h-4 w-4 text-foreground" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl sm:rounded-2xl bg-card backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-base sm:text-xl font-bold text-foreground">Déchiffrer</CardTitle>
            <Button
              onClick={handleImportData}
              size="icon"
              variant="outline"
              className="rounded-lg sm:rounded-xl border border-border hover:bg-accent/10 hover:border-accent/50 transition-all bg-transparent h-8 w-8 sm:h-10 sm:w-10"
              title="Importer"
            >
              {copiedDecrypt ? (
                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              ) : (
                <Clipboard className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5 pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="space-y-2">
              <Label htmlFor="decrypt-password" className="font-semibold text-foreground/90 text-xs sm:text-sm">
                Mot de passe
              </Label>
              <Input
                id="decrypt-password"
                type={isVisible ? "text" : "password"}
                placeholder={isVisible ? "Ex: BLINDE" : ""}
                value={decryptPassword}
                onChange={(e) => handleDecryptPasswordChange(e.target.value)}
                className={`font-mono uppercase rounded-lg sm:rounded-xl border focus:ring-2 transition-all overflow-x-hidden whitespace-nowrap text-xs sm:text-sm ${
                  decryptPasswordHasDuplicates
                    ? "border-destructive focus:ring-destructive/30"
                    : "border-border hover:border-border/70 focus:border-accent"
                }`}
              />
              {decryptPasswordHasDuplicates && (
                <p className="text-xs text-destructive font-medium">Lettres répétées non autorisées</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="decrypt-code" className="font-semibold text-foreground/90 text-xs sm:text-sm">
                Code
              </Label>
              <Input
                id="decrypt-code"
                type={isVisible ? "text" : "password"}
                placeholder={isVisible ? "Ex: 0,0,0,0,0,0" : ""}
                value={decryptCode}
                onChange={(e) => handleDecryptCodeChange(e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(e, setDecryptCode, () => decryptCode)}
                onBlur={() => setDecryptCode(validateAndFormatCode(decryptCode))}
                className="w-full font-mono rounded-lg sm:rounded-xl border border-border hover:border-border/70 focus:border-accent focus:ring-2 transition-all overflow-x-hidden whitespace-nowrap text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="decrypt-numbers" className="font-semibold text-foreground/90 text-xs sm:text-sm">
                Code Chiffré
              </Label>
              {isVisible ? (
                <Textarea
                  id="decrypt-numbers"
                  placeholder="Ex: texte"
                  value={decryptNumbers}
                  onChange={(e) => setDecryptNumbers(e.target.value)}
                  className="font-mono min-h-[80px] sm:min-h-[100px] rounded-lg sm:rounded-xl border border-border hover:border-border/70 focus:border-accent focus:ring-2 transition-all overflow-hidden resize-none text-xs sm:text-sm"
                />
              ) : (
                <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-border">
                  <Textarea
                    id="decrypt-numbers"
                    placeholder=""
                    value={decryptNumbers}
                    onChange={(e) => {
                      setDecryptNumbers(e.target.value)
                      setDecryptNumbersCursorPos(e.target.selectionStart)
                    }}
                    onSelect={(e) => setDecryptNumbersCursorPos((e.target as HTMLTextAreaElement).selectionStart)}
                    onClick={(e) => setDecryptNumbersCursorPos((e.target as HTMLTextAreaElement).selectionStart)}
                    onKeyUp={(e) => setDecryptNumbersCursorPos((e.target as HTMLTextAreaElement).selectionStart)}
                    className="font-mono min-h-[80px] sm:min-h-[100px] rounded-lg sm:rounded-xl border border-border hover:border-border/70 focus:border-accent focus:ring-2 transition-all overflow-hidden resize-none text-xs sm:text-sm"
                    style={{ color: "transparent", caretColor: "transparent" }}
                  />
                  <div className="absolute inset-0 bg-transparent border border-transparent rounded-lg sm:rounded-xl p-2 sm:p-3 font-mono text-xs sm:text-sm pointer-events-none flex items-start overflow-hidden">
                    <div className="overflow-hidden max-h-[80px] sm:max-h-[100px] w-full">
                      {renderTextWithCursor(decryptNumbers, decryptNumbersCursorPos)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {decryptError && <p className="text-xs sm:text-sm text-destructive font-medium">{decryptError}</p>}

            <Button
              onClick={handleDecrypt}
              className="w-full bg-accent hover:bg-accent/80 text-foreground font-bold rounded-lg sm:rounded-xl py-4 sm:py-6 transition-colors text-xs sm:text-sm"
              disabled={!decryptPassword || !decryptCode || !decryptNumbers}
            >
              Déchiffrer
            </Button>

            {decryptResult && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3">
                <Label className="font-semibold text-foreground/90 text-xs sm:text-sm">Résultat</Label>
                <div className="flex items-start gap-2 sm:gap-3 bg-secondary/70 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-border/50">
                  <div className="flex-1 font-mono text-xs sm:text-sm break-all min-w-0">
                    {isVisible ? decryptResult : "•".repeat(decryptResult.length)}
                  </div>
                  <Button
                    onClick={() => copyToClipboard(decryptResult, "decrypt")}
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0 hover:bg-accent/20 transition-colors"
                  >
                    {copiedDecrypt ? <Check className="h-4 w-4 text-foreground" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl sm:rounded-2xl bg-card backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 px-3 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-base sm:text-xl font-bold text-foreground">Tableau Interactif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 px-3 sm:px-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs sm:text-sm text-foreground/70 font-medium">
                {selectedStartLetter
                  ? `Point de départ: ${selectedStartLetter}`
                  : "Cliquez sur une lettre pour démarrer"}
              </p>
              {selectedStartLetter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStartLetter(null)}
                  className="rounded-lg text-xs h-7 hover:bg-accent/20"
                >
                  Réinitialiser
                </Button>
              )}
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-12 gap-1.5 sm:gap-2 max-w-full mx-auto">
              {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter, index) => {
                const { baseValues } = calculateAlphabetValues()
                const isPasswordLetter = getPasswordLetters().includes(letter)
                const isSelected = selectedStartLetter === letter
                const cumulativeValue = selectedStartLetter
                  ? calculateCumulativeValue(selectedStartLetter, letter, baseValues)
                  : baseValues[letter]

                // Classes de positionnement pour Y et Z
                let gridClass = ""
                if (letter === "Y") {
                  gridClass = "col-start-2 sm:col-start-4 lg:col-start-5"
                } else if (letter === "Z") {
                  gridClass = "col-start-5 sm:col-start-7 lg:col-start-9"
                }

                return (
                  <button
                    key={letter}
                    onClick={() => isPasswordLetter && setSelectedStartLetter(letter)}
                    disabled={!isPasswordLetter}
                    className={`
                      flex flex-col items-center justify-center aspect-square p-1 sm:p-2 rounded-lg sm:rounded-lg transition-all duration-200
                      font-semibold text-xs sm:text-sm
                      ${gridClass}
                      ${isPasswordLetter ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-30"}
                      ${
                        isSelected
                          ? "bg-accent text-foreground shadow-lg scale-110"
                          : isPasswordLetter
                            ? "bg-accent/30 border border-border hover:border-accent/50 hover:bg-accent/40"
                            : "bg-muted/20 border border-border/30"
                      }
                    `}
                  >
                    <span>{letter}</span>
                    <span className="text-xs opacity-75">{cumulativeValue}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PinConfigModal({
  pinMode,
  autoLockTime,
  onSave,
  onClose,
  onRemove,
  hasPin,
}: {
  pinMode: "letter" | "number"
  autoLockTime: number | null | "onClose"
  onSave: (pin: string, mode: "letter" | "number", autoLock: number | null | "onClose") => void
  onClose: () => void
  onRemove: () => void
  hasPin: boolean
}) {
  const [tempPin, setTempPin] = useState("")
  const [tempMode, setTempMode] = useState<"letter" | "number">(pinMode)
  const [tempAutoLock, setTempAutoLock] = useState<number | null | "onClose">(autoLockTime)

  const lockOptions = [
    { label: "Jamais", value: null },
    { label: "À la fermeture de l'application", value: "onClose" },
    { label: "Après 3 secondes", value: 3000 },
    { label: "Après 30 secondes", value: 30000 },
    { label: "Après 1 minute", value: 60000 },
    { label: "Après 3 minutes", value: 180000 },
    { label: "Après 5 minutes", value: 300000 },
    { label: "Après 10 minutes", value: 600000 },
    { label: "Après 15 minutes", value: 900000 },
    { label: "Après 30 minutes", value: 1800000 },
    { label: "Après 1 heure", value: 3600000 },
  ]

  return (
    <Card className="w-full max-w-sm sm:max-w-md border border-border shadow-2xl rounded-xl sm:rounded-2xl bg-card">
      <CardHeader className="border-b border-border/50 px-3 sm:px-6 py-3 sm:py-4">
        <CardTitle className="text-base sm:text-lg font-bold text-foreground">Code de sécurité</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 px-3 sm:px-6">
        <div className="space-y-2">
          <Label className="font-semibold text-foreground/90 text-xs sm:text-sm">Code</Label>
          <Input
            type="password"
            placeholder="Entrez votre code"
            value={tempPin}
            onChange={(e) => setTempPin(e.target.value)}
            className="rounded-lg sm:rounded-xl border border-border focus:border-accent focus:ring-2 transition-all text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="font-semibold text-foreground/90 text-xs sm:text-sm">Type</Label>
          <div className="flex gap-2">
            {(["letter", "number"] as const).map((mode) => (
              <Button
                key={mode}
                variant={tempMode === mode ? "default" : "outline"}
                onClick={() => setTempMode(mode)}
                className="flex-1 rounded-lg sm:rounded-xl text-xs sm:text-sm capitalize"
              >
                {mode === "letter" ? "Lettre" : "Chiffre"}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-semibold text-foreground/90 text-xs sm:text-sm">Verrouillage automatique</Label>
          <select
            value={tempAutoLock === "onClose" ? "onClose" : (tempAutoLock ?? "null")}
            onChange={(e) => {
              const val = e.target.value
              setTempAutoLock(val === "null" ? null : val === "onClose" ? "onClose" : Number.parseInt(val))
            }}
            className="w-full px-2 sm:px-3 py-2 rounded-lg sm:rounded-xl border border-background text-foreground focus:border-accent focus:ring-2 transition-all text-xs sm:text-sm"
          >
            {lockOptions.map((option) => (
              <option
                key={String(option.value)}
                value={String(option.value) === "null" ? "null" : String(option.value)}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 rounded-lg sm:rounded-xl hover:bg-secondary/50 transition-colors bg-transparent text-xs sm:text-sm"
          >
            Annuler
          </Button>
          <Button
            onClick={() => onSave(tempPin, tempMode, tempAutoLock)}
            className="flex-1 bg-accent hover:bg-accent/80 text-foreground font-bold rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm"
            disabled={!tempPin}
          >
            Enregistrer
          </Button>
        </div>

        {hasPin && (
          <Button
            onClick={onRemove}
            variant="destructive"
            className="w-full rounded-lg sm:rounded-xl text-xs sm:text-sm"
          >
            Supprimer le Code
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
