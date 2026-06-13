import { Sidebar } from "./sidebar"
import { DashboardHeader } from "./header"
import { StatCard } from "./stat-card"
import { EmotionsChart } from "./emotions-chart"
import { StressChart } from "./stress-chart"
import { SourcesChart } from "./sources-chart"
import { ComparisonChart } from "./comparison-chart"
import { SidebarProvider } from "@/components/ui/sidebar"
import type { Estadisticas } from "@/lib/types"
import { Users, Heart, MessageSquare, Eye, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface DashboardProps {
  universidades: string[]
  activeTab: string
  onTabChange: (u: string) => void
  estadisticas: Estadisticas
  todasLasEstadisticas: Record<string, Estadisticas>
}

export default function Dashboard({
  universidades,
  activeTab,
  onTabChange,
  estadisticas,
  todasLasEstadisticas,
}: DashboardProps) {
  const comparisonData = Object.values(todasLasEstadisticas)
  
  // Encontrar la emoción principal basada en los porcentajes
  const statsEmocionPrincipal = estadisticas.emociones.length > 0 
    ? [...estadisticas.emociones].sort((a,b) => b.cantidad - a.cantidad)[0]?.emocion_principal 
    : 'N/A'

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-sans antialiased text-foreground">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <DashboardHeader
            universidades={universidades}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
          <div key={activeTab} className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500 fill-mode-both">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Publicaciones"
                value={estadisticas.metricas.publicaciones.toLocaleString()}
                subtitle={`Posts en ${activeTab}`}
                icon={FileText}
              />
              <StatCard
                title="Comentarios Totales"
                value={estadisticas.metricas.comentarios.toLocaleString()}
                subtitle="Interacciones escritas"
                icon={MessageSquare}
              />
              <StatCard
                title="Vistas Totales"
                value={estadisticas.metricas.views.toLocaleString()}
                subtitle="Alcance global"
                icon={Eye}
              />
              <StatCard
                title="Me Gusta"
                value={estadisticas.metricas.likes.toLocaleString()}
                subtitle="Reacciones recibidas"
                icon={Heart}
                className="[&_.text-primary]:text-red-500 [&_.bg-primary\/10]:bg-red-500/10"
              />
            </div>
            
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="lg:col-span-4">
                <Card className="h-full flex flex-col border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Narrativa Emocional General</CardTitle>
                    <CardDescription>Resumen macro-analítico generado por Inteligencia Artificial</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 text-sm md:text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {estadisticas.narrativa}
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-3">
                <EmotionsChart data={estadisticas.emociones} />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="lg:col-span-3">
                <StressChart data={estadisticas.estres} />
              </div>
              <div className="lg:col-span-4">
                <SourcesChart data={estadisticas.fuentes} />
              </div>
            </div>

            <div className="mt-4">
              <ComparisonChart data={comparisonData} />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
