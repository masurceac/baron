import { Button } from '@baron/ui/components/button';
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
        <Button size="sm" className="mt-1">
          {props.label ?? 'View Default'}
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden w-full sm:max-w-screen-lg">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap overflow-y-auto p-4 border rounded-lg bg-muted mt-8">
            {props.content}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
