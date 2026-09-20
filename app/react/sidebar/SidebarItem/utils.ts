import { ReactNode, ReactElement, Children } from 'react';

function isReactElement(
  element: ReactNode
): element is ReactElement<{ to?: string; children?: ReactNode }> {
  return (
    !!element &&
    typeof element === 'object' &&
    'type' in element &&
    'props' in element
  );
}

export function getPaths(element: ReactNode, paths: string[]): string[] {
  if (!isReactElement(element)) {
    return paths;
  }

  if (typeof element.props.to === 'undefined') {
    return Children.toArray(element.props.children).flatMap((child) =>
      getPaths(child, paths)
    );
  }

  return [element.props.to, ...paths];
}
