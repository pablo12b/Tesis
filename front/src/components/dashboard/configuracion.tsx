import { useState } from "react"
import { Play, Loader2, ServerCog, AlertCircle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ConfiguracionPanel() {
  const [loadingInst, setLoadingInst] = useState<string | null>(null)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' })

  const runScraper = async (institucion: string) => {
    setLoadingInst(institucion)
    setStatus({ type: 'idle', message: '' })

    try {
      const response = await fetch('http://localhost:5000/api/scraper/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ institucion }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error ejecutando el scraper')
      }

      setStatus({ type: 'success', message: data.message })
    } catch (error: any) {
      console.error(error)
      setStatus({ type: 'error', message: error.message || 'Error de red o timeout.' })
    } finally {
      setLoadingInst(null)
    }
  }

  const isScraping = loadingInst !== null

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-primary/10 via-background to-background p-6 rounded-2xl border border-primary/20 flex items-center gap-4">
        <div className="rounded-full bg-primary/20 p-4">
          <ServerCog className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-1 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Panel de Control del Scraper
          </h2>
          <p className="text-muted-foreground">Ejecuta la extracción y el análisis semántico de IA bajo demanda.</p>
        </div>
      </div>

      {status.type !== 'idle' && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
          {status.type === 'success' ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <AlertCircle className="h-5 w-5 mt-0.5" />}
          <div>
            <h4 className="font-semibold">{status.type === 'success' ? '¡Actualización Completada!' : 'Error en la Actualización'}</h4>
            <p className="text-sm opacity-90">{status.message}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Actualización Individual</CardTitle>
            <CardDescription>Actualiza los datos de una sola universidad. El proceso toma unos minutos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["UPS", "UDA", "UCUENCA", "UCACUE"].map((inst) => (
              <div key={inst} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                <span className="font-medium">{inst}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => runScraper(inst)}
                  disabled={isScraping}
                  className="w-32"
                >
                  {loadingInst === inst ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...</>
                  ) : (
                    <><Play className="mr-2 h-4 w-4" /> Extraer</>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-primary">Actualización Global</CardTitle>
            <CardDescription>Ejecuta el pipeline completo para todas las universidades. ¡Advertencia! Este proceso puede tardar bastante.</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 flex flex-col items-center justify-center py-8">
            <Button 
              size="lg" 
              onClick={() => runScraper('TODAS')}
              disabled={isScraping}
              className="w-full max-w-xs text-lg h-14 shadow-lg shadow-primary/25"
            >
              {loadingInst === 'TODAS' ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analizando Todo...</>
              ) : (
                <><Play className="mr-2 h-5 w-5 fill-current" /> Sincronizar Todas</>
              )}
            </Button>
            
            {isScraping && (
              <p className="mt-6 text-sm text-muted-foreground animate-pulse flex items-center justify-center text-center">
                El scraper y la IA están trabajando en segundo plano.<br/>Por favor, no recargues la página.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
