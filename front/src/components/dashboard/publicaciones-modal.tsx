import { useState, useEffect } from "react"
import { X, Loader2, Filter, MessageSquare, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Comentario {
  id: number
  contenido_original: string
  emocion_predominante: string
  fecha: string
}

interface Publicacion {
  id: number
  contenido_original: string
  url_publicacion: string
  emocion_predominante: string
  institucion: string
  fecha: string
  comentarios: Comentario[]
}

interface PublicacionesModalProps {
  isOpen: boolean
  onClose: () => void
  institucion: string
  fecha?: string
}

export function PublicacionesModal({ isOpen, onClose, institucion, fecha }: PublicacionesModalProps) {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([])
  const [loading, setLoading] = useState(false)
  const [filterEmocion, setFilterEmocion] = useState<string>("Todas")
  const [expandedPubId, setExpandedPubId] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchPublicaciones = async () => {
      setLoading(true)
      try {
        const queryStr = fecha ? `?fecha=${fecha}` : ''
        const res = await fetch(`http://localhost:5000/api/publicaciones/${institucion}${queryStr}`)
        const data = await res.json()
        setPublicaciones(data)
      } catch (e) {
        console.error("Error fetching publicaciones:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchPublicaciones()
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

  const emocionesUnicas = ["Todas", ...Array.from(new Set(publicaciones.map(p => p.emocion_predominante).filter(Boolean)))]
  
  const filtrados = filterEmocion === "Todas" 
    ? publicaciones 
    : publicaciones.filter(p => p.emocion_predominante === filterEmocion)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-muted/30">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Publicaciones y Comentarios</h2>
            <p className="text-sm text-muted-foreground">
              {institucion === "GLOBAL" ? "Todas las instituciones" : institucion}
              {fecha ? ` • ${fecha}` : ' • Histórico completo'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-background flex items-center gap-2 overflow-x-auto">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 ml-2 mr-1" />
          {emocionesUnicas.map(emo => (
            <button
              key={emo}
              onClick={() => setFilterEmocion(emo)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filterEmocion === emo 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {emo}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Cargando publicaciones...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">No se encontraron publicaciones</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filtrados.map((pub) => {
                const isExpanded = expandedPubId === pub.id;
                return (
                  <div key={pub.id} className="bg-background rounded-xl border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                    <div className="p-5 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap flex-1">
                          {pub.contenido_original}
                        </p>
                        <a 
                          href={pub.url_publicacion} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline whitespace-nowrap font-medium"
                        >
                          Ver original ↗
                        </a>
                      </div>
                      
                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getEmocionColor(pub.emocion_predominante)}`}>
                            {pub.emocion_predominante || "Sin clasificar"}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {pub.institucion} • {pub.fecha}
                          </span>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedPubId(isExpanded ? null : pub.id)}
                          className="text-xs font-medium"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {pub.comentarios.length} Comentarios
                          {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Collapsible Comments Section */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t p-5 animate-in slide-in-from-top-2 duration-200">
                        <h4 className="text-sm font-semibold mb-4 text-foreground flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" /> Comentarios obtenidos
                        </h4>
                        
                        {pub.comentarios.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">No hay comentarios capturados para esta publicación.</p>
                        ) : (
                          <div className="space-y-3">
                            {pub.comentarios.map(com => (
                              <div key={com.id} className="bg-background border rounded-lg p-3 text-sm">
                                <p className="text-foreground mb-2 whitespace-pre-wrap">{com.contenido_original}</p>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getEmocionColor(com.emocion_predominante)}`}>
                                    {com.emocion_predominante || "Sin clasificar"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">{com.fecha}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
