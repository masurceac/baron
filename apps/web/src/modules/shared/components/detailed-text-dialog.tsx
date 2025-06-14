import { Button } from '@baron/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@baron/ui/components/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@baron/ui/components/tooltip';
import { CopyIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { toast } from 'sonner';

export function DetailedTextDialog(props: {
  title: ReactNode;
  content: ReactNode;
  label?: ReactNode;
}) {
  const handleCopy = async () => {
    const content = typeof props.content === 'string' ? props.content : '';
    await navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          {props.label ?? 'View Default'}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-screen-lg">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap p-4 border rounded-lg bg-muted mt-8 relative">
            {props.content}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy to clipboard</TooltipContent>
            </Tooltip>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
