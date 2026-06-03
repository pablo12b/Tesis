"use client"

import { universities } from "@/lib/data"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { StatCard } from "@/components/dashboard/stat-card"
import { SentimentChart } from "@/components/dashboard/sentiment-chart"
import { EmotionRadar } from "@/components/dashboard/emotion-radar"
import { UniversityComparison } from "@/components/dashboard/university-comparison"
import { TopicsTable } from "@/components/dashboard/topics-table"
import { RecentNarratives } from "@/components/dashboard/recent-narratives"
import { SourceDistribution } from "@/components/dashboard/source-distribution"
import {
  FileText,
  TrendingUp,
  GraduationCap,
  MessageSquare,
} from "lucide-react"

const totalNarratives = universities.reduce((acc, u) => acc + u.totalNarratives, 0)
const avgSentiment = universities.reduce((acc, u) => acc + u.avgSentiment, 0) / universities.length

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Narrativas"
              value={totalNarratives.toLocaleString()}
              subtitle="Datos recopilados"
              icon={FileText}
              trend={{ value: 12.5, label: "vs mes anterior", isPositive: true }}
            />
            <StatCard
              title="Sentimiento Promedio"
              value={`${(avgSentiment * 100).toFixed(0)}%`}
              subtitle="Índice positivo"
              icon={TrendingUp}
              trend={{ value: 3.2, label: "vs mes anterior", isPositive: true }}
            />
            <StatCard
              title="Universidades"
              value={universities.length}
              subtitle="Instituciones analizadas"
              icon={GraduationCap}
            />
            <StatCard
              title="Fuentes Activas"
              value="5"
              subtitle="Plataformas monitoreadas"
              icon={MessageSquare}
              trend={{ value: 1, label: "nueva fuente", isPositive: true }}
            />
          </div>

          {/* Charts Row 1 */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <SentimentChart />
            <EmotionRadar />
          </div>

          {/* Charts Row 2 */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <UniversityComparison />
            <SourceDistribution />
            <TopicsTable />
          </div>

          {/* Recent Narratives */}
          <div className="mt-6">
            <RecentNarratives />
          </div>
        </main>
      </div>
    </div>
  )
}
