'use client';
import { useEffect } from 'react';
import { useNodesInitialized, useReactFlow, useStore } from '@xyflow/react';

/** Refit only for layout changes; live counter updates preserve manual zoom. */
export function GraphViewport() {
  const { fitView } = useReactFlow();
  const initialized = useNodesInitialized();
  const width = useStore((state) => state.width);
  const height = useStore((state) => state.height);
  useEffect(() => {
    if (initialized && width > 0 && height > 0) void fitView({ padding: 0.18 });
  }, [fitView, initialized, width, height]);
  return null;
}
