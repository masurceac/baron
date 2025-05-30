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
import { VPCType } from '../types';
import { DeleteVPC } from './delete-vpc';

export function VPCActions(props: { vpc: Pick<VPCType, 'id' | 'name'> }) {
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
                getAppRoute('/app/volume-profile-config/view/:vpcId', {
                  vpcId: props.vpc.id,
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

      <DeleteVPC open={deleteOpen} vpc={props.vpc} setOpen={setDeleteOpen} />
    </>
  );
}
