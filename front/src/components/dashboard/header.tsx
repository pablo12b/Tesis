import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, RefreshCw, Loader2 } from "lucide-react"

interface HeaderProps {
  activePage: string
}

export function DashboardHeader({ activePage }: HeaderProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    setIsUpdating(true)
    const targetInstitucion = activePage === "Vista Global" ? "TODAS" : activePage;
    try {
      const response = await fetch('http://localhost:5000/api/scraper/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institucion: targetInstitucion }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      alert(`¡Actualización de ${targetInstitucion} completada!`)
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

        <div className="flex-1 flex justify-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {activePage}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 hidden sm:flex"
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isUpdating ? "Sincronizando..." : `Sincronizar ${activePage === "Vista Global" ? "Todo" : activePage}`}
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
