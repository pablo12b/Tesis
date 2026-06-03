import { Sidebar } from "./sidebar"
import { DashboardHeader } from "./header"
import { StatCard } from "./stat-card"
import { RiskChart } from "./risk-chart"
import { EmotionsChart } from "./emotions-chart"
import { StressChart } from "./stress-chart"
import { SourcesChart } from "./sources-chart"
import { ComparisonChart } from "./comparison-chart"
import { SidebarProvider } from "@/components/ui/sidebar"
import type { Estadisticas } from "@/lib/types"
import { Users, AlertTriangle, MessageSquare, Activity } from "lucide-react"

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
  const statsAltoRiesgo = estadisticas.riesgo.find(r => r.nivel_riesgo === 'Alto')?.cantidad || 0
  const statsEmocionPrincipal = [...estadisticas.emociones].sort((a,b) => b.cantidad - a.cantidad)[0]?.emocion_principal || 'N/A'

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
          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Registros"
                value={estadisticas.total.toLocaleString()}
                subtitle={`Datos recolectados para ${activeTab}`}
                icon={Users}
              />
              <StatCard
                title="Casos de Alto Riesgo"
                value={statsAltoRiesgo.toLocaleString()}
                subtitle="Requieren atención prioritaria"
                icon={AlertTriangle}
                className="[&_.text-primary]:text-destructive [&_.bg-primary\/10]:bg-destructive/10"
              />
              <StatCard
                title="Emoción Dominante"
                value={statsEmocionPrincipal}
                subtitle="Sentimiento más recurrente"
                icon={MessageSquare}
              />
              <StatCard
                title="Factores de Estrés"
                value={estadisticas.estres.length}
                subtitle="Categorías identificadas"
                icon={Activity}
              />
            </div>
            
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="lg:col-span-4">
                <EmotionsChart data={estadisticas.emociones} />
              </div>
              <div className="lg:col-span-3">
                <RiskChart data={estadisticas.riesgo} />
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
