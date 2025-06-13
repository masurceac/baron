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
import { ItemType } from '../types';

export function DeleteItem(props: {
  item: Pick<ItemType, 'id' | 'name'>;
  open: boolean;
  setOpen(open: boolean): void;
}) {
  const context = trpc.useUtils();

  const deleteItem = trpc.frvp.delete.useMutation({
    onSuccess() {
      context.frvp.list.invalidate();

      props.setOpen(false);
      toast('Item Deleted');
    },
    onError() {
      toast('There was an error deleting item.');
    },
  });

  return (
    <AlertDialog open={props.open} onOpenChange={props.setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            {`${props.item.name} will be deleted`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Selected item will be deleted forever! This action cannot be undone!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteItem.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleteItem.isPending}
            onClick={() =>
              deleteItem.mutate({
                id: props.item.id,
              })
            }
          >
            Delete Forever
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
