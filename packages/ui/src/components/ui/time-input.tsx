import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const hours = new Array(24).fill(null).map((_, index) => (
  <SelectItem key={index} value={'' + index}>
    {('' + index).padStart(2, '0')}
  </SelectItem>
));

const minutes = new Array(60).fill(null).map((_, index) => (
  <SelectItem key={index} value={'' + index}>
    {('' + index).padStart(2, '0')}
  </SelectItem>
));

const HourSelect = (props: {
  value: string;
  onChange(value: string): void;
}) => {
  const computedValue = props.value
    ? new Date(props.value).getHours().toString()
    : '';

  const handleValueChange = (value: string) => {
    const newDate = props.value ? new Date(props.value) : new Date();
    newDate.setHours(+value);
    props.onChange(newDate.toISOString());
  };

  return (
    <Select onValueChange={handleValueChange} value={computedValue}>
      <SelectTrigger>
        <SelectValue placeholder={'HH'} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem disabled value="HH">
          HH
        </SelectItem>
        {hours}
      </SelectContent>
    </Select>
  );
};
const MinuteSelect = (props: {
  value: string;
  onChange(value: string): void;
}) => {
  const computedValue = props.value
    ? new Date(props.value).getMinutes().toString()
    : '';

  const handleValueChange = (value: string) => {
    const newDate = props.value ? new Date(props.value) : new Date();

    newDate.setMinutes(+value);
    props.onChange(newDate.toISOString());
  };

  return (
    <Select onValueChange={handleValueChange} value={computedValue}>
      <SelectTrigger>
        <SelectValue placeholder={'MM'} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem disabled value="MM">
          MM
        </SelectItem>
        {minutes}
      </SelectContent>
    </Select>
  );
};

export const TimeInput = (props: {
  value: string;
  onChange(value: string): void;
}) => {
  return (
    <div className="grid grid-cols-2 gap-2 px-3">
      <HourSelect {...props} />
      <MinuteSelect {...props} />
    </div>
  );
};
