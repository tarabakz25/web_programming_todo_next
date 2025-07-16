"use client"

import React, { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Task } from "@/types/task"

interface ChartAreaProps {
  tasks: Task[]
}

export default function ChartArea({ tasks }: ChartAreaProps) {
  // チャートデータを生成
  const chartData = useMemo(() => {
    // 完了したタスクのみを抽出
    const completedTasks = tasks.filter(
      task => task.status === "AC" && task.completionDate
    )

    // 日付ごとにグループ化
    const tasksByDate: Record<string, number> = {}
    
    completedTasks.forEach(task => {
      if (task.completionDate) {
        const date = new Date(task.completionDate).toISOString().split('T')[0]
        tasksByDate[date] = (tasksByDate[date] || 0) + 1
      }
    })

    // 過去30日間のデータを生成
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const data = []
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = currentDate.toISOString().split('T')[0]
      const formattedDate = currentDate.toLocaleDateString('ja-JP', { 
        month: 'numeric', 
        day: 'numeric' 
      })
      
      data.push({
        date: formattedDate,
        fullDate: dateStr,
        tasks: tasksByDate[dateStr] || 0
      })
    }

    return data
  }, [tasks])

  const chartConfig = {
    tasks: {
      label: "完了タスク数",
      color: "hsl(var(--primary))",
    },
  }

  // 総完了タスク数
  const totalCompletedTasks = useMemo(() => {
    return chartData.reduce((sum, day) => sum + day.tasks, 0)
  }, [chartData])

  // 1日の平均完了タスク数
  const averageTasksPerDay = useMemo(() => {
    const activeDays = chartData.filter(day => day.tasks > 0).length
    return activeDays > 0 ? (totalCompletedTasks / activeDays).toFixed(1) : "0"
  }, [chartData, totalCompletedTasks])

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">競プロ日別進捗</CardTitle>
        <CardDescription className="text-sm">
          過去30日間の日別タスク完了数
        </CardDescription>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 text-sm">
          <div>
            <span className="font-medium">総完了数:</span> {totalCompletedTasks}
          </div>
          <div>
            <span className="font-medium">1日平均:</span> {averageTasksPerDay}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[150px] sm:h-[200px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 8,
              right: 8,
              top: 4,
              bottom: 4,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              fontSize={12}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent 
                  indicator="dot"
                  labelFormatter={(_, payload) => {
                    if (payload && payload[0]) {
                      return `${payload[0].payload.fullDate}`
                    }
                    return ""
                  }}
                />
              }
            />
            <Area
              dataKey="tasks"
              type="natural"
              fill="var(--color-tasks)"
              fillOpacity={0.4}
              stroke="var(--color-tasks)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
