export interface Estadisticas {
  institucion: string
  total: number
  riesgo: Array<{ nivel_riesgo: string; cantidad: number }>
  emociones: Array<{ emocion_principal: string; cantidad: number }>
  estres: Array<{ factor_estres: string; cantidad: number }>
  fuentes: Array<{ fuente: string; cantidad: number }>
}
