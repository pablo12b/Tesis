import { Sidebar } from "./sidebar"
import { DashboardHeader } from "./header"
import { StatCard } from "./stat-card"
import { EmotionsChart } from "./emotions-chart"
import { StressChart } from "./stress-chart"
import { SourcesChart } from "./sources-chart"
import { ComparisonChart } from "./comparison-chart"
import { ConfiguracionPanel } from "./configuracion"
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
  activePage: string
  onPageChange: (page: string) => void
}

export default function Dashboard({
  universidades,
  activeTab,
  onTabChange,
  estadisticas,
  todasLasEstadisticas,
  activePage,
  onPageChange,
}: DashboardProps) {
  const comparisonData = Object.values(todasLasEstadisticas)
  
  // Encontrar la emoción principal basada en los porcentajes
  const statsEmocionPrincipal = estadisticas.emociones.length > 0 
    ? [...estadisticas.emociones].sort((a,b) => b.cantidad - a.cantidad)[0]?.emocion_principal 
    : 'N/A'

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-sans antialiased text-foreground">
        <Sidebar activePage={activePage} onPageChange={onPageChange} />
        <main className="flex-1 flex flex-col min-w-0">
          <DashboardHeader
            universidades={universidades}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
          <div key={`${activeTab}-${activePage}`} className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500 fill-mode-both">
            {activePage === "Overview" && (
              <>
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
              </>
            )}

            {activePage === "Universidades" && (() => {
              const todas = Object.values(todasLasEstadisticas);
              const totales = todas.reduce((acc, curr) => ({
                publicaciones: acc.publicaciones + curr.metricas.publicaciones,
                comentarios: acc.comentarios + curr.metricas.comentarios,
                likes: acc.likes + curr.metricas.likes,
                views: acc.views + curr.metricas.views,
              }), { publicaciones: 0, comentarios: 0, likes: 0, views: 0 });

              // Encontrar los máximos para las barras de progreso
              const maxPubs = Math.max(...todas.map(u => u.metricas.publicaciones));
              const maxComs = Math.max(...todas.map(u => u.metricas.comentarios));
              const maxLikes = Math.max(...todas.map(u => u.metricas.likes));

              return (
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

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
                    {todas.map((univ) => {
                      const topEmotion = univ.emociones.length > 0 
                        ? [...univ.emociones].sort((a,b) => b.cantidad - a.cantidad)[0]?.emocion_principal 
                        : 'N/A';

                      return (
                        <Card key={univ.institucion} className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] transition-all duration-300 group">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                          <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-2xl font-bold">{univ.institucion}</CardTitle>
                                <CardDescription className="mt-1">Resumen de interacción</CardDescription>
                              </div>
                              <div className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                                {topEmotion}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-5 text-sm">
                              {/* Publicaciones */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" /> Publicaciones
                                  </span>
                                  <span className="font-bold text-base">{univ.metricas.publicaciones.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${(univ.metricas.publicaciones / maxPubs) * 100}%` }} 
                                  />
                                </div>
                              </div>
                              
                              {/* Comentarios */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-blue-500" /> Comentarios
                                  </span>
                                  <span className="font-bold text-base">{univ.metricas.comentarios.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${(univ.metricas.comentarios / maxComs) * 100}%` }} 
                                  />
                                </div>
                              </div>

                              {/* Me Gusta */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-red-500" /> Me Gusta
                                  </span>
                                  <span className="font-bold text-base">{univ.metricas.likes.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${(univ.metricas.likes / maxLikes) * 100}%` }} 
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
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
