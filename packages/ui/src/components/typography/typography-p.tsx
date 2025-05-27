import { createTypography } from './typography-util';

export const TypographyP = createTypography(
  'p',
  'leading-6 [&:not(:first-child)]:mt-6'
);

TypographyP.displayName = 'TypographyP';
