"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

export function Notepad() {
  const [noteContent, setNoteContent] = useState("")

  useEffect(() => {
    const savedNote = localStorage.getItem("notepadContent")
    if (savedNote) {
      setNoteContent(savedNote)
    }
  }, [])

  const handleSaveNote = () => {
    localStorage.setItem("notepadContent", noteContent)
  }

  return (
    <div className="min-h-screen bg-background p-8 flex items-center justify-center">
      <Card className="w-full max-w-2xl border border-border shadow-lg rounded-2xl bg-card">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-2xl font-bold text-foreground">Bloc-Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Textarea
            placeholder="Écrivez vos notes ici..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="font-sans min-h-[400px] rounded-xl border border-border hover:border-border/70 focus:border-accent focus:ring-2 transition-all resize-none"
          />
          <Button
            onClick={handleSaveNote}
            className="w-full bg-accent hover:bg-accent/80 text-foreground font-bold rounded-xl py-6 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="h-5 w-5" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
