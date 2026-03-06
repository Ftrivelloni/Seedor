"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/dashboard/ui/button"
import { Calendar } from "@/components/dashboard/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/dashboard/ui/popover"

type DatePickerProps = {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccione una fecha",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal !border-gray-300",
            !value && "text-gray-400",
            className
          )}
        >
          <span>
            {value ? format(value, "dd/MM/yyyy", { locale: es }) : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-gray-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
          }}
          captionLayout="dropdown"
          fromYear={1900}
          toYear={2100}
          locale={es}
          weekStartsOn={1}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}