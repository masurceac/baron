import { getAppRoute, GetRouteParams } from '@/core/route';
import { Button } from '@baron/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@baron/ui/components/dropdown-menu';
import { EllipsisIcon, PencilIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ItemType } from '../types';

export function ItemActions(props: { item: Pick<ItemType, 'id'> }) {
  const navigate = useNavigate();
  const params = useParams<GetRouteParams<'/app/simulation/room/:roomId'>>();

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
                getAppRoute('/app/simulation/room/:roomId/setup/:setupId', {
                  roomId: params.roomId ?? '',
                  setupId: props.item.id,
                }),
              );
            }}
          >
            {'View'}
            <DropdownMenuShortcut>
              <PencilIcon className="w-4" />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
