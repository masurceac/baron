import { trpc } from '@/core/trpc';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@baron/ui/components/alert-dialog';
import { Button } from '@baron/ui/components/button';
import { VPCType } from '../types';
import { toast } from 'sonner';

export function DeleteVPC(props: {
  vpc: Pick<VPCType, 'id' | 'name'>;
  open: boolean;
  setOpen(open: boolean): void;
}) {
  const context = trpc.useUtils();

  const deleteVpc = trpc.volumeProfileConfig.delete.useMutation({
    onSuccess() {
      context.volumeProfileConfig.list.invalidate();

      props.setOpen(false);
      toast('VPC Profile Deleted');
    },
    onError() {
      toast('There was an error deleting the news.');
    },
  });

  return (
    <AlertDialog open={props.open} onOpenChange={props.setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            {`${props.vpc.name} will be deleted`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {
              'Selected VPC will be deleted forever! This action cannot be undone!'
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteVpc.isPending}>
            {'Cancel'}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleteVpc.isPending}
            onClick={() =>
              deleteVpc.mutate({
                id: props.vpc.id,
              })
            }
          >
            {'Delete Forever'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
