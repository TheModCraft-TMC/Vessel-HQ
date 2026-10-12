'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import type { PodList } from 'kubernetes-types/core/v1';
import { ArrowRight, Search, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLayoutEnvironment } from '@console/layout/LayoutContext';

import { useNodesQuery as useKubernetesNodes } from '@/domains/clusters';
import { useStacks, StackType } from '@/domains/stacks';
import { useContainers } from '@/domains/containers';
import {
  useEnvironmentList,
  PlatformType,
  getPlatformType,
  getPlatformTypeName,
} from '@/domains/environments';
import axios from '@/shared/http';
import { useNodes as useDockerNodes } from '@/core/docker/proxy/queries/nodes/useNodes';

import styles from './GlobalSearch.module.css';
import {
  buildSearchItems,
  filterSearchItems,
  type SearchItem,
} from './searchItems';

export function GlobalSearchDialog({ onClose }: { onClose(): void }) {
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const resourceItems = useResourceSearchItems();
  const items = useMemo(
    () => [...resourceItems, ...buildSearchItems(pathname)],
    [pathname, resourceItems]
  );
  const results = useMemo(
    () => filterSearchItems(items, query),
    [items, query]
  );

  function navigate(item: SearchItem) {
    onClose();
    router.push(item.href, { transitionTypes: ['navigation', 'search'] });
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault();
      navigate(results[activeIndex]);
    }
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.dialog}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <Dialog.Title className={styles.visuallyHidden}>
            Global search
          </Dialog.Title>
          <div className={styles.inputRow}>
            <Search aria-hidden size={19} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search pages and resources…"
              aria-label="Search pages and resources"
              aria-controls="global-search-results"
              aria-activedescendant={
                results[activeIndex]
                  ? `global-search-result-${activeIndex}`
                  : undefined
              }
              role="combobox"
              aria-expanded
              aria-autocomplete="list"
            />
            <Dialog.Close className={styles.close} aria-label="Close search">
              <X aria-hidden size={17} />
            </Dialog.Close>
          </div>
          <div
            id="global-search-results"
            className={styles.results}
            role="listbox"
            aria-label="Search results"
          >
            {results.length ? (
              results.map((item, index) => (
                <button
                  id={`global-search-result-${index}`}
                  key={`${item.kind || 'page'}-${item.href}`}
                  className={styles.result}
                  data-active={index === activeIndex || undefined}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => navigate(item)}
                >
                  <span>
                    <span className={styles.resultTitle}>
                      <strong>{item.title}</strong>
                      {item.kind && <em>{item.kind}</em>}
                    </span>
                    <small>{item.description}</small>
                  </span>
                  <ArrowRight aria-hidden size={16} />
                </button>
              ))
            ) : (
              <p className={styles.empty}>No matching pages or resources.</p>
            )}
          </div>
          <footer className={styles.footer}>
            <span>↑↓ Select</span>
            <span>↵ Open</span>
            <span>Esc Close</span>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function useResourceSearchItems() {
  const { environment, docker } = useLayoutEnvironment();
  const environmentId = environment?.Id || 0;
  const isDocker = ['docker', 'podman'].includes(environment?.platform || '');
  const isKubernetes = environment?.platform === 'kubernetes';
  const environmentsQuery = useEnvironmentList(
    { pageLimit: 0 },
    { enabled: true, staleTime: 60_000 }
  );
  const containersQuery = useContainers(environmentId || undefined, {
    enabled: isDocker,
  });
  const stacksQuery = useStacks({ enabled: true });
  const dockerNodesQuery = useDockerNodes(environmentId, {
    enabled: isDocker && docker.isSwarmManager,
  });
  const kubernetesNodesQuery = useKubernetesNodes(environmentId, {
    enabled: isKubernetes,
  });
  const podsQuery = useQuery({
    queryKey: ['environments', environmentId, 'kubernetes', 'search', 'pods'],
    queryFn: async () => {
      const { data } = await axios.get<PodList>(
        `/endpoints/${environmentId}/kubernetes/api/v1/pods`
      );
      return data.items || [];
    },
    enabled: isKubernetes,
    staleTime: 30_000,
    retry: false,
  });

  return useMemo<SearchItem[]>(() => {
    const environmentById = new Map(
      environmentsQuery.environments.map((item) => [item.Id, item])
    );
    const environmentResults = environmentsQuery.environments.map((item) => {
      const platform = getPlatformType(item.Type, item.ContainerEngine);
      const platformName = getPlatformTypeName(item.Type, item.ContainerEngine);
      return {
        href: `/${item.Id}/${getPlatformPath(platform)}/dashboard`,
        title: item.Name,
        description: `${platformName} environment`,
        kind: platform === PlatformType.Kubernetes ? 'Cluster' : 'Environment',
        keywords: ['environment', 'endpoint', platformName, 'cluster'],
      };
    });
    const containerResults = (containersQuery.data || []).map((container) => {
      const name =
        container.Names?.[0]?.replace(/^\//, '') ||
        container.Id ||
        'Unnamed container';
      const nodeName = container.NodeName;
      const nodeQuery = nodeName
        ? `?nodeName=${encodeURIComponent(nodeName)}`
        : '';
      return {
        href: `/${environmentId}/docker/containers/${container.Id}${nodeQuery}`,
        title: name,
        description: [container.Image, nodeName].filter(Boolean).join(' · '),
        kind: 'Container',
        keywords: compactStrings([
          'container',
          container.Id,
          container.StatusText,
        ]),
      };
    });
    const stackResults = (stacksQuery.data || []).map((stack) => {
      const stackEnvironment = environmentById.get(stack.EndpointId);
      const isKubernetesStack = stack.Type === StackType.Kubernetes;
      const queryParams = new URLSearchParams({
        id: String(stack.Id),
        type: String(stack.Type),
        regular: 'true',
      });
      return {
        href: isKubernetesStack
          ? `/${stack.EndpointId}/kubernetes/applications`
          : `/${stack.EndpointId}/docker/stacks/${encodeURIComponent(stack.Name)}?${queryParams}`,
        title: stack.Name,
        description: `${stackEnvironment?.Name || `Environment ${stack.EndpointId}`} · ${isKubernetesStack ? 'Kubernetes' : 'Docker'}`,
        kind: 'Stack',
        keywords: compactStrings([
          'stack',
          'compose',
          'gitops',
          stack.Namespace,
        ]),
      };
    });
    const dockerNodeResults = (dockerNodesQuery.data || []).map((node) => ({
      href: `/${environmentId}/docker/nodes/${node.ID}`,
      title: node.Description?.Hostname || node.ID || 'Swarm node',
      description: `${node.Spec?.Role || 'Swarm'} node · ${node.Status?.State || 'unknown'}`,
      kind: 'Node',
      keywords: compactStrings(['node', 'swarm', node.ID]),
    }));
    const kubernetesNodeResults = (kubernetesNodesQuery.data || []).map(
      (node) => ({
        href: `/${environmentId}/kubernetes/cluster/${encodeURIComponent(node.metadata?.name || '')}`,
        title: node.metadata?.name || 'Kubernetes node',
        description: 'Kubernetes cluster node',
        kind: 'Node',
        keywords: ['node', 'cluster', 'kubernetes'],
      })
    );
    const podResults = (podsQuery.data || []).flatMap((pod) => {
      const name = pod.metadata?.name;
      const namespace = pod.metadata?.namespace;
      if (!name || !namespace) return [];
      return [
        {
          href: `/${environmentId}/kubernetes/applications/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`,
          title: name,
          description: `${namespace} · ${pod.status?.phase || 'Pod'}`,
          kind: 'Pod',
          keywords: ['pod', 'kubernetes', 'cluster', namespace],
        },
      ];
    });

    return [
      ...containerResults,
      ...podResults,
      ...stackResults,
      ...dockerNodeResults,
      ...kubernetesNodeResults,
      ...environmentResults,
    ];
  }, [
    containersQuery.data,
    dockerNodesQuery.data,
    environmentId,
    environmentsQuery.environments,
    kubernetesNodesQuery.data,
    podsQuery.data,
    stacksQuery.data,
  ]);
}

function getPlatformPath(platform: PlatformType) {
  switch (platform) {
    case PlatformType.Docker:
    case PlatformType.Podman:
      return 'docker';
    case PlatformType.Kubernetes:
      return 'kubernetes';
    case PlatformType.Azure:
      return 'azure';
  }
}

function compactStrings(values: Array<string | undefined>) {
  return values.filter((value): value is string => Boolean(value));
}
