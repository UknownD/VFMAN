import { CipherTool } from "@/components/cipher-tool"
import { Lock } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-16 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="p-3 rounded-full bg-accent/50">
              <Lock className="h-8 w-8 text-foreground" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground font-serif">Chiffrement Sécurisé</h1>
          </div>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed font-light">
            Protégez vos messages avec un système de cryptage avancé basé sur un mot de passe personnalisé
          </p>
        </div>

        <CipherTool />
      </div>
    </main>
  )
}
