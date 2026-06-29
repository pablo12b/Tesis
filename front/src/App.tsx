import { useState, useEffect } from 'react'
import axios from 'axios'
import Dashboard from './components/dashboard'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from './components/ui/button'

interface Estadisticas {
  institucion: string
  metricas: {
    publicaciones: number
    comentarios: number
    likes: number
    views: number
  }
  narrativa: string
  emociones: Array<{ emocion_principal: string; cantidad: number; ejemplo?: string }>
  estres: Array<{ factor_estres: string; cantidad: number }>
  fuentes: Array<{ fecha: string; TikTok: number; Instagram: number; Facebook: number }>
  historico: Array<{ fecha: string; Enojo: number; Tristeza: number; Miedo: number; Ansiedad: number; Alegría: number; Indiferencia: number }>
}

function App() {
  const [universidades, setUniversidades] = useState<string[]>([])
  const [stats, setStats] = useState<Record<string, Estadisticas>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePage, setActivePage] = useState<string>('Contexto del Proyecto')
  const [globalNarrativa, setGlobalNarrativa] = useState<any>(null)

  useEffect(() => {
    // Configurar la URL base de Axios para que apunte al backend en producción
    axios.defaults.baseURL = 'http://localhost:5000'

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const univResponse = await axios.get('/api/universidades')
        const univs = univResponse.data
        
        if (univs.length === 0) {
          setError('No hay universidades registradas en la base de datos')
          setLoading(false)
          return
        }
        
        setUniversidades(univs)
        
        // Cargar estadísticas individuales
        const statsPromises = univs.map((u: string) => 
          axios.get(`/api/estadisticas/${u}`).then(res => ({
            [u]: res.data
          }))
        )
        
        // Cargar narrativa global
        const globalPromise = axios.get('/api/global-narrativa').then(res => res.data)
        
        const [statsResults, globalData] = await Promise.all([
          Promise.all(statsPromises),
          globalPromise
        ])
        
        const combinedStats = Object.assign({}, ...statsResults)
        setStats(combinedStats)
        setGlobalNarrativa(globalData)
      } catch (err) {
        setError('Error al cargar los datos del servidor')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Cargando dashboard...</h2>
            <p className="text-muted-foreground">Conectando con la base de datos</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-4">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">{error}</h2>
            <div className="text-sm text-muted-foreground text-left bg-muted p-4 rounded-lg">
              <p className="font-medium mb-2 text-foreground">Asegúrate de que:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>El servidor backend está ejecutándose (npm start en /back)</li>
                <li>Hay datos en la base de datos (ejecuta el scraper primero)</li>
                <li>Las variables de entorno están configuradas</li>
              </ul>
            </div>
          </div>
          <Button onClick={() => window.location.reload()} variant="default" size="lg">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {universidades.length > 0 && (
        <Dashboard
          universidades={universidades}
          todasLasEstadisticas={stats}
          globalNarrativa={globalNarrativa}
          activePage={activePage}
          onPageChange={setActivePage}
        />
      )}
    </div>
  )
}

export default App
