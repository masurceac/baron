import { trpc } from '@/core/trpc';
import { Button } from '@baron/ui/components/button';
import { CalendarIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CheckAllTradesSuccessButtonProps {
  liveTradingRoomId: string;
  onSuccess?: () => void;
}

export function CheckAllTradesSuccessButton({ 
  liveTradingRoomId, 
  onSuccess 
}: CheckAllTradesSuccessButtonProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  const utils = trpc.useUtils();

  const checkAllTradesMutation = trpc.liveTradingRoom.checkSignalTradeSuccessForDate.useMutation({
    onSuccess: () => {
      utils.liveTradingRoom.signals.invalidate();
      utils.liveTradingRoom.signalsDailyBalance.invalidate();
      onSuccess?.();
      setIsOpen(false);
      setSelectedDate('');
      toast.success('Successfully checked all trades for the selected date');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    checkAllTradesMutation.mutate({
      roomId: liveTradingRoomId,
      date: selectedDate,
    });
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={checkAllTradesMutation.isPending}
      >
        <CalendarIcon className="w-4 h-4 mr-2" />
        Check All Trades for Date
      </Button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="flex items-center space-x-2 bg-muted/40 p-3 rounded-lg border">
          <div className="flex items-center space-x-2">
            <label htmlFor="date-input" className="text-sm font-medium">
              Date:
            </label>
            <input
              id="date-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={today}
              className="px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background"
              required
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!selectedDate || checkAllTradesMutation.isPending}
          >
            {checkAllTradesMutation.isPending ? (
              <>
                <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              'Check'
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              setSelectedDate('');
            }}
            disabled={checkAllTradesMutation.isPending}
          >
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
} 