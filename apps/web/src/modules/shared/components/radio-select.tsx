import { RadioGroup } from '@baron/ui/components/radio-group';
import { RadioGroupItem } from '@radix-ui/react-radio-group';

export function RadioSelect<T extends { id: string }>(props: {
  items: T[];
  value: string;
  onChange: (value: string) => void;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <RadioGroup
      value={props.value}
      onValueChange={props.onChange}
      className="w-full"
    >
      {props.items.map((item) => (
        <RadioGroupItem key={item.id} value={item.id} id={item.id} asChild>
          <div>{props.renderItem(item)}</div>
        </RadioGroupItem>
      ))}
    </RadioGroup>
  );
}
