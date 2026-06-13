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

interface EmotionsChartProps {
  data: Array<{ emocion_principal: string; cantidad: number }>
}

export function EmotionsChart({ data }: EmotionsChartProps) {
  const chartConfig = {
    cantidad: {
      label: "Porcentaje (%)",
      color: "var(--color-primary)",
    },
  } satisfies ChartConfig

  // Sort data by cantidad descending
  const sortedData = [...data].sort((a, b) => b.cantidad - a.cantidad).slice(0, 7)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emociones Dominantes</CardTitle>
        <CardDescription>Distribución porcentual del sentimiento colectivo</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart accessibilityLayer data={sortedData} layout="vertical" margin={{ left: 50 }}>
            <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" />
            <XAxis type="number" hide />
            <YAxis
              dataKey="emocion_principal"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              className="text-xs"
            />
            <ChartTooltip
              cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="cantidad"
              fill="var(--color-primary)"
              radius={[0, 4, 4, 0]}
              barSize={24}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
