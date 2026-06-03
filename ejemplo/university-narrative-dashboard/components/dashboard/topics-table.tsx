"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { topTopics } from "@/lib/data"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

function getSentimentIcon(sentiment: number) {
  if (sentiment >= 0.6) return <TrendingUp className="h-4 w-4 text-primary" />
  if (sentiment <= 0.4) return <TrendingDown className="h-4 w-4 text-destructive" />
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

function getSentimentColor(sentiment: number) {
  if (sentiment >= 0.6) return "text-primary"
  if (sentiment <= 0.4) return "text-destructive"
  return "text-muted-foreground"
}

export function TopicsTable() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-foreground">
          Temas Principales
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Temas más mencionados en las narrativas
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topTopics.map((topic, index) => (
            <div
              key={topic.topic}
              className="flex items-center justify-between rounded-lg bg-secondary/50 p-3 transition-colors hover:bg-secondary"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{topic.topic}</p>
                  <p className="text-xs text-muted-foreground">
                    {topic.count.toLocaleString()} menciones
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getSentimentIcon(topic.sentiment)}
                <span className={cn("text-sm font-medium", getSentimentColor(topic.sentiment))}>
                  {(topic.sentiment * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
