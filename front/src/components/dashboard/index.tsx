import { useEffect, useRef } from "react"
import { Sidebar } from "./sidebar"
import { DashboardHeader } from "./header"
import { StatCard } from "./stat-card"
import { EmotionsChart } from "./emotions-chart"
import { StressChart } from "./stress-chart"
import { SourcesChart } from "./sources-chart"
import { ComparisonChart } from "./comparison-chart"
import { HistoricoChart } from "./historico-chart"
import { ConfiguracionPanel } from "./configuracion"
import { SidebarProvider } from "@/components/ui/sidebar"
import type { Estadisticas } from "@/lib/types"
import { Heart, MessageSquare, Eye, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface DashboardProps {
  universidades: string[]
  todasLasEstadisticas: Record<string, Estadisticas>
  globalNarrativa: any
  activePage: string
  onPageChange: (page: string) => void
}

export default function Dashboard({
  universidades,
  todasLasEstadisticas,
  globalNarrativa,
  activePage,
  onPageChange,
}: DashboardProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [activePage])

  const comparisonData = Object.values(todasLasEstadisticas)
  const todas = Object.values(todasLasEstadisticas)
  const totales = todas.reduce((acc, curr) => ({
    publicaciones: acc.publicaciones + curr.metricas.publicaciones,
    comentarios: acc.comentarios + curr.metricas.comentarios,
    likes: acc.likes + curr.metricas.likes,
    views: acc.views + curr.metricas.views,
  }), { publicaciones: 0, comentarios: 0, likes: 0, views: 0 })

  const maxPubs = Math.max(...todas.map(u => u.metricas.publicaciones))
  const maxComs = Math.max(...todas.map(u => u.metricas.comentarios))
  const maxLikes = Math.max(...todas.map(u => u.metricas.likes))

  // Calcular historico global
  const historicoGlobalMap = new Map<string, { total_publicaciones: number, total_comentarios: number, total_likes: number, total_views: number }>()
  todas.forEach(univ => {
    univ.historico?.forEach(dia => {
      if (!historicoGlobalMap.has(dia.fecha)) {
        historicoGlobalMap.set(dia.fecha, { total_publicaciones: 0, total_comentarios: 0, total_likes: 0, total_views: 0 })
      }
      const actual = historicoGlobalMap.get(dia.fecha)!
      actual.total_publicaciones += dia.total_publicaciones || 0
      actual.total_comentarios += dia.total_comentarios || 0
      actual.total_likes += dia.total_likes || 0
      actual.total_views += dia.total_views || 0
    })
  })
  const historicoGlobal = Array.from(historicoGlobalMap.entries()).map(([fecha, datos]) => ({
    fecha,
    ...datos
  })).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-sans antialiased text-foreground">
        <Sidebar activePage={activePage} onPageChange={onPageChange} universidades={universidades} />
        <main className="flex-1 flex flex-col min-w-0">
          <DashboardHeader activePage={activePage} />
          <div ref={scrollRef} key={activePage} className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500 fill-mode-both">
            
            {/* VISTA GLOBAL */}
            {activePage === "Vista Global" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-gradient-to-r from-primary/10 via-background to-background p-6 rounded-2xl border border-primary/20">
                  <h2 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Métricas Globales de Universidades
                  </h2>
                  <p className="text-muted-foreground text-lg">Sumatoria total de interacciones y alcance en todas las instituciones analizadas.</p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="Total Publicaciones"
                    value={totales.publicaciones.toLocaleString()}
                    subtitle="Narrativas encontradas"
                    icon={FileText}
                    className="border-primary/20 bg-primary/5"
                  />
                  <StatCard
                    title="Total Comentarios"
                    value={totales.comentarios.toLocaleString()}
                    subtitle="Suma global"
                    icon={MessageSquare}
                    className="border-blue-500/20 bg-blue-500/5 [&_.text-primary]:text-blue-500 [&_.bg-primary\/10]:bg-blue-500/10"
                  />
                  <StatCard
                    title="Total Vistas"
                    value={totales.views.toLocaleString()}
                    subtitle="Alcance acumulado"
                    icon={Eye}
                    className="border-emerald-500/20 bg-emerald-500/5 [&_.text-primary]:text-emerald-500 [&_.bg-primary\/10]:bg-emerald-500/10"
                  />
                  <StatCard
                    title="Total Me Gusta"
                    value={totales.likes.toLocaleString()}
                    subtitle="Impacto global"
                    icon={Heart}
                    className="border-red-500/20 bg-red-500/5 [&_.text-primary]:text-red-500 [&_.bg-primary\/10]:bg-red-500/10"
                  />
                </div>

                {globalNarrativa && (
                  <>
                    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                      <div className="lg:col-span-4">
                        <Card className="h-full flex flex-col border-border/50 bg-card/50 backdrop-blur-sm">
                          <CardHeader>
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Narrativa Emocional General (Global)</CardTitle>
                            <CardDescription>Resumen meta-analítico generado por Inteligencia Artificial</CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1 text-sm md:text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                            {globalNarrativa.narrativa_general}
                          </CardContent>
                        </Card>
                      </div>
                      <div className="lg:col-span-3">
                        <EmotionsChart data={globalNarrativa.porcentajes_emociones} />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                      <div className="lg:col-span-3">
                        <StressChart data={globalNarrativa.factores_riesgo} />
                      </div>
                      <div className="lg:col-span-4">
                        <ComparisonChart data={comparisonData} />
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-4">
                  <HistoricoChart data={historicoGlobal} />
                </div>
              </div>
            )}

            {/* VISTA INDIVIDUAL (UNIVERSIDAD) */}
            {universidades.includes(activePage) && (() => {
              const estadisticas = todasLasEstadisticas[activePage];
              if (!estadisticas) return null;
              
              return (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      title="Publicaciones"
                      value={estadisticas.metricas.publicaciones.toLocaleString()}
                      subtitle={`Posts en ${activePage}`}
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
                          <CardDescription>Resumen macro-analítico de {activePage}</CardDescription>
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
                    <HistoricoChart data={estadisticas.historico} />
                  </div>
                </div>
              );
            })()}

            {activePage === "Fuentes" && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-4">
                <div className="rounded-full bg-primary/10 p-6">
                  <FileText className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Análisis de Fuentes de Datos</h2>
                <p className="text-muted-foreground max-w-md">Próximamente: Desglose detallado de las métricas separadas por plataformas como TikTok e Instagram.</p>
              </div>
            )}

            {activePage === "Configuración" && (
              <ConfiguracionPanel />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
