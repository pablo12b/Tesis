import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
  data: Array<{ fecha: string; TikTok: number; Instagram: number; Facebook: number }>
}

export function SourcesChart({ data }: SourcesChartProps) {
  const chartConfig = {
    TikTok: {
      label: "TikTok",
      color: "#000000",
    },
    Instagram: {
      label: "Instagram",
      color: "#E1306C",
    },
    Facebook: {
      label: "Facebook",
      color: "#1877F2",
    },
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
        <CardTitle>Histórico de Fuentes de Datos</CardTitle>
        <CardDescription>Evolución diaria de registros por red social</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center pb-6">
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <AreaChart accessibilityLayer data={formattedData} margin={{ left: 10, right: 10 }}>
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
              cursor={{ fill: "var(--color-muted)", opacity: 0.2 }}
              content={<ChartTooltipContent indicator="dot" className="text-sm p-3" />}
            />
            <Area
              type="monotone"
              dataKey="TikTok"
              stackId="1"
              stroke="#000000"
              fill="#000000"
              fillOpacity={0.6}
              dot={true}
            />
            <Area
              type="monotone"
              dataKey="Instagram"
              stackId="1"
              stroke="#E1306C"
              fill="#E1306C"
              fillOpacity={0.6}
              dot={true}
            />
            <Area
              type="monotone"
              dataKey="Facebook"
              stackId="1"
              stroke="#1877F2"
              fill="#1877F2"
              fillOpacity={0.6}
              dot={true}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
