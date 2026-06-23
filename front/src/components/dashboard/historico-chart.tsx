import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Estadisticas } from "@/lib/types"

interface HistoricoChartProps {
  data: Estadisticas["historico"]
}

export function HistoricoChart({ data }: HistoricoChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card className="col-span-full border-border/50 shadow-lg bg-card/50 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl">Historial Diario de Interacciones</CardTitle>
        <CardDescription>
          Evolución de las métricas clave a lo largo del tiempo.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
            <XAxis 
              dataKey="fecha" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickMargin={10}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            <Line 
              type="monotone" 
              dataKey="total_publicaciones" 
              name="Publicaciones" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="total_comentarios" 
              name="Comentarios" 
              stroke="#10b981" 
              strokeWidth={3}
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="total_likes" 
              name="Likes" 
              stroke="#f59e0b" 
              strokeWidth={3}
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="total_views" 
              name="Vistas" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
