import { trpc } from '@/core/trpc';
import { Button } from '@baron/ui/components/button';
import { PlayIcon } from 'lucide-react';

export function ExecuteSetup(props: { simulationSetupId: string }) {
  const { mutate, isPending } =
    trpc.simulationExecution.runSimulationSetup.useMutation();

  return (
    <Button
      variant="link"
      className="-ml-2"
      disabled={isPending}
      onClick={() =>
        mutate({
          simulationSetupId: props.simulationSetupId,
          startDate: new Date('2025-05-18T17:30:00.000Z'),
          iterations: 10,
        })
      }
    >
      Run <PlayIcon className="w-4" />
    </Button>
  );
}
