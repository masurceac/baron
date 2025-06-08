import { Badge } from '@baron/ui/components/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@baron/ui/components/dialog';
import { ReactNode } from 'react';

export function DetailedTextDialog(props: {
  title: ReactNode;
  content: ReactNode;
  label?: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Badge className="cursor-pointer">
          {props.label ?? 'View Default'}
        </Badge>
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-screen-lg">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap p-4 border rounded-lg bg-muted mt-8">
            {props.content}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
