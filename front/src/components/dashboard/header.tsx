import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, RefreshCw, Loader2 } from "lucide-react"

interface HeaderProps {
  universidades: string[]
  activeTab: string
  onTabChange: (u: string) => void
}

export function DashboardHeader({ universidades, activeTab, onTabChange }: HeaderProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleGlobalUpdate = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch('http://localhost:5000/api/scraper/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institucion: 'TODAS' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      alert('¡Actualización de todas las universidades completada!')
      window.location.reload()
    } catch (error: any) {
      alert('Hubo un error al actualizar: ' + error.message)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex h-16 items-center justify-between px-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">NE</span>
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              Dashboard
            </h1>
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-foreground">
              Análisis de Bienestar Estudiantil
            </h1>
          </div>
        </div>

        {/* The requested university tabs */}
        <div className="flex-1 flex justify-center overflow-x-auto hide-scrollbar">
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-fit">
            <TabsList className="gap-2 p-1.5 bg-muted/60 border border-border/50 rounded-xl">
              {universidades.map((u) => (
                <TabsTrigger
                  key={u}
                  value={u}
                  className="px-6 py-2.5 text-base font-semibold transition-all rounded-lg hover:bg-primary/20 hover:text-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                >
                  {u}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hidden sm:flex"
            onClick={handleGlobalUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isUpdating ? "Actualizando Todas..." : "Actualizar Todas"}
          </Button>

          <Button variant="default" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>
    </header>
  )
}
