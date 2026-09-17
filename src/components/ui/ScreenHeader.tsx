import { BrandedScreenHeader, type BrandedScreenHeaderProps } from '@/components/ui/BrandedScreenHeader';

export type ScreenHeaderProps = Omit<BrandedScreenHeaderProps, 'variant'>;

export function ScreenHeader(props: ScreenHeaderProps) {
  return <BrandedScreenHeader variant="plain" {...props} />;
}

