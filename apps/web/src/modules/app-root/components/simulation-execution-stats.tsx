import { trpc } from '@/core/trpc';
import { Suspense } from 'react';

function Content() {
  const [data] = trpc.simulationExecution.getAppStats.useSuspenseQuery();

  return (
    <div className="flex items-center space-x-8">
      <div className="text-xl font-semibold text-center">
        <p>Total: {data.total}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 text-sm">
        <p className="text-chart-4">Pending: {data.pending?.count}</p>
        <p className="text-chart-3">Running: {data.running?.count}</p>
        <p className="text-chart-2">Completed: {data.completed?.count}</p>
        <p className="text-chart-1">Failed: {data.failed?.count}</p>
      </div>
    </div>
  );
}
export function SimulationExecutionStats() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
