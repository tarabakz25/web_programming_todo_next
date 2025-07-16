"use client"

import * as React from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DateTimePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "日時を選択",
  className,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [timeValue, setTimeValue] = React.useState<string>("")

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date)
      setTimeValue(format(date, "HH:mm"))
    }
  }, [date])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // 既存の時刻を保持しながら日付を更新
      const [hours, minutes] = timeValue.split(":").map(Number)
      if (!isNaN(hours) && !isNaN(minutes)) {
        newDate.setHours(hours, minutes)
      }
      setSelectedDate(newDate)
      onDateChange?.(newDate)
    } else {
      setSelectedDate(undefined)
      onDateChange?.(undefined)
    }
  }

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTimeValue = event.target.value
    setTimeValue(newTimeValue)

    if (selectedDate && newTimeValue) {
      const [hours, minutes] = newTimeValue.split(":").map(Number)
      if (!isNaN(hours) && !isNaN(minutes)) {
        const newDateTime = new Date(selectedDate)
        newDateTime.setHours(hours, minutes)
        setSelectedDate(newDateTime)
        onDateChange?.(newDateTime)
      }
    }
  }

  const handleToday = () => {
    const today = new Date()
    setSelectedDate(today)
    setTimeValue(format(today, "HH:mm"))
    onDateChange?.(today)
  }

  const handleTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setSelectedDate(tomorrow)
    setTimeValue(format(tomorrow, "HH:mm"))
    onDateChange?.(tomorrow)
  }

  const handleNextWeek = () => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    setSelectedDate(nextWeek)
    setTimeValue(format(nextWeek, "HH:mm"))
    onDateChange?.(nextWeek)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "yyyy年MM月dd日(E) HH:mm", { locale: ja })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {/* クイック選択ボタン */}
          <div className="flex gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="flex-1"
            >
              今日
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTomorrow}
              className="flex-1"
            >
              明日
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              className="flex-1"
            >
              来週
            </Button>
          </div>
          
          {/* カレンダー */}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            className="border-b pb-3 mb-3"
          />
          
          {/* 時刻選択 */}
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              時刻
            </Label>
            <Input
              id="time"
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="w-full"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 