import { useState, useEffect } from "react"
import { X, Loader2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ComentariosModalProps {
  isOpen: boolean
  onClose: () => void
  institucion: string
  fecha?: string
}

interface Comentario {
  id: number
  contenido_original: string
  emocion_predominante: string
  institucion: string
  fecha: string
}

export function ComentariosModal({ isOpen, onClose, institucion, fecha }: ComentariosModalProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loading, setLoading] = useState(false)
  const [filterEmocion, setFilterEmocion] = useState<string>("Todas")

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchComentarios = async () => {
      setLoading(true)
      try {
        const queryStr = fecha ? `?fecha=${fecha}` : ''
        const res = await fetch(`http://localhost:5000/api/comentarios/${institucion}${queryStr}`)
        const data = await res.json()
        setComentarios(data)
      } catch (e) {
        console.error("Error fetching comentarios:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchComentarios()
  }, [isOpen, institucion, fecha])

  if (!isOpen) return null

  const getEmocionColor = (emocion: string) => {
    switch (emocion?.toLowerCase()) {
      case 'enojo': return 'bg-red-100 text-red-800 border-red-200'
      case 'tristeza': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'alegría': return 'bg-green-100 text-green-800 border-green-200'
      case 'miedo': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'ansiedad': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'indiferencia': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const emocionesUnicas = ["Todas", ...Array.from(new Set(comentarios.map(c => c.emocion_predominante).filter(Boolean)))]
  
  const filtrados = filterEmocion === "Todas" 
    ? comentarios 
    : comentarios.filter(c => c.emocion_predominante === filterEmocion)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background w-full max-w-5xl max-h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-card">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Comentarios Extraídos</h2>
            <p className="text-muted-foreground text-sm">
              {institucion === "GLOBAL" ? "Todas las Universidades" : institucion} 
              {fecha ? ` - Archivo Histórico (${fecha})` : ' - Datos Recientes'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b bg-muted/30 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrar Emoción:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {emocionesUnicas.map(em => (
              <button
                key={em}
                onClick={() => setFilterEmocion(em)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  filterEmocion === em 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background hover:bg-muted text-muted-foreground'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
              <p>Cargando comentarios...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p>No se encontraron comentarios para este filtro o fecha.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtrados.map((c, i) => (
                <div key={c.id || i} className="bg-card p-4 rounded-lg border shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-sm text-foreground flex-1 leading-relaxed">{c.contenido_original}</p>
                    <div className={`px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${getEmocionColor(c.emocion_predominante)}`}>
                      {c.emocion_predominante || 'Sin clasificar'}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                      {c.institucion}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {c.fecha}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
