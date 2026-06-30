export interface Estadisticas {
  institucion: string
  metricas: {
    publicaciones: number
    comentarios: number
    likes: number
    views: number
  }
  narrativa: string
  narrativa_estres: string
  emociones: Array<{ emocion_principal: string; cantidad: number; ejemplo?: string }>
  estres: Array<{ factor_estres: string; cantidad: number }>
  fuentes: Array<{ fecha: string; TikTok: number; Instagram: number; Facebook: number }>
  historico: Array<{ fecha: string; Enojo: number; Tristeza: number; Miedo: number; Ansiedad: number; Alegría: number; Indiferencia: number }>
}
