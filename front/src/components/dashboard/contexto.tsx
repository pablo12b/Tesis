import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BrainCircuit, Clock, GraduationCap, ArrowRight, LayoutDashboard } from "lucide-react"

interface ContextoProps {
  universidades: string[]
  onPageChange: (page: string) => void
}

export function ContextoProyecto({ universidades, onPageChange }: ContextoProps) {
  const scrollToDashboards = () => {
    const el = document.getElementById("dashboards-section");
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full pt-4 pb-12 md:pt-8 md:pb-24 space-y-16 md:space-y-32 text-center">
      
      {/* 1. Hero Section (Centrado y Normal) */}
      <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-12 flex flex-col items-center justify-center pt-8 md:pt-16">
        <div className="inline-flex items-center gap-2 px-6 py-2 mb-6 md:mb-8 text-sm font-bold tracking-widest rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm uppercase">
          El Observatorio del Bienestar
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight mb-6 md:mb-8 text-foreground leading-[1.1] max-w-[1200px] mx-auto text-center">
          Analizamos <span className="text-primary">narrativas emocionales</span> estudiantiles
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl lg:text-2xl max-w-[1000px] leading-relaxed mb-10 md:mb-12 mx-auto text-center">
          Plataforma avanzada de análisis de sentimiento para monitorear el bienestar estudiantil en las principales instituciones educativas a través de redes sociales.
        </p>
        <Button 
          size="lg" 
          className="text-lg px-8 py-6 rounded-full font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1"
          onClick={scrollToDashboards}
        >
          Explorar Dashboards
        </Button>
      </div>

      {/* 2. Sección Informativa "¿Qué Hacemos?" (Centrada Normal) */}
      <div className="w-full max-w-[1400px] mx-auto px-4 lg:px-12 space-y-16 md:space-y-24">
        
        {/* IA */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center mb-6 shadow-inner border border-blue-500/20">
            <BrainCircuit className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-foreground mb-4 md:mb-8 mx-auto text-center">Procesamiento por Inteligencia Artificial</h2>
          <p className="text-muted-foreground text-base md:text-xl lg:text-2xl leading-relaxed max-w-[1200px] mb-6 mx-auto text-center">
            Todas las narrativas, el análisis de emociones y la identificación de factores de estrés presentes en los dashboards <strong>son procesados e interpretados de manera automática por modelos avanzados de Inteligencia Artificial (Llama 3)</strong>.
          </p>
          <p className="text-muted-foreground text-base md:text-xl lg:text-2xl leading-relaxed max-w-[1200px] mx-auto text-center">
            Este enfoque tecnológico nos permite extraer significado de miles de comentarios públicos en redes sociales, eliminando sesgos humanos y garantizando la privacidad. La IA clasifica los sentimientos dominantes y extrae automáticamente las temáticas principales que preocupan a la comunidad universitaria.
          </p>
        </div>

        {/* Monitoreo Diario */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center mb-6 shadow-inner border border-emerald-500/20">
            <Clock className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-foreground mb-4 md:mb-8 mx-auto text-center">Monitoreo y Actualización Diaria</h2>
          <p className="text-muted-foreground text-base md:text-xl lg:text-2xl leading-relaxed max-w-[1200px] mb-6 mx-auto text-center">
            Nuestro ecosistema realiza un escrutinio digital constante. La recolección de datos masivos (Web Scraping) y su posterior evaluación semántica <strong>se ejecutan y actualizan automáticamente cada 24 horas</strong>.
          </p>
          <p className="text-muted-foreground text-base md:text-xl lg:text-2xl leading-relaxed max-w-[1200px] mx-auto text-center">
            Gracias a esta frecuencia de actualización, las métricas y tendencias reflejan siempre la realidad más reciente. Esta inmediatez es vital para detectar a tiempo crisis institucionales o periodos de alto estrés académico, permitiendo una toma de decisiones informada.
          </p>
        </div>
      </div>

      {/* 3. Grid de Servicios (Dashboards) */}
      <div id="dashboards-section" className="w-full max-w-[1600px] mx-auto px-4 lg:px-12 pt-12 md:pt-20">
        <h2 className="text-3xl md:text-5xl font-black mb-10 md:mb-16 mx-auto text-center">Dashboards Disponibles</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 text-left">
          {/* Vista Global (Destacada) */}
          <Card className="border-border/50 bg-white shadow-md hover:shadow-xl transition-all rounded-[2rem] overflow-hidden group border border-transparent hover:border-primary/30">
            <div className="p-6 md:p-8 h-full flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <LayoutDashboard className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Vista Global</h3>
                <p className="text-muted-foreground text-lg mb-8">
                  Métricas agregadas, tendencias históricas y suma total de interacciones de todas las universidades analizadas.
                </p>
              </div>
              <Button
                variant="ghost"
                className="w-fit p-0 h-auto text-blue-600 font-bold hover:bg-transparent hover:text-blue-700 flex items-center gap-2 group/btn"
                onClick={() => onPageChange("Vista Global")}
              >
                Ver análisis
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
              </Button>
            </div>
          </Card>

          {/* Universidades */}
          {universidades.map((univ) => (
            <Card key={univ} className="border-border/50 bg-white shadow-md hover:shadow-xl transition-all rounded-[2rem] overflow-hidden group border border-transparent hover:border-primary/30">
              <div className="p-6 md:p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-white border border-border/50 shadow-sm flex items-center justify-center mb-6 overflow-hidden">
                    <img 
                      src={`/logos/${univ.toLowerCase()}.png`} 
                      alt={`Logo ${univ}`} 
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <GraduationCap className="w-8 h-8 text-muted-foreground hidden" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{univ}</h3>
                  <p className="text-muted-foreground text-lg mb-8">
                    Análisis de sentimiento, picos de interacción y narrativas emocionales exclusivas de los estudiantes de {univ}.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="w-fit p-0 h-auto text-primary font-bold hover:bg-transparent hover:text-primary/80 flex items-center gap-2 group/btn"
                  onClick={() => onPageChange(univ)}
                >
                  Ver análisis
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
    </div>
  )
}
