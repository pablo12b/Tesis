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

interface SourcesChartProps {
  data: Array<{ fuente: string; cantidad: number }>
}

export function SourcesChart({ data }: SourcesChartProps) {
  const chartConfig = {
    cantidad: {
      label: "Registros",
      color: "var(--color-secondary)",
    },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuentes de Datos</CardTitle>
        <CardDescription>Distribución por red social o plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ bottom: 20 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="fuente"
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
              dataKey="cantidad"
              fill="var(--color-secondary)"
              radius={[4, 4, 0, 0]}
              barSize={40}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
