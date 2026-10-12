export default function MockCodeMirror({
  value,
  onChange,
  readOnly,
  placeholder,
  height,
  className,
  id,
  'data-cy': dataCy,
}: {
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  height?: string;
  className?: string;
  id?: string;
  'data-cy'?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      style={height ? { height } : undefined}
      className={className}
      id={id}
      data-cy={dataCy}
    />
  );
}

export const oneDarkHighlightStyle = {};
export const keymap = { of: () => ({}) };

vi.mock('react-codemirror-merge', () => {
  const components = {
    MergeView: () => <div />,
    Original: () => <div />,
    Modified: () => <div />,
  };

  return {
    __esModule: true,
    default: components,
    ...components,
  };
});

vi.mock('yaml-schema', () => ({
  yamlSchema: () => [],
  validation: () => ({
    of: () => ({}),
  }),
}));

/** @deprecated CodeMirror is aliased to this test stub in Vitest config. */
export function mockCodeMirror() {}
