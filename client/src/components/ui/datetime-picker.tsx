import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  disabled = false,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const hours = value ? value.getHours() : 12;
  const minutes = value ? value.getMinutes() : 0;

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange(undefined);
      return;
    }
    selectedDate.setHours(hours, minutes, 0, 0);
    onChange(selectedDate);
  };

  const handleHourChange = (hourStr: string) => {
    const newHour = parseInt(hourStr, 10);
    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(newHour, minutes, 0, 0);
    onChange(newDate);
  };

  const handleMinuteChange = (minuteStr: string) => {
    const newMinute = parseInt(minuteStr, 10);
    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(hours, newMinute, 0, 0);
    onChange(newDate);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          data-testid="datetime-picker-trigger"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP 'at' HH:mm") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="border-t p-3 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Time:</span>
          <Select value={hours.toString().padStart(2, '0')} onValueChange={handleHourChange}>
            <SelectTrigger className="w-[70px]" data-testid="datetime-hour-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                  {i.toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">:</span>
          <Select value={minutes.toString().padStart(2, '0')} onValueChange={handleMinuteChange}>
            <SelectTrigger className="w-[70px]" data-testid="datetime-minute-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 60 }, (_, i) => (
                <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                  {i.toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
