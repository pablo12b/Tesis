export interface Estadisticas {
  institucion: string
  metricas: {
    publicaciones: number
    comentarios: number
    likes: number
    views: number
  }
  narrativa: string
  emociones: Array<{ emocion_principal: string; cantidad: number }>
  estres: Array<{ factor_estres: string; cantidad: number }>
  fuentes: Array<{ fuente: string; cantidad: number }>
  historico: Array<{ fecha: string; total_publicaciones: number; total_comentarios: number; total_likes: number; total_views: number }>
}
