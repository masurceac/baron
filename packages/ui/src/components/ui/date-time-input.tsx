import { format, startOfDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { TimeInput } from './time-input';

const dateTimeInputVariants = cva(
  'w-full justify-start text-left font-normal truncate',
  {
    variants: {
      variant: {
        default: '',
        pfm: 'bg-background-primary px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type DateTimeInputProps = VariantProps<typeof dateTimeInputVariants> & {
  value: string | Date | undefined | null;
  hasTime?: boolean;
  placeholder: string;
  onChange(value: string | undefined): void;
  className?: string;
  disabled?: boolean;
};

export function DateTimeInput({
  value,
  hasTime,
  placeholder,
  onChange,
  className,
  variant,
  disabled = false,
}: DateTimeInputProps) {
  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }

    if (!value) {
      const startOfDayDate = startOfDay(date);
      const isoString = startOfDayDate.toISOString();
      onChange(isoString);
      return;
    }

    const currentDate = new Date(value);
    const newDate = new Date(date);
    
    newDate.setHours(currentDate.getHours());
    newDate.setMinutes(currentDate.getMinutes());
    newDate.setSeconds(currentDate.getSeconds());
    newDate.setMilliseconds(currentDate.getMilliseconds());
    
    onChange(newDate.toISOString());
  };

  const handleMonthChange = (date: Date | undefined) => {
    if (!date || !value) {
      return;
    }

    const currentDate = new Date(value);
    const newMonth = new Date(date);
    
    const currentDay = currentDate.getDate();
    const daysInNewMonth = new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0).getDate();
    
    const targetDay = Math.min(currentDay, daysInNewMonth);
    
    const adjustedDate = new Date(newMonth.getFullYear(), newMonth.getMonth(), targetDay);
    adjustedDate.setHours(currentDate.getHours());
    adjustedDate.setMinutes(currentDate.getMinutes());
    adjustedDate.setSeconds(currentDate.getSeconds());
    adjustedDate.setMilliseconds(currentDate.getMilliseconds());
    
    onChange(adjustedDate.toISOString());
  };

  return (
    <Popover>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          className={cn(
            dateTimeInputVariants({ variant }),
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          {value
            ? format(new Date(value), hasTime ? 'PPP p' : 'PPP')
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        {hasTime ? (
          <div className="pt-2">
            <TimeInput
              value={(value && new Date(value).toISOString()) ?? ''}
              onChange={onChange ?? (() => null)}
            />
          </div>
        ) : null}
        <Calendar
          mode="single"
          defaultMonth={value ? new Date(value) : undefined}
          selected={value ? new Date(value) : undefined}
          onMonthChange={(e) => handleMonthChange(e)}
          onSelect={(e) => handleSelect(e)}
          initialFocus
          captionLayout="dropdown"
          fromYear={1900}
          toYear={2100}
        />
      </PopoverContent>
    </Popover>
  );
}
