"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  Settings,
  GraduationCap,
  TrendingUp,
  Database,
  FileText,
} from "lucide-react"

const navigation = [
  { name: "Overview", icon: LayoutDashboard, current: true },
  { name: "Análisis", icon: BarChart3, current: false },
  { name: "Narrativas", icon: MessageSquare, current: false },
  { name: "Tendencias", icon: TrendingUp, current: false },
]

const secondaryNavigation = [
  { name: "Universidades", icon: GraduationCap },
  { name: "Fuentes", icon: Database },
  { name: "Reportes", icon: FileText },
  { name: "Configuración", icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground">NE</span>
        </div>
        <span className="font-semibold text-foreground">Dashboard</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Principal
        </p>
        {navigation.map((item) => (
          <a
            key={item.name}
            href="#"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              item.current
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </a>
        ))}

        <p className="mb-2 mt-6 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Datos
        </p>
        {secondaryNavigation.map((item) => (
          <a
            key={item.name}
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </a>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-sidebar-accent p-3">
          <p className="text-xs font-medium text-foreground">Web Scraping</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Última actualización: Hace 2 horas
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-primary">Activo</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
