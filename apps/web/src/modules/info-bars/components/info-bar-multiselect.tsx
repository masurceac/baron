import { Button } from '@baron/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@baron/ui/components/dialog';
import { PlusIcon } from 'lucide-react';
import { Suspense, useState } from 'react';
import { InfoBarList } from './info-bar-list';
import { InfoBarSelect } from './info-bar-select';

type Props = {
  value?: string[];
  onChange: (value: string[]) => void;
};

export function InfoBarMultiselect(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Suspense>
      <div>
        <InfoBarList
          items={props.value ?? []}
          onDelete={(id) => {
            props.onChange((props.value ?? []).filter((item) => item !== id));
          }}
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm" className="mt-4">
              <PlusIcon className="w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-screen-lg">
            <DialogHeader>
              <DialogTitle>Add Informative Bars</DialogTitle>
            </DialogHeader>
            <InfoBarSelect
              value=""
              onChange={(value) => {
                console.log(value);
                if ((props.value ?? []).includes(value)) {
                  setOpen(false);
                  return;
                }
                props.onChange([...(props.value ?? []), value]);
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}
