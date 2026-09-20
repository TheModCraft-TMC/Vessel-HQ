import { Badge } from '@@/Badge';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

export function RestrictedSecretBadge() {
  return (
    <TooltipWithChildren message="You can only view details of secrets you've created yourself in Vessel HQ">
      <div className="min-w-min">
        <Badge type="warn">Restricted</Badge>
      </div>
    </TooltipWithChildren>
  );
}
