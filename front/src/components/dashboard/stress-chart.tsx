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

interface StressChartProps {
  data: Array<{ factor_estres: string; cantidad: number }>
}

export function StressChart({ data }: StressChartProps) {
  // Sort and keep only the top ones or handle 'Ninguno' specially
  const sortedData = [...data].sort((a, b) => b.cantidad - a.cantidad)

  const chartConfig = {
    cantidad: {
      label: "Casos",
    },
    ...sortedData.reduce((acc, curr, i) => {
      acc[curr.factor_estres] = {
        label: curr.factor_estres,
        color: `var(--color-chart-${(i % 5) + 1})`,
      }
      return acc
    }, {} as ChartConfig),
  } as ChartConfig

  const chartData = sortedData.map((item) => ({
    name: item.factor_estres,
    value: item.cantidad,
    fill: chartConfig[item.factor_estres]?.color,
  }))

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Factores de Estrés</CardTitle>
        <CardDescription>Principales desencadenantes detectados</CardDescription>
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
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/3 [&>*]:justify-center text-xs"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
