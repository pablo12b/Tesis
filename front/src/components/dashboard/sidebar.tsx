import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Settings,
  GraduationCap,
  Database,
} from "lucide-react"

const navigation = [
  { name: "Vista Global", icon: LayoutDashboard, current: true },
]

const secondaryNavigation = [
  { name: "Fuentes", icon: Database },
  { name: "Configuración", icon: Settings },
]

interface SidebarProps {
  activePage: string
  onPageChange: (page: string) => void
  universidades: string[]
}

export function Sidebar({ activePage, onPageChange, universidades }: SidebarProps) {
  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-border bg-sidebar shrink-0 sticky top-0">
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground">NE</span>
        </div>
        <span className="font-semibold text-sidebar-foreground">Dashboard</span>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Principal
        </p>
        {navigation.map((item) => {
          const isActuallyActive = activePage === item.name;
          return (
            <a
              key={item.name}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(item.name);
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActuallyActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </a>
          )
        })}

        <p className="mb-2 mt-6 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Universidades
        </p>
        {universidades.map((univ) => {
          const isActive = activePage === univ;
          return (
            <a
              key={univ}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(univ);
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <GraduationCap className="h-5 w-5" />
              {univ}
            </a>
          )
        })}

        <p className="mb-2 mt-6 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Datos
        </p>
        {secondaryNavigation.map((item) => {
          const isActive = activePage === item.name;
          return (
            <a
              key={item.name}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(item.name);
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </a>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-sidebar-accent p-3">
          <p className="text-xs font-medium text-sidebar-foreground">API Backend</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Última actualización: En vivo
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-primary">Conectado</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
