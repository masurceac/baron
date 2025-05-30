import { FC, FocusEventHandler, useCallback, useEffect, useRef } from 'react';
import {
  NumericFormat,
  NumericFormatProps,
  OnValueChange,
} from 'react-number-format';
import { Input } from '../ui/input';

const isNullishValue = (value: unknown): value is undefined | null | '' =>
  value === undefined || value === null || value === '';

export type NumericInputProps = Omit<
  NumericFormatProps,
  'onChange' | 'customInput' | 'size'
> & {
  min?: number;
  max?: number;
  // value to be set when input is cleared
  fallbackValue?: number | null;
  value?: number | null;
  onChange?: (value: number | null) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement, Element>) => void;
  allowEmpty?: true;
  customInput?: FC;
  size?: 'sm' | 'default' | 'lg' | 'xl';
  disabled?: boolean;
  withControls?: boolean;
  [key: string | number]: unknown;
};

export const NumericInput: FC<NumericInputProps> = ({
  min = -Infinity,
  max = Infinity,
  fallbackValue,
  value,
  onChange = () => undefined,
  onBlur,
  allowEmpty,
  customInput = Input,
  size = 'default',
  disabled,
  withControls,
  ...numberFormatProps
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleNumberFormatChange = useCallback<OnValueChange>(
    (value) => onChange(value.floatValue ?? null),
    [onChange],
  );

  const handleInputBlur = useCallback<FocusEventHandler<HTMLInputElement>>(
    (event) => {
      if (allowEmpty && isNullishValue(value)) {
        return;
      }

      if (fallbackValue !== undefined && isNullishValue(value)) {
        onChange(fallbackValue);
      } else if (-Infinity !== min && isNullishValue(value)) {
        onChange(min);
      } else if (!isNullishValue(value)) {
        const newValue = Math.min(Math.max(min, value), max);
        onChange(newValue);
      }
      onBlur?.(event);
    },
    [value, fallbackValue, onBlur, onChange, min, max, allowEmpty],
  );

  useEffect(() => {
    // set empty input when value is undefined
    if (isNullishValue(value) && inputRef?.current) {
      if (numberFormatProps.tabIndex === -1 || allowEmpty) {
        inputRef.current.value = '';
        setTimeout(() => {
          if (inputRef?.current) {
            inputRef.current.value = '';
          }
        }, 10);
      }
    }
  }, [numberFormatProps.tabIndex, value, allowEmpty]);

  useEffect(() => {
    if (fallbackValue !== undefined && isNullishValue(value)) {
      onChange(fallbackValue);
    }
  }, [fallbackValue, onChange, value]);

  return (
    <NumericFormat
      getInputRef={inputRef}
      value={value}
      onValueChange={handleNumberFormatChange}
      onBlur={handleInputBlur}
      customInput={customInput}
      disabled={disabled}
      {...numberFormatProps}
    />
  );
};
