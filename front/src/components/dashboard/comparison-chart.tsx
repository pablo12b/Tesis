import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
import type { Estadisticas } from "@/lib/types"

interface ComparisonChartProps {
  data: Estadisticas[]
}

export function ComparisonChart({ data }: ComparisonChartProps) {
  const chartConfig = {
    likes: {
      label: "Me Gusta",
      color: "#06b6d4",
    },
    comentarios: {
      label: "Comentarios",
      color: "#3b82f6",
    },
    publicaciones: {
      label: "Publicaciones",
      color: "#a855f7",
    }
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativa de Interacción</CardTitle>
        <CardDescription>Volumen de Likes, Comentarios y Publicaciones por institución</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ top: 20, bottom: 20 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="institucion"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis hide />
            <ChartTooltip
              cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }}
              content={<ChartTooltipContent indicator="dashed" className="text-sm sm:text-base p-3 w-[200px]" />}
            />
            <Bar
              dataKey="metricas.publicaciones"
              name="Publicaciones"
              fill="#a855f7"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="metricas.comentarios"
              name="Comentarios"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="metricas.likes"
              name="Me Gusta"
              fill="#06b6d4"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
