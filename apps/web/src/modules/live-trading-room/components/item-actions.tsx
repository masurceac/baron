import { getAppRoute } from '@/core/route';
import { trpc } from '@/core/trpc';
import { SimulationExecutionStatus } from '@baron/common';
import { Button } from '@baron/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@baron/ui/components/dropdown-menu';
import {
  EllipsisIcon,
  PencilIcon,
  PlayIcon,
  StopCircleIcon,
  TrashIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ItemType } from '../types';
import { DeleteItem } from './delete-item';

export function ItemActions(props: { item: Pick<ItemType, 'id' | 'name'> }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const utils = trpc.useUtils();
  const trigger = trpc.liveTradingRoom.changeStatus.useMutation({
    onSuccess: () => {
      toast.success('Live trading room triggered');
      utils.liveTradingRoom.list.invalidate();
      utils.liveTradingRoom.get.invalidate({
        id: props.item.id,
      });
    },
    onError: () => {
      toast.error('Failed to trigger simulation room');
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40">
          <DropdownMenuItem
            onClick={() =>
              trigger.mutate({
                id: props.item.id,
                status: SimulationExecutionStatus.Completed,
              })
            }
          >
            Stop
            <DropdownMenuShortcut>
              <PlayIcon className="w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              trigger.mutate({
                id: props.item.id,
                status: SimulationExecutionStatus.Running,
              })
            }
          >
            Run
            <DropdownMenuShortcut>
              <StopCircleIcon className="w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to={getAppRoute('/app/live-trading/edit/:liveTradingRoomId', {
                liveTradingRoomId: props.item.id,
              })}
            >
              Edit
              <DropdownMenuShortcut>
                <PencilIcon className="w-4" />
              </DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive-foreground"
          >
            Delete
            <DropdownMenuShortcut>
              <TrashIcon className="w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteItem open={deleteOpen} item={props.item} setOpen={setDeleteOpen} />
    </>
  );
}
