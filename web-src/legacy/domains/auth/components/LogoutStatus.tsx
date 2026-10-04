import { Settings } from 'lucide-react';

import { Icon } from '@/core/auth';

export function LogoutStatus() {
  return (
    <div className="row text-center">
      Logout in progress...
      <Icon icon={Settings} className="space-left animate-spin-slow" />
    </div>
  );
}
