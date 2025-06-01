import { trpc } from '@/core/trpc';
import { Button } from '@baron/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@baron/ui/components/dialog';
import { PlayIcon } from 'lucide-react';
import { useState } from 'react';
import { RunSimulationForm } from './run-form';
import { toast } from 'sonner';

export function ExecuteSetup(props: { simulationSetupId: string }) {
  const { mutate, isPending } =
    trpc.simulationExecution.runSimulationSetup.useMutation({
      onSettled() {
        toast('Simulation setup executed successfully');
        setOpen(false);
      },
    });

  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="-ml-2" disabled={isPending}>
          Run <PlayIcon className="w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run Simulation Setup</DialogTitle>
        </DialogHeader>
        <RunSimulationForm
          simulationSetupId={props.simulationSetupId}
          onSubmit={(data) => mutate(data)}
        />
      </DialogContent>
    </Dialog>
  );
}
