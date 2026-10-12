import { Icon, type IconSource } from '@/ui/components/icons/Icon';

export function WidgetIcon({ icon }: { icon: IconSource }) {
  return (
    <div className="inline-flex items-center rounded-full bg-blue-3 p-2 text-lg text-blue-8 th-dark:bg-gray-9 th-dark:text-blue-3">
      <Icon icon={icon} />
    </div>
  );
}
