import { Badge } from '@/ui/components/status/Badge';

export function EdgeStackBadge({ className }: { className?: string }) {
  return (
    <Badge type="success" className={className}>
      Edge Stack
    </Badge>
  );
}
