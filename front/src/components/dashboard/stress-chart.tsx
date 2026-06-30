import { Cell, Pie, PieChart } from "recharts"
import { Sparkles } from "lucide-react"
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
  narrativa_estres?: string
}

export function StressChart({ data, narrativa_estres }: StressChartProps) {
  // Sort and keep only the top ones
  const sortedData = [...data].sort((a, b) => b.cantidad - a.cantidad)

  // Use a reliable color palette specifically for dark mode
  const COLORS = [
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
    "#a855f7", // Purple
    "#ec4899", // Pink
    "#f43f5e", // Rose/Red
    "#f59e0b", // Amber
    "#10b981", // Emerald
  ];

  const chartConfig = {
    cantidad: {
      label: "Porcentaje (%)",
    },
    ...sortedData.reduce((acc, curr, i) => {
      acc[curr.factor_estres] = {
        label: curr.factor_estres,
        color: COLORS[i % COLORS.length],
      }
      return acc
    }, {} as ChartConfig),
  } as ChartConfig

  const chartData = sortedData.map((item, i) => ({
    name: item.factor_estres,
    value: item.cantidad,
    fill: COLORS[i % COLORS.length],
  }))

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-2">
        <CardTitle>Factores de Estrés</CardTitle>
        <CardDescription>Principales desencadenantes detectados</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center pb-6">
        <ChartContainer
          config={chartConfig}
          className="mx-auto w-full max-h-[350px] aspect-square"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel className="text-sm p-3 min-w-[10rem] [&_.text-muted-foreground]:text-sm [&_.font-mono]:text-base" />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={130}
              strokeWidth={3}
              stroke="var(--background)"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="mt-4 flex-wrap gap-2 [&>*]:basis-1/3 [&>*]:justify-center text-sm"
            />
          </PieChart>
        </ChartContainer>

        {narrativa_estres && (
          <div className="mt-6 pt-6 border-t animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h4 className="flex items-center gap-2 font-semibold text-primary mb-3">
              <Sparkles className="h-5 w-5" /> 
              Análisis de Factores
            </h4>
            <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line bg-primary/5 p-4 rounded-xl border border-primary/10">
              {narrativa_estres}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
