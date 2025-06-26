import { trpc } from '@/core/trpc';
import { TradeResult } from '@baron/common';
import { Button } from '@baron/ui/components/button';
import { toast } from 'sonner';

interface CheckTradeSuccessButtonProps {
  signalId: string;
  suggestionIndex: number;
  suggestionType: 'buy' | 'sell' | 'hold';
  hasStopLoss: boolean;
  hasTakeProfit: boolean;
  onSuccess?: () => void;
}

export function CheckTradeSuccessButton({
  signalId,
  suggestionIndex,
  suggestionType,
  hasStopLoss,
  hasTakeProfit,
  onSuccess,
}: CheckTradeSuccessButtonProps) {
  const checkTradeSuccessMutation =
    trpc.liveTradingRoom.checkSignalTradeSuccess.useMutation({
      onSuccess: (result) => {
        const resultText =
          result.type === TradeResult.Success
            ? 'Success'
            : result.type === TradeResult.Failure
              ? 'Failure'
              : 'Unknown';
        toast.success(
          `Trade result: ${resultText}. Balance: $${result.resultBalance.toFixed(2)}`,
        );
        // Call the onSuccess callback to trigger parent refresh
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  // Only show button for buy/sell signals with valid prices
  if (suggestionType === 'hold' || !hasStopLoss || !hasTakeProfit) {
    return <span className="text-sm text-muted-foreground">N/A</span>;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        checkTradeSuccessMutation.mutate({
          signalId,
          suggestionIndex,
        });
      }}
      disabled={checkTradeSuccessMutation.isPending}
    >
      {checkTradeSuccessMutation.isPending ? 'Checking...' : 'Check Success'}
    </Button>
  );
}
