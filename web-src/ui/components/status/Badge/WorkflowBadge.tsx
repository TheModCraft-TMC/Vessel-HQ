import { Badge } from '@/ui/components/status/Badge';

export function WorkflowBadge({ className }: { className?: string }) {
  return (
    <Badge type="info" className={className}>
      Workflow
    </Badge>
  );
}
