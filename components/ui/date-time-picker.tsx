"use client"

import * as React from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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

  React.useEffect(() => {
    if (date) {
      setSelectedDate(date)
    }
  }, [date])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setSelectedDate(newDate)
      onDateChange?.(newDate)
    } else {
      setSelectedDate(undefined)
      onDateChange?.(undefined)
    }
  }

  const handleToday = () => {
    const today = new Date()
    setSelectedDate(today)
    onDateChange?.(today)
  }

  const handleTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setSelectedDate(tomorrow)
    onDateChange?.(tomorrow)
  }

  const handleNextWeek = () => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    setSelectedDate(nextWeek)
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
            format(selectedDate, "yyyy年MM月dd日(E)", { locale: ja })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto py-0" align="start">
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
            className="border-b pb-3 mb-3 w-full"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
} 