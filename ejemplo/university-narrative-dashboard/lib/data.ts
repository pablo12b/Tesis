// Datos simulados de análisis de narrativas emocionales de 4 universidades

export const universities = [
  {
    id: "unam",
    name: "UNAM",
    fullName: "Universidad Nacional Autónoma de México",
    totalNarratives: 12450,
    avgSentiment: 0.62,
  },
  {
    id: "ipn",
    name: "IPN",
    fullName: "Instituto Politécnico Nacional",
    totalNarratives: 8320,
    avgSentiment: 0.58,
  },
  {
    id: "itesm",
    name: "ITESM",
    fullName: "Instituto Tecnológico de Monterrey",
    totalNarratives: 6890,
    avgSentiment: 0.71,
  },
  {
    id: "udg",
    name: "UDG",
    fullName: "Universidad de Guadalajara",
    totalNarratives: 5240,
    avgSentiment: 0.55,
  },
]

export const emotionDistribution = [
  { emotion: "Alegría", unam: 32, ipn: 28, itesm: 38, udg: 25 },
  { emotion: "Tristeza", unam: 12, ipn: 15, itesm: 8, udg: 18 },
  { emotion: "Enojo", unam: 8, ipn: 12, itesm: 6, udg: 14 },
  { emotion: "Miedo", unam: 10, ipn: 11, itesm: 7, udg: 13 },
  { emotion: "Sorpresa", unam: 18, ipn: 16, itesm: 22, udg: 14 },
  { emotion: "Neutral", unam: 20, ipn: 18, itesm: 19, udg: 16 },
]

export const sentimentTrend = [
  { month: "Ene", unam: 0.58, ipn: 0.52, itesm: 0.68, udg: 0.50 },
  { month: "Feb", unam: 0.60, ipn: 0.55, itesm: 0.70, udg: 0.52 },
  { month: "Mar", unam: 0.55, ipn: 0.50, itesm: 0.65, udg: 0.48 },
  { month: "Abr", unam: 0.62, ipn: 0.58, itesm: 0.72, udg: 0.55 },
  { month: "May", unam: 0.65, ipn: 0.60, itesm: 0.74, udg: 0.58 },
  { month: "Jun", unam: 0.62, ipn: 0.58, itesm: 0.71, udg: 0.55 },
]

export const topTopics = [
  { topic: "Calidad académica", count: 4520, sentiment: 0.72 },
  { topic: "Infraestructura", count: 3890, sentiment: 0.45 },
  { topic: "Servicios estudiantiles", count: 3210, sentiment: 0.58 },
  { topic: "Vida universitaria", count: 2980, sentiment: 0.78 },
  { topic: "Becas y financiamiento", count: 2540, sentiment: 0.42 },
  { topic: "Prácticas profesionales", count: 2120, sentiment: 0.65 },
  { topic: "Docentes", count: 1890, sentiment: 0.68 },
  { topic: "Administración", count: 1560, sentiment: 0.35 },
]

export const recentNarratives = [
  {
    id: 1,
    university: "UNAM",
    text: "Excelente experiencia en el programa de intercambio, los profesores son muy dedicados.",
    emotion: "Alegría",
    sentiment: 0.85,
    date: "2024-01-15",
    source: "Twitter",
  },
  {
    id: 2,
    university: "IPN",
    text: "Los laboratorios necesitan mejor equipamiento para las prácticas.",
    emotion: "Neutral",
    sentiment: 0.40,
    date: "2024-01-14",
    source: "Facebook",
  },
  {
    id: 3,
    university: "ITESM",
    text: "Muy contento con las oportunidades de networking y los eventos empresariales.",
    emotion: "Alegría",
    sentiment: 0.88,
    date: "2024-01-14",
    source: "LinkedIn",
  },
  {
    id: 4,
    university: "UDG",
    text: "El proceso de inscripción fue muy complicado y tardado.",
    emotion: "Enojo",
    sentiment: 0.25,
    date: "2024-01-13",
    source: "Twitter",
  },
  {
    id: 5,
    university: "UNAM",
    text: "La biblioteca tiene una colección increíble de recursos digitales.",
    emotion: "Sorpresa",
    sentiment: 0.82,
    date: "2024-01-13",
    source: "Reddit",
  },
]

export const sourceDistribution = [
  { source: "Twitter", count: 15420, percentage: 47 },
  { source: "Facebook", count: 8650, percentage: 26 },
  { source: "LinkedIn", count: 4320, percentage: 13 },
  { source: "Reddit", count: 2890, percentage: 9 },
  { source: "Otros", count: 1620, percentage: 5 },
]

export const emotionColors: Record<string, string> = {
  "Alegría": "hsl(var(--chart-1))",
  "Tristeza": "hsl(var(--chart-2))",
  "Enojo": "hsl(var(--chart-4))",
  "Miedo": "hsl(var(--chart-5))",
  "Sorpresa": "hsl(var(--chart-3))",
  "Neutral": "hsl(var(--muted-foreground))",
}

export const universityColors: Record<string, string> = {
  unam: "hsl(var(--chart-1))",
  ipn: "hsl(var(--chart-2))",
  itesm: "hsl(var(--chart-3))",
  udg: "hsl(var(--chart-4))",
}
