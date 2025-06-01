import {
  differenceInDays,
  differenceInMilliseconds,
  format,
  formatDistanceStrict,
} from 'date-fns';
import { useCallback, useMemo } from 'react';
import { cn } from '../../lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { formatInTimeZone } from 'date-fns-tz';

export type DateInputType = string | Date | null | number;
const formats = {
  xs: 'MMM d',
  shortMonth: 'MMM d, yyyy',
  short: 'PPP',
  long: 'PPp',
  relative: '',
  relativeShort: '',
  fullDay: 'EEEE, d MMMM',
  full: 'yyyy/MM/dd HH:mm:ss',
};

export const useFormatedDate = (options: {
  date: DateInputType;
  leftDate?: string;
  variant: keyof typeof formats;
}): string => {
  const date = useMemo(() => {
    if (typeof options.date === 'string') {
      if (!options.date.includes('T')) {
        return new Date(options.date);
      }
      return new Date(
        options.date.endsWith('Z') ? options.date : options.date + 'Z',
      );
    }

    return options.date;
  }, [options.date]);

  const dateDifference = useCallback((date: Date | number) => {
    const now = new Date();
    const difference = differenceInMilliseconds(now, date);
    const minutes = Math.round(difference / 1000 / 60);
    const hour = Math.round(difference / 1000 / 60 / 60);
    const day = Math.round(difference / 1000 / 60 / 60 / 24);
    const week = Math.round(difference / 1000 / 60 / 60 / 24 / 7);
    const month = Math.round(difference / 1000 / 60 / 60 / 24 / 30);
    const year = Math.round(difference / 1000 / 60 / 60 / 24 / 365);

    if (hour < 1) {
      return `${minutes}min`;
    } else if (hour < 12) {
      return `${hour}h`;
    } else if (hour < 24) {
      return `today`;
    } else if (day < 7) {
      return `${day}d`;
    } else if (week < 4) {
      return `${week}w`;
    } else if (month < 12) {
      return `${day}d`;
    } else {
      return `${year}y`;
    }
  }, []);

  if (!date) {
    return '-';
  }

  if (options.variant === 'relativeShort') {
    return dateDifference(date);
  }

  if (options.variant === 'relative') {
    const leftDate = options.leftDate ? new Date(options.leftDate) : new Date();
    const distanceInDays = differenceInDays(leftDate, date);

    if (distanceInDays > 14) {
      return format(date, 'PP');
    }

    if (distanceInDays > 2) {
      return format(date, 'PPPP');
    }

    return formatDistanceStrict(date, leftDate, {
      addSuffix: true,
    });
  }

  return format(date, formats[options.variant]);
};

export const FormatDate = ({
  date,
  leftDate,
  format: displayFormat = 'short',
  asString,
  className,
  utc,
}: {
  date: DateInputType;
  leftDate?: string;
  format?: keyof typeof formats;
  asString?: boolean;
  className?: string;
  utc?: boolean;
}) => {
  const firstFormatting = useFormatedDate({
    date,
    leftDate,
    variant: displayFormat,
  });

  const dateAsUtc = formatInTimeZone(
    date ?? new Date(date ?? ''),
    'UTC',
    'PPP kk:mm',
  );

  const formattedDate = utc ? `${dateAsUtc} (UTC)` : firstFormatting;

  if (!formattedDate) {
    return null;
  }

  if (asString) {
    return formattedDate;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className={cn('whitespace-nowrap', className)}>
            {formattedDate}
          </span>
        </TooltipTrigger>
        {date && (
          <TooltipContent>{format(new Date(date), 'PPpp')}</TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
