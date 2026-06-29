import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface HistoricoChartProps {
  data: Array<{ fecha: string; Enojo: number; Tristeza: number; Miedo: number; Ansiedad: number; Alegría: number; Indiferencia: number }>
}

export function HistoricoChart({ data }: HistoricoChartProps) {
  const chartConfig = {
    Enojo: { label: "Enojo", color: "#ef4444" },
    Tristeza: { label: "Tristeza", color: "#3b82f6" },
    Miedo: { label: "Miedo", color: "#8b5cf6" },
    Ansiedad: { label: "Ansiedad", color: "#f59e0b" },
    Alegría: { label: "Alegría", color: "#10b981" },
    Indiferencia: { label: "Indiferencia", color: "#9ca3af" },
  } satisfies ChartConfig

  // Formatear fechas para evitar problemas de zona horaria (UTC-5)
  const formattedData = data.map(item => {
    const date = new Date(item.fecha + "T12:00:00");
    return {
      ...item,
      fechaDisplay: date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Emociones Dominantes</CardTitle>
        <CardDescription>Evolución diaria de las emociones expresadas</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center pb-6">
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <LineChart accessibilityLayer data={formattedData} margin={{ left: 10, right: 10 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="fechaDisplay"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              className="text-xs"
            />
            <YAxis hide />
            <ChartTooltip
              cursor={{ stroke: "var(--color-muted)", strokeWidth: 1, opacity: 0.5 }}
              content={<ChartTooltipContent className="text-sm p-3 min-w-[150px]" />}
            />
            <Legend verticalAlign="top" height={36} />
            <Line type="monotone" dataKey="Enojo" stroke="#ef4444" strokeWidth={2} dot={true} />
            <Line type="monotone" dataKey="Tristeza" stroke="#3b82f6" strokeWidth={2} dot={true} />
            <Line type="monotone" dataKey="Miedo" stroke="#8b5cf6" strokeWidth={2} dot={true} />
            <Line type="monotone" dataKey="Ansiedad" stroke="#f59e0b" strokeWidth={2} dot={true} />
            <Line type="monotone" dataKey="Alegría" stroke="#10b981" strokeWidth={2} dot={true} />
            <Line type="monotone" dataKey="Indiferencia" stroke="#9ca3af" strokeWidth={2} dot={true} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
