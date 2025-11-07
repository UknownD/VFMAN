"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const [totalLength, setTotalLength] = useState<number>(6)
  const [isLoading, setIsLoading] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem("generatorSettings") || "{}")
    if (settings.totalLength) setTotalLength(settings.totalLength)
  }, [])

  const saveSettings = () => {
    localStorage.setItem(
      "generatorSettings",
      JSON.stringify({
        totalLength,
      }),
    )
    setIsLoading(true)
    setTimeout(() => {
      router.push("/")
    }, 100)
  }

  // Add smooth back navigation with transition
  const handleBackClick = () => {
    setIsLoading(true)
    setTimeout(() => {
      router.push("/")
    }, 100)
  }

  return (
    <main className="min-h-screen bg-background animate-in fade-in duration-300">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <button
          onClick={handleBackClick}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 mb-8 text-foreground/70 hover:text-foreground transition-all ${
            isLoading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Retour</span>
        </button>

        <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-75">
          <h1 className="text-4xl font-bold text-foreground">Paramètres de Génération</h1>
          <p className="text-foreground/60">Personnalisez la longueur des mots de passe générés</p>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <Card className="border border-border shadow-lg rounded-2xl bg-card">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-xl text-foreground">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-4">
                <Label htmlFor="total-length" className="font-semibold text-foreground/90">
                  Nombre de caractères
                </Label>
                <p className="text-sm text-foreground/60">
                  Les mots de passe sont générés avec des lettres aléatoires sans répétition
                </p>
                <div className="flex flex-col gap-4">
                  <input
                    id="total-length"
                    type="range"
                    min="2"
                    max="26"
                    value={totalLength}
                    onChange={(e) => setTotalLength(Number.parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-bold text-accent">{totalLength}</span>
                    <span className="text-sm text-foreground/60">Max: 26</span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={saveSettings}
                disabled={isLoading}
                className={`w-full bg-accent hover:bg-accent/80 text-foreground font-bold rounded-xl py-6 transition-all mt-8 ${
                  isLoading ? "opacity-50" : ""
                }`}
              >
                {isLoading ? "Chargement..." : "Enregistrer les paramètres"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
