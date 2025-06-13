import { Button } from '@baron/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@baron/ui/components/dropdown-menu';
import { EllipsisIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { ItemType } from '../types';
import { DeleteItem } from './delete-item';

export function ItemActions(props: { item: Pick<ItemType, 'id' | 'name'> }) {
  const [deleteOpen, setDeleteOpen] = useState(false);

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
