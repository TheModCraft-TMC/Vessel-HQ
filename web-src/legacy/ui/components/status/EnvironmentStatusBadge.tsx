import clsx from 'clsx';

export interface EnvironmentStatusBadgeProps {
  color: 'danger' | 'success';
  text: string;
  heartbeat?: boolean;
}

export function EnvironmentStatusBadge({
  color,
  text,
  heartbeat,
}: EnvironmentStatusBadgeProps) {
  return (
    <span
      className={clsx(
        'flex items-center gap-2 rounded-xl',
        'w-fit px-2 py-px',
        'text-xs font-bold',
        {
          'bg-success-7/20 text-success-7': color === 'success',
          'bg-error-7/20 text-error-7': color === 'danger',
        }
      )}
      aria-label="status-badge"
    >
      <span
        aria-hidden="true"
        className={clsx(
          'block h-2 w-2 rounded-full',
          { 'animate-pulse': heartbeat },
          {
            'bg-success-7': color === 'success',
            'bg-error-7': color === 'danger',
          }
        )}
      />
      <span>{text}</span>
    </span>
  );
}
