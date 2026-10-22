interface Props {
  label: string;
  onClear: () => void;
}

export function FilterBarActiveIndicator({ label, onClear }: Props) {
  return (
    <div
      role="status"
      className="flex items-center gap-4 whitespace-nowrap bg-gray-2 px-5 th-highcontrast:bg-transparent th-dark:bg-gray-iron-10"
      data-cy="active-filter-indicator"
    >
      <span className="text-sm text-(--text-muted-color)">
        Showing:{' '}
        <span className="font-semibold text-(--text-summary-color)">
          {label}
        </span>
      </span>
      <button
        type="button"
        className="cursor-pointer border-0 bg-transparent p-0 text-xl font-bold leading-none text-(--button-close-color) opacity-(--button-opacity) hover:opacity-(--button-opacity-hover)"
        onClick={onClear}
        aria-label="Clear filter"
        data-cy="clear-filter-button"
      >
        &times;
      </button>
    </div>
  );
}
