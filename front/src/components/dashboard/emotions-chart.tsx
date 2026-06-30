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
} from "@/components/ui/chart"

interface EmotionsChartProps {
  data: Array<{ emocion_principal: string; cantidad: number; ejemplo?: string }>
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
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md max-w-[250px]">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-semibold">{data.emocion_principal}</span>
                          <span className="ml-auto font-mono text-muted-foreground">{data.cantidad}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
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
