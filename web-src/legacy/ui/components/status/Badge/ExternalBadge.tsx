import { Badge } from '@/ui/components/status/Badge';

export function ExternalBadge({ className }: { className?: string }) {
  return (
    <Badge type="info" className={className}>
      External
    </Badge>
  );
}
