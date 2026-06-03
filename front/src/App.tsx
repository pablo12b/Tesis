import { useState, useEffect } from 'react'
import axios from 'axios'
import Dashboard from './components/dashboard'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from './components/ui/button'

interface Estadisticas {
  institucion: string
  total: number
  riesgo: Array<{ nivel_riesgo: string; cantidad: number }>
  emociones: Array<{ emocion_principal: string; cantidad: number }>
  estres: Array<{ factor_estres: string; cantidad: number }>
  fuentes: Array<{ fuente: string; cantidad: number }>
}

function App() {
  const [universidades, setUniversidades] = useState<string[]>([])
  const [stats, setStats] = useState<Record<string, Estadisticas>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('')

  useEffect(() => {
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
        setActiveTab(univs[0])
        
        const statsPromises = univs.map((u: string) => 
          axios.get(`/api/estadisticas/${u}`).then(res => ({
            [u]: res.data
          }))
        )
        
        const statsResults = await Promise.all(statsPromises)
        const combinedStats = Object.assign({}, ...statsResults)
        setStats(combinedStats)
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
      {universidades.length > 0 && stats[activeTab] && (
        <Dashboard
          universidades={universidades}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          estadisticas={stats[activeTab]}
          todasLasEstadisticas={stats}
        />
      )}
    </div>
  )
}

export default App
