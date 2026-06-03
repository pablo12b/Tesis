import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, RefreshCw } from "lucide-react"

interface HeaderProps {
  universidades: string[]
  activeTab: string
  onTabChange: (u: string) => void
}

export function DashboardHeader({ universidades, activeTab, onTabChange }: HeaderProps) {
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
            <TabsList>
              {universidades.map((u) => (
                <TabsTrigger key={u} value={u}>
                  {u}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Actualizar
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
