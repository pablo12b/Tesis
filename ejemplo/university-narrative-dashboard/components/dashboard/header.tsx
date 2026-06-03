"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, Download, RefreshCw, ChevronDown } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">NE</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Narrativas Emocionales
              </h1>
              <p className="text-xs text-muted-foreground">
                Análisis de Web Scraping Universitario
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Últimos 6 meses
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Última semana</DropdownMenuItem>
              <DropdownMenuItem>Último mes</DropdownMenuItem>
              <DropdownMenuItem>Últimos 3 meses</DropdownMenuItem>
              <DropdownMenuItem>Últimos 6 meses</DropdownMenuItem>
              <DropdownMenuItem>Último año</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>

          <Button variant="default" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>
    </header>
  )
}
