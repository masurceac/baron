import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@baron/ui/components/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@baron/ui/components/popover';
import { ReactNode, useState } from 'react';

export function SelectWithSearch<T extends { id: string }>(props: {
  data: T[];
  value: string;
  search: string;
  placeholder?: string;
  searchableKeys: (keyof T)[];
  onChange: (val: string) => void;
  onSearch(search: string): void;
  renderItem(props: { item: T; selected: boolean }): ReactNode;
  children: ReactNode;
  listFooter?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{props.children}</PopoverTrigger>
      <PopoverContent align="start">
        <Command className="space-y-1">
          <CommandInput
            placeholder={props.placeholder}
            value={props.search}
            onValueChange={props.onSearch}
          />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {props.data.map((item) => (
                <CommandItem
                  className="cursor-pointer"
                  key={item.id}
                  value={props.searchableKeys.map((key) => item[key]).join(' ')}
                  onSelect={() => {
                    props.onChange(item.id);
                    setOpen(false);
                  }}
                >
                  {props.renderItem({
                    item,
                    selected: item.id === props.value,
                  })}
                </CommandItem>
              ))}
            </CommandGroup>
            {props.listFooter ?? null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
