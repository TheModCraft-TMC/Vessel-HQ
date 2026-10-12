import { FeatureId } from '@/shared/feature-flags/enums';
import { isLimitedToBE } from '@/shared/feature-flags/feature-flags.service';

export function BEOverlay({
  featureId,
  children,
}: {
  featureId: FeatureId;
  children: React.ReactNode;
}) {
  const isLimited = isLimitedToBE(featureId);
  if (isLimited) {
    return null;
  }

  return <>{children}</>;
}
