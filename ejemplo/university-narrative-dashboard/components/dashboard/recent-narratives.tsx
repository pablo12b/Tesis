"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { recentNarratives } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Twitter, Facebook, Linkedin, MessageCircle } from "lucide-react"

function getSourceIcon(source: string) {
  switch (source) {
    case "Twitter":
      return <Twitter className="h-4 w-4" />
    case "Facebook":
      return <Facebook className="h-4 w-4" />
    case "LinkedIn":
      return <Linkedin className="h-4 w-4" />
    default:
      return <MessageCircle className="h-4 w-4" />
  }
}

function getEmotionColor(emotion: string) {
  switch (emotion) {
    case "Alegría":
      return "bg-primary/20 text-primary border-primary/30"
    case "Tristeza":
      return "bg-chart-2/20 text-chart-2 border-chart-2/30"
    case "Enojo":
      return "bg-destructive/20 text-destructive border-destructive/30"
    case "Sorpresa":
      return "bg-chart-3/20 text-chart-3 border-chart-3/30"
    default:
      return "bg-muted text-muted-foreground border-muted"
  }
}

function getSentimentBar(sentiment: number) {
  const width = sentiment * 100
  const color = sentiment >= 0.6 ? "bg-primary" : sentiment <= 0.4 ? "bg-destructive" : "bg-chart-2"
  return (
    <div className="h-1.5 w-16 rounded-full bg-secondary">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${width}%` }} />
    </div>
  )
}

export function RecentNarratives() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-foreground">
          Narrativas Recientes
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Últimas narrativas recopiladas del web scraping
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentNarratives.map((narrative) => (
            <div
              key={narrative.id}
              className="rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-medium">
                      {narrative.university}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getEmotionColor(narrative.emotion))}
                    >
                      {narrative.emotion}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {narrative.text}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {getSourceIcon(narrative.source)}
                      <span>{narrative.source}</span>
                    </div>
                    <span>{narrative.date}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">Sentimiento</span>
                  {getSentimentBar(narrative.sentiment)}
                  <span className="text-xs font-medium text-foreground">
                    {(narrative.sentiment * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
