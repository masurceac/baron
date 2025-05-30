import { getAppRoute } from '@/core/route';
import { Button } from '@baron/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@baron/ui/components/dropdown-menu';
import { EllipsisIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeleteInfoBar } from './delete-info-bar';
import { InfoBarType } from '../types';

export function InfoBarActions(props: {
  infoBar: Pick<InfoBarType, 'id' | 'name'>;
}) {
  const navigate = useNavigate();

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
            onClick={() => {
              navigate(
                getAppRoute('/app/info-bars/view/:infoBarId', {
                  infoBarId: props.infoBar.id,
                }),
              );
            }}
          >
            {'View'}
            <DropdownMenuShortcut>
              <PencilIcon className="w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive-foreground"
          >
            {'Delete'}
            <DropdownMenuShortcut>
              <TrashIcon className="w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteInfoBar
        open={deleteOpen}
        infoBar={props.infoBar}
        setOpen={setDeleteOpen}
      />
    </>
  );
}
