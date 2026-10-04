import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { sidebarStore } from '@/ui/layouts/mobile-navigation/sidebarStore';
import { TooltipWithChildren } from '@/ui/components/feedback/Tip/TooltipWithChildren';

export function SidebarToggleButton() {
  const { isOpen, toggle } = sidebarStore();

  return (
    <TooltipWithChildren message={`${isOpen ? 'Collapse' : 'Expand'} sidebar`}>
      <button
        type="button"
        onClick={toggle}
        className="flex h-6 shrink-0 items-center justify-center rounded border-0 bg-transparent text-sm text-gray-8 transition-colors duration-200 hover:bg-gray-6/30 th-highcontrast:text-white th-dark:text-gray-5"
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
      </button>
    </TooltipWithChildren>
  );
}
