import { trpc } from '@/core/trpc';
import { Badge } from '@baron/ui/components/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@baron/ui/components/card';
import { FormatDate } from '@baron/ui/components/format-date';
import { Suspense } from 'react';

function DailyBalanceSummaryContent(props: { liveTradingRoomId: string }) {
  const { data: dailyBalances } = trpc.liveTradingRoom.signalsDailyBalance.useQuery({
    liveTradingRoomId: props.liveTradingRoomId,
  });

  if (!dailyBalances || dailyBalances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Balance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No exit balance data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const totalBalance = dailyBalances.reduce((sum, day) => sum + (Number(day.totalBalance) ?? 0), 0);
  const totalSignals = dailyBalances.reduce((sum, day) => sum + (Number(day.signalCount) ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Balance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/40 rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground">Total Days</p>
            <p className="text-2xl font-bold">{dailyBalances.length}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalBalance.toFixed(2)}
            </p>
          </div>
          <div className="bg-muted/40 rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground">Total Signals</p>
            <p className="text-2xl font-bold">{totalSignals}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">Daily Breakdown</h4>
          {dailyBalances.map((day) => (
            <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FormatDate date={new Date(day.date)} format="short" />
                <Badge variant="outline">{day.signalCount} signals</Badge>
              </div>
              <div className={`font-medium ${(Number(day.totalBalance) ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(Number(day.totalBalance) ?? 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyBalanceSummary(props: { liveTradingRoomId: string }) {
  return (
    <Suspense>
      <DailyBalanceSummaryContent liveTradingRoomId={props.liveTradingRoomId} />
    </Suspense>
  );
} 