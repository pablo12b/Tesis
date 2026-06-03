import { Cell, Pie, PieChart } from "recharts"
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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

interface RiskChartProps {
  data: Array<{ nivel_riesgo: string; cantidad: number }>
}

const RISK_COLORS: Record<string, string> = {
  "Alto": "var(--color-destructive)",
  "Medio": "var(--color-chart-4)",
  "Bajo": "var(--color-chart-2)",
  "No determinado": "var(--color-muted)",
}

export function RiskChart({ data }: RiskChartProps) {
  // Config for the chart
  const chartConfig = {
    cantidad: {
      label: "Estudiantes",
    },
    ...data.reduce((acc, curr, i) => {
      acc[curr.nivel_riesgo] = {
        label: curr.nivel_riesgo,
        color: RISK_COLORS[curr.nivel_riesgo] || `var(--color-chart-${(i % 5) + 1})`,
      }
      return acc
    }, {} as ChartConfig),
  } as ChartConfig

  // Format data for Recharts Pie
  const chartData = data.map((item) => ({
    name: item.nivel_riesgo,
    value: item.cantidad,
    fill: chartConfig[item.nivel_riesgo]?.color,
  }))

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Nivel de Riesgo</CardTitle>
        <CardDescription>Distribución de estudiantes por riesgo</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
