"use client"

import * as React from "react"
import { IconCalendar } from "@tabler/icons-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "日付を選択",
  disabled = false,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  // Convert yyyy-mm-dd string to Date object
  const dateValue = value ? new Date(value) : undefined
  
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Convert Date to yyyy-mm-dd format
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      onChange?.(dateString)
    } else {
      onChange?.("")
    }
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <IconCalendar className="mr-2 h-4 w-4" />
          {dateValue ? (
            format(dateValue, "yyyy年MM月dd日", { locale: ja })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
