# Live Trading Room Components

## Daily Balance Summary

The `DailyBalanceSummary` component provides a comprehensive view of exit balance data aggregated by day for live trading room signals.

### Features

- **Daily Aggregation**: Groups signals by exit date and calculates total balance per day
- **Summary Statistics**: Shows total days, total balance, and total signals
- **Visual Indicators**: Color-coded balance amounts (green for positive, red for negative)
- **Toggle Integration**: Can be shown/hidden in the signals table view

### Usage

The component is integrated into the `SignalsTable` component with a toggle button:

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setShowDailySummary(!showDailySummary)}
>
  <BarChart3Icon className="w-4 h-4 mr-2" />
  {showDailySummary ? 'Hide' : 'Show'} Daily Summary
</Button>
```

### API Endpoint

The component uses the `signalsDailyBalance` tRPC endpoint which:

- Groups signals by exit date using SQL `DATE()` function
- Calculates sum of exit balances per day
- Counts signals per day
- Filters only signals with valid exit dates and balances
- Orders results by date (most recent first)

### Data Structure

```typescript
type DailyBalance = {
  date: string;           // YYYY-MM-DD format
  totalBalance: number;   // Sum of exit balances for the day
  signalCount: number;    // Number of signals for the day
}
```

### Styling

- Uses shadcn/ui components (Card, Badge, etc.)
- Responsive grid layout for summary statistics
- Color-coded balance amounts for quick visual assessment
- Consistent with the overall application design system 