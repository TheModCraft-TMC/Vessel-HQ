import { Eye, Moon, RefreshCw, Sun } from 'lucide-react';
import { ReactNode } from 'react';

import {
  useLayoutBindings,
  type LayoutUser,
} from '@/ui/layouts/layout-context';
import {
  SegmentItem,
  SegmentedControl,
} from '@/ui/components/forms/SegmentedControl';
import { Icon } from '@/ui/components/icons/Icon';

const themeIconMap: Record<string, ReactNode> = {
  light: <Icon icon={Sun} />,
  dark: <Icon icon={Moon} />,
  highcontrast: <Icon icon={Eye} />,
  auto: <Icon icon={RefreshCw} />,
};

export function ThemeSelector({ user }: { user?: LayoutUser }) {
  const { themeOptions, updateUserTheme } = useLayoutBindings();
  const themeSegmentItems: SegmentItem[] = themeOptions.map((option) => ({
    id: option.id,
    label: themeIconMap[option.id],
    title: option.label,
  }));
  const activeTheme = user?.ThemeSettings?.color ?? 'auto';

  function handleThemeSelect(id: string) {
    updateUserTheme(id);
  }

  return (
    <SegmentedControl
      label="Theme"
      items={themeSegmentItems}
      activeId={activeTheme}
      onChange={handleThemeSelect}
      size="md"
    />
  );
}
