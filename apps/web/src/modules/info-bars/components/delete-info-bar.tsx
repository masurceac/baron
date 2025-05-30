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
import { toast } from 'sonner';
import { InfoBarType } from '../types';

export function DeleteInfoBar(props: {
  infoBar: Pick<InfoBarType, 'id' | 'name'>;
  open: boolean;
  setOpen(open: boolean): void;
}) {
  const context = trpc.useUtils();

  const deleteInfoBar = trpc.infoBars.delete.useMutation({
    onSuccess() {
      context.infoBars.list.invalidate();

      props.setOpen(false);
      toast('Info Bar Deleted');
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
            {`${props.infoBar.name} will be deleted`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {
              'Selected Info Bar will be deleted forever! This action cannot be undone!'
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteInfoBar.isPending}>
            {'Cancel'}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleteInfoBar.isPending}
            onClick={() =>
              deleteInfoBar.mutate({
                id: props.infoBar.id,
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
