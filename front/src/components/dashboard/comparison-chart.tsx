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
    total: {
      label: "Total Registros",
      color: "var(--color-chart-3)",
    },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativa de Universidades</CardTitle>
        <CardDescription>Volumen total de datos analizados por institución</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ top: 20, bottom: 20 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="institucion"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis hide />
            <ChartTooltip
              cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar
              dataKey="total"
              fill="var(--color-chart-3)"
              radius={[4, 4, 0, 0]}
              barSize={40}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
