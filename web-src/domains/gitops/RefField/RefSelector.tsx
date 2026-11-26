import { useGitRefs } from '@/domains/gitops';
import { PortainerSelect } from '@/ui/components/forms/PortainerSelect';

export function RefSelector({
  sourceId,
  value,
  onChange,
  inputId,
}: {
  sourceId?: number;
  value: string;
  onChange: (value: string) => void;
  inputId: string;
}) {
  const { data: refs } = useGitRefs<Array<{ label: string; value: string }>>(
    {
      sourceId: sourceId!,
    },
    {
      enabled: !!sourceId,
      select: (refs) => {
        // Query data is shared. Sort a copy and retain an explicit reference
        // even if the remote no longer advertises it (for example a commit SHA).
        const ordered = [...refs].sort((a, b) => {
          function rank(ref: string) {
            return ref === 'refs/heads/main'
              ? 0
              : ref === 'refs/heads/master'
                ? 1
                : 2;
          }
          return rank(a) - rank(b);
        });
        if (value && !ordered.includes(value)) ordered.unshift(value);
        if (!value) ordered.unshift('');
        return ordered.map((t: string) => ({
          value: t,
          label: t || 'HEAD (default branch)',
        }));
      },
    }
  );

  return (
    <PortainerSelect
      inputId={inputId}
      value={value}
      options={refs || [{ value, label: value || 'HEAD (default branch)' }]}
      onChange={(e) => e !== null && e !== undefined && onChange(e)}
      data-cy="component-gitRefInput"
    />
  );
}
