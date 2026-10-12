import { render } from '@testing-library/react';

import { withUserProvider } from '@/core/test-support/withUserProvider';
import { withTestQueryProvider } from '@/core/query/test-support/withTestQuery';

import {
  getFirstNamespaceFromManifest,
  hasNonDefaultServiceAccount,
  K8sRegistryAccessNotice,
} from './K8sRegistryAccessNotice';

it('renders nothing when no namespace can be determined', () => {
  const Notice = withTestQueryProvider(
    withUserProvider(K8sRegistryAccessNotice)
  );
  const { container } = render(<Notice environmentId={1} />);

  expect(container).toBeEmptyDOMElement();
});
describe('getFirstNamespaceFromManifest', () => {
  it('returns the namespace from a single-document manifest', () => {
    const manifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: my-namespace
spec:
  replicas: 1
`;
    expect(getFirstNamespaceFromManifest(manifest)).toBe('my-namespace');
  });

  it('returns the first namespace from a multi-document manifest', () => {
    const manifest = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: config
  namespace: first-ns
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  namespace: second-ns
`;
    expect(getFirstNamespaceFromManifest(manifest)).toBe('first-ns');
  });

  it('returns undefined when no namespace is present', () => {
    const manifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 1
`;
    expect(getFirstNamespaceFromManifest(manifest)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getFirstNamespaceFromManifest('')).toBeUndefined();
  });

  it('skips invalid YAML documents and continues', () => {
    const manifest = `
invalid: yaml: [broken
---
apiVersion: v1
kind: Namespace
metadata:
  name: valid
  namespace: good-ns
`;
    expect(getFirstNamespaceFromManifest(manifest)).toBe('good-ns');
  });

  it('returns undefined when manifest has only cluster-scoped resources', () => {
    const manifest = `
apiVersion: v1
kind: Namespace
metadata:
  name: my-namespace
`;
    expect(getFirstNamespaceFromManifest(manifest)).toBeUndefined();
  });
});

describe('hasNonDefaultServiceAccount', () => {
  it('returns false when no serviceAccountName is set', () => {
    const manifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  namespace: default
spec:
  template:
    spec:
      containers:
        - name: app
          image: nginx
`;
    expect(hasNonDefaultServiceAccount(manifest)).toBe(false);
  });

  it('returns false when serviceAccountName is "default"', () => {
    const manifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  template:
    spec:
      serviceAccountName: default
      containers:
        - name: app
          image: nginx
`;
    expect(hasNonDefaultServiceAccount(manifest)).toBe(false);
  });

  it('returns true when a Deployment uses a custom serviceAccountName', () => {
    const manifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  template:
    spec:
      serviceAccountName: my-service-account
      containers:
        - name: app
          image: nginx
`;
    expect(hasNonDefaultServiceAccount(manifest)).toBe(true);
  });

  it('returns true when a Pod uses a custom serviceAccountName', () => {
    const manifest = `
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  serviceAccountName: custom-sa
  containers:
    - name: app
      image: nginx
`;
    expect(hasNonDefaultServiceAccount(manifest)).toBe(true);
  });

  it('returns true when a CronJob uses a custom serviceAccountName', () => {
    const manifest = `
apiVersion: batch/v1
kind: CronJob
metadata:
  name: my-job
spec:
  schedule: "* * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: cron-sa
          containers:
            - name: job
              image: busybox
`;
    expect(hasNonDefaultServiceAccount(manifest)).toBe(true);
  });

  it('returns true when any doc in a multi-doc manifest has a custom SA', () => {
    const manifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-a
spec:
  template:
    spec:
      containers:
        - name: a
          image: nginx
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-b
spec:
  template:
    spec:
      serviceAccountName: special-sa
      containers:
        - name: b
          image: nginx
`;
    expect(hasNonDefaultServiceAccount(manifest)).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(hasNonDefaultServiceAccount('')).toBe(false);
  });

  it('skips invalid YAML and returns false when no valid custom SA found', () => {
    const manifest = `
invalid: yaml: [broken
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  template:
    spec:
      containers:
        - name: app
          image: nginx
`;
    expect(hasNonDefaultServiceAccount(manifest)).toBe(false);
  });
});
